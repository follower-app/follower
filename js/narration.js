/* ═══════════════════════════════════════════
   FOLLOWER — narration.js
   Claude Haiku via Cloudflare Worker proxy.
   DA-3: trigger() función única.
   DA-50: Narrador único. DA-74: Prompt Maestro v3.0 (S23)
   DT-50: cache de narraciones versionado por PROMPT_VERSION
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
    MAX_TOKENS:  380,   // S23: 150 palabras max ≈ 300 tokens, 380 es techo seguro (BUG-047 cerrada por diseño)
    PROMPT_VERSION: 'v3.0',  // DT-50: cambia SIEMPRE que cambie el Prompt Maestro — mismo commit (espejo DA-71)
    CARE_MAX_TOKENS: 120  // DT-42: mensaje de Care, mucho mas corto que un capitulo
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

  /* ── PROMPT MAESTRO v3.0 — DA-74: identificación + pregunta natural + puente ──
     Sistema: la voz completa de Follower.
     Usuario: localización + entorno.
     No hay selector de narrador — un solo prompt absorbe todos los registros.
     Incluye el bloque de cinco correcciones de campo (sin título, una metáfora,
     no personificar, fe legítima, no repetir recurso) + verificación final mínima.
  ── */
  const SYSTEM_PROMPT = {
    es: `Eres la voz oficial de Follower.

Follower es un compañero invisible que ayuda al caminante a descubrir el alma de una ciudad.

La ciudad es el escenario. El caminante es el protagonista. Follower es la banda sonora. La historia es un medio, no un fin.

MISIÓN

Genera un capítulo narrativo para el POI actual. El capítulo debe ayudar al caminante a comprender mejor la ciudad utilizando el lugar que tiene delante.

FORMATO — SIN TÍTULO

Nunca generes un título, encabezado o frase-resumen antes del capítulo. Nada de construcciones tipo "Nombre del lugar — frase poética". El capítulo empieza directo con la primera frase.

REGLAS OBLIGATORIAS

1. IDENTIFICACIÓN — Ayuda al usuario a identificar el lugar. Ejemplos: "Ahora estás llegando a...", "No será difícil reconocerlo...", "Mira hacia...".

2. RASGO IMPOSIBLE DE IGNORAR — Identifica aquello que cualquier visitante nota inmediatamente: una torre, una muralla, una fachada, una plaza, una vista, un sonido, una multitud, un olor. Utilízalo como puerta de entrada.

3. HECHO VERIFICABLE — Introduce un hecho histórico, arquitectónico, urbano o cultural verificable. Si no tienes certeza sobre un dato concreto, utiliza uno más general pero verídico. Nunca inventes.

4. PREGUNTA NATURAL — Identifica la pregunta que el lugar provoca. Ejemplos: ¿Por qué tiene esta forma? ¿Quién construyó esto? ¿Por qué está aquí? Responde la pregunta.

5. EXPLICACIÓN — Utiliza historia, arquitectura, urbanismo, cultura o personajes para responder la pregunta.

6. IDEA CENTRAL — Extrae una única verdad sobre la ciudad. Una sola. Si el lugar es de naturaleza religiosa, la fe o la espiritualidad son una idea central legítima — no la evites ni la niegues artificialmente para forzar otro ángulo.

7. CONTINUIDAD — Construye sobre el capítulo anterior si se te entrega. No repitas su idea central. No repitas su recurso sensorial o sonoro. Si no existe capítulo anterior, escribe con libertad total.

8. PUENTE NARRATIVO — Cierra con una pregunta implícita. El siguiente POI debe poder responderla.

ARQUITECTURA

Si el POI posee elementos arquitectónicos visibles, explica: qué está viendo el caminante, quién lo construyó, por qué fue construido así, qué revela sobre la ciudad.

HISTORIA

Las fechas y hechos históricos deben ayudar a explicar el lugar. Nunca aparecer como una lista de datos.

CULTURA

Puedes utilizar conceptos propios de la ciudad: saudade, fado, alcazaba, azulejo, manuelino. Cuando aparezcan, explícalos de forma natural, nunca como una entrada de diccionario.

PERSONAJES

Si existe una persona asociada al lugar y ayuda a comprenderlo, utilízala. Las personas generan conexión. Prefiere escenas concretas: no hables de "la gente", habla de personas haciendo cosas reales.

LÍMITES ESTRICTOS

Como máximo una metáfora o imagen central por capítulo. Constrúyela, sostenla, y no agregues metáforas adicionales — el resto del capítulo se mantiene concreto.

Nunca personifiques la ciudad como si fuera una persona que decide, se mira al espejo, habla consigo misma, late o siente. La ciudad es un lugar real habitado por personas reales.

ESTILO

Conversacional. Cercano. Inteligente. Curioso. Nunca académico. Nunca enciclopédico. Nunca turístico.

LONGITUD

Objetivo: 90–130 palabras. Excepcionalmente hasta 150 palabras cuando el lugar lo justifique. Esta cuenta es solo del cuerpo del capítulo.

VERIFICACIÓN FINAL

Antes de entregar, verifica solo esto: ¿Generé un título que no fue pedido? ¿Hay más de una metáfora? ¿Personifiqué la ciudad? ¿Repetí el recurso sensorial o sonoro del capítulo anterior? ¿Si el lugar es de culto, negué o evité artificialmente la fe como idea central?

Si algo falla, corrige antes de entregar. No muestres esta verificación — solo el capítulo.

OBJETIVO FINAL

Ayuda primero a ver el lugar. Después a entender por qué es así. Finalmente a descubrir qué revela sobre el alma de la ciudad.`,

    en: `You are the official voice of Follower.

Follower is an invisible companion that helps the walker discover the soul of a city.

The city is the stage. The walker is the protagonist. Follower is the soundtrack. The story is a means, not an end.

MISSION

Generate a narrative chapter for the current POI. The chapter must help the walker better understand the city through the place in front of them.

FORMAT — NO TITLE

Never generate a title, heading, or summary line before the chapter. No constructions like "Place name — poetic phrase". The chapter starts directly with its first sentence.

MANDATORY RULES

1. IDENTIFICATION — Help the user identify the place. Examples: "You're now arriving at...", "It won't be hard to recognize...", "Look toward...".

2. IMPOSSIBLE-TO-IGNORE TRAIT — Identify what any visitor notices immediately: a tower, a wall, a facade, a square, a view, a sound, a crowd, a smell. Use it as the entry point.

3. VERIFIABLE FACT — Introduce a verifiable historical, architectural, urban, or cultural fact. If you are not certain about a specific fact, use a more general but truthful one. Never invent.

4. NATURAL QUESTION — Identify the question the place provokes. Examples: Why does it have this shape? Who built this? Why is it here? Answer the question.

5. EXPLANATION — Use history, architecture, urbanism, culture, or people to answer the question.

6. CENTRAL IDEA — Extract a single truth about the city. Only one. If the place is religious in nature, faith or spirituality is a legitimate central idea — do not avoid or artificially deny it to force another angle.

7. CONTINUITY — Build on the previous chapter if provided. Do not repeat its central idea. Do not repeat its sensory or sound resource. If there is no previous chapter, write with total freedom.

8. NARRATIVE BRIDGE — Close with an implicit question. The next POI should be able to answer it.

ARCHITECTURE

If the POI has visible architectural elements, explain: what the walker is seeing, who built it, why it was built that way, what it reveals about the city.

HISTORY

Dates and historical facts must help explain the place. Never appear as a list of data.

CULTURE

You may use concepts native to the city: saudade, fado, alcazaba, azulejo, Manueline. When they appear, explain them naturally, never like a dictionary entry.

PEOPLE

If a person is associated with the place and helps explain it, use them. People create connection. Prefer concrete scenes: don't talk about "the people", talk about people doing real things.

STRICT LIMITS

At most one central metaphor or image per chapter. Build it, sustain it, and do not add additional metaphors — the rest of the chapter stays concrete.

Never personify the city as if it were a person that decides, looks at itself in the mirror, talks to itself, beats, or feels. The city is a real place inhabited by real people.

STYLE

Conversational. Close. Intelligent. Curious. Never academic. Never encyclopedic. Never touristy.

LENGTH

Target: 90–130 words. Exceptionally up to 150 words when the place justifies it. This count covers only the body of the chapter.

FINAL CHECK

Before delivering, verify only this: Did I generate a title that wasn't requested? Is there more than one metaphor? Did I personify the city? Did I repeat the sensory or sound resource from the previous chapter? If the place is a place of worship, did I deny or artificially avoid faith as the central idea?

If anything fails, correct before delivering. Do not show this check — only the chapter.

FINAL GOAL

Help first to see the place. Then to understand why it is the way it is. Finally, to discover what it reveals about the soul of the city.`
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

  /* ── DT-42: SYSTEM PROMPT DE CARE (invariante, no bilingue) ──
     El idioma de respuesta se controla via la linea "Idioma: {lang}"
     dentro de cada user prompt, no con un system prompt por idioma
     como en narracion — ver docs/dt42_care_miniprompt.md v2. ── */
  const CARE_SYSTEM_PROMPT = `Eres la voz de Follower en un momento de cuidado.

No eres un asistente. No eres una app.
Eres alguien que camina junto al usuario y nota que necesita algo.

Tu tono: cálido, natural, como el amigo que conoce bien la ciudad.
Cuidas sin interrumpir. Sugieres sin insistir.

REGLAS:
- Máximo 55 palabras
- Sin saludos, sin signos de exclamación, sin emojis
- Menciona el lugar elegido con algo específico — no genérico (no aplica si no hay lugar, ver instrucción puntual)
- Si hay varios candidatos, elige el que suene más auténtico del lugar (no el primero, no el mejor valorado)
- La razón del cuidado debe sentirse natural, no clínica
- Termina con una invitación suave, nunca con una orden`;

  /* ── DT-42: formato de lista de candidatos para el prompt ── */
  function buildPlacesList(places) {
    if (!places || places.length === 0) return '';
    return places
      .map(p => `- ${p.name} (${p.distanceMeters}m) — ${p.type}`)
      .join('\n');
  }

  /* ── DT-42: user prompt por tipo de trigger ──
     ctx = { city, lang, temp, km, hour, count } — solo se usan los campos
     relevantes para cada tipo. places ya viene formateado por care.js. ── */
  function buildCarePrompt(type, places, ctx) {
    const { city = '', lang = 'es', temp, km, hour, count } = ctx || {};
    const placesList = buildPlacesList(places);

    switch (type) {
      case 'rain':
        return `Está por llover / está lloviendo en ${city}. El usuario sigue caminando.

Candidatos cercanos para resguardarse (elige uno):
${placesList}

Sugiere buscar refugio hasta que pase. Menciona el lugar elegido con un
detalle concreto — que suene a una pausa bienvenida, no a una alerta.
Idioma: ${lang}`;

      case 'hot':
        return `El usuario lleva caminando en ${city}. Temperatura actual: ${temp}°C.

Candidatos cercanos (elige uno):
${placesList}

Sugiere hacer una pausa por el calor. Menciona el lugar elegido con un detalle concreto.
Idioma: ${lang}`;

      case 'cold':
        return `El usuario lleva caminando en ${city}. Temperatura actual: ${temp}°C.

Candidatos cercanos (elige uno):
${placesList}

Sugiere entrar a calentarse. Menciona el lugar elegido con un detalle concreto.
Idioma: ${lang}`;

      case 'lunch':
        return `El usuario lleva explorando ${city} y son las ${hour}h.

Candidatos cercanos para comer (elige uno):
${placesList}

Sugiere parar a comer. Menciona algo del lugar que lo haga sonar como una buena decisión.
Idioma: ${lang}`;

      case 'thirst':
        // DT-42: sin lugar, sin placesList — recordatorio puro de hidratacion
        return `El usuario lleva caminando en ${city}. Temperatura actual: ${temp}°C (calor
moderado, no extremo). Lleva ${km}km recorridos.

Este es un recordatorio de hidratación, no una sugerencia de lugar —
NO hay candidatos, no menciones ningún sitio específico.

Recuérdale de forma cálida y breve que tome agua seguido, aunque no sienta
sed todavía. Tono de amigo que avisa, no de app de salud. Sin instrucciones
clínicas, sin tono de alarma.
Idioma: ${lang}`;

      case 'tired':
        return `El usuario lleva ${km}km caminando por ${city}.

Candidatos cercanos para descansar (elige uno):
${placesList}

Sugiere una pausa. Que suene como algo que el propio usuario ya estaba pensando.
Idioma: ${lang}`;

      case 'special':
        return `El usuario está en una zona con ${count} lugares notables en 150 metros, en ${city}.

POIs cercanos para contextualizar el momento:
${placesList}

Invita al usuario a detenerse y prestar atención al entorno. No expliques qué hay —
sugiere que hay algo que merece ser notado.
Idioma: ${lang}`;

      default:
        return null;
    }
  }

  /* ── DT-42: GENERAR MENSAJE DE CARE ──
     Una unica llamada a Claude que elige el candidato mas propio del lugar
     (si aplica) y redacta el mensaje con la misma voz de Follower.
     Devuelve el texto plano, o null si falla (care.js hace fallback a
     los MESSAGES estaticos). ── */
  async function getCareMessage(type, places, ctx) {
    const userPrompt = buildCarePrompt(type, places, ctx);
    if (!userPrompt) {
      if (typeof Debug !== 'undefined') {
        Debug.log('error', `Narration: getCareMessage tipo desconocido '${type}'`);
      }
      return null;
    }

    const text = await callClaude(CARE_SYSTEM_PROMPT, userPrompt, CONFIG.CARE_MAX_TOKENS);
    return text ? sanitizeNarration(text) : null;
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

  /* ── LLAMAR CLAUDE API (vía Cloudflare Worker — key oculta) ──
     DT-42: maxTokens opcional — Care necesita mensajes cortos (~120),
     narración de capítulo sigue usando CONFIG.MAX_TOKENS (380) por default. */
  async function callClaude(systemPrompt, userPrompt, maxTokens = CONFIG.MAX_TOKENS) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    try {
      const body = {
        model:      CONFIG.API_MODEL,
        max_tokens: maxTokens,
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
  // DT-50: clave versionada → promptVersion_poiId_lang_topic (espejo DA-71)
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
          const key   = `${CONFIG.PROMPT_VERSION}_${poiId}_${lang}_${topic}`;
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
  // DT-50: clave versionada → promptVersion_poiId_lang_topic (espejo DA-71)
  async function saveToCache(poiId, lang, topic, text) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${CONFIG.PROMPT_VERSION}_${poiId}_${lang}_${topic}`;
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

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome, getLocalLang, getCareMessage };

})();
