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
    MAX_TOKENS:  380,   // S23: 150 palabras max ≈ 300 tokens, 380 es techo seguro (BUG-047 cerrada por diseño). Revertido tras experimento fallido (S27b): subir a 500 no trajo autor/fecha — hipotesis 3 (presupuesto de palabras) descartada
    PROMPT_VERSION: 'v3.6',  // DT-51: revertido tras experimento v3.7-test (S27b) — subir MAX_TOKENS/rango de palabras NO trajo autor/fecha (hipotesis 3 descartada, misma tasa 0/n). Contenido identico al v3.6 original: duracion/antiguedad inventada corregida en LIMITES ESTRICTOS + bloque de grounding — mismo commit (espejo DA-71)
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

6. IDEA CENTRAL — Extrae una única verdad, anclada en algo concreto y reconocible de la cultura, naturaleza o identidad de ESTA ciudad — nunca una reflexión filosófica genérica que podría aplicar a cualquier ciudad del mundo. Una sola idea. Si el lugar es de naturaleza religiosa, la fe o la espiritualidad son una idea central legítima — no la evites ni la niegues artificialmente para forzar otro ángulo.

7. CONTINUIDAD — Construye sobre el capítulo anterior si se te entrega. No repitas su idea central. No repitas su recurso sensorial o sonoro. Si no existe capítulo anterior, escribe con libertad total.

8. PUENTE NARRATIVO — Cierra con una pregunta implícita. El siguiente POI debe poder responderla.

ARQUITECTURA

Si el POI posee elementos arquitectónicos visibles, explica: qué está viendo el caminante, quién lo construyó, por qué fue construido así, qué revela sobre la ciudad.

HISTORIA

Las fechas y hechos históricos deben ayudar a explicar el lugar. Nunca aparecer como una lista de datos — pero esto no autoriza a omitir un dato que el bloque de hechos verificados exige incluir (autor, fecha). Intégralo en la prosa; no lo elimines.

CULTURA

Puedes utilizar conceptos propios de la ciudad: saudade, fado, alcazaba, azulejo, manuelino. Cuando aparezcan, explícalos de forma natural, nunca como una entrada de diccionario.

PERSONAJES

Si existe una persona asociada al lugar y ayuda a comprenderlo, utilízala. Las personas generan conexión. Prefiere escenas concretas: no hables de "la gente", habla de personas haciendo cosas reales.

LÍMITES ESTRICTOS

Como máximo una metáfora o imagen central por capítulo. Constrúyela, sostenla, y no agregues metáforas adicionales — el resto del capítulo se mantiene concreto.

Nunca personifiques la ciudad como si fuera una persona que decide, se mira al espejo, habla consigo misma, late o siente. La ciudad es un lugar real habitado por personas reales.

Si el lugar debe su nombre a una persona, santo o figura histórica, NO inventes datos biográficos sobre esa persona (profesión, orden religiosa, nacionalidad, enseñanzas, obra) salvo que el extracto los confirme explícitamente. Puedes mencionar que el lugar lleva su nombre, sin elaborar una biografía no verificada.

No afirmes cuánto tiempo lleva existiendo una tradición, vínculo o práctica — frases como "durante siglos", "durante generaciones" o "desde tiempos ancestrales" — salvo que el extracto indique explícitamente esa duración o una fecha de origen que la respalde. Si no lo sabes, describe la práctica en presente, sin cuantificar su antigüedad.

ESTILO

Conversacional. Cercano. Inteligente. Curioso. Nunca académico. Nunca enciclopédico. Nunca turístico.

LONGITUD

Objetivo: 90–130 palabras. Excepcionalmente hasta 150 palabras cuando el lugar lo justifique. Esta cuenta es solo del cuerpo del capítulo.

VERIFICACIÓN FINAL

