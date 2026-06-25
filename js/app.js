/* ═══════════════════════════════════════════
   FOLLOWER — app.js
   AppState central, router de pantallas,
   setPhase, inicialización de la app
   ═══════════════════════════════════════════ */

/* ── APP STATE — fuente de verdad ── */
const AppState = {
  screen:      'splash',
  phase:       'systole',
  mode:        'free',
  lang:        'es',
  gps:         null,
  nearbyPOIs:  [],
  activePOI:   null,
  activeRoute: null,
  offline:     false,
  steps:       0,
  kmWalked:    0,
  poisVisited: 0,
  weather:     null,
  cityName:    '',
  narrationStyle:      'storyteller',
  narrationStyleLabel: 'Storyteller',

  // ── Bienvenida de ciudad ──
  _cityWelcomeDone: false,

  // ── Métricas de ritmo cinematográfico ──
  _phaseStart:        null,
  _msTotalSystole:    0,
  _msTotalDiastole:   0,
  _lastNarrationTs:   null,
  _narrationCount:    0,
  _sessionStart:      null,
  _firstNarrationTs:  null,
};

/* ── ROUTER — cambiar pantalla ── */
function navigateTo(screenId) {
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('active');
    current.classList.add('hidden');
  }
  const next = document.getElementById(`screen-${screenId}`);
  if (!next) {
    console.warn(`navigateTo: pantalla "${screenId}" no encontrada`);
    return;
  }
  next.classList.remove('hidden');
  next.classList.add('active');
  AppState.screen = screenId;

  // Debug bar y care strip solo visibles en la pantalla de exploración
  const onExplore = screenId === 'explore';
  const dbgBar = document.getElementById('dbg-bar');
  const dbgPanel = document.getElementById('dbg-panel');
  if (dbgBar)  dbgBar.style.display  = onExplore ? 'flex' : 'none';
  if (dbgPanel && !onExplore) dbgPanel.classList.add('hidden');
}

/* ── SET PHASE — sístole / diástole ── */
function setPhase(phase) {
  const valid = ['systole', 'diastole', 'rest', 'alert'];
  if (!valid.includes(phase)) {
    console.warn(`setPhase: fase inválida "${phase}"`);
    return;
  }

  // Acumular tiempo en la fase que termina
  const now = performance.now();
  if (AppState._phaseStart !== null && AppState.phase !== phase) {
    const elapsed = now - AppState._phaseStart;
    if (AppState.phase === 'systole')  AppState._msTotalSystole  += elapsed;
    if (AppState.phase === 'diastole') AppState._msTotalDiastole += elapsed;

    // Detectar silencios largos — más de 5min en sístole sin narración
    if (AppState.phase === 'systole' && elapsed > 5 * 60 * 1000) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `Silencio largo: ${Math.round(elapsed / 1000)}s sin narración`);
      }
    }
  }
  AppState._phaseStart = now;

  valid.forEach(p => document.body.classList.remove(`phase-${p}`));
  document.body.classList.add(`phase-${phase}`);
  AppState.phase = phase;
  updateExplorePhase(phase);
}

/* ── MODALES ── */
function showModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.offsetHeight; // forzar reflow
  modal.classList.add('visible');
}

function hideModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 500);
}

/* ── ACTUALIZAR CARE STRIP ── */
function updateCareStrip() {
  const weather = AppState.weather;
  const iconEl  = document.getElementById('csWeatherIcon');
  const valEl   = document.getElementById('csWeatherVal');

  if (iconEl && valEl) {
    if (weather) {
      const icon = weather.temp >= 30 ? '☀️'
                 : weather.temp <= 5  ? '🥶'
                 : weather.description?.includes('rain') ? '🌧️'
                 : '🌤️';
      iconEl.textContent = icon;
      valEl.textContent  = `${Math.round(weather.temp)}°`;
      valEl.classList.toggle('alert', weather.temp >= 30 || weather.temp <= 5);
    } else {
      iconEl.textContent = '🌤️';
      valEl.textContent  = '--°';
      valEl.classList.remove('alert');
    }
  }

  const stepsEl = document.getElementById('csStepsVal');
  if (stepsEl) {
    stepsEl.textContent = AppState.steps > 0
      ? `${AppState.steps.toLocaleString()} pasos`
      : '0 pasos';
  }

  const kmEl = document.getElementById('csKmVal');
  if (kmEl) kmEl.textContent = `${AppState.kmWalked.toFixed(1)} km`;
}

