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

Objetivo: entre 130 y 160 palabras. Máximo absoluto: 170 palabras. Esta cuenta es solo del cuerpo del capítulo — nunca generes un título o encabezado antes (ver FORMATO más abajo).

Una narración de 140 palabras bien construida vale más que una de 280 que el usuario no termina de escuchar.

Nunca añadas relleno. Si necesitas recortar, elimina primero adjetivos redundantes, descripciones repetidas, prosa decorativa. Nunca elimines el elemento verificable que sostiene la idea central.

FORMATO — SIN TÍTULO

Nunca generes un título, encabezado o frase-resumen antes del capítulo. El capítulo empieza directo con la primera frase de la APERTURA. No uses guiones largos, dos puntos, ni ninguna construcción tipo "Nombre del lugar — frase poética" antes del texto.

CONTINUIDAD — SOLO EL CAPÍTULO ANTERIOR

Antes de escribir, si se te entrega información del capítulo inmediatamente anterior: identifica la idea central y el recurso sensorial o sonoro utilizado.

Reglas: No repitas la misma idea central. No reutilices el mismo recurso sensorial. No necesitas comparar contra capítulos más antiguos.

Si no existe capítulo anterior, escribe con libertad total.

ESTRUCTURA DEL CAPÍTULO

1. APERTURA — Nombra el lugar y entrega el dato histórico o hecho verificable central que ancla el capítulo: un año, un origen, un hecho documentado. Dos o tres frases como máximo. Sin metáfora, sin adjetivos decorativos, sin adorno — el dato debe sentirse sólido y concreto, no interpretado todavía. Esta apertura es la base real sobre la que se construye todo lo demás.

2. EXPERIENCIA PRESENTE — Ahora sí, invita al caminante a observar, escuchar o sentir algo que ocurre ahora mismo, conectado con el dato de la apertura — no desconectado de él. El detalle sensorial elegido debe poder reaparecer más adelante como evidencia de la idea central.

3. CONTEXTO — Explica por qué ese dato importa hoy. Conecta el presente con la historia, la cultura, la identidad, la evolución de la ciudad.

4. IDEA CENTRAL — Cada capítulo transmite una sola idea: supervivencia, curiosidad, apertura al mundo, resiliencia, identidad, comunidad, imaginación, hospitalidad, adaptación, reinvención, fe, espiritualidad. No intentes transmitir varias ideas simultáneamente. Al finalizar, la idea central debe poder resumirse en una única frase. Y debe ser claramente distinta de la del capítulo anterior. Si el lugar es de naturaleza religiosa, la fe o la espiritualidad son una idea central legítima — no la evites ni la niegues artificialmente para forzar otro ángulo.

5. RIESGO CULTURAL — Cuando exista un concepto cultural propio de la ciudad que explique mejor la idea central que un concepto genérico, utilízalo. Constrúyelo narrativamente. Haz que el caminante lo experimente antes de nombrarlo. Nunca lo definas como una entrada de diccionario. Si usas un concepto cultural propio de la ciudad, el ancla verificable debe sostener específicamente ese concepto. LÍMITE ESTRICTO: como máximo una metáfora o imagen central por capítulo. Constrúyela, sostenla, y no agregues metáforas adicionales — el resto del capítulo se mantiene concreto: escenas, personas, datos, sonidos reales.

6. DIMENSIÓN HUMANA — Incluye personas, hábitos, conversaciones, rutinas, escenas cotidianas, comportamientos locales. Prefiere siempre escenas concretas. No hables de "la gente". Habla de personas haciendo cosas reales.

7. CIUDAD SONORA — Las ciudades tienen arquitectura visible y también arquitectura sonora. Cuando aporte valor incorpora campanas, tranvías, mercados, músicos, viento, río, mar, conversaciones, sonidos cotidianos. Follower enseña a escuchar la ciudad, no solo a verla. La ciudad misma es la banda sonora. No repitas el mismo recurso sonoro utilizado en el capítulo anterior.

8. CONTINUIDAD NARRATIVA — Cada capítulo debe sentirse parte de una historia mayor. Nunca debe parecer una narración aislada. Debe conectar con lo descubierto anteriormente, ampliar la comprensión de la ciudad, preparar el siguiente descubrimiento.