Antes de entregar, verifica solo esto: ¿Generé un título que no fue pedido? ¿Hay más de una metáfora? ¿Personifiqué la ciudad? ¿Repetí el recurso sensorial o sonoro del capítulo anterior? ¿Si el lugar es de culto, negué o evité artificialmente la fe como idea central? ¿Si me dieron un extracto con autor o fecha, los incluí explícitamente en el capítulo? ¿Si el lugar lleva el nombre de una persona o santo, inventé algo biográfico sobre ella que el extracto no confirma?

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

6. CENTRAL IDEA — Extract a single truth, anchored in something concrete and recognizable about THIS city's culture, nature, or identity — never a generic philosophical reflection that could apply to any city in the world. Only one idea. If the place is religious in nature, faith or spirituality is a legitimate central idea — do not avoid or artificially deny it to force another angle.

7. CONTINUITY — Build on the previous chapter if provided. Do not repeat its central idea. Do not repeat its sensory or sound resource. If there is no previous chapter, write with total freedom.

8. NARRATIVE BRIDGE — Close with an implicit question. The next POI should be able to answer it.

ARCHITECTURE

If the POI has visible architectural elements, explain: what the walker is seeing, who built it, why it was built that way, what it reveals about the city.

HISTORY

Dates and historical facts must help explain the place. Never appear as a list of data — but this does not authorize dropping a fact the verified-facts block requires you to include (author, date). Weave it into the prose; do not remove it.

CULTURE

You may use concepts native to the city: saudade, fado, alcazaba, azulejo, Manueline. When they appear, explain them naturally, never like a dictionary entry.

PEOPLE

If a person is associated with the place and helps explain it, use them. People create connection. Prefer concrete scenes: don't talk about "the people", talk about people doing real things.

STRICT LIMITS

At most one central metaphor or image per chapter. Build it, sustain it, and do not add additional metaphors — the rest of the chapter stays concrete.

Never personify the city as if it were a person that decides, looks at itself in the mirror, talks to itself, beats, or feels. The city is a real place inhabited by real people.

If the place is named after a person, saint, or historical figure, do NOT invent biographical facts about that person (profession, religious order, nationality, teachings, work) unless the extract explicitly confirms them. You may mention that the place is named after them, without elaborating an unverified biography.

Do not claim how long a tradition, bond, or practice has existed — phrases like "for centuries", "for generations", or "since ancient times" — unless the extract explicitly states that duration or an origin date that supports it. If you don't know, describe the practice in the present tense, without quantifying its age.

STYLE

Conversational. Close. Intelligent. Curious. Never academic. Never encyclopedic. Never touristy.

LENGTH

Target: 90–130 words. Exceptionally up to 150 words when the place justifies it. This count covers only the body of the chapter.

FINAL CHECK

Before delivering, verify only this: Did I generate a title that wasn't requested? Is there more than one metaphor? Did I personify the city? Did I repeat the sensory or sound resource from the previous chapter? If the place is a place of worship, did I deny or artificially avoid faith as the central idea? If I was given an extract with an author or date, did I include them explicitly in the chapter? If the place is named after a person or saint, did I invent any biographical detail about them that the extract doesn't confirm?

If anything fails, correct before delivering. Do not show this check — only the chapter.

FINAL GOAL