/* ── ACTUALIZAR FASE EN BOTTOM BAR ── */
function updateExplorePhase(phase) {
  const barSys = document.getElementById('barSystole');
  const barDia = document.getElementById('barDiastole');
  if (!barSys || !barDia) return;

  if (phase === 'diastole') {
    barSys.classList.add('hidden');
    barDia.classList.remove('hidden');
  } else {
    barSys.classList.remove('hidden');
    barDia.classList.add('hidden');
  }
}

/* ── ACTUALIZAR PILL DERECHO + NEARBY SELECTOR ── */
function updateHistCount() {
  const nearby = AppState.nearbyPOIs || [];
  const sorted = [...nearby]
    .sort((a, b) => (a._distanceMeters || 999) - (b._distanceMeters || 999))
    .slice(0, 5);

  const OSM_ICONS = {
    historic: '🏛️', museum: '🖼️', church: '⛪', castle: '🏰',
    ruins: '🏚️', monument: '🗿', fountain: '⛲', artwork: '🎨',
    viewpoint: '🔭', archaeological: '⚱️', tourism: '📍',
    amenity: '☕', park: '🌳', default: '📍'
  };

  // Pill derecho — muestra el más cercano
  const iconEl = document.getElementById('barNextIcon');
  const nameEl = document.getElementById('barNextName');
  if (iconEl && nameEl) {
    if (sorted.length === 0) {
      iconEl.textContent = '📍';
      nameEl.textContent = 'buscando';
      nameEl.classList.add('muted');
    } else {
      const closest = sorted[0];
      iconEl.textContent = OSM_ICONS[closest.type] || OSM_ICONS.default;
      nameEl.textContent = closest.name;
      nameEl.classList.remove('muted');
    }
  }

  // Nearby selector list
  const listEl = document.getElementById('nearbySelectorList');
  if (!listEl) return;

  if (sorted.length === 0) {
    listEl.innerHTML = `<div class="style-card" style="justify-content:center;">
      <span style="font-size:11px;color:var(--color-smoke-2);">Sin historias cercanas por ahora</span>
    </div>`;
    return;
  }

  listEl.innerHTML = sorted.map(poi => {
    const icon     = OSM_ICONS[poi.type] || OSM_ICONS.default;
    const dist     = poi._distanceMeters ? `· ${poi._distanceMeters}m` : '';
    const isActive = AppState.activePOI?.id === poi.id;
    return `<div class="style-card${isActive ? ' active' : ''}"
                 onclick="POI.activateFromBar('${poi.id}');document.getElementById('nearbySelector').classList.add('hidden');">
      <div class="style-emoji">${icon}</div>
      <div class="style-info">
        <div class="style-name">${poi.name}</div>
        <div class="style-desc">${poi.type || 'historia'} ${dist}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── ACTUALIZAR STATS ── */
function updateStats() {
  updateHistCount();
  updateCareStrip();
}

/* ── CONECTIVIDAD ── */
function handleOnline()  { AppState.offline = false; updateTopPill(); }
function handleOffline() { AppState.offline = true;  updateTopPill(); }

/* ── PEDIR PERMISO GPS — necesario en iOS antes de cualquier interacción ── */
function requestGPSPermission() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Guardar posición inicial en AppState
        AppState.gps = {
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        resolve(true);
      },
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/* ── SPLASH — progreso de carga ── */
async function runSplash() {
  const fill   = document.getElementById('progressFill');
  const label  = document.getElementById('progressLabel');
  const heart  = document.getElementById('heartSvg');

  // Métrica: tiempo total de arranque
  const splashId = (typeof Debug !== 'undefined')
    ? Debug.metricStart('app', 'arranque → exploración lista')
    : null;

  const msgs = [
    'iniciando...',
    'obteniendo ubicación...',
    'cargando puntos históricos...',
    'preparando tu soundtrack...',
    'casi listo...'
  ];

  let pct = 0;

  // Pedir permiso GPS en paralelo con la animación del splash
  const gpsStartTs  = performance.now();
  const gpsPromise  = requestGPSPermission();

  const iv = setInterval(() => {
    // Avanzar más lento al llegar a 80% — esperar GPS
    const increment = pct < 80
      ? Math.random() * 16 + 7
      : Math.random() * 4 + 1;

    pct += increment;
    if (pct > 95) pct = 95; // No llegar al 100% hasta tener GPS

    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = msgs[
      Math.min(Math.floor((pct / 100) * msgs.length), msgs.length - 1)
    ];
  }, 480);

  // Esperar GPS (máximo 8 segundos)
  const gpsOk = await Promise.race([
    gpsPromise,
    new Promise(resolve => setTimeout(() => resolve(false), 8000))
  ]);

  const gpsDurationMs = Math.round(performance.now() - gpsStartTs);

  if (typeof Debug !== 'undefined') {
    Debug.log(
      gpsOk ? 'info' : 'warn',
      `GPS arranque: ${gpsOk ? 'concedido' : 'denegado/timeout'} · ${gpsDurationMs}ms`
    );
  }

  clearInterval(iv);

  // Completar barra
  if (fill)  fill.style.width = '100%';
  if (label) label.textContent = gpsOk ? 'listo ✓' : 'continuando sin GPS...';

  setTimeout(() => expandHeart(heart, splashId), 400);
}

function expandHeart(heart, splashId) {
  if (!heart) return;
  heart.classList.add('expanding');

  setTimeout(() => {
    const splash = document.getElementById('screen-splash');
    if (splash) splash.classList.add('fade-out');
  }, 550);

  setTimeout(() => {
    if (Config.isFirstTime()) {
      // Primera vez — mostrar config completa
      if (splashId) Debug.metricEnd(splashId, 'first-time');
      showModal('config');
    } else {
      // Sesión anterior — ir directo a exploración con config guardada
      AppState.lang           = Config.get('lang');
      AppState.narrationStyle = Config.get('narrator');
      AppState.narrationStyleLabel = STYLE_LABELS[AppState.narrationStyle] || AppState.narrationStyle;
      AppState.mode           = Config.get('mode');
      if (splashId) Debug.metricEnd(splashId, 'returning-user');
      navigateTo('explore');
      initExplore();
    }
  }, 720);
}

/* ── INICIALIZAR EXPLORACIÓN ── */
function initExplore() {
  setPhase('systole');
  updateCareStrip();
  updateStats();
  initCompass();

  // Marcar inicio de sesión — base para "tiempo hasta primera narración"
  AppState._sessionStart = performance.now();
  AppState._phaseStart   = performance.now();
  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Sesión iniciada — tracking de fases activo');
  }

  // GPS ya tiene permiso — solo iniciar el watch continuo
  if (typeof GPS !== 'undefined') GPS.start();

  // Iniciar clima
  if (typeof Weather !== 'undefined') Weather.start();

  // Iniciar cuidado contextual
  if (typeof Care !== 'undefined') Care.start();
}

/* ── BIENVENIDA DE CIUDAD — texto sobre el mapa, una vez por sesión ── */
function welcomeCity(city) {
  if (AppState._cityWelcomeDone) return;
  AppState._cityWelcomeDone = true;

  const style = AppState.narrationStyle || 'storyteller';
  const lang  = AppState.lang || 'es';

  let text = city;
  if (typeof Narration !== 'undefined' && typeof Narration.getCityWelcome === 'function') {
    text = Narration.getCityWelcome(city, style, lang);
  }

  const el = document.getElementById('cityWelcome');
  if (!el) return;

  el.textContent = text;
  // Quitar hidden primero, luego en el siguiente frame añadir visible
  // (si se hace en el mismo frame, la transición de opacity no funciona)
  el.classList.remove('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('visible');
    });
  });

  if (typeof Debug !== 'undefined') {
    Debug.log('info', `Bienvenida ciudad: "${text}" · narrador=${style}`);
  }

  // Auto-cerrar a los 5 segundos
  const autoClose = setTimeout(() => dismissCityWelcome(el), 5000);

  // Tap para cerrar antes
  el.addEventListener('click', () => {
    clearTimeout(autoClose);
    dismissCityWelcome(el);
  }, { once: true });
}

function dismissCityWelcome(el) {
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.classList.add('hidden'), 600);
}

/* ── EVENT LISTENERS — CONFIG MODAL ── */
function initConfigModal() {
  // Preseleccionar valores guardados
  const savedLang     = Config.get('lang');
  const savedNarrator = Config.get('narrator');

  // Pills de idioma
  const langPills = document.querySelectorAll('#langPills .pill');
  langPills.forEach(pill => {
    if (pill.dataset.value === savedLang) pill.classList.add('active');
    else pill.classList.remove('active');
    pill.addEventListener('click', () => {
      langPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.lang = pill.dataset.value;
    });
  });

  // Cards de narrador
  const narratorCards = document.querySelectorAll('#narratorCards .narrator-card');
  narratorCards.forEach(card => {
    if (card.dataset.value === savedNarrator) card.classList.add('active');
    else card.classList.remove('active');
    card.addEventListener('click', () => {
      narratorCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      AppState.narrationStyle = card.dataset.value;
    });
  });

  // Botón comenzar
  const btnStart = document.getElementById('btnStartExplore');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      Config.setLang(AppState.lang);
      Config.setNarrator(AppState.narrationStyle);
      // Inicializar AudioContext desde gesto del usuario (requerido en iOS Safari)
      if (typeof Music !== 'undefined' && typeof Music.initFromGesture === 'function') {
        Music.initFromGesture();
      }
      hideModal('config');
      setTimeout(() => showModal('mode'), 300);
    });
  }
}

/* ── EVENT LISTENERS — MODE MODAL ── */
function initModeModal() {
  const btnFree = document.getElementById('btnModeFree');
  if (btnFree) {
    btnFree.addEventListener('click', () => {
      Config.setMode('free');
      AppState.mode = 'free';
      hideModal('mode');
      setTimeout(() => {
        navigateTo('explore');
        initExplore();
      }, 300);
    });
  }

  const btnRoute = document.getElementById('btnModeRoute');
  if (btnRoute) {
    btnRoute.addEventListener('click', () => {
      Config.setMode('route');
      AppState.mode = 'route';
      hideModal('mode');
      setTimeout(() => {
        navigateTo('explore');
        initExplore();
        if (typeof Routes !== 'undefined') Routes.showPicker();
      }, 300);
    });
  }
}

/* ── STYLE SELECTOR ── */
const STYLE_LABELS = {
  storyteller: 'Storyteller',
  historian:   'Historiador',
  explorer:    'Explorador',
  local:       'Local',
};

function initStyleSelector() {
  const selector   = document.getElementById('styleSelector');
  const styleBtn   = document.getElementById('btnStyleSelector');
  const styleCards = document.querySelectorAll('.style-card');

  if (styleBtn && selector) {
    styleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('hidden');
    });
  }

  // Cerrar al tocar el mapa
  document.getElementById('map')?.addEventListener('click', () => {
    selector?.classList.add('hidden');
  });

  styleCards.forEach(card => {
    card.addEventListener('click', () => {
      const style = card.dataset.style;

      AppState.narrationStyle      = style;
      AppState.narrationStyleLabel = STYLE_LABELS[style] || style;
      Config.setNarrator(style);

      styleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const nameEl = document.getElementById('barStyleName');
      const lblEl  = document.getElementById('barStyleLbl');
      if (nameEl) nameEl.textContent = AppState.narrationStyleLabel;
      if (lblEl)  lblEl.textContent  = AppState.narrationStyleLabel;

      selector?.classList.add('hidden');

      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Narrador cambiado: ${AppState.narrationStyleLabel}`);
      }
    });
  });
}