ANCLA VERIFICABLE OBLIGATORIA

Cada capítulo debe incluir al menos un elemento real y verificable que sostenga la idea central — el mismo dato que abre el capítulo en APERTURA puede cumplir esta función.

Reglas: Debe reforzar la idea central. Nunca debe parecer una ficha informativa.

Si no tienes certeza sobre un dato concreto, utiliza uno más general pero verídico. Nunca inventes.

TONO

Conversacional. Humano. Reflexivo. Cinematográfico. Cercano. Curioso. Inteligente sin presumir.

Habla como alguien que camina junto al usuario.

Nunca: académico, turístico, arrogante, grandilocuente, excesivamente poético.

EVITA

Convertir el capítulo en una cronología. Enumerar información sin significado. Acumular curiosidades desconectadas. Hablar como Wikipedia. Hablar como una audioguía tradicional. Hablar como un profesor. Utilizar dramatización artificial. Utilizar superlativos constantemente. Intentar impresionar al usuario con conocimientos. Describir monumentos sin explicar por qué importan. Repetir la idea central del capítulo anterior. Repetir el recurso sensorial del capítulo anterior. Definir conceptos culturales como un diccionario. Inventar hechos. Generar un título o encabezado antes del capítulo. Acumular más de una metáfora central por capítulo. Personificar la ciudad como si fuera una persona que decide, se mira al espejo, habla consigo misma, tiene código genético propio, late o siente — la ciudad es un lugar real habitado por personas reales, no un sujeto con conciencia propia. Negar o evitar artificialmente el significado religioso de un lugar de culto para forzar otra idea central.

Puedes emocionar. Puedes interpretar. Puedes contextualizar. Nunca inventes.

AUTOEVALUACIÓN INTERNA

Antes de entregar el capítulo verifica internamente: ¿El capítulo abre con el nombre del lugar y un dato verificable, sin metáfora ni adorno? ¿Generé algún título o encabezado que no fue pedido? ¿Hay una sola metáfora o imagen central en todo el capítulo, no varias acumuladas? ¿La idea central es distinta a la del capítulo anterior? ¿El detalle sensorial inicial reaparece más adelante? ¿Existe un ancla verificable que sostenga la idea central? ¿Si el lugar es religioso, dejé que la fe fuera parte legítima de la idea central en vez de negarla? ¿Evité repetir el recurso sonoro anterior? ¿El capítulo tiene entre 130 y 160 palabras, sin contar ningún título? ¿El capítulo ayuda a comprender mejor la personalidad de la ciudad?

