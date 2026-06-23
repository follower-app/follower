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
  mood:        'epic',
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
  narrationStyleLabel: 'Cuentero',

  // ── Métricas de ritmo cinematográfico ──
  _phaseStart:        null,   // timestamp (performance.now) del inicio de la fase actual
  _msTotalSystole:    0,      // ms acumulados en sístole (caminando)
  _msTotalDiastole:   0,      // ms acumulados en diástole (narrando)
  _lastNarrationTs:   null,   // timestamp de la última narración disparada
  _narrationCount:    0,      // total de narraciones en la sesión
  _sessionStart:      null,   // timestamp de inicio de sesión (primer GPS fix)
  _firstNarrationTs:  null,   // timestamp de la primera narración (para "tiempo hasta primera narración")
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

/* ── ACTUALIZAR LISTA DE HISTORIAS CERCANAS ── */
function updateHistCount() {
  const list = document.getElementById('barNearbyList');
  if (!list) return;

  const nearby = AppState.nearbyPOIs || [];
  const sorted = [...nearby]
    .sort((a, b) => (a._distanceMeters || 999) - (b._distanceMeters || 999))
    .slice(0, 3);

  if (sorted.length === 0) {
    list.innerHTML = `<div class="bar-nearby-empty">buscando historias...</div>`;
    return;
  }

  const OSM_ICONS = {
    historic: '🏛️', museum: '🖼️', church: '⛪', castle: '🏰',
    ruins: '🏚️', monument: '🗿', fountain: '⛲', artwork: '🎨',
    viewpoint: '🔭', archaeological: '⚱️', tourism: '📍', amenity: '☕',
    park: '🌳', default: '📍'
  };

  list.innerHTML = sorted.map(poi => {
    const icon     = OSM_ICONS[poi.type] || OSM_ICONS.default;
    const dist     = poi._distanceMeters ? `${poi._distanceMeters}m` : '';
    const isActive = AppState.activePOI?.id === poi.id;
    return `<div class="bar-nearby-item${isActive ? ' active-poi' : ''}"
                 onclick="POI.activateFromBar('${poi.id}')">
      <span class="bar-nearby-icon">${icon}</span>
      <span class="bar-nearby-name">${poi.name}</span>
      <span class="bar-nearby-dist">${dist}</span>
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

  const msgs = [
    'iniciando...',
    'obteniendo ubicación...',
    'cargando puntos históricos...',
    'preparando tu soundtrack...',
    'casi listo...'
  ];

  let pct = 0;

  // Pedir permiso GPS en paralelo con la animación del splash
  const gpsPromise = requestGPSPermission();

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

  clearInterval(iv);

  // Completar barra
  if (fill)  fill.style.width = '100%';
  if (label) label.textContent = gpsOk ? 'listo ✓' : 'continuando sin GPS...';

  setTimeout(() => expandHeart(heart), 400);
}

function expandHeart(heart) {
  if (!heart) return;
  heart.classList.add('expanding');

  setTimeout(() => {
    const splash = document.getElementById('screen-splash');
    if (splash) splash.classList.add('fade-out');
  }, 550);

  setTimeout(() => {
    if (Config.isFirstTime()) {
      // Primera vez — mostrar config completa
      showModal('config');
    } else {
      // Sesión anterior — ir directo a exploración con config guardada
      AppState.lang = Config.get('lang');
      AppState.mood = Config.get('mood');
      AppState.mode = Config.get('mode');
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

  // Marcar inicio de sesión — base para "tiempo hasta primera narración"
  AppState._sessionStart = performance.now();
  AppState._phaseStart   = performance.now();
  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Sesión iniciada — tracking de fases activo');
  }

  // GPS ya tiene permiso — solo iniciar el watch continuo
  if (typeof GPS !== 'undefined') GPS.start();

  // Iniciar música
  if (typeof Music !== 'undefined') Music.play(Config.get('mood'));

  // Iniciar clima
  if (typeof Weather !== 'undefined') Weather.start();

  // Iniciar cuidado contextual
  if (typeof Care !== 'undefined') Care.start();
}

/* ── EVENT LISTENERS — CONFIG MODAL ── */
function initConfigModal() {
  // Preseleccionar valores guardados
  const savedLang = Config.get('lang');
  const savedMood = Config.get('mood');

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

  // Cards de mood
  const moodCards = document.querySelectorAll('#moodCards .mood-card');
  moodCards.forEach(card => {
    if (card.dataset.value === savedMood) card.classList.add('active');
    else card.classList.remove('active');
    card.addEventListener('click', () => {
      moodCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      AppState.mood = card.dataset.value;
    });
  });

  // Botón comenzar
  const btnStart = document.getElementById('btnStartExplore');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      Config.setLang(AppState.lang);
      Config.setMood(AppState.mood);
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
  storyteller: 'Cuentero',
  historian:   'Historiador',
  poet:        'Poeta',
  detective:   'Detective',
};

function initStyleSelector() {
  const selector  = document.getElementById('styleSelector');
  const styleBtn  = document.getElementById('btnStyleSelector');
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
      const mood  = card.dataset.mood || 'epic';

      AppState.narrationStyle      = style;
      AppState.narrationStyleLabel = STYLE_LABELS[style] || style;
      AppState.mood                = mood;
      Config.setMood(mood);

      styleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const nameEl = document.getElementById('barStyleName');
      const lblEl  = document.getElementById('barStyleLbl');
      if (nameEl) nameEl.textContent = AppState.narrationStyleLabel;
      if (lblEl)  lblEl.textContent  = AppState.narrationStyleLabel;

      if (typeof Music !== 'undefined') Music.changeMood(mood);
      selector?.classList.add('hidden');

      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Estilo cambiado: ${AppState.narrationStyleLabel} · mood=${mood}`);
      }
    });
  });
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
    // Restaurar icono de pausa
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
  AppState.lang = Config.get('lang');
  AppState.mood = Config.get('mood');
  AppState.mode = Config.get('mode');

  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  AppState.offline = !navigator.onLine;

  initConfigModal();
  initModeModal();
  initExploreListeners();

  runSplash();
}

document.addEventListener('DOMContentLoaded', init);