/* ── BRÚJULA — lógica de 3 estados ── */

let _compassActive    = false;
let _compassHeading   = 0;
let _orientationCb    = null;

function initCompass() {
  const btn = document.getElementById('btnCompass');
  if (!btn) return;
  btn.addEventListener('click', _onCompassTap);
}

function _onCompassTap() {
  if (_compassActive) {
    _deactivateCompass();
  } else {
    _compassBeat(() => _requestCompassPermission());
  }
}

/* Fase 1 — latido (~450ms) */
function _compassBeat(callback) {
  const btn = document.getElementById('btnCompass');
  if (!btn) { callback(); return; }

  // Ring exterior
  const ring = document.createElement('div');
  ring.className = 'compass-pulse-ring';
  btn.appendChild(ring);

  // Clase para animar el corazón
  btn.classList.add('beating');

  setTimeout(() => {
    btn.classList.remove('beating');
    ring.remove();
    callback();
  }, 450);
}

/* Fase 2 — pedir permiso iOS 13+ y activar */
function _requestCompassPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === 'granted') {
          _activateCompass();
        } else {
          if (typeof Debug !== 'undefined') {
            Debug.log('warn', 'Brújula: permiso de orientación denegado por el usuario');
          }
        }
      })
      .catch(err => {
        if (typeof Debug !== 'undefined') {
          Debug.log('error', `Brújula: error solicitando permiso — ${err.message}`);
        }
      });
  } else {
    // Android / Chrome desktop
    _activateCompass();
  }
}

