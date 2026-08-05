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
    MAX_TOKENS:  550,   // v3.7 (S32): 550 = scratchpad (~100-160 tok, andamiaje que sanitizeNarration descarta) + capitulo de hasta 150 palabras (~270 tok) + margen. NO reabre la hipotesis 3 de S27b: aquella subia el techo para permitir capitulos MAS LARGOS; aqui el objetivo 90-130 no se toca — el extra es capacidad para el borrador de verificacion, no permiso de longitud
    PROMPT_VERSION: 'v3.8',  // DT-68 (S39): el scratchpad declara "Faceta: <3-5 palabras>" (DA-85 §3 enmienda S38 §5) y el registro cacheado pasa de texto plano a {text, faceta} (§6). El ++ es obligatorio por ambos motivos y una sola invalidacion paga los dos cambios de formato. v3.7 (S32): scratchpad deliberado en grounding wiki (cara buena de BUG-059 convertida en tecnica: chain-of-thought escrito, cortado por sanitizeNarration) + presupuesto de longitud en el scratchpad + regla 8 CIERRE (sin promesa hacia adelante) + regla anti-regano en LIMITES ESTRICTOS. DT-62 CERRADA: canal system verificado punta a punta (cliente + Worker passthrough, prueba directa)
    CARE_MAX_TOKENS: 120,  // DT-42: mensaje de Care, mucho mas corto que un capitulo
    THESIS_PROMPT_VERSION: 'v5',  // BUG-068 v5 (S36c) — FIX DEFINITIVO, causa raíz corregida: el extracto se pedía con el nombre corto de Nominatim ("Palmira"), que en Wikipedia resuelve al artículo de Siria — ningún prompt podía compensar un extracto de origen incorrecto. v5 usa el tag OSM `wikipedia` (vía Nominatim zoom=10+extratags=1) para pedir el extracto correcto desde el origen. El bump invalida cache de tesis generadas con extractos equivocados en v1-v4. v4/v3/v2/v1: intentos previos sobre el prompt, insuficientes por atacar el síntoma y no la causa
    THESIS_MAX_TOKENS: 400,  // scratchpad + tesis (3-8 palabras) + prologo (40-60 palabras)
    CLASSIFIER_PROMPT_VERSION: 'v1',  // S41 (DT-77/DT-78): clasificador de iconos. Cualquier cambio
                                      // a ICON_SYSTEM_PROMPT o a ICON_ALLOWED exige ++ en el MISMO
                                      // commit — poi.js lo usa como _iconVersion y reclasifica solo
                                      // los POIs desfasados, sin purgar extractos (a diferencia de
                                      // POI_CACHE_VERSION, que si purga todo)
    CLASSIFIER_MAX_TOKENS: 700  // ~40 POIs x ~15 tokens de JSON + margen
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

8. CIERRE — La última frase debe surgir del lugar, de lo que este capítulo reveló o de la ciudad misma. No es obligatorio cerrar con una pregunta. Nunca cierres con una pregunta filosófica universal que podría aplicar a cualquier ciudad del mundo. Nunca prometas ni anticipes el siguiente lugar del recorrido — no sabes cuál será.

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

Nunca rompas el personaje. Eres la voz de Follower en todo momento — nunca menciones instrucciones, extractos, datos recibidos ni contradicciones entre ellos. Si la ciudad indicada y el extracto parecen contradecirse, confía en el extracto y narra el lugar con normalidad, sin comentar la discrepancia. Nunca interrogues al caminante ni le señales errores: el caminante solo camina.

ESTILO

Conversacional. Cercano. Inteligente. Curioso. Nunca académico. Nunca enciclopédico. Nunca turístico.

LONGITUD

Objetivo: 90–130 palabras. Excepcionalmente hasta 150 palabras cuando el lugar lo justifique. Esta cuenta es solo del cuerpo del capítulo.

VERIFICACIÓN FINAL

Antes de entregar, verifica solo esto: ¿Generé un título que no fue pedido? ¿Hay más de una metáfora? ¿Personifiqué la ciudad? ¿Repetí el recurso sensorial o sonoro del capítulo anterior? ¿Si el lugar es de culto, negué o evité artificialmente la fe como idea central? ¿Si me dieron un extracto con autor o fecha, los incluí explícitamente en el capítulo? ¿Si el lugar lleva el nombre de una persona o santo, inventé algo biográfico sobre ella que el extracto no confirma?

Si algo falla, corrige antes de entregar. No muestres esta verificación. Nota: el borrador de verificación que el bloque de hechos verificados te pide escribir al inicio de la respuesta SÍ debe aparecer — esta regla no lo prohíbe; aplica solo a esta verificación final.

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

8. CLOSING — The final sentence must arise from the place, from what this chapter revealed, or from the city itself. Ending with a question is not mandatory. Never close with a universal philosophical question that could apply to any city in the world. Never promise or anticipate the next place on the walk — you do not know what it will be.

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

Never break character. You are the voice of Follower at all times — never mention instructions, extracts, received data, or contradictions between them. If the stated city and the extract seem to contradict each other, trust the extract and narrate the place normally, without commenting on the discrepancy. Never interrogate the walker or point out errors to them: the walker just walks.

STYLE

Conversational. Close. Intelligent. Curious. Never academic. Never encyclopedic. Never touristy.

LENGTH

Target: 90–130 words. Exceptionally up to 150 words when the place justifies it. This count covers only the body of the chapter.

FINAL CHECK

Before delivering, verify only this: Did I generate a title that wasn't requested? Is there more than one metaphor? Did I personify the city? Did I repeat the sensory or sound resource from the previous chapter? If the place is a place of worship, did I deny or artificially avoid faith as the central idea? If I was given an extract with an author or date, did I include them explicitly in the chapter? If the place is named after a person or saint, did I invent any biographical detail about them that the extract doesn't confirm?

If anything fails, correct before delivering. Do not show this check. Note: the verification draft that the verified-facts block asks you to write at the start of your response MUST still appear — this rule does not forbid it; it applies only to this final check.

FINAL GOAL