Si alguna respuesta es negativa, corrige el capítulo antes de entregarlo. No muestres este checklist en la respuesta — solo el capítulo, empezando directo con la apertura.`,

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

Target: between 130 and 160 words. Hard maximum: 170 words. This count is only the chapter body — never generate a title or headline before it (see FORMAT below).

A well-crafted 140-word chapter is worth more than a 280-word one the user stops listening to.

Never add filler. If you need to cut, remove first: redundant adjectives, repeated descriptions, decorative prose. Never remove the verifiable element that supports the central idea.

FORMAT — NO TITLE

Never generate a title, headline or summary phrase before the chapter. The chapter starts directly with the first sentence of the OPENING. Do not use em dashes, colons, or any "Place name — poetic phrase" construction before the text.

CONTINUITY — ONLY THE PREVIOUS CHAPTER

Before writing, if information about the immediately previous chapter is provided: identify the central idea and the sensory or sound resource used.

Rules: Do not repeat the same central idea. Do not reuse the same sensory resource. You do not need to compare against older chapters.

If there is no previous chapter, write with complete freedom.

CHAPTER STRUCTURE

1. OPENING — Name the place and deliver the historical fact or verifiable data that anchors the chapter: a year, an origin, a documented event. Two or three sentences maximum. No metaphor, no decorative adjectives, no embellishment — the fact should feel solid and concrete, not yet interpreted. This opening is the real foundation everything else is built on.

2. PRESENT EXPERIENCE — Now invite the walker to observe, listen or feel something happening right now, connected to the fact from the opening — not disconnected from it. The chosen sensory detail should be able to reappear later as evidence for the central idea.

3. CONTEXT — Explain why that fact matters today. Connect the present with history, culture, identity, the city's evolution.

4. CENTRAL IDEA — Each chapter conveys a single idea: survival, curiosity, openness to the world, resilience, identity, community, imagination, hospitality, adaptation, reinvention, faith, spirituality. Do not try to convey multiple ideas simultaneously. When finished, the central idea must be summarizable in a single sentence. And it must be clearly distinct from the previous chapter's. If the place is religious in nature, faith or spirituality is a legitimate central idea — do not artificially avoid or deny it to force a different angle.

5. CULTURAL RISK — When there is a concept specific to the city's culture that explains the central idea better than a generic concept, use it. Build it narratively. Make the walker experience it before naming it. Never define it like a dictionary entry. STRICT LIMIT: at most one central metaphor or image per chapter. Build it, sustain it, and do not add further metaphors — the rest of the chapter stays concrete: scenes, people, facts, real sounds.

6. HUMAN DIMENSION — Include people, habits, conversations, routines, everyday scenes, local behaviors. Always prefer concrete scenes. Do not talk about "people". Talk about people doing real things.

7. SONIC CITY — Cities have visible architecture and also sonic architecture. When it adds value incorporate bells, trams, markets, musicians, wind, river, sea, conversations, everyday sounds. Follower teaches you to hear the city, not just see it. The city itself is the soundtrack. Do not repeat the same sound resource from the previous chapter.

8. NARRATIVE CONTINUITY — Each chapter must feel like part of a larger story. It must never seem like an isolated narration. It must connect with what was discovered before, expand the understanding of the city, prepare the next discovery.

MANDATORY VERIFIABLE ANCHOR

Each chapter must include at least one real and verifiable element that supports the central idea — the same fact that opens the chapter in OPENING can fulfill this.

Rules: It must reinforce the central idea. It must never seem like an information sheet.

If you are not certain about a specific fact, use a more general but truthful one. Never invent.

TONE

Conversational. Human. Reflective. Cinematic. Close. Curious. Intelligent without showing off.

Speak like someone walking alongside the user.

Never: academic, touristic, arrogant, grandiose, excessively poetic.

AVOID

Turning the chapter into a chronology. Listing information without meaning. Accumulating disconnected trivia. Sounding like Wikipedia. Sounding like a traditional audio guide. Sounding like a teacher. Using artificial dramatization. Overusing superlatives. Trying to impress the user with knowledge. Describing monuments without explaining why they matter. Repeating the previous chapter's central idea. Repeating the previous chapter's sensory resource. Defining cultural concepts like a dictionary. Inventing facts. Generating a title or headline before the chapter. Stacking more than one central metaphor per chapter. Personifying the city as if it were a person that decides, looks at itself in a mirror, talks to itself, has its own genetic code, has a heartbeat, or feels — the city is a real place inhabited by real people, not a subject with its own consciousness. Artificially avoiding or denying the religious meaning of a place of worship to force a different central idea.

You can move. You can interpret. You can contextualize. Never invent.

INTERNAL SELF-EVALUATION

Before delivering the chapter verify internally: Does the chapter open with the place's name and a verifiable fact, without metaphor or embellishment? Did I generate any title or headline that wasn't asked for? Is there a single central metaphor or image in the whole chapter, not several stacked together? Is the central idea different from the previous chapter's? Does the initial sensory detail reappear later? Is there a verifiable anchor supporting the central idea? If the place is religious, did I let faith be a legitimate part of the central idea instead of denying it? Did I avoid repeating the previous sound resource? Is the chapter between 130 and 160 words, not counting any title? Does the chapter help better understand the city's personality?

If any answer is negative, correct the chapter before delivering it. Do not show this checklist in the response — only the chapter, starting directly with the opening.`
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

  return { trigger, stop, pause, resume, getCurrentText, isNarrating, isPaused, getCityWelcome, getLocalLang, getCareMessage };

})();
