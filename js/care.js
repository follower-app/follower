/* ═══════════════════════════════════════════
   FOLLOWER — care.js
   Sistema de cuidado contextual.
   Evalúa pasos, distancia, clima y hora
   para sugerir descansos. DA-3:
   checkCareContext() función única.
   ═══════════════════════════════════════════ */

const Care = (() => {

  /* ── ESTADO INTERNO ── */
  let _lastSuggestion  = 0;      // timestamp de última sugerencia
  let _suggestionShown = false;  // sugerencia activa en pantalla
  let _checkTimer      = null;   // timer de chequeo periódico
  let _nearbyRest           = null;   // lugar de descanso cercano
  let _specialZoneTriggerPos = null;  // DT-43: posicion donde se disparo zona especial
  let _thirstShownThisWalk  = false;  // DT-42: thirst solo una vez por caminata

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    CHECK_INTERVAL:    2 * 60 * 1000,   // chequear cada 2 minutos
    MIN_KM_FOR_REST:   2.0,             // km mínimos antes de sugerir descanso
    MIN_STEPS_FOR_REST: 2600,           // pasos mínimos (~2km)
    COOLDOWN_MS:       20 * 60 * 1000,  // 20 min entre sugerencias
    HOT_TEMP:          30,              // °C — calor intenso
    COLD_TEMP:         5,               // °C — frío intenso
    HOUR_LUNCH_START:  12,              // hora de almuerzo inicio
    HOUR_LUNCH_END:    14,              // hora de almuerzo fin
    THIRST_TEMP_MIN:   22,              // DT-42: calor moderado, banda inferior
    THIRST_TEMP_MAX:   29,              // DT-42: por debajo de HOT_TEMP (30)
    THIRST_MIN_KM:     1.2,             // DT-42: menor que MIN_KM_FOR_REST — adelanta el aviso
    REST_SEARCH_RADIUS: 400,            // metros para buscar cafe cercano
    SPECIAL_ZONE_RADIUS: 150,            // DT-43: radio para detectar zona especial
    SPECIAL_ZONE_MIN:    3,              // DT-43: minimo de POIs para zona especial
    SPECIAL_ZONE_RESET:  200             // DT-43: metros para resetear el trigger
  };

  /* ── MENSAJES POR CONTEXTO ── */
  const MESSAGES = {
    tired: {
      es: (km) => ({
        title:  '¡Te lo mereces! ☕',
        text:   `Llevas ${km.toFixed(1)} km explorando. Hay un lugar perfecto para recuperar energía y luego continuar.`,
        btn:    'Ver dónde descansar →'
      }),
      en: (km) => ({
        title:  'You deserve a break! ☕',
        text:   `You've walked ${km.toFixed(1)} km. There's a perfect spot nearby to recharge and keep exploring.`,
        btn:    'Find a place to rest →'
      })
    },
    hot: {
      es: (temp) => ({
        title:  `Hace ${temp}°C ☀️`,
        text:   'El calor está fuerte. Hay un lugar con sombra y bebidas frías a pocos metros.',
        btn:    'Buscar refugio del calor →'
      }),
      en: (temp) => ({
        title:  `It's ${temp}°C ☀️`,
        text:   'It\'s really hot out here. There\'s a shady spot with cold drinks nearby.',
        btn:    'Find cool shelter →'
      })
    },
    cold: {
      es: (temp) => ({
        title:  `Solo ${temp}°C 🧊`,
        text:   'Hace bastante frío. Un café caliente a pocos pasos te esperará de maravilla.',
        btn:    'Encontrar lugar cálido →'
      }),
      en: (temp) => ({
        title:  `Only ${temp}°C 🧊`,
        text:   'It\'s quite cold out here. A warm café nearby sounds perfect right now.',
        btn:    'Find a warm place →'
      })
    },
    lunch: {
      es: () => ({
        title:  'Hora de comer 🍽️',
        text:   'Son las horas del almuerzo. Los italianos pararían ahora — tú también mereces un descanso.',
        btn:    'Ver restaurantes cerca →'
      }),
      en: () => ({
        title:  'Time to eat 🍽️',
        text:   'It\'s lunchtime. The locals would stop now — you deserve a break too.',
        btn:    'Find nearby restaurants →'
      })
    }
,
    special: {
      es: (count) => ({
        title: 'Un rincón especial ✨',
        text:  `Hay ${count} historias concentradas aquí. Tómate un momento — este lugar merece más atención.`,
        btn:   'Explorar este rincón →'
      }),
      en: (count) => ({
        title: 'A special corner ✨',
        text:  `There are ${count} stories concentrated here. Take a moment — this place deserves more attention.`,
        btn:   'Explore this corner →'
      })
    },
    // DT-42: rain migrado desde weather.js — antes vivia hardcodeado,
    // sin pasar por lang, en showRainAlert(). Ahora es fallback como el resto.
    rain: {
      es: () => ({
        title: '🌧️ Se viene lluvia',
        text:  'Va a llover en los próximos minutos. Busquemos un lugar cercano donde esperar.',
        btn:   'Ver refugio cercano →'
      }),
      en: () => ({
        title: '🌧️ Rain is coming',
        text:  "It's about to rain. Let's find a nearby place to wait it out.",
        btn:   'Find shelter →'
      })
    },
    // DT-42: thirst — sin lugar, un solo boton de cierre
    thirst: {
      es: () => ({
        title: '💧 No olvides hidratarte',
        text:  'Hace calor y ya llevas un buen tramo caminado. Tomá agua seguido, aunque no sientas sed todavía.',
        btn:   'Entendido'
      }),
      en: () => ({
        title: '💧 Stay hydrated',
        text:  "It's warm out and you've covered some distance. Drink water regularly, even before you feel thirsty.",
        btn:   'Got it'
      })
    }
  };
  // DT-42: los mensajes anteriores son fallback estatico — se usan solo si
  // Narration.getCareMessage() falla o AppState.offline es true. El camino
  // normal reemplaza msg.text con el texto generado por Claude.

  /* ── EVALUAR CONTEXTO — DA-3 función única ──
     DT-42: orden de prioridad ampliado a 6 (special se evalua aparte,
     via checkSpecialZone() en cada tick de GPS, no aca). ── */
  function checkCareContext() {
    // No interrumpir si hay sugerencia activa
    if (_suggestionShown) return;

    // Respetar cooldown entre sugerencias
    const now = Date.now();
    if (now - _lastSuggestion < CONFIG.COOLDOWN_MS) return;

    // No sugerir durante narración activa
    if (AppState.phase === 'diastole') return;

    const lang    = Config.get('lang');
    const weather = AppState.weather;
    const km      = AppState.kmWalked;
    const steps   = AppState.steps;
    const hour    = new Date().getHours();

    /* ── PRIORIDAD 1: Lluvia — DT-42, migrado desde weather.js ──
       Antes vivia en un sistema separado (showRainAlert), con su propio
       timer y texto hardcodeado sin pasar por lang. Ahora es un trigger
       mas de Care, con el mismo cooldown y la misma voz generativa. ── */
    if (weather?.isRaining) {
      triggerSuggestion('rain', lang);
      return;
    }

    /* ── PRIORIDAD 2: Calor extremo ── */
    if (weather?.temp >= CONFIG.HOT_TEMP) {
      triggerSuggestion('hot', lang, weather.temp);
      return;
    }

    /* ── PRIORIDAD 3: Frío extremo ── */
    if (weather?.temp <= CONFIG.COLD_TEMP) {
      triggerSuggestion('cold', lang, weather.temp);
      return;
    }

    /* ── PRIORIDAD 4: Hora de almuerzo ── */
    if (hour >= CONFIG.HOUR_LUNCH_START && hour < CONFIG.HOUR_LUNCH_END && km > 1) {
      triggerSuggestion('lunch', lang);
      return;
    }

    /* ── PRIORIDAD 5: Sed / hidratacion — DT-42, nuevo ──
       Calor moderado + distancia moderada. Una sola vez por caminata,
       nunca por cooldown estandar — ver _thirstShownThisWalk. ── */
    if (!_thirstShownThisWalk &&
        weather?.temp >= CONFIG.THIRST_TEMP_MIN &&
        weather?.temp <= CONFIG.THIRST_TEMP_MAX &&
        km >= CONFIG.THIRST_MIN_KM) {
      triggerSuggestion('thirst', lang, weather.temp);
      return;
    }

    /* ── PRIORIDAD 6: Cansancio por distancia ── */
    if (km >= CONFIG.MIN_KM_FOR_REST || steps >= CONFIG.MIN_STEPS_FOR_REST) {
      triggerSuggestion('tired', lang, km);
      return;
    }
  }

  /* ── DT-42: METADATA POR TRIGGER ──
     Define si el trigger necesita candidatos de Overpass, con que amenity,
     y si la card final tiene boton de "ir al lugar" o solo cierre. ── */
  const TRIGGER_META = {
    rain:    { amenity: 'cafe|bar|library|museum', usesOverpass: true,  hasPlaceButton: true  },
    hot:     { amenity: 'cafe|bar',                 usesOverpass: true,  hasPlaceButton: true  },
    cold:    { amenity: 'cafe|bar',                 usesOverpass: true,  hasPlaceButton: true  },
    lunch:   { amenity: 'restaurant|cafe',           usesOverpass: true,  hasPlaceButton: true  },
    thirst:  { amenity: null,                        usesOverpass: false, hasPlaceButton: false },
    tired:   { amenity: 'cafe|bar',                 usesOverpass: true,  hasPlaceButton: true  },
    special: { amenity: null,                        usesOverpass: false, hasPlaceButton: false }
  };

  /* ── DISPARAR SUGERENCIA — DT-42: ahora async, arma candidatos segun
     el tipo (Overpass / POIs de zona / ninguno) y llama a Claude ── */
  function triggerSuggestion(type, lang, value = null) {
    const meta = TRIGGER_META[type];
    if (!meta) {
      if (typeof Debug !== 'undefined') Debug.log('error', `Care: trigger desconocido '${type}'`);
      return;
    }

    if (meta.usesOverpass) {
      findNearbyRestPlace(type, (candidates) => {
        generateAndShowCard(type, lang, value, candidates);
      });
    } else if (type === 'special') {
      generateAndShowCard(type, lang, value, buildSpecialZonePlaces());
    } else {
      // thirst — sin candidatos de ningun tipo
      generateAndShowCard(type, lang, value, []);
    }
  }

  /* ── BUSCAR LUGARES CERCANOS — DT-42: 5 candidatos (antes 3), amenity
     por TRIGGER_META (incluye rain, migrado de weather.js), devuelve el
     array completo al callback en vez de quedarse solo con el primero ── */
  function findNearbyRestPlace(type, callback) {
    if (!AppState.gps || AppState.offline) {
      callback([]);
      return;
    }

    const { lat, lng } = AppState.gps;
    const amenity = (TRIGGER_META[type] && TRIGGER_META[type].amenity) || 'cafe';
    const query   = `
      [out:json][timeout:8];
      (
        node["amenity"~"${amenity}"](around:${CONFIG.REST_SEARCH_RADIUS},${lat},${lng});
      );
      out 5;
    `;

    fetch('https://lz4.overpass-api.de/api/interpreter', {
      method: 'POST',
      body:   `data=${encodeURIComponent(query)}`
    })
    .then(r => r.json())
    .then(data => callback(data.elements || []))
    .catch(() => callback([]));
  }

  /* ── DT-42: candidatos de zona especial — POIs de Wikipedia ya
     cargados, no Overpass. Mismo radio que checkSpecialZone(). ── */
  function buildSpecialZonePlaces() {
    if (!AppState.gps || typeof POI === 'undefined' || typeof GPS === 'undefined') return [];
    const { lat, lng } = AppState.gps;
    const allPOIs = POI.getPOIs() || [];
    return allPOIs
      .filter(p => GPS.distanceMeters(lat, lng, p.lat, p.lng) <= CONFIG.SPECIAL_ZONE_RADIUS)
      .map(p => ({
        name: p.name,
        distanceMeters: Math.round(GPS.distanceMeters(lat, lng, p.lat, p.lng)),
        type: 'poi'
      }));
  }

  /* ── DT-42: formatear candidato de Overpass para el prompt ── */
  function formatOverpassCandidate(el) {
    const name    = el.tags?.name || 'lugar sin nombre';
    const amenity = el.tags?.amenity || 'lugar';
    let dist = 9999;
    if (AppState.gps && typeof GPS !== 'undefined') {
      dist = Math.round(GPS.distanceMeters(AppState.gps.lat, AppState.gps.lng, el.lat, el.lon));
    }
    return { name, distanceMeters: dist, type: amenity };
  }

  /* ── DT-42: matchear que candidato eligio Claude, por nombre exacto
     en el texto de respuesta. Fallback silencioso al primero. ── */
  function matchChosenPlace(text, candidates) {
    if (!text || !candidates || candidates.length === 0) return null;
    return candidates.find(c => c.tags?.name && text.includes(c.tags.name)) || null;
  }

  /* ── DT-42: NUCLEO GENERATIVO — arma contexto, llama a Claude,
     matchea el lugar elegido, y muestra la card. Si Claude falla o
     esta offline, showCareCard() cae sola al fallback estatico. ── */
  async function generateAndShowCard(type, lang, value, rawCandidates) {
    const meta = TRIGGER_META[type];

    const ctx = {
      city:  AppState.cityName || '',
      lang,
      temp:  (type === 'hot' || type === 'cold' || type === 'thirst')
               ? value
               : AppState.weather?.temp,
      km:    type === 'tired'  ? value
           : type === 'thirst' ? AppState.kmWalked
           : undefined,
      hour:  type === 'lunch' ? new Date().getHours() : undefined,
      count: type === 'special' ? value : undefined
    };

    const places = type === 'special'
      ? rawCandidates  // ya viene formateado por buildSpecialZonePlaces()
      : (meta.hasPlaceButton ? rawCandidates.map(formatOverpassCandidate) : []);

    let generatedText = null;
    if (typeof Narration !== 'undefined' &&
        typeof Narration.getCareMessage === 'function' &&
        !AppState.offline) {
      const genId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('care', `Care Worker call — ${type}`)
        : null;
      generatedText = await Narration.getCareMessage(type, places, ctx);
      if (genId) Debug.metricEnd(genId, generatedText ? 'ok' : 'error', { type });
    }

    _nearbyRest = meta.hasPlaceButton
      ? (matchChosenPlace(generatedText, rawCandidates) || rawCandidates[0] || null)
      : null;

    showCareCard(type, lang, value, generatedText);
  }

  /* ── MOSTRAR CARE CARD — DT-42: acepta texto generado opcional,
     que reemplaza msg.text del fallback estatico. Adapta botones
     segun si el trigger tiene lugar asociado (hasPlaceButton). ── */
  function showCareCard(type, lang, value, generatedText) {
    const careCard = document.getElementById('careCard');
    if (!careCard) return;

    const msgs    = MESSAGES[type];
    const langKey = msgs[lang] ? lang : 'es';
    const msg     = msgs[langKey](value);

    // DT-42: si Claude respondio, su texto reemplaza al fallback estatico.
    // Titulo y boton siguen siendo la etiqueta corta y fija de MESSAGES —
    // no hace falta que sean generativos, solo el cuerpo del mensaje.
    if (generatedText) msg.text = generatedText;

    const hasPlace = TRIGGER_META[type]?.hasPlaceButton && !!_nearbyRest;

    // Clase visual de lluvia se conserva — acento azul en vez de rojo
    careCard.classList.toggle('rain', type === 'rain');

    const title  = document.getElementById('careTitle');
    const badge  = document.getElementById('careBadge');
    const meta   = document.getElementById('careMeta');
    const text   = document.getElementById('careText');
    const btnAcc = document.getElementById('btnCareAccept');
    const btnDis = document.getElementById('btnCareDismiss');

    if (title) title.textContent = msg.title;
    if (text)  text.textContent  = msg.text;

    // Badge con distancia al lugar si lo encontramos, si no, clima
    if (badge) {
      if (hasPlace && AppState.gps) {
        const dist = GPS.distanceMeters(
          AppState.gps.lat, AppState.gps.lng,
          _nearbyRest.lat, _nearbyRest.lon
        );
        badge.textContent = `${Math.round(dist)}m`;
      } else {
        badge.textContent = AppState.weather ? `${AppState.weather.temp}°C` : '';
      }
    }

    // Meta con nombre del lugar — vacio si no hay lugar (thirst/special)
    if (meta) {
      meta.textContent = hasPlace ? (_nearbyRest?.tags?.name || 'lugar cercano') : '';
    }

    // Boton principal — centra mapa si hay lugar, si no, solo cierra
    if (btnAcc) {
      btnAcc.textContent = msg.btn;
      btnAcc.onclick     = hasPlace ? () => onAccept() : () => dismiss();
      btnAcc.style.display = '';
    }

    // Boton secundario — solo existe si hay lugar (par "Ir aqui / Seguir").
    // thirst y special usan un solo boton de cierre (msg.btn ya lo cubre).
    if (btnDis) {
      if (hasPlace) {
        btnDis.textContent   = lang === 'en' ? 'Keep going' : 'Seguir';
        btnDis.onclick       = () => dismiss();
        btnDis.style.display = '';
      } else {
        btnDis.style.display = 'none';
      }
    }

    // Ocultar care strip — la card ocupa su lugar
    const strip = document.getElementById('careStrip');
    if (strip) strip.classList.add('care-active');

    // Cambiar fase a descanso
    setPhase('rest');

    // Mostrar card
    careCard.classList.remove('hidden');

    // Registrar estado
    _suggestionShown = true;
    _lastSuggestion  = Date.now();
    if (type === 'thirst') _thirstShownThisWalk = true;
  }

  /* ── ACEPTAR — centrar mapa en el lugar ── */
  function onAccept() {
    if (_nearbyRest) {
      const map = GPS.getMap();
      if (map) {
        map.setView(
          [_nearbyRest.lat, _nearbyRest.lon],
          18,
          { animate: true, duration: 0.8 }
        );
      }
    }
    dismiss();
  }

  /* ── DESCARTAR ── */
  function dismiss() {
    const careCard = document.getElementById('careCard');
    if (careCard) {
      careCard.classList.add('hidden');
      careCard.classList.remove('rain');
    }

    // Restaurar botones a su estado por defecto (por si quedaron ocultos)
    const btnDis = document.getElementById('btnCareDismiss');
    if (btnDis) btnDis.style.display = '';

    // Restaurar care strip
    const strip = document.getElementById('careStrip');
    if (strip) strip.classList.remove('care-active');

    _suggestionShown = false;
    _nearbyRest      = null;

    // Volver a la fase correcta — 'alert' ya no existe como fase propia,
    // rain usa el mismo flujo systole/diastole que el resto de Care
    if (AppState.activePOI) {
      setPhase('diastole');
    } else {
      setPhase('systole');
    }
  }

  /* ── DT-42: reset de estado por caminata — llamar junto con el reset
     de AppState._walkChapters (DA-54, cierre de caminata) para que
     thirst pueda volver a dispararse en la caminata siguiente.
     PENDIENTE: cablear esta llamada en app.js donde se resetea
     _walkChapters — no se toco app.js en esta sesion. ── */
  function resetWalk() {
    _thirstShownThisWalk = false;
  }

  /* ── DT-43: ZONA ESPECIAL — densidad de POIs Wikipedia ──
     Se dispara cuando ≥3 POIs están a menos de 150m.
     Reset al moverse >200m desde donde se disparó por primera vez.
  ── */
  function checkSpecialZone(lat, lng) {
    if (_suggestionShown) return;
    if (AppState.phase === 'diastole') return;  // no interrumpir narración

    const now = Date.now();
    if (now - _lastSuggestion < CONFIG.COOLDOWN_MS) return;

    // Si ya disparó en esta zona, verificar si se alejaron lo suficiente para resetear
    if (_specialZoneTriggerPos) {
      if (typeof GPS === 'undefined') return;
      const moved = GPS.distanceMeters(lat, lng, _specialZoneTriggerPos.lat, _specialZoneTriggerPos.lng);
      if (moved < CONFIG.SPECIAL_ZONE_RESET) return;  // siguen en la zona
      _specialZoneTriggerPos = null;
    }

    const allPOIs = (typeof POI !== 'undefined') ? POI.getPOIs() : [];
    if (allPOIs.length === 0) return;

    if (typeof GPS === 'undefined') return;
    const nearbyCount = allPOIs.filter(p =>
      GPS.distanceMeters(lat, lng, p.lat, p.lng) <= CONFIG.SPECIAL_ZONE_RADIUS
    ).length;

    if (nearbyCount >= CONFIG.SPECIAL_ZONE_MIN) {
      _specialZoneTriggerPos = { lat, lng };
      const lang = Config.get('lang');
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Care: zona especial detectada — ${nearbyCount} POIs en ${CONFIG.SPECIAL_ZONE_RADIUS}m`);
      }
      triggerSuggestion('special', lang, nearbyCount);
    }
  }

  /* ── CHEQUEO PERIÓDICO ── */
  function check() {
    checkCareContext();
  }

  /* ── TEST FORZADO — para debug-sim.js ──
     Bypasea checkCareContext() por completo: no respeta cooldown de 20min,
     ni clima real, ni hora real. Llama triggerSuggestion() directo con
     valores de prueba razonables, para poder disparar cada trigger a
     demanda y medir latencia en ráfaga. NUNCA usar en producción. */
  function _testTrigger(type) {
    const lang = Config.get('lang');
    const testValues = {
      hot:     32,   // °C
      cold:    3,    // °C
      tired:   2.5,  // km
      lunch:   null, // MESSAGES.lunch() no usa valor
      special: 4,    // cantidad de POIs simulada
      rain:    null, // DT-42: MESSAGES.rain() no usa valor, weather.isRaining no se fuerza
      thirst:  26    // DT-42: temp dentro de la banda 22-29
    };

    if (!(type in testValues)) {
      if (typeof Debug !== 'undefined') {
        Debug.log('error', `Care: _testTrigger tipo desconocido '${type}'`);
      }
      return;
    }

    if (typeof Debug !== 'undefined') {
      Debug.log('info', `Care: test forzado — trigger '${type}'`);
    }
    triggerSuggestion(type, lang, testValues[type]);
  }

  /* ── INICIAR ── */
  function start() {
    // Primer chequeo tras 5 minutos de uso
    setTimeout(check, 5 * 60 * 1000);

    // Chequeos periódicos
    if (_checkTimer) clearInterval(_checkTimer);
    _checkTimer = setInterval(check, CONFIG.CHECK_INTERVAL);
  }

  /* ── DETENER ── */
  function stop() {
    if (_checkTimer) {
      clearInterval(_checkTimer);
      _checkTimer = null;
    }
    dismiss();
  }

  /* ── API PÚBLICA ── */
  return {
    start,
    stop,
    check,
    checkSpecialZone,
    dismiss,
    resetWalk,
    _testTrigger
  };

})();