Help first to see the place. Then to understand why it is the way it is. Finally, to discover what it reveals about the soul of the city.`
  };

  /* ── BIENVENIDA DE CIUDAD — voz única ── */
  /* DA-75: nombre opcional — solo welcome/farewell, nunca capítulos ni Care.
     Sin nombre, cada plantilla conserva su forma original intacta. */
  const CITY_WELCOME = {
    es: (city, name) => name ? `${city}. Un capítulo te espera en cada esquina, ${name}.` : `${city}. Un capítulo te espera en cada esquina.`,
    en: (city, name) => name ? `${city}. A chapter waits at every corner, ${name}.` : `${city}. A chapter waits at every corner.`,
    fr: (city, name) => name ? `${city}. Un chapitre t'attend à chaque coin de rue, ${name}.` : `${city}. Un chapitre t'attend à chaque coin de rue.`,
    de: (city, name) => name ? `${city}. An jeder Ecke wartet ein neues Kapitel, ${name}.` : `${city}. An jeder Ecke wartet ein neues Kapitel.`,
    it: (city, name) => name ? `${city}. Un capitolo ti aspetta ad ogni angolo, ${name}.` : `${city}. Un capitolo ti aspetta ad ogni angolo.`,
    pt: (city, name) => name ? `${city}. Um capítulo te espera em cada esquina, ${name}.` : `${city}. Um capítulo te espera em cada esquina.`,
    nl: (city, name) => name ? `${city}. Op elke hoek wacht een nieuw hoofdstuk, ${name}.` : `${city}. Op elke hoek wacht een nieuw hoofdstuk.`,
    sv: (city, name) => name ? `${city}. Ett kapitel väntar vid varje gathörn, ${name}.` : `${city}. Ett kapitel väntar vid varje gathörn.`,
    no: (city, name) => name ? `${city}. Et kapittel venter rundt hvert hjørne, ${name}.` : `${city}. Et kapittel venter rundt hvert hjørne.`,
    da: (city, name) => name ? `${city}. Et kapitel venter rundt hvert hjørne, ${name}.` : `${city}. Et kapitel venter rundt hvert hjørne.`,
    pl: (city, name) => name ? `${city}. Za każdym rogiem czeka nowy rozdział, ${name}.` : `${city}. Za każdym rogiem czeka nowy rozdział.`,
    ja: (city, name) => name ? `${name}さん。${city}。すべての角に物語が待っています。` : `${city}。すべての角に物語が待っています。`,
    zh: (city, name) => name ? `${name}，${city}。每个街角都有一个故事等待着你。` : `${city}。每个街角都有一个故事等待着你。`,
    ko: (city, name) => name ? `${name}님. ${city}. 모든 모퉁이에서 이야기가 기다리고 있습니다.` : `${city}. 모든 모퉁이에서 이야기가 기다리고 있습니다.`,
    ar: (city, name) => name ? `${city}. في كل زاوية فصل ينتظرك يا ${name}.` : `${city}. في كل زاوية فصل ينتظرك.`,
    ru: (city, name) => name ? `${city}. За каждым углом ждёт новая глава, ${name}.` : `${city}. За каждым углом ждёт новая глава.`,
    tr: (city, name) => name ? `${city}. Her köşede seni bekleyen bir bölüm var, ${name}.` : `${city}. Her köşede seni bekleyen bir bölüm var.`,
    el: (city, name) => name ? `${city}. Σε κάθε γωνία σε περιμένει ένα κεφάλαιο, ${name}.` : `${city}. Σε κάθε γωνία σε περιμένει ένα κεφάλαιο.`,
  };

  /* Ratificacion S25c: "Soy Follower" es presentacion, no bienvenida diaria.
     Solo se dice la PRIMERA vez que el saludo de ciudad efectivamente suena
     (ver introHeard en config.js + welcomeCity en app.js). Reutiliza el tono
     personal que antes vivia en el wizard, ahora fusionado con la ciudad real. */
  const CITY_INTRO = {
    es: (city, name) => name ? `Hola, ${name}. Soy Follower. ${city} tiene historias que contarte.` : `Hola. Soy Follower. ${city} tiene historias que contarte.`,
    en: (city, name) => name ? `Hi, ${name}. I'm Follower. ${city} has stories to tell you.` : `Hi. I'm Follower. ${city} has stories to tell you.`,
    fr: (city, name) => name ? `Bonjour, ${name}. Je suis Follower. ${city} a des histoires à te raconter.` : `Bonjour. Je suis Follower. ${city} a des histoires à te raconter.`,
    de: (city, name) => name ? `Hallo, ${name}. Ich bin Follower. ${city} hat Geschichten für dich.` : `Hallo. Ich bin Follower. ${city} hat Geschichten für dich.`,
    it: (city, name) => name ? `Ciao, ${name}. Sono Follower. ${city} ha storie da raccontarti.` : `Ciao. Sono Follower. ${city} ha storie da raccontarti.`,
    pt: (city, name) => name ? `Olá, ${name}. Eu sou o Follower. ${city} tem histórias para te contar.` : `Olá. Eu sou o Follower. ${city} tem histórias para te contar.`,
    nl: (city, name) => name ? `Hallo, ${name}. Ik ben Follower. ${city} heeft verhalen voor je.` : `Hallo. Ik ben Follower. ${city} heeft verhalen voor je.`,
    sv: (city, name) => name ? `Hej, ${name}. Jag är Follower. ${city} har historier att berätta för dig.` : `Hej. Jag är Follower. ${city} har historier att berätta för dig.`,
    no: (city, name) => name ? `Hei, ${name}. Jeg er Follower. ${city} har historier å fortelle deg.` : `Hei. Jeg er Follower. ${city} har historier å fortelle deg.`,
    da: (city, name) => name ? `Hej, ${name}. Jeg er Follower. ${city} har historier at fortælle dig.` : `Hej. Jeg er Follower. ${city} har historier at fortælle dig.`,
    pl: (city, name) => name ? `Cześć, ${name}. Jestem Follower. ${city} ma dla ciebie historie do opowiedzenia.` : `Cześć. Jestem Follower. ${city} ma dla ciebie historie do opowiedzenia.`,
    ja: (city, name) => name ? `${name}さん、こんにちは。Followerです。${city}にはあなたに話したい物語があります。` : `こんにちは。Followerです。${city}にはあなたに話したい物語があります。`,
    zh: (city, name) => name ? `你好，${name}。我是Follower。${city}有故事想告诉你。` : `你好。我是Follower。${city}有故事想告诉你。`,
    ko: (city, name) => name ? `안녕하세요, ${name}님. 저는 Follower입니다. ${city}에는 당신에게 들려줄 이야기가 있습니다.` : `안녕하세요. 저는 Follower입니다. ${city}에는 당신에게 들려줄 이야기가 있습니다.`,
    ar: (city, name) => name ? `مرحبًا يا ${name}. أنا Follower. لدى ${city} قصص لأرويها لك.` : `مرحبًا. أنا Follower. لدى ${city} قصص لأرويها لك.`,
    ru: (city, name) => name ? `Привет, ${name}. Я Follower. ${city} хочет рассказать тебе истории.` : `Привет. Я Follower. ${city} хочет рассказать тебе истории.`,
    tr: (city, name) => name ? `Merhaba, ${name}. Ben Follower. ${city}'in sana anlatacak hikayeleri var.` : `Merhaba. Ben Follower. ${city}'in sana anlatacak hikayeleri var.`,
    el: (city, name) => name ? `Γεια σου, ${name}. Είμαι ο Follower. Η ${city} έχει ιστορίες να σου πει.` : `Γεια σου. Είμαι ο Follower. Η ${city} έχει ιστορίες να σου πει.`,
  };

  function getCityWelcome(city, name, lang, includeIntro) {
    const map = includeIntro ? CITY_INTRO : CITY_WELCOME;
    const fn  = map[lang] || map.es;
    return fn(city, name || null);
  }

  /* Caso raro: Nominatim no resolvio la ciudad a tiempo Y es la primera vez
     que el saludo suena. Sin nombre de ciudad real, se reutiliza la
     presentacion generica (antes vivia en WIZ_PHRASE del wizard). */
  function getCityIntroFallback(name, lang) {
    return lang === 'es'
      ? (name ? `Hola, ${name}. Soy Follower. Tu ciudad tiene historias que contarte.` : 'Hola. Soy Follower. Tu ciudad tiene historias que contarte.')
      : (name ? `Hi, ${name}. I'm Follower. Your city has stories to tell you.` : `Hi. I'm Follower. Your city has stories to tell you.`);
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

  /* ── DT-51: GROUNDING — bloque de hechos o de restricción, según _source ──
     Contrato DA-72/DT-52: _source:'wiki' con _extract → hechos verificados
     que el modelo puede usar; _source:'osm' (o wiki sin extract disponible)
     → prohibición explícita de inventar lo que no se sabe. Sesión de
     definición DT-51, puntos 3 y 4 — ratificados punto por punto. */
  function buildGroundingBlock(poi, lang) {
    if (poi._source === 'wiki' && poi._extract) {
      return (lang === 'en')
        ? `\nVerified facts about this place (Wikipedia extract):\n"${poi._extract}"\n\nMANDATORY FIRST CHECK — read the extract above before writing anything: does it mention the author, the creation or inauguration date, or the specific reason it was created? If YES, you MUST include those exact facts explicitly in the chapter — they are Follower's credibility anchor, never optional, never left out for the sake of style or flow.\n\nHow to include them: weave them into a sentence naturally — e.g. "Diego Pombo built it in 2015..." — never as a separate fact-sheet line like "Author: Diego Pombo. Date: 2015." But smooth prose is NOT an excuse to drop the fact — if you can't find a graceful way to fit it in, include it plainly anyway. Losing the fact is worse than a slightly less elegant sentence.\n\nThese are the ONLY facts you may use for author, date, figures, materials, reason for creation, attributed meaning, architectural style or period, how long a tradition or practice has existed, and religious details (patron saint, order, denomination, year of consecration). If the extract does not mention one of these — do NOT fill that gap yourself. Never claim "for centuries", "for generations", or equivalent duration phrases if the extract doesn't say so. Describe the observable instead — apparent size, location, surroundings, what the walker can see right now — without inventing anything the extract doesn't support.\n\nIf the extract describes a trait shared by a group of elements (for example, a set of figures or species), do not attribute it to a single individual element unless the extract distinguishes it explicitly for that one.\n\n`
        : `\nHechos verificados sobre este lugar (extracto de Wikipedia):\n"${poi._extract}"\n\nVERIFICACIÓN OBLIGATORIA PRIMERO — lee el extracto de arriba antes de escribir nada: ¿menciona autor, fecha de creación o inauguración, o el motivo específico de su creación? Si SÍ, DEBES incluir esos datos exactos explícitamente en el capítulo — son el ancla de credibilidad de Follower, nunca opcionales, nunca omitidos por mantener el estilo o el flujo.\n\nCómo incluirlos: téjelos en una frase con naturalidad — ej. "Diego Pombo lo construyó en 2015..." — nunca como una línea de ficha técnica separada tipo "Autor: Diego Pombo. Fecha: 2015." Pero la prosa fluida NO es excusa para omitir el dato — si no encuentras una forma elegante de incluirlo, inclúyelo de todas formas aunque suene menos pulido. Perder el dato es peor que una frase un poco menos elegante.\n\nEstos son los ÚNICOS hechos que puedes usar para autor, fecha, cifras, materiales, motivo de creación, significado atribuido, estilo o período arquitectónico, duración o antigüedad de una tradición o práctica, y detalles religiosos (advocación, orden, denominación, año de consagración). Si el extracto no menciona alguno de estos — NO llenes ese vacío por tu cuenta. Nunca afirmes "durante siglos", "durante generaciones" ni expresiones equivalentes de duración si el extracto no lo dice. Describe en su lugar lo observable — tamaño aparente, ubicación, entorno, lo que el caminante puede ver ahora mismo — sin inventar nada que el extracto no respalde.\n\nSi el extracto describe una característica compartida por un conjunto de elementos (por ejemplo, un grupo de figuras o especies), no se la atribuyas a un elemento individual salvo que el extracto lo distinga explícitamente para ese elemento en particular.\n\n`;
    }

    if (poi._source === 'osm') {
      const inscription = poi.tags?.inscription || null;
      return (lang === 'en')
        ? `\nThis place has no verified article — only its name and location are known${inscription ? `, plus this inscription: "${inscription}"` : ''}.\nDo not invent author, date, architectural style, or religious order. If the name refers to a person or saint (e.g. a parish named after someone), do not invent biographical facts about them either — no profession, no religious order, no nationality, no teachings. Describe the observable: what the name suggests, the surroundings, the visible architecture in general terms (without attributing a period), and why it deserves the pause — without fabricating historical data.\n\n`
        : `\nEste lugar no tiene artículo verificado — solo se conoce su nombre y ubicación${inscription ? `, y esta inscripción: "${inscription}"` : ''}.\nNo inventes autor, fecha, estilo arquitectónico ni orden religiosa. Si el nombre refiere a una persona o santo (por ejemplo, una parroquia con nombre de alguien), tampoco inventes datos biográficos sobre esa persona — nada de profesión, orden religiosa, nacionalidad ni enseñanzas. Describe lo observable: lo que sugiere el nombre, el entorno, la arquitectura visible en términos generales (sin atribuir período), y por qué merece la pausa — sin fabricar datos históricos.\n\n`;
    }

    // _source ausente (defensivo — no debería pasar con DA-72/DT-52 vigentes)
    return '';
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

    // DT-51: bloque de grounding — hechos verificados (wiki) o restricción
    // explícita (osm) — bloque aparte, mismo patrón que prevBlock
    const groundingBlock = buildGroundingBlock(poi, lang);

    const user = (lang === 'en')
      ? `${prevBlock}I'm at "${name}" in ${city}. Write the chapter for this place.${groundingBlock}${context || ''}`
      : `${prevBlock}Estoy en "${name}" en ${city}. Escribe el capítulo de este lugar.${groundingBlock}${context || ''}`;

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

  /* ── DT-51 (fix): HUELLA CORTA DEL EXTRACTO ──
     Problema real de campo (09-Jul-2026, caso Maceta): subir EXTRACT_MAX_CHARS
     no toca el Prompt Maestro, así que no ameritaba subir PROMPT_VERSION —
     pero SÍ cambia lo que Claude recibe. La clave de cache (solo
     promptVersion+poiId+lang+topic) no tenía forma de notar ese cambio: el
     capítulo viejo, generado con el extracto corto, quedaba servido para
     siempre sin que ningún cambio de versión lo invalidara. Esto no es
     hipotético para cerrar solo en escritorio — en campo (iPhone sin Mac ni
     Web Inspector) no hay forma de purgar IndexedDB a mano.
     Solución: la clave de cache incluye una huella del propio extracto.
     Cualquier cambio al extracto (tope de caracteres, mejora de exintro,
     edición del artículo en Wikipedia) cambia la huella → cache miss
     automático, en cualquier dispositivo, sin intervención manual. */
  function _fingerprint(str) {
    if (!str) return '0';
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  }

  /* ── CARGAR NARRACIÓN DESDE INDEXEDDB ── */
  // DT-50: clave versionada → promptVersion_poiId_lang_topic_extractHash (DT-51 fix)
  async function loadFromCache(poiId, lang, topic, extract) {
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
          const key   = `${CONFIG.PROMPT_VERSION}_${poiId}_${lang}_${topic}_${_fingerprint(extract)}`;
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
  // DT-50: clave versionada → promptVersion_poiId_lang_topic_extractHash (DT-51 fix)
  async function saveToCache(poiId, lang, topic, text, extract) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${CONFIG.PROMPT_VERSION}_${poiId}_${lang}_${topic}_${_fingerprint(extract)}`;
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
    let text = await loadFromCache(poi.id, lang, topic, poi._extract);
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
        await saveToCache(poi.id, lang, topic, text, poi._extract);
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

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome, getCityIntroFallback, getLocalLang, getCareMessage };

})();
