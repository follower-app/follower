/* ═══════════════════════════════════════════
   FOLLOWER — app.js
   AppState central, router de pantallas,
   setPhase, inicialización de la app
   ═══════════════════════════════════════════ */

/* ── APP STATE — fuente de verdad ── */
const AppState = {
  screen:      'splash',    // pantalla activa
  phase:       'systole',   // systole | diastole | rest | alert
  mode:        'free',      // free | route
  mood:        'epic',      // epic | romantic | mystery | curious
  lang:        'es',        // idioma
  gps:         null,        // { lat, lng, accuracy }
  nearbyPOIs:  [],          // POIs en radio activo
  activePOI:   null,        // POI actualmente en narración
  activeRoute: null,        // recorrido activo (modo route)
  offline:     false,       // estado de conectividad
  steps:       0,           // pasos acumulados
  kmWalked:    0,           // kilómetros recorridos
  poisVisited: 0,           // POIs visitados en esta sesión
  weather:     null,        // { temp, condition, rain }
  cityName:    ''           // nombre de la ciudad detectada
};

/* ── ROUTER — cambiar pantalla ── */
function navigateTo(screenId) {
  // Ocultar pantalla actual
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('active');
    current.classList.add('hidden');
  }

  // Mostrar nueva pantalla
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

  // Remover fase anterior del body
  valid.forEach(p => document.body.classList.remove(`phase-${p}`));

  // Aplicar nueva fase
  document.body.classList.add(`phase-${phase}`);
  AppState.phase = phase;

  // Actualizar top pill mood color
  updateTopPillPhase(phase);
}

/* ── MODALES ── */
function showModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  modal.classList.remove('hidden');
  // Forzar reflow para que la transición funcione
  modal.offsetHeight;
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

/* ── ACTUALIZAR TOP PILL ── */
function updateTopPill() {
  const cityEl = document.getElementById('topCity');
  const moodEl = document.getElementById('topMood');
  const pill   = document.querySelector('.top-pill');

  if (cityEl) cityEl.textContent = AppState.cityName || 'Explorando...';
  if (moodEl) moodEl.textContent = Config.getMoodLabel();
  if (pill)   pill.classList.toggle('offline', AppState.offline);
}

function updateTopPillPhase(phase) {
  const moodEl = document.getElementById('topMood');
  if (!moodEl) return;
  // El color lo maneja CSS via body.phase-*
  // Aquí solo actualizamos el texto si cambia el estado
  if (phase === 'rest') {
    moodEl.textContent = '☕ descansando';
  } else if (phase === 'alert') {
    moodEl.textContent = '🌧️ lluvia';
  } else {
    moodEl.textContent = Config.getMoodLabel();
  }
}

/* ── ACTUALIZAR STATS ── */
function updateStats() {
  const kmEl   = document.getElementById('statKm');
  const poisEl = document.getElementById('statPOIs');
  if (kmEl)   kmEl.textContent   = AppState.kmWalked.toFixed(1);
  if (poisEl) poisEl.textContent = AppState.poisVisited;
}

/* ── CONECTIVIDAD ── */
function handleOnline() {
  AppState.offline = false;
  updateTopPill();
  console.log('App: conexión recuperada');
}

function handleOffline() {
  AppState.offline = true;
  updateTopPill();
  console.log('App: sin conexión — modo offline');
}

/* ── SPLASH — progreso de carga ── */
function runSplash() {
  const fill   = document.getElementById('progressFill');
  const label  = document.getElementById('progressLabel');
  const heart  = document.getElementById('heartSvg');

  const msgs = [
    'iniciando...',
    `cargando ${AppState.cityName || 'tu ciudad'}...`,
    'buscando puntos históricos...',
    'preparando tu soundtrack...',
    'casi listo...'
  ];

  let pct = 0;

  const iv = setInterval(() => {
    pct += Math.random() * 16 + 7;
    if (pct > 100) pct = 100;

    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = msgs[
      Math.min(Math.floor((pct / 100) * msgs.length), msgs.length - 1)
    ];

    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(() => expandHeart(heart), 350);
    }
  }, 480);
}

function expandHeart(heart) {
  if (!heart) return;
  heart.classList.add('expanding');

  setTimeout(() => {
    const splash = document.getElementById('screen-splash');
    if (splash) splash.classList.add('fade-out');
  }, 550);

  setTimeout(() => {
    // Primera vez → mostrar config
    // Veces siguientes → ir directo al mapa
    if (Config.isFirstTime()) {
      showModal('config');
    } else {
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
  updateTopPill();
  updateStats();

  // Iniciar GPS
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
  // Pills de idioma
  const langPills = document.querySelectorAll('#langPills .pill');
  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      langPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.lang = pill.dataset.value;
    });
  });

  // Cards de mood
  const moodCards = document.querySelectorAll('#moodCards .mood-card');
  moodCards.forEach(card => {
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
      // Guardar config
      Config.setLang(AppState.lang);
      Config.setMood(AppState.mood);

      hideModal('config');

      // Mostrar selección de modo
      setTimeout(() => showModal('mode'), 300);
    });
  }
}

/* ── EVENT LISTENERS — MODE MODAL ── */
function initModeModal() {
  const btnFree = document.getElementById('btnModeFreee');
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
        // Mostrar selector de recorridos
        if (typeof Routes !== 'undefined') Routes.showPicker();
      }, 300);
    });
  }
}

/* ── EVENT LISTENERS — EXPLORACIÓN ── */
function initExploreListeners() {
  // Tap en card POI pequeña → expandir
  const poiCard = document.getElementById('poiCard');
  if (poiCard) {
    poiCard.addEventListener('click', () => {
      if (AppState.activePOI) {
        navigateTo('poi');
        if (typeof POI !== 'undefined') POI.renderExpanded(AppState.activePOI);
      }
    });
  }

  // Botón volver desde POI expandido
  const btnBack = document.getElementById('btnBackFromPOI');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      navigateTo('explore');
    });
  }

  // Botón continuar narrando
  const btnContinue = document.getElementById('btnContinueNarration');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      navigateTo('explore');
      if (typeof Narration !== 'undefined') Narration.resume();
    });
  }

  // Botón center — brújula
  const btnCenter = document.getElementById('btnCenter');
  if (btnCenter) {
    btnCenter.addEventListener('click', () => {
      if (AppState.gps && typeof GPS !== 'undefined') {
        GPS.centerMap();
      }
    });
  }
}

/* ── INIT PRINCIPAL ── */
function init() {
  // Cargar config guardada
  AppState.lang = Config.get('lang');
  AppState.mood = Config.get('mood');
  AppState.mode = Config.get('mode');

  // Escuchar conectividad
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  AppState.offline = !navigator.onLine;

  // Inicializar listeners
  initConfigModal();
  initModeModal();
  initExploreListeners();

  // Arrancar splash
  runSplash();
}

/* ── ARRANCAR AL CARGAR EL DOM ── */
document.addEventListener('DOMContentLoaded', init);
