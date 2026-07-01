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
    }
  };
  // DT-42: los mensajes anteriores son placeholders estáticos.
  // Serán reemplazados por Care generativo (llamada a Claude) una vez
  // que el mini-prompt de Care esté validado en campo.

  /* ── EVALUAR CONTEXTO — DA-3 función única ── */
  function checkCareContext() {
    // No interrumpir si hay sugerencia activa
    if (_suggestionShown) return;

    // Respetar cooldown entre sugerencias
    const now = Date.now();
    if (now - _lastSuggestion < CONFIG.COOLDOWN_MS) return;

    // No sugerir durante narración activa
    if (AppState.phase === 'diastole') return;

    // No sugerir si ya hay alerta de lluvia
    if (AppState.phase === 'alert') return;

    const lang    = Config.get('lang');
    const weather = AppState.weather;
    const km      = AppState.kmWalked;
    const steps   = AppState.steps;
    const hour    = new Date().getHours();

    /* ── PRIORIDAD 1: Calor extremo ── */
    if (weather?.temp >= CONFIG.HOT_TEMP) {
      triggerSuggestion('hot', lang, weather.temp);
      return;
    }

    /* ── PRIORIDAD 2: Frío extremo ── */
    if (weather?.temp <= CONFIG.COLD_TEMP) {
      triggerSuggestion('cold', lang, weather.temp);
      return;
    }

    /* ── PRIORIDAD 3: Hora de almuerzo ── */
    if (hour >= CONFIG.HOUR_LUNCH_START && hour < CONFIG.HOUR_LUNCH_END && km > 1) {
      triggerSuggestion('lunch', lang);
      return;
    }

    /* ── PRIORIDAD 4: Cansancio por distancia ── */
    if (km >= CONFIG.MIN_KM_FOR_REST || steps >= CONFIG.MIN_STEPS_FOR_REST) {
      triggerSuggestion('tired', lang, km);
      return;
    }
  }

  /* ── DISPARAR SUGERENCIA ── */
  function triggerSuggestion(type, lang, value = null) {
    // Buscar lugar cercano primero
    findNearbyRestPlace(type, () => {
      showCareCard(type, lang, value);
    });
  }

  /* ── BUSCAR LUGAR CERCANO ── */
  function findNearbyRestPlace(type, callback) {
    if (!AppState.gps || AppState.offline) {
      callback();
      return;
    }

    const { lat, lng } = AppState.gps;

    // Tipo de lugar según el contexto
    const amenityMap = {
      tired:  'cafe|bar',
      hot:    'cafe|bar',
      cold:   'cafe|bar',
      lunch:  'restaurant|cafe'
    };

    const amenity = amenityMap[type] || 'cafe';
    const query   = `
      [out:json][timeout:8];
      (
        node["amenity"~"${amenity}"](around:${CONFIG.REST_SEARCH_RADIUS},${lat},${lng});
      );
      out 3;
    `;

    fetch('https://lz4.overpass-api.de/api/interpreter', {
      method: 'POST',
      body:   `data=${encodeURIComponent(query)}`
    })
    .then(r => r.json())
    .then(data => {
      const places = data.elements || [];
      _nearbyRest  = places.length > 0 ? places[0] : null;
      callback();
    })
    .catch(() => {
      _nearbyRest = null;
      callback();
    });
  }

  /* ── MOSTRAR CARE CARD ── */
  function showCareCard(type, lang, value) {
    const careCard = document.getElementById('careCard');
    if (!careCard) return;

    const msgs    = MESSAGES[type];
    const langKey = msgs[lang] ? lang : 'es';
    const msg     = msgs[langKey](value);

    // Limpiar clases anteriores
    careCard.classList.remove('rain');

    // Rellenar contenido
    const title  = document.getElementById('careTitle');
    const badge  = document.getElementById('careBadge');
    const meta   = document.getElementById('careMeta');
    const text   = document.getElementById('careText');
    const btnAcc = document.getElementById('btnCareAccept');
    const btnDis = document.getElementById('btnCareDismiss');

    if (title) title.textContent = msg.title;
    if (text)  text.textContent  = msg.text;

    // Badge con distancia al lugar si lo encontramos
    if (badge) {
      if (_nearbyRest && AppState.gps) {
        const dist = GPS.distanceMeters(
          AppState.gps.lat, AppState.gps.lng,
          _nearbyRest.lat, _nearbyRest.lon
        );
        badge.textContent = `${Math.round(dist)}m`;
      } else {
        badge.textContent = AppState.weather
          ? `${AppState.weather.temp}°C`
          : '';
      }
    }

    // Meta con nombre del lugar
    if (meta) {
      meta.textContent = _nearbyRest?.tags?.name || 'lugar cercano';
    }

    // Botón aceptar
    if (btnAcc) {
      btnAcc.textContent = msg.btn;
      btnAcc.onclick     = () => onAccept();
    }

    // Botón dismissar
    if (btnDis) {
      btnDis.textContent = lang === 'en' ? 'Keep going' : 'Seguir';
      btnDis.onclick     = () => dismiss();
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
    if (careCard) careCard.classList.add('hidden');

    // Restaurar care strip
    const strip = document.getElementById('careStrip');
    if (strip) strip.classList.remove('care-active');

    _suggestionShown = false;
    _nearbyRest      = null;

    // Volver a la fase correcta
    if (AppState.activePOI) {
      setPhase('diastole');
    } else {
      setPhase('systole');
    }
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
    dismiss
  };

})();
