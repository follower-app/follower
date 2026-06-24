/* ═══════════════════════════════════════════
   FOLLOWER — narration.js
   Claude Haiku via Cloudflare Worker proxy.
   DA-3: trigger() función única.
   Estilos: storyteller, historian, poet, detective
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

  /* ── PROMPTS POR ESTILO DE NARRADOR ── */
  const STYLE_PROMPTS = {

    storyteller: {
      system: {
        es: `Eres un cuentero local — el narrador del barrio que conoce cada piedra de la ciudad y recuerda las historias de sus habitantes.
Tu voz: cálida, directa, con ritmo. Siempre hay un personaje real, un momento concreto, tensión humana.
Nunca hablas como guía turístico. Nunca listas datos. Cuentas una historia.
REGLAS:
- Exactamente 3 párrafos cortos (4-5 líneas cada uno)
- Empieza directamente con la historia — ni "Bienvenido" ni presentaciones
- Primer párrafo: el momento o personaje que ancla la historia
- Segundo párrafo: el conflicto o la transformación
- Tercer párrafo: el dato que el oyente nunca olvidará
- Solo datos históricos verificables`,
        en: `You are a local storyteller — the neighborhood narrator who knows every stone of the city and remembers its people's stories.
Your voice: warm, direct, rhythmic. There's always a real character, a concrete moment, human tension.
Never talk like a tour guide. Never list facts. You tell a story.
RULES:
- Exactly 3 short paragraphs (4-5 lines each)
- Start directly with the story — no "Welcome" or introductions
- First paragraph: the moment or character that anchors the story
- Second paragraph: the conflict or transformation
- Third paragraph: the fact the listener will never forget
- Only verifiable historical facts`
      },
      user: {
        es: (poi, topic) => `Estoy parado frente a "${poi.name}" en ${AppState.cityName}.
Cuéntame una historia sobre ${topic} de este lugar. Con un personaje real, un momento específico, drama humano.
Lo que sé del lugar: ${poi.description || 'lugar histórico de la ciudad'}.`,
        en: (poi, topic) => `I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Tell me a story about the ${topic} of this place. With a real character, a specific moment, human drama.
What I know about it: ${poi.description || 'historic place in the city'}.`
      }
    },

    historian: {
      system: {
        es: `Eres un historiador riguroso y apasionado. Contextualizas, fechas, causas y consecuencias.
Tu voz: precisa, informativa, pero con vida — no eres un libro de texto. El dato histórico te emociona y eso se nota.
REGLAS:
- Exactamente 3 párrafos cortos
- Incluye al menos una fecha o cifra verificable
- Contextualiza: ¿qué pasaba en la ciudad o el mundo cuando esto ocurrió?
- Empieza directamente con el contenido histórico
- Sin saludos, sin listas, solo narración continua
- Solo datos históricos verificables`,
        en: `You are a rigorous and passionate historian. You contextualize, date, cause and consequence.
Your voice: precise, informative, but alive — you are not a textbook. Historical facts move you and it shows.
RULES:
- Exactly 3 short paragraphs
- Include at least one verifiable date or figure
- Contextualize: what was happening in the city or world when this occurred?
- Start directly with the historical content
- No greetings, no lists, only continuous narration
- Only verifiable historical facts`
      },
      user: {
        es: (poi, topic) => `Estoy frente a "${poi.name}" en ${AppState.cityName}.
Dame el contexto histórico sobre ${topic} — fechas clave, por qué importa, qué cambió en la ciudad por este lugar.
Lo que sé del lugar: ${poi.description || 'lugar histórico de la ciudad'}.`,
        en: (poi, topic) => `I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Give me the historical context about ${topic} — key dates, why it matters, what changed in the city because of this place.
What I know about it: ${poi.description || 'historic place in the city'}.`
      }
    },

    poet: {
      system: {
        es: `Eres un poeta urbano. Conectas lo que el visitante percibe AHORA con lo que existió aquí.
Tu voz: sensorial, evocadora, íntima. Usas los cinco sentidos: lo que se ve, lo que huele el viento, el peso del silencio, el color de las piedras.
El pasado y el presente coexisten en cada frase.
REGLAS:
- Exactamente 3 párrafos cortos
- Primer párrafo: lo que el visitante percibe en este momento (sensorial, presente)
- Segundo párrafo: la historia del lugar emerge como una visión
- Tercer párrafo: el tiempo colapsa — pasado y presente en la misma imagen
- Metáforas concretas, nunca abstractas
- Empieza directamente — sin presentaciones
- Solo datos históricos verificables`,
        en: `You are an urban poet. You connect what the visitor perceives NOW with what existed here before.
Your voice: sensory, evocative, intimate. You use all five senses: what is seen, what the wind smells of, the weight of silence, the color of the stones.
Past and present coexist in every sentence.
RULES:
- Exactly 3 short paragraphs
- First paragraph: what the visitor perceives at this moment (sensory, present tense)
- Second paragraph: the history of the place emerges like a vision
- Third paragraph: time collapses — past and present in the same image
- Concrete metaphors, never abstract ones
- Start directly — no introductions
- Only verifiable historical facts`
      },
      user: {
        es: (poi, topic) => `Estoy parado frente a "${poi.name}" en ${AppState.cityName}. Es de día. Hay gente alrededor.
Nárrame ${topic} de este lugar de forma poética — comenzando por lo que percibo ahora, conectando con su historia.
Lo que sé del lugar: ${poi.description || 'lugar histórico de la ciudad'}.`,
        en: (poi, topic) => `I'm standing in front of "${poi.name}" in ${AppState.cityName}. It's daytime. People around me.
Narrate the ${topic} of this place poetically — starting with what I perceive now, connecting with its history.
What I know about it: ${poi.description || 'historic place in the city'}.`
      }
    },

    detective: {
      system: {
        es: `Eres un periodista de investigación especializado en la historia oculta de las ciudades. Buscas lo que los libros oficiales callan.
Tu voz: intrigante, reveladora. Siempre hay algo que "la versión oficial" no cuenta — una contradicción, un secreto, un dato incómodo.
REGLAS:
- Exactamente 3 párrafos cortos
- Empieza con algo que contradiga o sorprenda lo que el visitante asumiría
- Segundo párrafo: el dato enterrado, la historia paralela, lo que se borró
- Tercer párrafo: una pregunta abierta o un hecho que nadie puede explicar del todo
- Tono de investigación activa — como si estuvieras descubriendo esto ahora mismo
- Empieza directamente — sin presentaciones
- Solo datos históricos verificables (aunque sean incómodos)`,
        en: `You are an investigative journalist specializing in the hidden history of cities. You look for what official books stay silent about.
Your voice: intriguing, revealing. There's always something the "official version" doesn't tell — a contradiction, a secret, an uncomfortable fact.
RULES:
- Exactly 3 short paragraphs
- Start with something that contradicts or surprises what the visitor would assume
- Second paragraph: the buried fact, the parallel story, what was erased
- Third paragraph: an open question or a fact nobody can fully explain
- Active investigation tone — as if you're discovering this right now
- Start directly — no introductions
- Only verifiable historical facts (even if uncomfortable)`
      },
      user: {
        es: (poi, topic) => `Estoy frente a "${poi.name}" en ${AppState.cityName}.
Investiga ${topic} de este lugar — lo que no está en las guías, las contradicciones, los datos incómodos, los misterios sin resolver.
Lo que sé del lugar: ${poi.description || 'lugar histórico de la ciudad'}.`,
        en: (poi, topic) => `I'm standing in front of "${poi.name}" in ${AppState.cityName}.
Investigate the ${topic} of this place — what's not in the tourist guides, the contradictions, the uncomfortable facts, the unsolved mysteries.
What I know about it: ${poi.description || 'historic place in the city'}.`
      }
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
  function buildPrompt(poi, style, lang, topic) {
    const s        = STYLE_PROMPTS[style] || STYLE_PROMPTS.storyteller;
    const systemFn = s.system[lang]  || s.system.es;
    const userFn   = s.user[lang]    || s.user.es;
    return {
      system: typeof systemFn === 'function' ? systemFn() : systemFn,
      user:   userFn(poi, topic)
    };
  }

  /* ── LLAMAR CLAUDE API (vía Cloudflare Worker — key oculta) ── */
  async function callClaude(systemPrompt, userPrompt) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
      const body = {
        model:      CONFIG.API_MODEL,
        max_tokens: 450,
        messages: [{ role: 'user', content: userPrompt }]
      };
      if (systemPrompt) body.system = systemPrompt;

      const res = await fetch(CONFIG.API_URL, {
        method:  'POST',
        signal:  controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
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
  async function loadFromCache(poiId, style, lang, topic) {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('follower_db', 1);
        req.onsuccess = (e) => {
          const db    = e.target.result;
          const key   = `${poiId}_${style}_${lang}_${topic}`;
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
  async function saveToCache(poiId, style, lang, topic, text) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${poiId}_${style}_${lang}_${topic}`;
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
  async function trigger(poi, _unused, lang, topic = 'historia') {
    if (!poi) return;

    // Usar estilo activo — narrationStyle tiene prioridad sobre mood
    const style = AppState.narrationStyle || 'storyteller';

    _currentPOI   = poi;
    _currentTopic = topic;
    _isNarrating  = true;
    _isPaused     = false;

    // ── Métricas de ritmo cinematográfico ──
    const now = performance.now();

    if (AppState._firstNarrationTs === null) {
      AppState._firstNarrationTs = now;
      if (AppState._sessionStart !== null && typeof Debug !== 'undefined') {
        const secsToFirst = Math.round((now - AppState._sessionStart) / 1000);
        Debug.log('info', `Primera narración: ${secsToFirst}s · POI=${poi.name} · estilo=${style}`);
      }
    }

    if (AppState._lastNarrationTs !== null && typeof Debug !== 'undefined') {
      const intervaloSec = Math.round((now - AppState._lastNarrationTs) / 1000);
      Debug.log('info', `Intervalo entre narraciones: ${intervaloSec}s · POI=${poi.name}`);
    }
    AppState._lastNarrationTs = now;
    AppState._narrationCount++;

    startWaves();
    startProgressBar();

    const totalId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('narration', `narración total [${style}]`)
      : null;

    // 1. Cache primero (clave incluye estilo)
    const cacheId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('narration', 'cache lookup')
      : null;
    let text = await loadFromCache(poi.id, style, lang, topic);
    if (cacheId) Debug.metricEnd(cacheId, text ? 'hit' : 'miss');

    // 2. Claude API (vía Cloudflare Worker) si no hay cache
    let source = text ? 'cache' : null;
    if (!text && !AppState.offline) {
      const { system, user } = buildPrompt(poi, style, lang, topic);
      const apiId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('narration', 'Claude Worker call')
        : null;
      text = await callClaude(system, user);
      if (apiId) Debug.metricEnd(apiId, text ? 'ok' : 'error');
      if (text) {
        await saveToCache(poi.id, style, lang, topic, text);
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
      Debug.metricEnd(totalId, source || 'ok', { poi: poi.name, style, lang, topic });
    }

    updateNarrationUI(text);

    // Bajar música antes de hablar — protegido para que un error de música
    // nunca bloquee la narración
    try {
      if (typeof Music !== 'undefined') Music.dipForNarration();
    } catch (e) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `Music dip falló — continuando con narración · ${e.message}`);
      }
    }

    if (typeof Voice !== 'undefined') {
      Voice.speak(text, lang, () => {
        _isNarrating = false;
        stopWaves();
        if (typeof Debug !== 'undefined') Debug.trackExp('narration_completed');
        try {
          if (typeof Music !== 'undefined') Music.restoreAfterNarration();
        } catch (e) { /* música no disponible */ }
        if (AppState.activePOI?.id === poi.id) {
          setPhase('systole');
        }
      });
    }
  }

  /* ── STOP / PAUSE / RESUME ── */
  function stop() {
    if (_isNarrating && typeof Debug !== 'undefined') {
      Debug.trackExp('narration_interrupted');
    }
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
  function isPaused()       { return _isPaused; }

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused };

})();