/* Fase 3 — activar rotación real */
function _activateCompass() {
  const btn = document.getElementById('btnCompass');
  if (btn) btn.classList.add('active');
  _compassActive = true;

  _orientationCb = (e) => {
    let heading = 0;
    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      heading = e.webkitCompassHeading;          // iOS — grados desde norte, clockwise
    } else if (e.alpha !== null) {
      heading = (360 - e.alpha) % 360;           // Android — invertir
    }
    _compassHeading = heading;
    _updateCompassNeedle(heading);
    if (typeof GPS !== 'undefined') GPS.updateHeadingCone(heading);
  };

  window.addEventListener('deviceorientation', _orientationCb, true);
  if (typeof GPS !== 'undefined') GPS.showHeadingCone(true);

  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Brújula activada — escuchando DeviceOrientationEvent');
  }
}

function _deactivateCompass() {
  const btn = document.getElementById('btnCompass');
  if (btn) btn.classList.remove('active');
  _compassActive = false;

  if (_orientationCb) {
    window.removeEventListener('deviceorientation', _orientationCb, true);
    _orientationCb = null;
  }

  // Aguja vuelve al norte
  _updateCompassNeedle(0);
  if (typeof GPS !== 'undefined') GPS.showHeadingCone(false);

  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Brújula desactivada');
  }
}

