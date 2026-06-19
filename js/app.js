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
  cityName:    ''
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
  valid.forEach(p => document.body.classList.remove(`phase-${p}`));
  document.body.classList.add(`phase-${phase}`);
  AppState.phase = phase;
  updateTopPillPhase(phase);
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
  if (phase === 'rest')  moodEl.textContent = '☕ descansando';
  else if (phase === 'alert') moodEl.textContent = '🌧️ lluvia';
  else moodEl.textContent = Config.getMoodLabel();
}

/* ── ACTUALIZAR STATS ── */
function updateStats() {
  const kmEl   = document.getElementById('statKm');
  const poisEl = document.getElementById('statPOIs');
  if (kmEl)   kmEl.textContent   = AppState.kmWalked.toFixed(1);
  if (poisEl) poisEl.textContent = AppState.poisVisited;
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
    // SIEMPRE mostrar config — así el usuario puede confirmar idioma y mood
    // independientemente de si es primera vez o no
    showModal('config');
  }, 720);
}

/* ── INICIALIZAR EXPLORACIÓN ── */
function initExplore() {
  setPhase('systole');
  updateTopPill();
  updateStats();

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
        if (typeof Routes !== 'undefined') Routes.showPicker();
      }, 300);
    });
  }
}

/* ── EVENT LISTENERS — EXPLORACIÓN ── */
function initExploreListeners() {
  const poiCard = document.getElementById('poiCard');
  if (poiCard) {
    poiCard.addEventListener('click', () => {
      if (AppState.activePOI) {
        navigateTo('poi');
        if (typeof POI !== 'undefined') POI.renderExpanded(AppState.activePOI);
      }
    });
  }

  const btnBack = document.getElementById('btnBackFromPOI');
  if (btnBack) {
    btnBack.addEventListener('click', () => navigateTo('explore'));
  }

  const btnContinue = document.getElementById('btnContinueNarration');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      navigateTo('explore');
      if (typeof Narration !== 'undefined') Narration.resume();
    });
  }

  const btnCenter = document.getElementById('btnCenter');
  if (btnCenter) {
    btnCenter.addEventListener('click', () => {
      if (AppState.gps && typeof GPS !== 'undefined') GPS.centerMap();
    });
  }
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
