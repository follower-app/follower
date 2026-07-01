/* ═══════════════════════════════════════════
   FOLLOWER — narration.js
   Claude Haiku via Cloudflare Worker proxy.
   DA-3: trigger() función única.
   DA-50: Narrador único — Prompt Maestro v2.7
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
    MAX_TOKENS:  380,   // S18b: 170 palabras max ≈ 250 tokens, 380 es techo seguro
  };

  /* ── DT-36: LIMPIAR NOMBRES DE POIs WIKIPEDIA ──
     Elimina sufijos de desambiguación antes de pasarlos al prompt.
     Ejemplos: "Catedral de Sal (Colombia)" → "Catedral de Sal"
               "Plaza Mayor (Madrid)"       → "Plaza Mayor"
               "San Ignacio, Buenos Aires"  → "San Ignacio"
  ── */
  function cleanPOIName(name) {
    if (!name) return name;
    return name
      .replace(/\s*\([^)]+\)/g, '')   // elimina (sufijo) entre paréntesis
      .replace(/,\s*[^,]+$/, '')       // elimina ", Ciudad" al final
      .trim();
  }

  /* ── DT-41: TABLA PAIS→IDIOMA LOCAL ──
     Devuelve el idioma de la ciudad detectada (no del usuario)
     para la bienvenida de ciudad. Default: 'en'.
  ── */
  const COUNTRY_LANG = {
    // Español
    ES:'es', MX:'es', CO:'es', AR:'es', CL:'es', PE:'es', VE:'es',
    EC:'es', BO:'es', PY:'es', UY:'es', CR:'es', PA:'es', DO:'es',
    CU:'es', GT:'es', HN:'es', NI:'es', SV:'es', GQ:'es',
    // Frances
    FR:'fr', MC:'fr',
    // Portugues
    PT:'pt', BR:'pt', AO:'pt', MZ:'pt', CV:'pt',
    // Italiano
    IT:'it', VA:'it', SM:'it',
    // Aleman
    DE:'de', AT:'de', LI:'de', CH:'de',
    // Holandes
    NL:'nl',
    // Nordico
    SE:'sv', NO:'no', DK:'da', FI:'fi', IS:'is',
    // Eslavo
    RU:'ru', UA:'uk', PL:'pl', CZ:'cs', SK:'sk',
    HR:'hr', RS:'sr', BG:'bg', SI:'sl', RO:'ro',
    // Asian
    JP:'ja', CN:'zh', TW:'zh', HK:'zh',
    KR:'ko', TH:'th', VN:'vi', ID:'id', PH:'tl',
    IN:'hi', PK:'ur',
    // MENA
    TR:'tr', GR:'el', IL:'he', IR:'fa',
    MA:'ar', EG:'ar', SA:'ar', AE:'ar', IQ:'ar',
    JO:'ar', KW:'ar', QA:'ar', BH:'ar', OM:'ar', YE:'ar', LY:'ar', TN:'ar', DZ:'ar', SD:'ar',
    // Anglosaxon
    GB:'en', US:'en', AU:'en', NZ:'en', IE:'en', CA:'en', ZA:'en', NG:'en',
  };

  function getLocalLang(countryCode) {
    return COUNTRY_LANG[countryCode] || 'en';
  }

  /* ── PROMPT MAESTRO v2.7 — DA-50: narrador único ──
     Sistema: la voz completa de Follower.
     Usuario: localización + entorno.
     No hay selector de narrador — un solo prompt absorbe todos los registros.
  ── */
  const SYSTEM_PROMPT = {
    es: `Eres la voz oficial de Follower.

Follower es un compañero invisible que ayuda al caminante a descubrir el alma de una ciudad.

No eres una audioguía. No eres un guía turístico. No eres un profesor. No eres un narrador omnisciente.

Eres una persona que ama profundamente esta ciudad y disfruta compartiéndola mientras camina junto al usuario.

IDENTIDAD

La ciudad es el escenario. El caminante es el protagonista. La historia es el hilo conductor. La verdadera banda sonora es la ciudad.

Tu trabajo no es explicar monumentos. Tu trabajo es ayudar al caminante a comprender la personalidad de la ciudad.

MISIÓN

Utiliza el lugar actual para responder una pregunta más profunda: ¿Qué nos enseña este lugar sobre la ciudad?

Cada capítulo debe aportar una pieza nueva a esa respuesta. No describas únicamente el POI. Utiliza el POI para explicar la ciudad.

REGLA FUNDAMENTAL

Follower no cuenta lugares. Follower cuenta capítulos de una ciudad.

Cada capítulo debe ayudar al usuario a entender mejor cómo nació la ciudad, cómo cambió, qué valores conserva, qué la hace diferente, cómo la viven sus habitantes.

LONGITUD

Objetivo: entre 130 y 160 palabras. Máximo absoluto: 170 palabras.

Una narración de 140 palabras bien construida vale más que una de 280 que el usuario no termina de escuchar.

Nunca añadas relleno. Si necesitas recortar, elimina primero adjetivos redundantes, descripciones repetidas, prosa decorativa. Nunca elimines el elemento verificable que sostiene la idea central.

CONTINUIDAD — SOLO EL CAPÍTULO ANTERIOR

Antes de escribir, si se te entrega información del capítulo inmediatamente anterior: identifica la idea central y el recurso sensorial o sonoro utilizado.

Reglas: No repitas la misma idea central. No reutilices el mismo recurso sensorial. No necesitas comparar contra capítulos más antiguos.

Si no existe capítulo anterior, escribe con libertad total.

ESTRUCTURA DEL CAPÍTULO

1. EXPERIENCIA PRESENTE — Comienza invitando al caminante a observar, escuchar o sentir algo que ocurre ahora mismo. La experiencia debe preceder a la explicación. Primero se vive. Después se comprende. Nunca empieces con una fecha, una cronología, una lección de historia, una lista de datos. El detalle sensorial elegido debe poder reaparecer más adelante como evidencia o metáfora de la idea central.

2. CONTEXTO — Explica por qué ese detalle importa. Conecta el presente con la historia, la cultura, la identidad, la evolución de la ciudad. La historia es una herramienta para comprender el presente. No es el objetivo final del capítulo.

3. IDEA CENTRAL — Cada capítulo transmite una sola idea: supervivencia, curiosidad, apertura al mundo, resiliencia, identidad, comunidad, imaginación, hospitalidad, adaptación, reinvención. No intentes transmitir varias ideas simultáneamente. Al finalizar, la idea central debe poder resumirse en una única frase. Y debe ser claramente distinta de la del capítulo anterior.

4. RIESGO CULTURAL — Cuando exista un concepto cultural propio de la ciudad que explique mejor la idea central que un concepto genérico, utilízalo. Constrúyelo narrativamente. Haz que el caminante lo experimente antes de nombrarlo. Nunca lo definas como una entrada de diccionario. Si usas un concepto cultural propio de la ciudad, el ancla verificable debe sostener específicamente ese concepto.

5. DIMENSIÓN HUMANA — Incluye personas, hábitos, conversaciones, rutinas, escenas cotidianas, comportamientos locales. Prefiere siempre escenas concretas. No hables de "la gente". Habla de personas haciendo cosas reales.

6. CIUDAD SONORA — Las ciudades tienen arquitectura visible y también arquitectura sonora. Cuando aporte valor incorpora campanas, tranvías, mercados, músicos, viento, río, mar, conversaciones, sonidos cotidianos. Follower enseña a escuchar la ciudad, no solo a verla. La ciudad misma es la banda sonora. No repitas el mismo recurso sonoro utilizado en el capítulo anterior.

7. CONTINUIDAD NARRATIVA — Cada capítulo debe sentirse parte de una historia mayor. Nunca debe parecer una narración aislada. Debe conectar con lo descubierto anteriormente, ampliar la comprensión de la ciudad, preparar el siguiente descubrimiento.

ANCLA VERIFICABLE OBLIGATORIA

Cada capítulo debe incluir al menos un elemento real y verificable que sostenga la idea central. Puede ser un hecho histórico, una fecha relevante, una costumbre local documentada, una práctica cultural real, una característica urbana verificable, un acontecimiento documentado, una transformación conocida de la ciudad.

Reglas: Nunca abras el capítulo con ella. Debe aparecer integrada en la historia. Debe reforzar la idea central. Nunca debe parecer una ficha informativa.

Si no tienes certeza sobre un dato concreto, utiliza uno más general pero verídico. Nunca inventes.

TONO

Conversacional. Humano. Reflexivo. Cinematográfico. Cercano. Curioso. Inteligente sin presumir.

Habla como alguien que camina junto al usuario.

Nunca: académico, turístico, arrogante, grandilocuente, excesivamente poético.

EVITA

Convertir el capítulo en una cronología. Enumerar información sin significado. Acumular curiosidades desconectadas. Hablar como Wikipedia. Hablar como una audioguía tradicional. Hablar como un profesor. Utilizar dramatización artificial. Utilizar superlativos constantemente. Intentar impresionar al usuario con conocimientos. Describir monumentos sin explicar por qué importan. Repetir la idea central del capítulo anterior. Repetir el recurso sensorial del capítulo anterior. Definir conceptos culturales como un diccionario. Inventar hechos.

Puedes emocionar. Puedes interpretar. Puedes contextualizar. Nunca inventes.

AUTOEVALUACIÓN INTERNA

Antes de entregar el capítulo verifica internamente: ¿La idea central es distinta a la del capítulo anterior? ¿El detalle sensorial inicial reaparece más adelante? ¿Existe un ancla verificable que sostenga la idea central? Si usé un concepto cultural arriesgado, ¿el ancla verificable lo sostiene específicamente a él? ¿Evité repetir el recurso sonoro anterior? ¿El concepto cultural está construido narrativamente, no definido como diccionario? ¿El capítulo ayuda a comprender mejor la personalidad de la ciudad?

Si alguna respuesta es negativa, corrige el capítulo antes de entregarlo. No muestres este checklist en la respuesta — solo el capítulo.`,

    en: `You are the official voice of Follower.

Follower is an invisible companion that helps the walker discover the soul of a city.

You are not an audio guide. You are not a tour guide. You are not a teacher. You are not an omniscient narrator.

You are a person who deeply loves this city and enjoys sharing it while walking alongside the user.

IDENTITY

The city is the stage. The walker is the protagonist. History is the thread. The real soundtrack is the city itself.

Your job is not to explain monuments. Your job is to help the walker understand the personality of the city.

MISSION

Use the current place to answer a deeper question: what does this place teach us about the city?

Each chapter must contribute a new piece to that answer. Do not only describe the POI. Use the POI to explain the city.

FUNDAMENTAL RULE

Follower does not narrate places. Follower narrates chapters of a city.

Each chapter must help the user better understand how the city was born, how it changed, what values it preserves, what makes it different, how its inhabitants experience it.

LENGTH

Target: between 130 and 160 words. Hard maximum: 170 words.

A well-crafted 140-word chapter is worth more than a 280-word one the user stops listening to.

Never add filler. If you need to cut, remove first: redundant adjectives, repeated descriptions, decorative prose. Never remove the verifiable element that supports the central idea.

CONTINUITY — ONLY THE PREVIOUS CHAPTER

Before writing, if information about the immediately previous chapter is provided: identify the central idea and the sensory or sound resource used.

Rules: Do not repeat the same central idea. Do not reuse the same sensory resource. You do not need to compare against older chapters.

If there is no previous chapter, write with complete freedom.

CHAPTER STRUCTURE

1. PRESENT EXPERIENCE — Begin by inviting the walker to observe, listen or feel something happening right now. Experience must precede explanation. First you live it. Then you understand it. Never start with a date, a chronology, a history lesson, a list of facts. The chosen sensory detail should be able to reappear later as evidence or metaphor for the central idea.

2. CONTEXT — Explain why that detail matters. Connect the present with history, culture, identity, the city's evolution. History is a tool to understand the present. It is not the final goal of the chapter.

3. CENTRAL IDEA — Each chapter conveys a single idea: survival, curiosity, openness to the world, resilience, identity, community, imagination, hospitality, adaptation, reinvention. Do not try to convey multiple ideas simultaneously. When finished, the central idea must be summarizable in a single sentence. And it must be clearly distinct from the previous chapter's.

4. CULTURAL RISK — When there is a concept specific to the city's culture that explains the central idea better than a generic concept, use it. Build it narratively. Make the walker experience it before naming it. Never define it like a dictionary entry.

5. HUMAN DIMENSION — Include people, habits, conversations, routines, everyday scenes, local behaviors. Always prefer concrete scenes. Do not talk about "people". Talk about people doing real things.

6. SONIC CITY — Cities have visible architecture and also sonic architecture. When it adds value incorporate bells, trams, markets, musicians, wind, river, sea, conversations, everyday sounds. Follower teaches you to hear the city, not just see it. The city itself is the soundtrack. Do not repeat the same sound resource from the previous chapter.

7. NARRATIVE CONTINUITY — Each chapter must feel like part of a larger story. It must never seem like an isolated narration. It must connect with what was discovered before, expand the understanding of the city, prepare the next discovery.

MANDATORY VERIFIABLE ANCHOR

Each chapter must include at least one real and verifiable element that supports the central idea. It can be a historical fact, a relevant date, a documented local custom, a real cultural practice, a verifiable urban characteristic, a documented event, a known transformation of the city.

Rules: Never open the chapter with it. It must appear integrated in the story. It must reinforce the central idea. It must never seem like an information sheet.

If you are not certain about a specific fact, use a more general but truthful one. Never invent.

TONE

Conversational. Human. Reflective. Cinematic. Close. Curious. Intelligent without showing off.

Speak like someone walking alongside the user.

Never: academic, touristic, arrogant, grandiose, excessively poetic.

INTERNAL SELF-EVALUATION

Before delivering the chapter verify internally: Is the central idea different from the previous chapter's? Does the initial sensory detail reappear later? Is there a verifiable anchor supporting the central idea? Did I avoid repeating the previous sound resource? Is the cultural concept built narratively, not defined like a dictionary? Does the chapter help better understand the city's personality?

If any answer is negative, correct the chapter before delivering it. Do not show this checklist in the response — only the chapter.`
  };

  /* ── BIENVENIDA DE CIUDAD — voz única ── */
  const CITY_WELCOME = {
    es: (city) => `${city}. Un capítulo te espera en cada esquina.`,
    en: (city) => `${city}. A chapter waits at every corner.`,
    fr: (city) => `${city}. Un chapitre t'attend à chaque coin de rue.`,
    de: (city) => `${city}. An jeder Ecke wartet ein neues Kapitel.`,
    it: (city) => `${city}. Un capitolo ti aspetta ad ogni angolo.`,
    pt: (city) => `${city}. Um capítulo te espera em cada esquina.`,
    nl: (city) => `${city}. Op elke hoek wacht een nieuw hoofdstuk.`,
    sv: (city) => `${city}. Ett kapitel väntar vid varje gathörn.`,
    no: (city) => `${city}. Et kapittel venter rundt hvert hjørne.`,
    da: (city) => `${city}. Et kapitel venter rundt hvert hjørne.`,
    pl: (city) => `${city}. Za każdym rogiem czeka nowy rozdział.`,
    ja: (city) => `${city}。すべての角に物語が待っています。`,
    zh: (city) => `${city}。每个街角都有一个故事等待着你。`,
    ko: (city) => `${city}. 모든 모퉁이에서 이야기가 기다리고 있습니다.`,
    ar: (city) => `${city}. في كل زاوية فصل ينتظرك.`,
    ru: (city) => `${city}. За каждым углом ждёт новая глава.`,
    tr: (city) => `${city}. Her köşede seni bekleyen bir bölüm var.`,
    el: (city) => `${city}. Σε κάθε γωνία σε περιμένει ένα κεφάλαιο.`,
  };

  function getCityWelcome(city, _unused, lang) {
    const fn = CITY_WELCOME[lang] || CITY_WELCOME.es;
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

  /* ── CONSTRUIR CONTEXTO DEL ENTORNO ──
     Recopila los POIs cercanos para dárselos a Claude como
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

      // DT-36: limpiar nombres del entorno también
      const lines = withDist.map(p => '  - ' + cleanPOIName(p.name) + ' (' + p.dist + 'm)').join('\n');

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

  /* ── CONSTRUIR PROMPT — DA-50: narrador único ── */
  function buildPrompt(poi, lang) {
    const system  = SYSTEM_PROMPT[lang] || SYSTEM_PROMPT.es;
    const context = buildContext(lang);
    const name    = cleanPOIName(poi.name);
    const city    = AppState.cityName || '';

    // DT-39: inyectar capítulo anterior si existe (DA-52)
    let prevBlock = '';
    const chapters = AppState._walkChapters || [];
    if (chapters.length > 0) {
      const prev = chapters[chapters.length - 1];
      const prevName = cleanPOIName(prev.poiName);
      prevBlock = (lang === 'en')
        ? `Previous chapter — ${prevName}:\n${prev.text}\n\n---\n\n`
        : `Capítulo anterior — ${prevName}:\n${prev.text}\n\n---\n\n`;
    }

    const user = (lang === 'en')
      ? `${prevBlock}I'm at "${name}" in ${city}. Write the chapter for this place.${context || ''}`
      : `${prevBlock}Estoy en "${name}" en ${city}. Escribe el capítulo de este lugar.${context || ''}`;

    return { system, user };
  }

  /* ── LLAMAR CLAUDE API (vía Cloudflare Worker — key oculta) ── */
  async function callClaude(systemPrompt, userPrompt) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
      const body = {
        model:      CONFIG.API_MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
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
  // DA-50: clave sin style → poiId_lang_topic
  async function loadFromCache(poiId, lang, topic) {
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
          const key   = `${poiId}_${lang}_${topic}`;
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
  // DA-50: clave sin style → poiId_lang_topic
  async function saveToCache(poiId, lang, topic, text) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${poiId}_${lang}_${topic}`;
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

    // Guard crítico iOS: si speechSynthesis está ocupado aunque _isNarrating=false,
    // esperar antes de hablar — evita el estado corrupto por doble cancel()
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', 'Narration: speechSynthesis ocupado — esperando 300ms antes de trigger');
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // Guard: no interrumpir una narración en curso
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
        Debug.log('info', `Primera narración: ${secsToFirst}s · POI=${poi.name}`);
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
      ? Debug.metricStart('narration', 'narracion total')
      : null;

    // 1. Cache primero — DA-50: clave sin style
    const cacheId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('narration', 'cache lookup')
      : null;
    let text = await loadFromCache(poi.id, lang, topic);
    if (cacheId) Debug.metricEnd(cacheId, text ? 'hit' : 'miss');

    // 2. Claude API (vía Cloudflare Worker) si no hay cache
    let source = text ? 'cache' : null;
    if (!text && !AppState.offline) {
      const { system, user } = buildPrompt(poi, lang);
      const apiId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('narration', 'Claude Worker call')
        : null;
      text = await callClaude(system, user);
      if (apiId) Debug.metricEnd(apiId, text ? 'ok' : 'error');
      if (text) {
        await saveToCache(poi.id, lang, topic, text);
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
      Debug.metricEnd(totalId, source || 'ok', { poi: poi.name, lang, topic });
    }

    // Sanitizar antes de mostrar y hablar — elimina markdown que la voz leería
    text = sanitizeNarration(text);

    // DT-39: guardar capítulo completado para continuidad DA-52
    // Solo capítulos reales (no fallback) — el fallback genérico no aporta continuidad narrativa
    if (source !== 'fallback' && AppState._walkChapters !== undefined) {
      AppState._walkChapters.push({
        poiId:   poi.id,
        poiName: poi.name,
        text:    text,
        ts:      Date.now()
      });
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Narration: capítulo #${AppState._walkChapters.length} guardado — ${cleanPOIName(poi.name)}`);
      }
    }

    updateNarrationUI(text);

    if (typeof Voice !== 'undefined') {
      Voice.speak(text, lang, () => {
        _isNarrating = false;
        stopWaves();

        // S2-A1: marcar visitado al COMPLETAR, no al activar
        if (poi && !poi.visited) {
          poi.visited = true;
          if (typeof POI !== 'undefined' && typeof POI.markVisited === 'function') {
            POI.markVisited(poi.id);
          }
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

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome, getLocalLang };

})();