/* Rotar la aguja SVG: -heading para que siempre apunte al norte */
function _updateCompassNeedle(heading) {
  const needle = document.getElementById('compassNeedle');
  if (needle) needle.style.transform = `rotate(${-heading}deg)`;
}

/* ── EVENT LISTENERS — EXPLORACIÓN ── */
function initExploreListeners() {
  // Tap en nombre del POI en diástole → pantalla expandida
  document.getElementById('barPoiName')?.addEventListener('click', () => {
    if (AppState.activePOI) {
      navigateTo('poi');
      if (typeof POI !== 'undefined') POI.renderExpanded(AppState.activePOI);
    }
  });

  // Volver desde POI expandido
  document.getElementById('btnBackFromPOI')?.addEventListener('click', () => {
    navigateTo('explore');
  });

  // Continuar narración desde pantalla POI
  document.getElementById('btnContinueNarration')?.addEventListener('click', () => {
    navigateTo('explore');
    if (typeof Narration !== 'undefined') Narration.resume();
  });

  // Pill derecho — abrir lista de historias cercanas
  const btnNearby    = document.getElementById('btnNearbyStories');
  const nearbySelect = document.getElementById('nearbySelector');
  if (btnNearby && nearbySelect) {
    btnNearby.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cerrar style selector si está abierto
      document.getElementById('styleSelector')?.classList.add('hidden');
      nearbySelect.classList.toggle('hidden');
    });
  }

  // Cerrar nearby selector al tocar el mapa
  document.getElementById('map')?.addEventListener('click', () => {
    nearbySelect?.classList.add('hidden');
  });

  // Corazón-brújula — centrar mapa
  document.getElementById('btnCenter')?.addEventListener('click', () => {
    if (AppState.gps && typeof GPS !== 'undefined') GPS.centerMap();
  });

  // Pausar / reanudar narración
  let _narrPaused = false;
  const btnPause  = document.getElementById('btnPauseNarration');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (typeof Narration === 'undefined') return;
      if (_narrPaused) {
        Narration.resume();
        _narrPaused = false;
        btnPause.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2.5" y="2" width="3.5" height="10" rx="1" fill="#5dade2"/>
          <rect x="8"   y="2" width="3.5" height="10" rx="1" fill="#5dade2"/>
        </svg>`;
        btnPause.setAttribute('aria-label', 'Pausar narración');
      } else {
        Narration.pause();
        _narrPaused = true;
        btnPause.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <polygon points="3,2 11,7 3,12" fill="#5dade2"/>
        </svg>`;
        btnPause.setAttribute('aria-label', 'Reanudar narración');
      }
    });
  }

  // Detener narración
  document.getElementById('btnStopNarration')?.addEventListener('click', () => {
    if (typeof Narration !== 'undefined') Narration.stop();
    AppState.activePOI = null;
    _narrPaused = false;
    if (btnPause) {
      btnPause.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2.5" y="2" width="3.5" height="10" rx="1" fill="#5dade2"/>
        <rect x="8"   y="2" width="3.5" height="10" rx="1" fill="#5dade2"/>
      </svg>`;
      btnPause.setAttribute('aria-label', 'Pausar narración');
    }
    setPhase('systole');
  });

  initStyleSelector();
}

/* ── INIT PRINCIPAL ── */
function init() {
  AppState.lang            = Config.get('lang');
  AppState.narrationStyle  = Config.get('narrator');
  AppState.narrationStyleLabel = STYLE_LABELS[AppState.narrationStyle] || AppState.narrationStyle;
  AppState.mode            = Config.get('mode');

  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  AppState.offline = !navigator.onLine;

  initConfigModal();
  initModeModal();
  initExploreListeners();

  // Sincronizar label del pill con el narrador ya guardado en Config
  const nameEl = document.getElementById('barStyleName');
  const lblEl  = document.getElementById('barStyleLbl');
  const iconEl = document.getElementById('barStyleIcon');
  const STYLE_ICONS = { storyteller: '🎭', historian: '🏛️', explorer: '🔎', local: '❤️' };
  if (nameEl) nameEl.textContent = AppState.narrationStyleLabel;
  if (lblEl)  lblEl.textContent  = AppState.narrationStyleLabel;
  if (iconEl) iconEl.textContent = STYLE_ICONS[AppState.narrationStyle] || '🎭';

  runSplash();
}

document.addEventListener('DOMContentLoaded', init);
