/* ═══════════════════════════════════════════
   FOLLOWER — narration.js
   Gemini 1.5 Flash (gratuito) para piloto.
   Mismos prompts por mood e idioma.
   DA-3: trigger() función única.
   ═══════════════════════════════════════════ */

const Narration = (() => {

  /* ── ESTADO INTERNO ── */
  let _currentText  = '';
  let _isPaused     = false;
  let _isNarrating  = false;
  let _currentPOI   = null;
  let _currentTopic = 'historia';

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    API_URL:     'https://followernarration.jaimeand.workers.dev/narration',
    API_MODEL:   'claude-haiku-4-5-20251001',
    API_TIMEOUT: 15000,
  };

  /* ── PROMPTS POR MOOD ── */
  const MOOD_PROMPTS = {
    epic: {
      es: (poi, topic) => `Eres un narrador cinematográfico épico. Estoy frente a "${poi.name}" en ${AppState.cityName}. 
Genera una narración de máximo 3 párrafos cortos sobre ${topic} de este lugar. 
Estilo: dramático, grandioso, como una película de Hollywood. 
Usa datos históricos reales. Empieza directamente con la narración, sin saludos.
Descripción base: ${poi.description || 'lugar histórico importante'}.`,
      en: (poi, topic) => `You are an epic cinematic narrator. I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Generate a narration of maximum 3 short paragraphs about the ${topic} of this place.
Style: dramatic, grand, like a Hollywood movie.
Use real historical facts. Start directly with the narration, no greetings.
Base description: ${poi.description || 'important historic place'}.`
    },
    romantic: {
      es: (poi, topic) => `Eres un narrador poético y romántico. Estoy frente a "${poi.name}" en ${AppState.cityName}.
Genera una narración de máximo 3 párrafos cortos sobre ${topic} de este lugar.
Estilo: poético, íntimo, evocador. Como si contaras una historia de amor con la ciudad.
Usa datos históricos reales. Empieza directamente con la narración, sin saludos.
Descripción base: ${poi.description || 'lugar histórico importante'}.`,
      en: (poi, topic) => `You are a poetic and romantic narrator. I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Generate a narration of maximum 3 short paragraphs about the ${topic} of this place.
Style: poetic, intimate, evocative. Like telling a love story with the city.
Use real historical facts. Start directly with the narration, no greetings.
Base description: ${poi.description || 'important historic place'}.`
    },
    mystery: {
      es: (poi, topic) => `Eres un narrador de suspenso y misterio. Estoy frente a "${poi.name}" en ${AppState.cityName}.
Genera una narración de máximo 3 párrafos cortos sobre ${topic} de este lugar.
Estilo: intrigante, tenso, lleno de secretos y datos ocultos.
Usa datos históricos reales. Empieza directamente con la narración, sin saludos.
Descripción base: ${poi.description || 'lugar histórico importante'}.`,
      en: (poi, topic) => `You are a suspense and mystery narrator. I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Generate a narration of maximum 3 short paragraphs about the ${topic} of this place.
Style: intriguing, tense, full of secrets and hidden facts.
Use real historical facts. Start directly with the narration, no greetings.
Base description: ${poi.description || 'important historic place'}.`
    },
    curious: {
      es: (poi, topic) => `Eres un narrador curioso y entretenido. Estoy frente a "${poi.name}" en ${AppState.cityName}.
Genera una narración de máximo 3 párrafos cortos sobre ${topic} de este lugar.
Estilo: ligero, lleno de datos sorprendentes y curiosidades que la gente no sabe.
Usa datos históricos reales. Empieza directamente con la narración, sin saludos.
Descripción base: ${poi.description || 'lugar histórico importante'}.`,
      en: (poi, topic) => `You are a curious and entertaining narrator. I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Generate a narration of maximum 3 short paragraphs about the ${topic} of this place.
Style: light, full of surprising facts and curiosities people don't know.
Use real historical facts. Start directly with the narration, no greetings.
Base description: ${poi.description || 'important historic place'}.`
    }
  };

  /* ── TEXTOS FALLBACK OFFLINE ── */
  const FALLBACK_TEXTS = {
    es: (poi) => `Estás frente a ${poi.name}, uno de los lugares más destacados de ${AppState.cityName}. 
Este lugar guarda siglos de historia entre sus paredes. 
Tómate un momento para observar los detalles — cada piedra, cada arco, tiene una historia que contar.`,
    en: (poi) => `You're standing in front of ${poi.name}, one of the most remarkable places in ${AppState.cityName}.
This place holds centuries of history within its walls.
Take a moment to observe the details — every stone, every arch, has a story to tell.`
  };

  /* ── CONSTRUIR PROMPT ── */
  function buildPrompt(poi, mood, lang, topic) {
    const moodPrompts = MOOD_PROMPTS[mood] || MOOD_PROMPTS.epic;
    const langPrompt  = moodPrompts[lang]  || moodPrompts.es;
    return langPrompt(poi, topic);
  }

  /* ── LLAMAR CLAUDE API (vía Cloudflare Worker — key oculta) ── */
  async function callClaude(prompt) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
      const res = await fetch(CONFIG.API_URL, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model:      CONFIG.API_MODEL,
          max_tokens: 350,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Claude API error ${res.status}`);

      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === 'text');
      return textBlock?.text || null;

    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        console.warn('Narration: timeout de Claude API');
      } else {
        console.warn('Narration: error de Claude API:', e.message);
      }
      return null;
    }
  }

  /* ── CARGAR NARRACIÓN DESDE INDEXEDDB ── */
  async function loadFromCache(poiId, mood, lang, topic) {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('follower_db', 1);
        req.onsuccess = (e) => {
          const db    = e.target.result;
          const key   = `${poiId}_${mood}_${lang}_${topic}`;
          const tx    = db.transaction('narrations', 'readonly');
          const store = tx.objectStore('narrations');
          const get   = store.get(key);
          get.onsuccess = () => resolve(get.result?.text || null);
          get.onerror   = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  /* ── GUARDAR NARRACIÓN EN INDEXEDDB ── */
  async function saveToCache(poiId, mood, lang, topic, text) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${poiId}_${mood}_${lang}_${topic}`;
        const tx    = db.transaction('narrations', 'readwrite');
        const store = tx.objectStore('narrations');
        store.put({ id: key, text, cachedAt: Date.now() });
      };
    } catch (e) {
      console.warn('Narration: no se pudo guardar en cache');
    }
  }

  /* ── MOSTRAR TEXTO EN UI ── */
  function updateNarrationUI(text) {
    _currentText = text;

    const cardText = document.getElementById('poiCardText');
    if (cardText) cardText.textContent = text.slice(0, 120) + '...';

    const narText = document.getElementById('narrationText');
    if (narText) {
      const sentences = text.split('. ');
      if (sentences.length > 1) {
        narText.innerHTML = `<span class="highlight">${sentences[0]}.</span> ${sentences.slice(1).join('. ')}`;
      } else {
        narText.textContent = text;
      }
    }
  }

  /* ── PROGRESS BAR ── */
  function startProgressBar() {
    const fill  = document.getElementById('audioProgressFill');
    const pFill = document.getElementById('playerBarFill');
    if (!fill && !pFill) return;

    let pct = 0;
    const iv = setInterval(() => {
      if (!_isNarrating || _isPaused) { clearInterval(iv); return; }
      pct += 0.5;
      if (pct > 100) { clearInterval(iv); pct = 100; }
      if (fill)  fill.style.width  = pct + '%';
      if (pFill) pFill.style.width = pct + '%';
    }, 300);
  }

  /* ── WAVES ── */
  function startWaves() {
    const waves = document.getElementById('audioWaves');
    if (waves) waves.classList.remove('paused');
  }

  function stopWaves() {
    const waves = document.getElementById('audioWaves');
    if (waves) waves.classList.add('paused');
  }

  /* ── TRIGGER — DA-3 función única ── */
  async function trigger(poi, mood, lang, topic = 'historia') {
    if (!poi) return;

    _currentPOI   = poi;
    _currentTopic = topic;
    _isNarrating  = true;
    _isPaused     = false;

    startWaves();
    startProgressBar();

    const totalId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('narration', 'narración total (hasta texto listo)')
      : null;

    // 1. Cache primero
    const cacheId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('narration', 'cache lookup')
      : null;
    let text = await loadFromCache(poi.id, mood, lang, topic);
    if (cacheId) Debug.metricEnd(cacheId, text ? 'hit' : 'miss');

    // 2. Claude API (vía Cloudflare Worker) si no hay cache
    let source = text ? 'cache' : null;
    if (!text && !AppState.offline) {
      const prompt = buildPrompt(poi, mood, lang, topic);
      const apiId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('narration', 'Claude Worker call')
        : null;
      text = await callClaude(prompt);
      if (apiId) Debug.metricEnd(apiId, text ? 'ok' : 'error');
      if (text) {
        await saveToCache(poi.id, mood, lang, topic, text);
        source = 'api';
      }
    }

    // 3. Fallback genérico (DA-6)
    if (!text) {
      const fallbacks = FALLBACK_TEXTS[lang] || FALLBACK_TEXTS.es;
      text = fallbacks(poi);
      source = 'fallback';
    }

    if (totalId) {
      Debug.metricEnd(totalId, source || 'ok', { poi: poi.name, mood, lang, topic });
    }

    updateNarrationUI(text);

    // Bajar música antes de hablar — el texto ya está listo, es el momento exacto
    if (typeof Music !== 'undefined') Music.dipForNarration();

    if (typeof Voice !== 'undefined') {
      Voice.speak(text, lang, () => {
        _isNarrating = false;
        stopWaves();
        // Restaurar volumen de música al terminar de hablar
        if (typeof Music !== 'undefined') Music.restoreAfterNarration();
        if (AppState.activePOI?.id === poi.id) {
          setPhase('systole');
        }
      });
    }
  }

  /* ── STOP / PAUSE / RESUME ── */
  function stop() {
    _isNarrating = false;
    _isPaused    = false;
    _currentPOI  = null;
    stopWaves();
    if (typeof Voice !== 'undefined') Voice.stop();
  }

  function pause() {
    _isPaused = true;
    stopWaves();
    if (typeof Voice !== 'undefined') Voice.pause();
  }

  function resume() {
    _isPaused = false;
    startWaves();
    if (typeof Voice !== 'undefined') Voice.resume();
  }

  function getCurrentText() { return _currentText; }
  function isNarrating()    { return _isNarrating; }

  return { trigger, stop, pause, resume, getCurrentText, isNarrating };

})();