Help first to see the place. Then to understand why it is the way it is. Finally, to discover what it reveals about the soul of the city.`
  };

  /* ── BIENVENIDA DE CIUDAD — voz única ── */
  /* DA-75: nombre opcional — solo welcome/farewell, nunca capítulos ni Care.
     Sin nombre, cada plantilla conserva su forma original intacta. */
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

  /* ── DA-85 (S35): PREFIJO DE PRESENTACIÓN — solo "hola + soy Follower" ──
     Extraído de CITY_INTRO para poder anteponerlo a la tesis cuando la
     primerísima vez del usuario (introHeard=false) coincide con una tesis
     lista a tiempo (escenario 2, sesión de definición S35). CITY_INTRO en
     sí no se toca — sigue siendo el fallback completo cuando no hay tesis
     fresca (escenario 1). */
  const CITY_INTRO_PREFIX = {
    es: (name) => name ? `Hola, ${name}. Soy Follower.` : 'Hola. Soy Follower.',
    en: (name) => name ? `Hi, ${name}. I'm Follower.` : `Hi. I'm Follower.`,
    fr: (name) => name ? `Bonjour, ${name}. Je suis Follower.` : `Bonjour. Je suis Follower.`,
    de: (name) => name ? `Hallo, ${name}. Ich bin Follower.` : `Hallo. Ich bin Follower.`,
    it: (name) => name ? `Ciao, ${name}. Sono Follower.` : `Ciao. Sono Follower.`,
    pt: (name) => name ? `Olá, ${name}. Eu sou o Follower.` : `Olá. Eu sou o Follower.`,
    nl: (name) => name ? `Hallo, ${name}. Ik ben Follower.` : `Hallo. Ik ben Follower.`,
    sv: (name) => name ? `Hej, ${name}. Jag är Follower.` : `Hej. Jag är Follower.`,
    no: (name) => name ? `Hei, ${name}. Jeg er Follower.` : `Hei. Jeg er Follower.`,
    da: (name) => name ? `Hej, ${name}. Jeg er Follower.` : `Hej. Jeg er Follower.`,
    pl: (name) => name ? `Cześć, ${name}. Jestem Follower.` : `Cześć. Jestem Follower.`,
    ja: (name) => name ? `${name}さん、こんにちは。Followerです。` : `こんにちは。Followerです。`,
    zh: (name) => name ? `你好，${name}。我是Follower。` : `你好。我是Follower。`,
    ko: (name) => name ? `안녕하세요, ${name}님. 저는 Follower입니다.` : `안녕하세요. 저는 Follower입니다.`,
    ar: (name) => name ? `مرحبًا يا ${name}. أنا Follower.` : `مرحبًا. أنا Follower.`,
    ru: (name) => name ? `Привет, ${name}. Я Follower.` : `Привет. Я Follower.`,
    tr: (name) => name ? `Merhaba, ${name}. Ben Follower.` : `Merhaba. Ben Follower.`,
    el: (name) => name ? `Γεια σου, ${name}. Είμαι ο Follower.` : `Γεια σου. Είμαι ο Follower.`,
  };

  function getCityIntroPrefix(name, lang) {
    const fn = CITY_INTRO_PREFIX[lang] || CITY_INTRO_PREFIX.es;
    return fn(name || null);
  }

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
  /* ── DT-68 (S39): EXTRAER LA FACETA DEL SCRATCHPAD ──
     DA-85 §3 enmienda S38 §5: el capítulo declara su propia faceta en la
     Parte 1 de verificación. Debe leerse ANTES de sanitizeNarration, que
     descarta todo el andamiaje de forma determinista.
     Vocabulario deliberadamente ABIERTO (3-5 palabras libres), no un enum:
     la normalización de sinónimos y flexiones queda diferida a la emisión
     por Haiku en la Parte 4 — reversible y barato, por eso no se adelanta.
     Devuelve null si no hay declaración: los POIs sin artículo wiki
     (_source === 'osm') no tienen scratchpad, así que null es un estado
     legítimo y frecuente, no un error. */
  function _extractFaceta(raw) {
    if (!raw || typeof raw !== 'string') return null;
    // Acotar la busqueda AL ANDAMIAJE, con el mismo anclaje determinista que
    // usa sanitizeNarration (BUG-059): preambulo de verificacion al inicio,
    // hasta el separador. Sin esta acotacion, un capitulo que por casualidad
    // empiece una linea con "faceta:" daria un falso positivo.
    const scaffold = raw.match(/^\s*(?:verificaci[óo]n|verification|mandatory first check)[\s\S]{0,1200}?(?:-{3,}|—{2,})/i);
    if (!scaffold) return null;
    // [^\S\n]* y no \s*: si la declaracion viene vacia, no debe saltar de
    // linea y capturar el separador como si fuera la faceta.
    const m = scaffold[0].match(/^[\s>*_#-]*faceta[^\S\n]*[:：][^\S\n]*[*_`]*(.+)$/im);
    if (!m) return null;
    const faceta = m[1]
      .replace(/[*_`#]/g, '')   // el modelo a veces la emite en negrita
      .replace(/\.\s*$/, '')
      .trim()
      .slice(0, 60);            // techo defensivo: 3-5 palabras, no una frase
    return faceta || null;
  }

  function sanitizeNarration(text) {
    // BUG-059 (S31): el modelo a veces ejecuta EN VOZ ALTA la "VERIFICACION
    // OBLIGATORIA PRIMERO" del bloque de grounding — preambulo meta tipo
    // "Verificación obligatoria: El extracto menciona..." + separador ---
    // antes del capitulo real. La voz lo leia completo, inflaba los conteos
    // de longitud y contaminaba el detector DT-51 (podia dar "cumple" por
    // el autor mencionado en el preambulo, no en el capitulo). Hallazgo
    // colateral valioso: hacer la verificacion en voz alta fue la primera
    // vez que autor/fecha entraron al capitulo (chain-of-thought accidental)
    // — candidato a tecnica deliberada en v3.7. Aqui solo se corta el
    // preambulo de forma determinista; si no hay separador, no se toca nada.
    const meta = text.match(/^\s*(verificaci[óo]n|verification|mandatory first check)[\s\S]{0,1200}?(?:-{3,}|—{2,})\s*/i);
    if (meta) {
      text = text.slice(meta[0].length);
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `BUG-059: preámbulo de verificación filtrado — ${meta[0].length} chars eliminados antes de entregar`);
      }
    }
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
        ? `\nVerified facts about this place (Wikipedia extract):\n"${poi._extract}"\n\nMANDATORY RESPONSE FORMAT — your response has TWO parts, in this exact order:\n\nPART 1 — VERIFICATION DRAFT (scaffolding: it is automatically discarded before reaching the walker, it is never part of the chapter). Start your response with the literal line "Mandatory first check:" and below it list, reading the extract above: the author if the extract mentions one (if not, write "author: not present"), the creation or inauguration date if present (if not, "date: not present"), the specific reason it was created if present (if not, "reason: not present"), and finally the line "Budget: the chapter will be between 90 and 130 words". Then add the line "Faceta:" followed by 3 to 5 words naming the angle from which you will explain this place (for example: everyday neighbourhood life, water engineering, memory of a trade). It is your own label, not a closed list: name it in whatever way best describes the chapter you are about to write. Close this part with a line containing only ---\n\nPART 2 — THE CHAPTER. After the separator, write the chapter starting directly with its first sentence. Every fact you noted as found in Part 1 MUST appear explicitly in the chapter — it is Follower's credibility anchor, never optional, never left out for the sake of style or flow. And the chapter must honor the budget you declared: between 90 and 130 words.\n\nHow to include the facts: weave them into a sentence naturally — e.g. "Diego Pombo built it in 2015..." — never as a separate fact-sheet line like "Author: Diego Pombo. Date: 2015." But smooth prose is NOT an excuse to drop the fact — if you can't find a graceful way to fit it in, include it plainly anyway. Losing the fact is worse than a slightly less elegant sentence.\n\nThese are the ONLY facts you may use for author, date, figures, materials, reason for creation, attributed meaning, architectural style or period, how long a tradition or practice has existed, and religious details (patron saint, order, denomination, year of consecration). If the extract does not mention one of these — do NOT fill that gap yourself. Never claim "for centuries", "for generations", or equivalent duration phrases if the extract doesn't say so. Describe the observable instead — apparent size, location, surroundings, what the walker can see right now — without inventing anything the extract doesn't support.\n\nIf the extract describes a trait shared by a group of elements (for example, a set of figures or species), do not attribute it to a single individual element unless the extract distinguishes it explicitly for that one.\n\n`
        : `\nHechos verificados sobre este lugar (extracto de Wikipedia):\n"${poi._extract}"\n\nFORMATO OBLIGATORIO DE RESPUESTA — tu respuesta tiene DOS partes, en este orden exacto:\n\nPARTE 1 — BORRADOR DE VERIFICACIÓN (andamiaje: se descarta automáticamente antes de llegar al caminante, nunca forma parte del capítulo). Empieza tu respuesta con la línea literal "Verificación obligatoria:" y debajo enumera, leyendo el extracto de arriba: el autor si el extracto lo menciona (si no, escribe "autor: no aparece"), la fecha de creación o inauguración si aparece (si no, "fecha: no aparece"), el motivo específico de su creación si aparece (si no, "motivo: no aparece"), y por último la línea "Presupuesto: el capítulo tendrá entre 90 y 130 palabras". Añade después la línea "Faceta:" seguida de 3 a 5 palabras que nombren el ángulo desde el que vas a explicar este lugar (por ejemplo: vida cotidiana del barrio, ingeniería del agua, memoria de un oficio). Es tu propia etiqueta, no una lista cerrada: nómbrala como mejor describa el capítulo que vas a escribir. Cierra esta parte con una línea que contenga únicamente ---\n\nPARTE 2 — EL CAPÍTULO. Después del separador, escribe el capítulo empezando directo con su primera frase. Todo dato que anotaste como encontrado en la Parte 1 DEBE aparecer explícitamente en el capítulo — es el ancla de credibilidad de Follower, nunca opcional, nunca omitido por mantener el estilo o el flujo. Y el capítulo debe cumplir el presupuesto que declaraste: entre 90 y 130 palabras.\n\nCómo incluir los datos: téjelos en una frase con naturalidad — ej. "Diego Pombo lo construyó en 2015..." — nunca como una línea de ficha técnica separada tipo "Autor: Diego Pombo. Fecha: 2015." Pero la prosa fluida NO es excusa para omitir el dato — si no encuentras una forma elegante de incluirlo, inclúyelo de todas formas aunque suene menos pulido. Perder el dato es peor que una frase un poco menos elegante.\n\nEstos son los ÚNICOS hechos que puedes usar para autor, fecha, cifras, materiales, motivo de creación, significado atribuido, estilo o período arquitectónico, duración o antigüedad de una tradición o práctica, y detalles religiosos (advocación, orden, denominación, año de consagración). Si el extracto no menciona alguno de estos — NO llenes ese vacío por tu cuenta. Nunca afirmes "durante siglos", "durante generaciones" ni expresiones equivalentes de duración si el extracto no lo dice. Describe en su lugar lo observable — tamaño aparente, ubicación, entorno, lo que el caminante puede ver ahora mismo — sin inventar nada que el extracto no respalde.\n\nSi el extracto describe una característica compartida por un conjunto de elementos (por ejemplo, un grupo de figuras o especies), no se la atribuyas a un elemento individual salvo que el extracto lo distinga explícitamente para ese elemento en particular.\n\n`;
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

  /* ═══════════════════════════════════════════
     DA-85 §1 (Sesión 35) — TESIS DE CIUDAD (PRÓLOGO)
     100% Haiku + scratchpad sobre el extracto wiki de la ciudad.
     THESIS_PROMPT_VERSION nace v1, independiente de PROMPT_VERSION.
     ═══════════════════════════════════════════ */

  /* ── EXTRACTO WIKI DE LA CIUDAD — mismo canal BUG-060-safe ──
     A diferencia de _attachExtracts (poi.js), esto es una búsqueda por
     TÍTULO exacto (la ciudad), no un batch de pageids de geosearch — por
     eso vive aparte y no reutiliza esa función. Misma lección BUG-060:
     sin exchars (la API lo recorta en silencio a 1200), truncado en
     cliente retrocediendo al último punto. Wiki del idioma local primero
     (getLocalLang, DT-41), fallback en.wiki. */
  const THESIS_EXTRACT_MAX_CHARS = 2500;

  /* ── DT-69: guarda por coordenadas — red ADICIONAL a DA-87 ──
     DA-87 corrige el ORIGEN (título canónico vía tag OSM). Esta guarda no
     corrige nada: solo detecta que el artículo llegó mal por una vía que
     DA-87 no anticipa (tag OSM apuntando a otro sitio, redirect raro,
     cascada de adivinanza acertando el nombre pero no la ciudad).
     Umbral generoso a propósito: el artículo apunta al centro de la ciudad
     y el caminante puede estar en la periferia de un área metropolitana
     grande. 50 km descarta homónimas de otro continente sin falsos
     positivos plausibles. Ausencia de coordenadas NO es motivo de rechazo:
     hay artículos legítimos sin geoetiqueta, y ausencia no es evidencia. */
  const THESIS_COORD_MAX_KM = 50;

  /* DT-69: ¿el artículo que respondió está donde está el caminante?
     Devuelve true (aceptar) en todos los casos ambiguos — la guarda solo
     rechaza cuando hay evidencia POSITIVA de que el artículo es de otra
     ciudad: hay GPS, hay coordenadas en el artículo, y la distancia
     supera el umbral. Sin GPS o sin geoetiqueta, no opina. */
  function _coordGuardPasses(page, lang, title) {
    const gps = (typeof AppState !== 'undefined') ? AppState.gps : null;
    if (!gps || typeof gps.lat !== 'number' || typeof gps.lng !== 'number') return true;

    const coord = Array.isArray(page.coordinates) ? page.coordinates[0] : null;
    if (!coord || typeof coord.lat !== 'number' || typeof coord.lon !== 'number') {
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `DT-69: "${title}" (${lang}.wikipedia) sin geoetiqueta — guarda no aplica, se acepta`);
      }
      return true;
    }

    if (typeof GPS === 'undefined' || typeof GPS.distanceMeters !== 'function') return true;

    const km = GPS.distanceMeters(gps.lat, gps.lng, coord.lat, coord.lon) / 1000;
    if (km > THESIS_COORD_MAX_KM) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `DT-69: artículo "${title}" (${lang}.wikipedia) descartado — está a ${Math.round(km)} km del caminante (umbral ${THESIS_COORD_MAX_KM} km). Probando siguiente candidato.`);
      }
      return false;
    }

    if (typeof Debug !== 'undefined') {
      Debug.log('info', `DT-69: "${title}" (${lang}.wikipedia) a ${Math.round(km)} km — guarda OK`);
    }
    return true;
  }

  async function _fetchCityExtract(cityName, localLang, wikiHint) {
    // BUG-068 v5: si hay hint (título canónico desde el tag OSM `wikipedia`),
    // se intenta PRIMERO, en su propio idioma+título exactos — sin cascada
    // de adivinanza. Si falla (página movida, tag desactualizado, etc.), cae
    // a la cascada de siempre. wikiHint = {lang, title} | null.
    const attempts = [];
    if (wikiHint && wikiHint.lang && wikiHint.title) {
      attempts.push({ lang: wikiHint.lang, title: wikiHint.title });
    }
    const guessLangs = (localLang && localLang !== 'en') ? [localLang, 'en'] : ['en'];
    for (const lang of guessLangs) {
      // Evitar repetir la misma combinación lang+title que ya probó el hint
      if (wikiHint && wikiHint.lang === lang && wikiHint.title === cityName) continue;
      attempts.push({ lang, title: cityName });
    }

    for (const { lang, title } of attempts) {
      try {
        const baseUrl = `https://${lang}.wikipedia.org/w/api.php`;
        const params = new URLSearchParams({
          action:      'query',
          prop:        'extracts|coordinates|pageprops',
          ppprop:      'disambiguation',
          exintro:     'true',
          explaintext: 'true',
          redirects:   '1',
          titles:      title,
          format:      'json',
          origin:      '*',
        });

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${baseUrl}?${params}`, { signal: controller.signal });
        clearTimeout(tid);

        if (!res.ok) continue;

        const data  = await res.json();
        const pages = data?.query?.pages || {};
        const page  = Object.values(pages)[0];

        if (page && !('missing' in page) && typeof page.extract === 'string' && page.extract.length > 0) {
          // DT-69b: las paginas de desambiguacion son el candidato SIN
          // coordenadas mas probable, asi que la guarda de DT-69 las deja
          // pasar por diseño ("ausencia no es evidencia") y Haiku recibe
          // una lista de acepciones en vez de una ciudad. Se descartan
          // antes, por la propiedad oficial de MediaWiki.
          if (page.pageprops && 'disambiguation' in page.pageprops) {
            if (typeof Debug !== 'undefined') {
              Debug.log('warn', `DT-69b: "${title}" (${lang}.wikipedia) es pagina de desambiguacion — descartada. Probando siguiente candidato.`);
            }
            continue;
          }

          // DT-69: guarda por coordenadas ANTES de aceptar el extracto.
          // Si falla, se hace `continue` — no `return null` — para que la
          // cascada de adivinanza siga buscando el artículo correcto.
          if (!_coordGuardPasses(page, lang, title)) continue;

          let ext = page.extract;
          if (ext.length > THESIS_EXTRACT_MAX_CHARS) {
            ext = ext.slice(0, THESIS_EXTRACT_MAX_CHARS);
            const lastDot = ext.lastIndexOf('.');
            if (lastDot > THESIS_EXTRACT_MAX_CHARS * 0.6) ext = ext.slice(0, lastDot + 1);
          }
          // BUG-068 v5: page.title es el titulo canonico REAL post-redirect
          // de la pagina que efectivamente respondio — coincide con el hint
          // de OSM cuando el hint acerto, y sirve de titulo correcto igual
          // si se cayo a la cascada de adivinanza.
          return { extract: ext, wikiTitle: page.title || cityName };
        }
      } catch (e) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Tesis: extracto de ciudad falló (${lang}.wikipedia, ${e.message}) — probando siguiente idioma si hay`);
        }
      }
    }
    return null; // degradación: ningún idioma tenía artículo, o el fetch falló en todos
  }

  /* ── MINI-PROMPT DE LA TESIS — invariante + "Idioma:" en el user prompt ──
     Decisión B ratificada (S35): mismo patrón que CARE_SYSTEM_PROMPT — cubre
     los ~19 idiomas que ya maneja CITY_WELCOME/getLocalLang (DT-41), en vez
     de limitarse al espejo es/en de los capítulos. */
  const THESIS_SYSTEM_PROMPT = `Eres la voz oficial de Follower, escribiendo la bienvenida con la que un caminante conoce una ciudad por primera vez.

Follower es un compañero invisible que ayuda al caminante a descubrir el alma de una ciudad. Esta bienvenida tiene dos piezas que nacen de la misma idea: una TESIS (se habla en voz alta) y un PRÓLOGO (se muestra como texto, nunca se habla).

MISIÓN

A partir del extracto de Wikipedia sobre la ciudad, encuentra su lente — el rasgo, la tensión o el carácter que hace a ESTA ciudad distinta de cualquier otra.

LA TESIS: un epíteto corto, como un apodo que la ciudad se ganó. No es una oración completa, no es una invitación a caminar ni a descubrir nada — es solo el rasgo, dicho con la menor cantidad de palabras posible. Una sola idea, nunca una segunda reflexión o cierre poético después del rasgo principal. Ejemplos de la EXTENSIÓN y el TONO (formato de referencia — nunca los repitas ni los adaptes a la ciudad real): "la ciudad que nunca calla", "una ciudad de puertas abiertas", "la capital del asombro".

EL PRÓLOGO: una elaboración breve de la MISMA lente que la tesis — no un dato nuevo, no un tema distinto. Es contexto que acompaña a la tesis, nunca la reemplaza ni la contradice. 40-60 palabras.

PERSONIFICACIÓN AUTORIZADA — ÚNICA EXCEPCIÓN EN TODO FOLLOWER

A diferencia de los capítulos de POIs, donde tratar a la ciudad como una persona está prohibido, aquí SÍ puedes hacerlo, en ambas piezas: "la ciudad que...", "la ciudad donde...", "una ciudad que...". Es el único lugar de Follower donde esta licencia existe.

PROHIBIDO — DATOS LITERALES

Nunca incluyas fechas, cifras, nombres propios de personas ni hechos verificables del extracto, ni en la tesis ni en el prólogo. Ninguna de las dos piezas presenta datos, presentan un carácter. Si el extracto es solo información administrativa o estadística, busca igual el carácter detrás de ella — nunca la cites directamente.

PROHIBIDO ABSOLUTO — FUENTES EXTERNAS AL EXTRACTO

Todo lo que escribas en la tesis y el prólogo debe poder respaldarse con una frase del extracto dado. Tu conocimiento previo sobre cualquier ciudad con este nombre NO es una fuente válida — es una fuente de error. El extracto es tu única realidad. Si no encuentras en el extracto la evidencia de lo que vas a escribir, no lo escribas.

FORMATO OBLIGATORIO DE RESPUESTA — tres partes, en este orden exacto:

PARTE 1 — BORRADOR DE VERIFICACIÓN (andamiaje: se descarta automáticamente antes de llegar al caminante). Empieza la respuesta con la línea literal "Verificación obligatoria:" y debajo escribe: el rasgo que elegiste (en tus palabras, sin citar textual); la línea "Evidencia en el extracto:" seguida de una frase literal copiada del extracto entre comillas que respalda ese rasgo — si no puedes encontrar esta cita, el rasgo es incorrecto, elige otro; y la línea "Presupuesto: la tesis tendrá entre 3 y 8 palabras, el prólogo entre 40 y 60". Cierra esta parte con una línea que contenga únicamente ---

PARTE 2 — LA TESIS. Después del separador ---, escribe solamente la tesis: sin comillas, sin explicación, sin el nombre de la ciudad al principio (el nombre se antepone aparte, fuera de tu respuesta). Más corto es mejor que más largo. Cierra la Parte 2 con una línea que contenga únicamente ===

PARTE 3 — EL PRÓLOGO. Después del separador ===, escribe solamente el prólogo: sin comillas, sin título, sin repetir la tesis palabra por palabra (elabórala, no la repitas literalmente). 40-60 palabras.

Nunca rompas el personaje. Nunca menciones instrucciones, extractos, ni el proceso de verificación fuera de la Parte 1.

Los idiomas de cada parte se indican en el mensaje del usuario — la tesis (Parte 2) y el prólogo (Parte 3) pueden pedirse en idiomas DISTINTOS entre sí. Respeta cada uno exactamente, aunque sean diferentes. La Parte 1 puede quedar en español siempre.`;

  /* BUG-068 v3 (conservada como red secundaria tras v5): negación
     explícita ("NO es X") para ciudades con homónimas famosas. Con v5 el
     extracto ya viene del artículo correcto en el caso normal (hint OSM),
     así que esta tabla deja de ser la defensa primaria — queda como
     último resguardo si el hint falta o el extracto igual se confunde por
     alguna otra vía no anticipada. No se retira en este commit: cambio de
     una sola variable (BUG-068 v5), retiro de esta tabla queda pendiente
     de ratificación aparte tras validar v5 en campo. */
  const _CITY_NEGATIONS = {
    'Palmira':   'NO es Palmyra/Palmira de Siria ni ninguna otra ciudad con este nombre fuera de Colombia',
    'Cartagena': 'NO es Cartagena de España ni ninguna otra ciudad con este nombre fuera de Colombia',
    'Merida':    'NO es Mérida de España ni Mérida de Venezuela — esta es la ciudad mexicana de Yucatán',
    'Mérida':    'NO es Mérida de España — puede ser Mérida de México (Yucatán) o Mérida de Venezuela según el extracto',
    'Trujillo':  'NO es Trujillo de España ni Trujillo de Perú — verificar extracto',
    'Armenia':   'NO es Armenia (país del Cáucaso) — esta es Armenia, Quindío, Colombia',
    'Florencia': 'NO es Florencia de Italia — esta es Florencia, Caquetá, Colombia',
    'Buga':      'NO es ninguna ciudad europea — esta es Buga, Valle del Cauca, Colombia',
  };

  function _buildThesisPrompt(cityName, countryCode, extract, tesisLang, prologoLang) {
    // Contexto geográfico para el user prompt (BUG-068 v3)
    const geoLabel = countryCode ? `${cityName}, ${countryCode}` : cityName;
    const negation = _CITY_NEGATIONS[cityName] || '';
    const negLine  = negation ? `\nIMPORTANTE: ${negation}.\n` : '\n';

    const user = `Ciudad: ${geoLabel}${negLine}\nExtracto de Wikipedia sobre esta ciudad:\n"${extract}"\n\nIdioma de la Parte 2 (la tesis, hablada): ${tesisLang}\nIdioma de la Parte 3 (el prólogo, en pantalla): ${prologoLang}`;
    return { system: THESIS_SYSTEM_PROMPT, user };
  }

  /* ── CACHE DE BIENVENIDA (TESIS + PRÓLOGO) — MISMO STORE 'narrations' ──
     Decisión A ratificada (S35): cero cambio de esquema, cero bump de
     DB_VERSION en poi.js. La clave incluye AMBOS idiomas porque tesis y
     prólogo pueden pedirse en idiomas distintos (S35+: tesis en idioma
     local de la ciudad, prólogo en idioma elegido por el usuario) — dos
     usuarios visitando la misma ciudad con idiomas de usuario distintos
     necesitan cachés distintos. Sin fingerprint de extracto — THESIS_
     PROMPT_VERSION es la única palanca de invalidación, por diseño. */
  function _thesisCacheKey(cityName, tesisLang, prologoLang) {
    return `thesis_${CONFIG.THESIS_PROMPT_VERSION}_${cityName}_${tesisLang}_${prologoLang}`;
  }

  async function loadThesisFromCache(cityName, tesisLang, prologoLang) {
    const key = _thesisCacheKey(cityName, tesisLang, prologoLang);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000);
      try {
        const req = indexedDB.open('follower_db', 1);
        req.onsuccess = (e) => {
          const db  = e.target.result;
          const tx  = db.transaction('narrations', 'readonly');
          const get = tx.objectStore('narrations').get(key);
          get.onsuccess = () => { clearTimeout(timeout); resolve(get.result?.value || null); };
          get.onerror   = () => { clearTimeout(timeout); resolve(null); };
        };
        req.onerror = () => { clearTimeout(timeout); resolve(null); };
      } catch (e) { clearTimeout(timeout); resolve(null); }
    });
  }

  async function saveThesisToCache(cityName, tesisLang, prologoLang, value) {
    const key = _thesisCacheKey(cityName, tesisLang, prologoLang);
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('narrations', 'readwrite');
        tx.objectStore('narrations').put({ id: key, value, cachedAt: Date.now() });
      };
    } catch (e) { console.warn('Narration: no se pudo guardar bienvenida en cache'); }
  }

  /* ── GENERACIÓN + REGLA DE CARRERA ──
     _thesisInFlight evita disparos duplicados para la misma ciudad+par de
     idiomas. _thesisFreshValue SOLO se llena cuando se generó DE CERO en
     esta sesión (cache miss) — un hit de cache significa "ya viví esta
     ciudad antes", así que nunca se marca como fresca ni se habla/muestra
     de nuevo. El saludo NUNCA espera esta promesa (DA-85): se dispara
     fire-and-forget desde gps.js y welcomeCity() solo consulta si ya llegó. */
  let _thesisInFlight   = {};
  let _thesisFreshValue = {};

  async function prefetchCityThesis(cityName, tesisLang, prologoLang, countryCode, wikiHint) {
    if (!cityName) return;
    // BUG-068 v5: cityName sigue siendo la clave de cache/inflight (DA-86:
    // AppState.cityShort, sin tocar) — wikiHint {lang,title}|null SOLO
    // decide qué artículo de Wikipedia se consulta, nunca la clave.
    const key = _thesisCacheKey(cityName, tesisLang, prologoLang);
    if (_thesisInFlight[key]) return;

    _thesisInFlight[key] = (async () => {
      try {
        const cached = await loadThesisFromCache(cityName, tesisLang, prologoLang);
        if (cached) {
          if (typeof Debug !== 'undefined') {
            Debug.log('info', `Bienvenida: cache hit — ${cityName}/${tesisLang}-${prologoLang} (DA-86: mostrar viene del cache; narrar lo decide la marca durable)`);
          }
          return;
        }

        const cityResult = await _fetchCityExtract(cityName, tesisLang, wikiHint);
        if (!cityResult) {
          if (typeof Debug !== 'undefined') {
            Debug.log('info', `Bienvenida: sin artículo de ciudad para "${cityName}" — degradación silenciosa, no se cachea`);
          }
          return;
        }

        // BUG-068 v5: cityLabel viene del artículo REAL que respondió a la
        // consulta (hint de OSM si acertó, cascada de adivinanza si no) —
        // ya no es una adivinanza basada en el nombre corto de Nominatim.
        const { extract, wikiTitle } = cityResult;
        const cityLabel = wikiTitle || cityName;
        if (typeof Debug !== 'undefined' && wikiTitle && wikiTitle !== cityName) {
          Debug.log('info', `BUG-068 v5: nombre canónico Wikipedia "${wikiTitle}" (Nominatim: "${cityName}")${wikiHint ? ' · hint OSM usado' : ' · cascada de adivinanza'}`);
        }

        const { system, user } = _buildThesisPrompt(cityLabel, countryCode, extract, tesisLang, prologoLang);
        const raw = await callClaude(system, user, CONFIG.THESIS_MAX_TOKENS);
        if (!raw) return; // Haiku falló — degradación, no cachea

        // sanitizeNarration ya descarta la Parte 1 (mismo regex de
        // "Verificación obligatoria: ... ---" que usan los capítulos).
        // Lo que queda es "tesis\n===\nprologo" — se separa con ===.
        const afterScratchpad = sanitizeNarration(raw);
        const pieces  = afterScratchpad.split(/\n?={3,}\n?/);
        const tesis   = (pieces[0] || '').trim();
        const prologo = (pieces[1] || '').trim();

        if (!tesis || !prologo || /^\s*verificaci[óo]n/i.test(tesis)) {
          if (typeof Debug !== 'undefined') {
            Debug.log('warn', `Bienvenida: borrador malformado para "${cityName}" — descartada, no se cachea`);
          }
          return; // separador --- o === ausente, o strip vacío — degradación
        }

        const value = { tesis, prologo };
        await saveThesisToCache(cityName, tesisLang, prologoLang, value);
        _thesisFreshValue[key] = value;
        if (typeof Debug !== 'undefined') {
          Debug.log('info', `Bienvenida: generada — ${cityName}/${tesisLang}-${prologoLang} · tesis="${tesis}" · prólogo=${prologo.length} chars`);
        }
      } catch (e) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Bienvenida: excepción (${e.message}) — degradación silenciosa`);
        }
      } finally {
        delete _thesisInFlight[key];
      }
    })();
  }

  /* Consumo de un solo uso. DA-86 (S36): app.js ya NO la usa — el flujo
     migró a whenCityWelcomeReady() (no consumible) + marca durable en
     Config. Se conserva exportada solo por compatibilidad de debug;
     candidata a limpieza en una sesión futura. */
  function getFreshCityWelcome(cityName, tesisLang, prologoLang) {
    const key   = _thesisCacheKey(cityName, tesisLang, prologoLang);
    const value = _thesisFreshValue[key] || null;
    if (value) delete _thesisFreshValue[key];
    return value; // { tesis, prologo } | null
  }

  /* Lectura NO consumible — reservada para DT-67 (tarjeta persistente
     futura). A diferencia de getFreshCityWelcome(), no borra la entrada:
     la tarjeta necesita poder leerla en cada sesión, no solo la primera
     vez que se generó. */
  function getCachedCityWelcome(cityName, tesisLang, prologoLang) {
    return loadThesisFromCache(cityName, tesisLang, prologoLang); // Promise<{tesis,prologo}|null>
  }

  /* ── DA-86: RESOLVEDOR ESPERABLE — sustituye la carrera de DA-85 ──
     Devuelve la bienvenida cuando ESTÉ (fresca, cacheada, o al terminar la
     generación en vuelo) o null si la degradación es real (sin artículo,
     Haiku caído). El title card la espera antes de mostrar la Etapa 2
     ("toca para escucharme") — el tap del usuario es la pista, no un
     timeout: la bienvenida ya no puede perder la carrera porque no hay
     carrera. NO consumible y NO decide si se narra — esa decisión vive en
     Config.isCityNarrated (DA-86, marca durable). */
  async function whenCityWelcomeReady(cityName, tesisLang, prologoLang) {
    if (!cityName) return null;
    const key = _thesisCacheKey(cityName, tesisLang, prologoLang);

    // 1. Generada de cero en esta sesión y aún en memoria
    if (_thesisFreshValue[key]) return _thesisFreshValue[key];

    // 2. Generación en vuelo — esperar a que termine (éxito o degradación)
    if (_thesisInFlight[key]) {
      try { await _thesisInFlight[key]; } catch (e) { /* degradación silenciosa */ }
      if (_thesisFreshValue[key]) return _thesisFreshValue[key];
    }

    // 3. Cache de sesiones anteriores (o nada — degradación real)
    return loadThesisFromCache(cityName, tesisLang, prologoLang);
  }

  /* ── DEBUG: borrar SOLO la tesis+prólogo de una ciudad puntual ──
     Pensado para el panel de debug (Debug.retestCityWelcome) — permite
     reintentar la generación fresca sin perder el cache de POIs ni forzar
     un reload completo, a diferencia de Debug.clearCache() (borra todo
     'follower_db'). Reutiliza _thesisCacheKey — misma clave que
     save/loadThesisFromCache, sin duplicar el formato. */
  async function clearCityThesisCache(cityName, tesisLang, prologoLang) {
    const key = _thesisCacheKey(cityName, tesisLang, prologoLang);
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('follower_db', 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('narrations', 'readwrite');
          tx.objectStore('narrations').delete(key);
          tx.oncomplete = () => resolve(true);
          tx.onerror    = () => resolve(false);
        };
        req.onerror = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  /* ── DT-51 (instrumentación, Sesión 28): VERIFICACIÓN PROGRAMÁTICA AUTOR/FECHA ──
     Punto 1 ratificado: enfoque estructural en vez de seguir ajustando texto
     del prompt (S27b confirmó 0/n en autor/fecha tras cuatro intentos de
     redacción distintos). Este bloque SOLO MIDE — no altera, no bloquea,
     no regenera el capítulo entregado. El Punto 2 (qué hacer cuando la
     verificación FALLA) queda deliberadamente sin resolver hasta tener
     evidencia real de campo con esta instrumentación.

     Enfoque validado en sesión de diseño: patrón de atribución
     (verbo + por/de/by + nombre propio) con ventana de ±1 oración —
     ventana de 1 sola oración fallaba en el caso fundacional del ticket
     (Maceta: año y autor en oraciones distintas del extracto real).
     Validado 3/3 contra narraciones REALES de Claude Haiku 4.5 (Maceta,
     Catedral de Pasto, Sagrada Familia) antes de instrumentar aquí.

     Dos bugs corregidos durante la validación, ambos relevantes para
     mantener aquí: (1) el flag case-insensitive NUNCA debe aplicarse al
     grupo que exige mayúscula inicial del nombre — si no, cualquier
     palabra en minúscula se cuela como "nombre propio"; (2) la
     verificación de presencia debe ser por palabra completa (límites \b),
     nunca por substring — un apellido corto o mal capturado puede
     aparecer como substring de cualquier palabra del capítulo y dar un
     falso "sí lo incluyó". */

  // FIX (encontrado al probar contra las 3 narraciones reales juntas):
  // el nombre debe buscarse INMEDIATAMENTE despues del verbo+conector que
  // matcheo, no en cualquier parte de la oracion — si no, una oracion con
  // mas de un "de"/"por" (ej. "Templo... DE la Sagrada Familia... disenada
  // POR Gaudi") captura el conector equivocado (el primero, no el del verbo).
  const _DT51_VERB_CONECTOR_RE = /\b(?:constru\w+|diseñ\w+|cre\w+|dirigi\w+|fund\w+|inaugur\w+|revel\w+|erigi\w+|consagr\w+|inspirad\w+|inici\w+|built|designed|created|directed|founded|inaugurated|unveiled|erected|consecrated|inspired|initiated)\b\s+(?:por|de|by)\s+/i;
  const _DT51_NAME_ANCHORED_RE = /^(?:(?:el|la|los|las|un|una|the|a|an)\s+)?(?:[a-záéíóúñ]+\s+){0,3}([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/;
  const _DT51_YEAR_RE = /\b(1[4-9]\d{2}|20\d{2})\b/g;

  function _dt51ExtractCandidates(extractText) {
    if (!extractText) return [];
    const sentences = extractText.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/);
    const candidatos = [];
    sentences.forEach((sent, i) => {
      const verbMatch = _DT51_VERB_CONECTOR_RE.exec(sent);
      if (!verbMatch) return;
      const resto = sent.slice(verbMatch.index + verbMatch[0].length);
      const nameMatch = _DT51_NAME_ANCHORED_RE.exec(resto);
      if (!nameMatch) return;
      const nombre = nameMatch[1];
      // sanity: descarta capturas basura (muy cortas o mal formadas)
      if (!nombre || nombre.length < 3) return;
      const ventana = sentences.slice(Math.max(0, i - 1), i + 2).join(' ');
      const anios = Array.from(new Set(ventana.match(_DT51_YEAR_RE) || []));
      candidatos.push({ nombre, anios });
    });
    return candidatos;
  }

  function _dt51WordPresent(token, texto) {
    if (!token || !texto) return false;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b').test(texto);
  }

  function _dt51VerifyAutorFecha(poi, textoGenerado) {
    if (!poi || poi._source !== 'wiki' || !poi._extract) return null; // no aplica (osm o sin extracto)
    const candidatos = _dt51ExtractCandidates(poi._extract);
    if (candidatos.length === 0) return { veredicto: 'sin_candidatos', detalle: [] };

    const detalle = candidatos.map(c => {
      const apellido = c.nombre.split(' ').pop();
      const nombrePresente = _dt51WordPresent(apellido, textoGenerado) || _dt51WordPresent(c.nombre, textoGenerado);
      const aniosPresentes = c.anios.filter(a => _dt51WordPresent(a, textoGenerado));
      return { nombre: c.nombre, nombrePresente, aniosPresentes };
    });
    const cumple = detalle.some(d => d.nombrePresente || d.aniosPresentes.length > 0);
    return { veredicto: cumple ? 'cumple' : 'falla', detalle };
  }

  /* ── DT-68 (S39): VENTANA DE INYECCIÓN DE FACETAS ──
     DA-85 §3 enmienda S38 §7: la rotación inyecta solo las últimas 8
     facetas, FIFO. Acota tokens en caminatas largas y refleja que lo que
     molesta es repetir un ángulo reciente, no uno de hace dos horas.
     El Epílogo NO usa esta función: lee el ledger completo.
     Vive aquí desde DT-68 pero su consumidor (§3) aún no existe — no se
     llama desde ningún punto todavía, a propósito. */
  const FACETA_WINDOW = 8;

  function getRecentFacetas() {
    const chapters = AppState._walkChapters || [];
    return chapters
      .slice(-FACETA_WINDOW)
      .map(c => c.faceta)
      .filter(Boolean);
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


  /* ── S41: CLASIFICADOR DE ICONOS (DT-77 / DT-78) ──
     Wikipedia GeoSearch devuelve type='landmark' para todo (verificado en
     campo, Palmira: 4 POIs, 4 landmarks), asi que el tipo no se puede
     derivar del dato. Wikidata P31 si clasifica bien pero exige un mapa
     P31->emoji de claves ilimitadas: los 4 primeros POIs de Palmira ya
     pedian 3 entradas nuevas. Haiku recibe la lista cerrada y resuelve el
     mapeo, que es el trabajo que no converge a mano.
     Una llamada por ciudad, sobre extractos que ya estan en memoria. */

  const ICON_ALLOWED = [
    '⛪','🕌','🕍','🏛️','🏰','🏚️','⚱️','🗿','🖼️','🎭','🎞️','📚','🎨',
    '🌳','⛲','🔭','🌉','🗼','🏭','🏟️','🚉','🎓','🏪','🪦','☕'
  ];

  // El modelo puede devolver el emoji sin el selector de variacion U+FE0F
  // ('🏛' en vez de '🏛️'). Comparar en crudo mandaria a fallback un acierto.
  const _stripVS   = s => s.replace(/\uFE0F/g, '');
  const ICON_CANON = new Map(ICON_ALLOWED.map(e => [_stripVS(e), e]));

  const ICON_SYSTEM_PROMPT = `Eres un clasificador de iconos para Follower. Recibes lugares y devuelves, para cada uno, el emoji de la lista cerrada que mejor lo representa.

LISTA CERRADA — solo puedes usar estos 25 simbolos:
⛪  iglesia, catedral, capilla, convento
🕌  mezquita
🕍  sinagoga
🏛️  edificio historico o civil, palacio, ayuntamiento, casona, hacienda
🏰  castillo, fortaleza, muralla
🏚️  ruinas
⚱️  sitio arqueologico
🗿  monumento, estatua, memorial
🖼️  museo, galeria
🎭  teatro, auditorio, opera
🎞️  cine
📚  biblioteca, archivo
🎨  arte publico, mural, escultura urbana
🌳  parque, jardin, plaza, bulevar, alameda
⛲  fuente
🔭  mirador
🌉  puente, viaducto
🗼  torre, faro
🏭  patrimonio industrial, fabrica, ingenio, molino, mina
🏟️  estadio, complejo deportivo, plaza de toros
🚉  estacion de tren, metro o tranvia
🎓  universidad, colegio historico
🏪  mercado
🪦  cementerio
☕  cafe o bar historico

REGLAS
1. Devuelve UNICAMENTE un objeto JSON. Sin preambulo, sin explicacion, sin bloques de codigo, sin texto antes ni despues.
2. La clave es el id exacto que recibiste. El valor es un emoji de la lista, o cadena vacia si ninguno encaja.
3. Nunca uses un emoji que no este en la lista. Ante la duda, cadena vacia. Una cadena vacia es una respuesta correcta; un emoji inventado no.
4. Cadena vacia tambien si el articulo trata de una persona, un evento, una obra o un concepto en vez de un lugar que se pueda visitar.
5. Si un lugar encaja en dos categorias, elige la de su funcion principal hoy, no la de su origen. Un convento convertido en museo es 🖼️.
6. No repitas el id. No agregues ids que no recibiste.

FORMATO DE SALIDA
{"wiki_11502036":"⛪","wiki_2276045":"🏟️","wiki_11485987":""}`;

  /* Recibe [{ id, name, _extract }] y devuelve { id: emoji|'' } o null.
     null = la llamada fallo (red, timeout, JSON invalido) y el POI debe
     conservar su icono provisional para reintentar. Distinto de '' , que
     significa "el modelo miro y no habia categoria". */
  async function classifyIcons(items) {
    if (!Array.isArray(items) || items.length === 0) return null;

    const payload = items.map(it => ({
      id:      it.id,
      nombre:  cleanPOIName(it.name),
      resumen: (it._extract || '').slice(0, 200)
    }));

    const raw = await callClaude(ICON_SYSTEM_PROMPT, JSON.stringify(payload), CONFIG.CLASSIFIER_MAX_TOKENS);
    if (!raw) return null;

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `Narration: clasificador devolvio JSON invalido — ${raw.slice(0, 80)}`);
      }
      return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;

    // La lista cerrada se hace cumplir AQUI, no solo en el prompt: un emoji
    // fuera de lista se degrada a '' y el POI recibe el fallback.
    const out = {};
    for (const [id, emoji] of Object.entries(parsed)) {
      if (typeof emoji !== 'string') continue;
      out[id] = ICON_CANON.get(_stripVS(emoji.trim())) || '';
    }
    return out;
  }

  function getClassifierVersion() { return CONFIG.CLASSIFIER_PROMPT_VERSION; }

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
          // DT-68 (S39): el registro cacheado pasa de texto plano a {text, faceta}.
          // Devuelve el registro completo, no solo el texto — la faceta debe
          // llegar al ledger igual que si el capítulo se hubiera generado
          // (DA-85 §3 enmienda S38 §6: la rotación es indiferente al origen).
          get.onsuccess = () => {
            clearTimeout(timeout);
            const r = get.result;
            resolve(r?.text ? { text: r.text, faceta: r.faceta || null } : null);
          };
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
  async function saveToCache(poiId, lang, topic, text, extract, faceta) {
    try {
      const req = indexedDB.open('follower_db', 1);
      req.onsuccess = (e) => {
        const db    = e.target.result;
        const key   = `${CONFIG.PROMPT_VERSION}_${poiId}_${lang}_${topic}_${_fingerprint(extract)}`;
        const tx    = db.transaction('narrations', 'readwrite');
        const store = tx.objectStore('narrations');
        store.put({ id: key, text, faceta: faceta || null, cachedAt: Date.now() });  // DT-68 (S39): la faceta viaja dentro del registro cacheado
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
    // DT-68 (S39): la caché devuelve {text, faceta} — la faceta de un capítulo
    // servido vale igual que la de uno generado (DA-85 §3 enmienda S38 §6).
    const cachedRec = await loadFromCache(poi.id, lang, topic, poi._extract);
    let text   = cachedRec ? cachedRec.text : null;
    let faceta = cachedRec ? cachedRec.faceta : null;
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
        // DT-68: leer la faceta del scratchpad ANTES de que sanitizeNarration
        // descarte el andamiaje, y guardarla junto al texto ya limpio.
        faceta = _extractFaceta(text);
        await saveToCache(poi.id, lang, topic, sanitizeNarration(text), poi._extract, faceta);
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

    // DT-51 (instrumentación, Sesión 28): verificación programática de
    // autor/fecha — SOLO mide y loguea, nunca altera `text` ni bloquea la
    // entrega. Punto 2 (qué hacer si FALLA) sigue sin resolver a propósito.
    if (source !== 'fallback' && typeof Debug !== 'undefined') {
      try {
        const verifDT51 = _dt51VerifyAutorFecha(poi, text);
        if (verifDT51 && verifDT51.veredicto !== 'sin_candidatos') {
          const nombres = verifDT51.detalle.map(d => d.nombre).join(', ');
          Debug.log(
            verifDT51.veredicto === 'cumple' ? 'info' : 'warn',
            `DT-51 verificacion: ${verifDT51.veredicto} · POI=${poi.name} · source=${source} · candidatos=[${nombres}]`
          );
        }
      } catch (e) {
        Debug.log('warn', `DT-51 verificacion: error al verificar (${e.message}) — continuando sin instrumentar`);
      }
    }

    // DT-39: guardar capítulo completado para continuidad DA-52
    // Solo capítulos reales (no fallback) — el fallback genérico no aporta continuidad narrativa
    if (source !== 'fallback' && AppState._walkChapters !== undefined) {
      // DT-68 (S39): el ledger guarda DOS VISTAS del mismo evento —
      // `text` completo para el Epílogo (DA-85 §4, lee el ledger entero) y
      // `faceta` compacta para la rotación (DA-85 §3, lee la ventana de 8).
      // Consumidores incompatibles: inyectar veinte textos de 130 palabras
      // en cada prompt sería inviable; solo etiquetas dejaría al Epílogo sin
      // material. Por eso ambas.
      AppState._walkChapters.push({
        poiId:   poi.id,
        poiName: poi.name,
        text:    text,
        faceta:  faceta || null,   // null legítimo: los POIs sin artículo wiki no tienen scratchpad
        ts:      Date.now()
      });
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Narration: capítulo #${AppState._walkChapters.length} guardado — ${cleanPOIName(poi.name)} · faceta="${faceta || '(sin declarar)'}" · source=${source}`);
      }
    }

    updateNarrationUI(text);

    if (typeof Voice !== 'undefined') {
      Voice.speak(text, lang, (source) => {
        _isNarrating = false;
        stopWaves();

        // BUG-062: cierre por visibility-recovery = narracion interrumpida,
        // no completada. No marcar visited — con cache el re-disparo es
        // instantaneo y el capitulo no se pierde para siempre.
        // S2-A1: marcar visitado al COMPLETAR, no al activar
        if (poi && !poi.visited && source !== 'visibility-recovery') {
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

  return { classifyIcons, getClassifierVersion, trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome, getCityIntroFallback, getCityIntroPrefix, getLocalLang, getCareMessage, prefetchCityThesis, getFreshCityWelcome, getCachedCityWelcome, whenCityWelcomeReady, clearCityThesisCache };

})();
