/* ═══════════════════════════════════════════
   FOLLOWER — narration.js
   Claude Haiku via Cloudflare Worker proxy.
   DA-3: trigger() función única.
   Estilos: storyteller, historian, explorer, local
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
        es: `Eres un narrador de historias humanas. Tu materia prima son las personas — no los edificios, no las fechas. Siempre hay alguien que vivió algo aquí.
Tu voz: cálida, con ritmo, con suspenso. El oyente no puede dejar de escuchar porque quiere saber qué pasó.
REGLAS:
- Exactamente 3 párrafos cortos
- Empieza directamente con un personaje o un momento humano concreto — como: "Hace más de cien años una joven cruzó esta plaza..."
- Primer párrafo: el personaje y la situación que lo ancla aquí
- Segundo párrafo: la emoción, la anécdota, lo que le pasó — el suspenso
- Tercer párrafo: el remate — lo que cambió, lo que quedó, lo que el oyente no va a olvidar
- Sin presentaciones, sin saludos, sin datos sueltos
- Solo datos históricos verificables
- LONGITUD: máximo 70 palabras por párrafo. Total: 180-220 palabras. Objetivo: 30-40 segundos hablado.`,
        en: `You are a human stories narrator. Your raw material is people — not buildings, not dates. There's always someone who lived something here.
Your voice: warm, rhythmic, suspenseful. The listener can't stop listening because they want to know what happened.
RULES:
- Exactly 3 short paragraphs
- Start directly with a character or a concrete human moment — like: "More than a hundred years ago a young woman crossed this plaza..."
- First paragraph: the character and the situation that anchors them here
- Second paragraph: the emotion, the anecdote, what happened — the suspense
- Third paragraph: the payoff — what changed, what remained, what the listener won't forget
- No introductions, no greetings, no loose facts
- Only verifiable historical facts
- LENGTH: maximum 70 words per paragraph. Total: 180-220 words. Target: 30-40 seconds spoken.`
      },
      user: {
        es: (poi, topic, context) => `Estoy parado en "${poi.name}" en ${AppState.cityName}.
Cuéntame la historia de alguien que vivió algo aquí. Un personaje real, un momento específico, con emoción y suspenso.
Usa el entorno completo — no solo este lugar, sino todo lo que hay alrededor para encontrar el ángulo humano más memorable.${context || ''}`,
        en: (poi, topic, context) => `I'm standing at "${poi.name}" in ${AppState.cityName}.
Tell me the story of someone who lived something here. A real character, a specific moment, with emotion and suspense.
Use the full surroundings — not just this place, but everything nearby to find the most memorable human angle.${context || ''}`
      }
    },

    historian: {
      system: {
        es: `Eres un historiador apasionado. Tu foco es la historia, las fechas, la arquitectura y el contexto — por qué este lugar existe, qué representa, qué revela de su época.
Tu voz: precisa pero viva. Los datos te emocionan y eso se nota. No eres un libro de texto — eres alguien que encontró algo fascinante y lo está contando.
REGLAS:
- Exactamente 3 párrafos cortos
- Empieza directamente con el lugar — como: "La Ermita fue construida en 1942 inspirada en el gótico europeo..."
- Primer párrafo: el dato fundacional — cuándo, por qué, qué estilo arquitectónico, qué contexto histórico
- Segundo párrafo: lo que este lugar revela de la ciudad y la época en que se construyó
- Tercer párrafo: lo que sobrevivió, lo que cambió, por qué sigue importando hoy
- Al menos una fecha o cifra verificable
- Sin saludos, sin listas, solo narración continua
- Solo datos históricos verificables
- LONGITUD: máximo 70 palabras por párrafo. Total: 180-220 palabras. Objetivo: 30-40 segundos hablado.`,
        en: `You are a passionate historian. Your focus is history, dates, architecture and context — why this place exists, what it represents, what it reveals about its era.
Your voice: precise but alive. Facts move you and it shows. You are not a textbook — you are someone who found something fascinating and is sharing it.
RULES:
- Exactly 3 short paragraphs
- Start directly with the place — like: "The Ermita was built in 1942 inspired by European Gothic..."
- First paragraph: the founding fact — when, why, what architectural style, what historical context
- Second paragraph: what this place reveals about the city and the era it was built in
- Third paragraph: what survived, what changed, why it still matters today
- At least one verifiable date or figure
- No greetings, no lists, only continuous narration
- Only verifiable historical facts
- LENGTH: maximum 70 words per paragraph. Total: 180-220 words. Target: 30-40 seconds spoken.`
      },
      user: {
        es: (poi, topic, context) => `Estoy en "${poi.name}" en ${AppState.cityName}.
Cuéntame la historia de este lugar y su entorno — cuándo fue construido, qué contexto histórico lo explica, qué revela de la ciudad y su época.
Considera todo lo que hay alrededor para dar el contexto histórico más rico.${context || ''}`,
        en: (poi, topic, context) => `I'm at "${poi.name}" in ${AppState.cityName}.
Tell me the history of this place and its surroundings — when it was built, what historical context explains it, what it reveals about the city and its era.
Consider everything nearby to give the richest historical context.${context || ''}`
      }
    },

    explorer: {
      system: {
        es: `Eres un periodista urbano que descubre lo que la ciudad esconde a simple vista. No buscas lo oscuro — buscas lo fascinante que nadie notó.
Tu voz: directa, con ritmo de revelación. Cada frase abre algo. El oyente siente que está a punto de descubrir lo que el 99% de la gente pasa por alto.
REGLAS:
- Exactamente 3 párrafos cortos
- Empieza con algo que está ahí pero nadie ve — como: "La mayoría de las personas pasan por aquí sin notar..."
- Primer párrafo: la curiosidad o detalle oculto que abre la historia
- Segundo párrafo: la revelación — qué significa realmente, qué esconde
- Tercer párrafo: el dato que cambia cómo el oyente va a ver este lugar para siempre
- Tono de descubrimiento activo — como si lo estuvieras revelando ahora mismo
- Sin presentaciones, sin saludos
- Solo datos históricos verificables
- LONGITUD: máximo 70 palabras por párrafo. Total: 180-220 palabras. Objetivo: 30-40 segundos hablado.`,
        en: `You are an urban journalist who uncovers what the city hides in plain sight. You're not looking for the dark — you're looking for the fascinating that nobody noticed.
Your voice: direct, with a rhythm of revelation. Every sentence opens something. The listener feels they're about to discover what 99% of people walk right past.
RULES:
- Exactly 3 short paragraphs
- Start with something that's right there but nobody sees — like: "Most people walk past here without noticing..."
- First paragraph: the curiosity or hidden detail that opens the story
- Second paragraph: the revelation — what it really means, what it hides
- Third paragraph: the fact that changes how the listener will see this place forever
- Active discovery tone — as if you're revealing it right now
- No introductions, no greetings
- Only verifiable historical facts
- LENGTH: maximum 70 words per paragraph. Total: 180-220 words. Target: 30-40 seconds spoken.`
      },
      user: {
        es: (poi, topic, context) => `Estoy en "${poi.name}" en ${AppState.cityName}.
Revélame algo que la mayoría no nota — una curiosidad, un secreto, un detalle oculto de este lugar o de todo lo que lo rodea.
Busca el ángulo que cambia cómo se ve este rincón de la ciudad.${context || ''}`,
        en: (poi, topic, context) => `I'm at "${poi.name}" in ${AppState.cityName}.
Reveal something most people don't notice — a curiosity, a secret, a hidden detail about this place or everything surrounding it.
Find the angle that changes how you see this corner of the city.${context || ''}`
      }
    },

    local: {
      system: {
        es: `Eres alguien que nació en esta ciudad y conoce este lugar desde siempre. No eres guía ni historiador — eres el vecino que vivió esto.
Tu voz: cercana, directa, personal. Hablas como le hablarías a un amigo recién llegado. Usas referencias reales: cómo llaman este lugar los de aquí, qué se hace, qué se dice.
REGLAS:
- Exactamente 3 párrafos cortos
- Empieza con cómo los locales viven este lugar — como: "Si le preguntas a cualquier caleño dónde encontrarse con alguien..."
- Primer párrafo: la costumbre, el hábito, el nombre coloquial — cómo lo usa la gente de verdad
- Segundo párrafo: algo que solo sabe quien creció aquí — una anécdota del barrio, una tradición, un recuerdo colectivo
- Tercer párrafo: lo que este lugar significa para la gente de aquí, no para los turistas
- Voz personal y directa — nada de tono oficial
- Sin presentaciones, sin saludos
- LONGITUD: máximo 70 palabras por párrafo. Total: 180-220 palabras. Objetivo: 30-40 segundos hablado.`,
        en: `You are someone who was born in this city and has known this place forever. You're not a guide or a historian — you're the neighbor who lived this.
Your voice: close, direct, personal. You talk like you would to a friend who just arrived. You use real references: what locals call this place, what people do here, what people say.
RULES:
- Exactly 3 short paragraphs
- Start with how locals experience this place — like: "If you ask any local where to meet someone..."
- First paragraph: the custom, the habit, the colloquial name — how real people use it
- Second paragraph: something only someone who grew up here knows — a neighborhood anecdote, a tradition, a collective memory
- Third paragraph: what this place means for the people from here, not for tourists
- Personal and direct voice — nothing official
- No introductions, no greetings
- LENGTH: maximum 70 words per paragraph. Total: 180-220 words. Target: 30-40 seconds spoken.`
      },
      user: {
        es: (poi, topic, context) => `Estoy en "${poi.name}" en ${AppState.cityName}.
Cuéntame cómo vive la gente de aquí este rincón — las costumbres reales, los nombres coloquiales, lo que significan estos lugares para quienes crecieron aquí.
No la historia oficial. La memoria viva del barrio.${context || ''}`,
        en: (poi, topic, context) => `I'm at "${poi.name}" in ${AppState.cityName}.
Tell me how people from here experience this corner of the city — the real customs, the local names, what these places mean to those who grew up here.
Not the official history. The living memory of the neighborhood.${context || ''}`
      }
    }
  };

  /* ── BIENVENIDA DE CIUDAD — una frase por narrador ── */
  const CITY_WELCOME = {
    storyteller: {
      es: (city) => `${city}. Aquí cada esquina tiene un personaje esperando ser contado.`,
      en: (city) => `${city}. Every corner here has a character waiting to be told.`
    },
    historian: {
      es: (city) => `${city}. Cada piedra de esta ciudad tiene una fecha y una razón.`,
      en: (city) => `${city}. Every stone in this city has a date and a reason.`
    },
    explorer: {
      es: (city) => `${city}. La mayoría pasa por aquí sin notar lo que realmente esconde.`,
      en: (city) => `${city}. Most people pass through without noticing what it really hides.`
    },
    local: {
      es: (city) => `${city}. Bienvenido. Acá te cuento cómo es esto de verdad.`,
      en: (city) => `${city}. Welcome. Let me tell you how this place really works.`
    }
  };

  /* ── OBTENER FRASE DE BIENVENIDA ── */
  function getCityWelcome(city, style, lang) {
    const narrator = CITY_WELCOME[style] || CITY_WELCOME.storyteller;
    const fn       = narrator[lang]      || narrator.es;
    return fn(city);
  }

  /* ── SANITIZAR TEXTO — eliminar markdown antes de hablar ── */
  // Claude puede responder con **negrita**, # títulos, - listas aunque el prompt
  // diga "narración continua". La voz lee esos caracteres literalmente.
  function sanitizeNarration(text) {
    return text
      // Encabezados markdown
      .replace(/^#{1,6}\s+/gm, '')
      // Negrita y cursiva: **texto**, *texto*, __texto__, _texto_
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Código inline
      .replace(/`([^`]+)`/g, '$1')
      // Bloques de código
      .replace(/```[\s\S]*?```/g, '')
      // Listas: - item o * item al inicio de línea
      .replace(/^[\-\*]\s+/gm, '')
      // Listas numeradas: 1. item
      .replace(/^\d+\.\s+/gm, '')
      // Líneas vacías múltiples → una sola
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

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
  /* ── CONSTRUIR CONTEXTO DEL ENTORNO ──
     Recopila los POIs Wikipedia cercanos para dárselos a Claude como
     materia prima narrativa. El POI activado es el detonante geográfico;
     el entorno es donde viven las historias.
  ── */
  function buildContext(lang) {
    // Nunca debe romper trigger() — envuelto en try/catch defensivo
    try {
      const allPOIs = (typeof POI !== 'undefined' && typeof POI.getPOIs === 'function')
        ? POI.getPOIs()
        : [];

      if (allPOIs.length === 0) return '';

      // Calcular distancia en tiempo real — _distanceMeters puede ser null
      // si detectPOI() aún no procesó los POIs en este tick
      const lat = AppState.gps?.lat;
      const lng = AppState.gps?.lng;

      const withDist = allPOIs
        .filter(p => p && p.name)
        .map(p => {
          const dist = (lat && lng && typeof GPS !== 'undefined')
            ? Math.round(GPS.distanceMeters(lat, lng, p.lat, p.lng))
            : (p._distanceMeters || 9999);
          return { name: p.name, dist };
        })
        .filter(p => p.dist <= 600)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8);

      if (withDist.length === 0) return '';

      const lines = withDist.map(p => '  - ' + p.name + ' (' + p.dist + 'm)').join('\n');

      if (lang === 'en') {
        return '\nNearby places within 600m:\n' + lines;
      }
      return '\nLugares cercanos en un radio de 600m:\n' + lines;

    } catch (e) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', 'Narration: buildContext falló (' + e.message + ') — continuando sin contexto');
      }
      return '';
    }
  }


  function buildPrompt(poi, style, lang, topic) {
    const s        = STYLE_PROMPTS[style] || STYLE_PROMPTS.storyteller;
    const systemFn = s.system[lang]  || s.system.es;
    const userFn   = s.user[lang]    || s.user.es;
    const context  = buildContext(lang);
    return {
      system: typeof systemFn === 'function' ? systemFn() : systemFn,
      user:   userFn(poi, topic, context)
    };
  }

  /* ── LLAMAR CLAUDE API (vía Cloudflare Worker — key oculta) ── */
  async function callClaude(systemPrompt, userPrompt) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
      const body = {
        model:      CONFIG.API_MODEL,
        max_tokens: 350,
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
    // Timeout de 2s: si IndexedDB está bloqueada por otra transacción,
    // no esperar indefinidamente — continuar sin cache y llamar a Claude
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', 'Narration: loadFromCache timeout — IndexedDB bloqueada, continuando sin cache');
        }
        resolve(null);
      }, 2000);

      try {
        const req = indexedDB.open('follower_db', 1);
        req.onsuccess = (e) => {
          const db    = e.target.result;
          const key   = `${poiId}_${style}_${lang}_${topic}`;
          const tx    = db.transaction('narrations', 'readonly');
          const store = tx.objectStore('narrations');
          const get   = store.get(key);
          get.onsuccess = () => { clearTimeout(timeout); resolve(get.result?.text || null); };
          get.onerror   = () => { clearTimeout(timeout); resolve(null); };
        };
        req.onerror = () => { clearTimeout(timeout); resolve(null); };
      } catch (e) {
        clearTimeout(timeout);
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
    if (typeof Debug !== 'undefined') {
      Debug.log('info', `Narration: trigger llamado · poi=${poi?.name} lang=${lang}`);
    }
    if (!poi) return;

    // Usar estilo activo — narrationStyle tiene prioridad sobre mood
    const style = AppState.narrationStyle || 'storyteller';

    // Guard: no interrumpir una narración en curso
    // Si ya está narrando, ignorar el trigger — la narración actual debe terminar
    if (_isNarrating) {
      if (typeof Debug !== 'undefined') {
        const mismo = _currentPOI?.id === poi.id ? 'mismo POI' : `POI diferente: ${poi.name}`;
        Debug.log('info', `Narration: narrando en curso (${_currentPOI?.name}) — ignorando trigger [${mismo}]`);
      }
      return;
    }

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

    // Sanitizar antes de mostrar y hablar — elimina markdown que la voz leería
    text = sanitizeNarration(text);

    updateNarrationUI(text);

    // Reproducir intro del narrador — con timeout de 3s para no bloquear la voz
    // Si los MP3 no existen o el AudioContext falla, seguimos directo a la voz
    if (typeof Music !== 'undefined') {
      const introId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('narration', `intro musical [${style}]`)
        : null;
      try {
        await Promise.race([
          Music.playNarratorIntro(style),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        if (introId) Debug.metricEnd(introId, 'ok');
      } catch (e) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Music intro falló — continuando con narración · ${e.message}`);
        }
        if (introId) Debug.metricEnd(introId, 'error');
      }
    }

    if (typeof Voice !== 'undefined') {
      Voice.speak(text, lang, () => {
        _isNarrating = false;
        stopWaves();

        // S2-A1: marcar visitado al COMPLETAR, no al activar
        // Un POI interrumpido vuelve a estar disponible en la próxima detección
        if (poi && !poi.visited) {
          poi.visited = true;
          if (typeof AppState !== 'undefined') {
            AppState.poisVisited++;
            if (typeof updateStats === 'function') updateStats();
          }
          if (typeof Debug !== 'undefined') {
            Debug.log('info', `POI: visited=true al completar narración · ${poi.name}`);
          }
        }

        if (typeof Debug !== 'undefined') Debug.trackExp('narration_completed');
        if (AppState.activePOI?.id === poi.id) {
          setPhase('systole');
        }

        // S2-A2: procesar cola narrativa después de completar
        if (typeof POI !== 'undefined' && typeof POI.processQueue === 'function') {
          POI.processQueue();
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

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome };

})();
