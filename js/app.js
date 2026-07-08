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
  // ── Bienvenida de ciudad ──
  _cityWelcomeDone: false,
  countryCode:      '',    // DT-41: ISO code de la ciudad actual

  // ── DA-52: memoria de capítulos ──
  _walkChapters:    [],    // DT-39: { poiId, poiName, text, ts }

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
  // DA-65: 'alert' se elimino — rain ahora usa el mismo flujo systole/diastole/rest que el resto de Care
  const valid = ['systole', 'diastole', 'rest'];
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

  // DT-47: en primera vez el GPS se pide en el paso 1 del wizard (priming) —
  // el splash nunca dispara el prompt nativo sin contexto
  const isFirst     = Config.isFirstTime();
  const gpsStartTs  = performance.now();
  const gpsPromise  = isFirst ? Promise.resolve(null) : requestGPSPermission();

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

  if (typeof Debug !== 'undefined' && !isFirst) {
    Debug.log(
      gpsOk ? 'info' : 'warn',
      `GPS arranque: ${gpsOk ? 'concedido' : 'denegado/timeout'} · ${gpsDurationMs}ms`
    );
  }

  clearInterval(iv);

  // Completar barra
  if (fill)  fill.style.width = '100%';
  if (label) label.textContent = (gpsOk || isFirst) ? 'listo ✓' : 'continuando sin GPS...';

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
      // DT-47: primera vez — wizard de entrada
      if (splashId) Debug.metricEnd(splashId, 'first-time');
      _startWizard();
    } else {
      // Sesión anterior — ir directo a exploración con config guardada
      AppState.lang  = Config.get('lang');
      AppState.mode  = Config.get('mode');
      if (splashId) Debug.metricEnd(splashId, 'returning-user');
      _enterExploreViaTitleCard();
    }
  }, 720);
}

/* ── UNLOCK DE AUDIO — iOS Safari requiere gesto del usuario (por carga de pagina) ──
   Puerta UNICA de desbloqueo (DA-77): convergen aqui el corazon del wizard
   (paso 4), el tap del title card y el primer tap en exploracion. Ademas
   pronuncia el saludo de ciudad pendiente si el TTL sigue vigente. */
let _audioUnlocked = false;
let _pendingWelcome = null;          // { text, lang, ts } — DA-77
const WELCOME_TTL_MS = 90000;        // se fija en mano (60-90s)

function _unlockAudioOnFirstTap() {
  if (_audioUnlocked) return;
  _audioUnlocked = true;

  if (typeof Voice !== 'undefined' && typeof Voice.unlockFromGesture === 'function') {
    Voice.unlockFromGesture();
  }
  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Audio: desbloqueado desde gesto');
  }

  // DA-77: saludo pendiente — se pronuncia en el primer gesto.
  // Pasado el TTL se descarta en silencio: un "bienvenido" a los 5 minutos
  // sonaria a bug, no a bienvenida.
  if (_pendingWelcome) {
    const p = _pendingWelcome;
    _pendingWelcome = null;
    if (Date.now() - p.ts <= WELCOME_TTL_MS) {
      const onSpoken = p.isIntro
        ? () => { if (typeof Config !== 'undefined') Config.set('introHeard', true); }
        : null;
      Voice.speak(p.text, p.lang, onSpoken);
    } else if (typeof Debug !== 'undefined') {
      Debug.log('info', 'Bienvenida descartada — TTL vencido (intro conservada para proxima vez)');
    }
  }
}

/* ── DT-45: TITLE CARD — FOLLOWER + slogan, fade puro ──
   La pantalla titula, la voz saluda (enmienda S24).
   Timing provisional — se fija en mano. */
const TITLECARD_MAX_MS = 4000; // techo

function _showTitleCard(onDone) {
  const card = document.getElementById('screen-titlecard');
  if (!card) { onDone(); return; } // fallback: sin pantalla, flujo intacto

  navigateTo('titlecard');

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(ceiling);
    onDone();
  };

  const ceiling = setTimeout(finish, TITLECARD_MAX_MS);

  // Tap salta Y desbloquea la voz (el techo de 4s NO desbloquea — no es gesto)
  const tapFinish = () => { _unlockAudioOnFirstTap(); finish(); };
  card.addEventListener('touchend', tapFinish, { once: true });
  card.addEventListener('click',    tapFinish, { once: true });
}

function _enterExploreViaTitleCard(afterExplore) {
  _showTitleCard(() => {
    navigateTo('explore');
    initExplore();
    if (typeof afterExplore === 'function') afterExplore();
  });
}

/* ── INICIALIZAR EXPLORACIÓN ── */
function initExplore() {
  setPhase('systole');
  updateCareStrip();
  updateStats();
  initCompass();

  // Reset completo de sesión — todos los contadores desde cero
  // Usar startTestSession si Debug está disponible (reset centralizado)
  // o hacer el reset manual como fallback
  if (typeof Debug !== 'undefined') {
    Debug.startTestSession();
  } else {
    // Fallback sin Debug
    AppState.kmWalked          = 0;
    AppState.poisVisited       = 0;
    AppState._msTotalSystole   = 0;
    AppState._msTotalDiastole  = 0;
    AppState._narrationCount   = 0;
    AppState._firstNarrationTs = null;
    AppState._lastNarrationTs  = null;
    AppState._sessionStart     = performance.now();
    AppState._phaseStart       = performance.now();
    AppState.activePOI         = null;
  }

  AppState._cityWelcomeDone = false;
  // _audioUnlocked NO se resetea aqui: el trust de speechSynthesis es por
  // carga de pagina, no por caminata. El desbloqueo del wizard o del title
  // card debe sobrevivir hasta explore (DA-77).

  // DA-58: memoria de capitulo — nunca se reseteaba, crecia sin limite
  // mientras la pestaña siguiera abierta entre caminatas distintas
  AppState._walkChapters = [];

  // DT-42: thirst se dispara una sola vez por caminata — sin este reset,
  // solo aparecia una vez por sesion de navegador, no por caminata
  if (typeof Care !== 'undefined' && typeof Care.resetWalk === 'function') {
    Care.resetWalk();
  }

  // Limpiar Set de POIs visitados — nueva sesión en campo (BUG-044)
  if (typeof POI !== 'undefined' && typeof POI.resetVisited === 'function') {
    POI.resetVisited();
  }

  if (typeof Debug !== 'undefined') {
    Debug.log('info', 'Sesión iniciada — todos los contadores desde cero');
  }

  // GPS ya tiene permiso — solo iniciar el watch continuo
  if (typeof GPS !== 'undefined') GPS.start();

  // Iniciar clima
  if (typeof Weather !== 'undefined') Weather.start();

  // Iniciar cuidado contextual
  if (typeof Care !== 'undefined') Care.start();

  // Fallback: si Nominatim no responde en 10s, mostrar bienvenida genérica
  _scheduleWelcomeFallback();

  // Unlock de audio en primer tap — red de seguridad si nadie toco wizard ni title card
  if (!_audioUnlocked) {
    // iOS Safari: usar touchend en lugar de touchstart passive
    // touchstart con passive:true no garantiza trusted event para speechSynthesis
    // cuando Leaflet está activo — usa touchend que llega limpio al call stack
    document.addEventListener('touchend', _unlockAudioOnFirstTap, { once: true });
    document.addEventListener('click',    _unlockAudioOnFirstTap, { once: true });
  }
}

/* ── BIENVENIDA DE CIUDAD — texto sobre el mapa, una vez por sesión ── */
function welcomeCity(city) {
  if (AppState._cityWelcomeDone) return;
  AppState._cityWelcomeDone = true;

  // DT-41: saludo en idioma local de la ciudad, no del usuario
  const localLang = (AppState.countryCode && typeof Narration !== 'undefined' && Narration.getLocalLang)
    ? Narration.getLocalLang(AppState.countryCode)
    : 'en';

  // Si es el fallback generico, no pasar por getCityWelcome
  const isFallback  = (city === 'Tu ciudad te espera.' || city === 'Your city awaits.');
  const name        = (typeof Config !== 'undefined') ? (Config.get('userName') || null) : null;  // DA-75

  // Ratificacion S25c: "Soy Follower" solo la primera vez que el saludo
  // efectivamente suena — no es bienvenida recurrente, es presentacion.
  const includeIntro = (typeof Config !== 'undefined') ? !Config.get('introHeard') : false;

  let text = city;
  if (isFallback) {
    text = (includeIntro && typeof Narration !== 'undefined' && typeof Narration.getCityIntroFallback === 'function')
      ? Narration.getCityIntroFallback(name, AppState.lang || 'es')
      : city;
  } else if (typeof Narration !== 'undefined' && typeof Narration.getCityWelcome === 'function') {
    text = Narration.getCityWelcome(city, name, localLang, includeIntro);
  }

  if (typeof Debug !== 'undefined') {
    Debug.log('info', `Bienvenida (voz${includeIntro ? ', con intro' : ''}): "${text}"`);
  }

  // DT-45: el saludo vive 100% en el canal de voz — la pantalla titula, la voz saluda
  if (typeof Voice === 'undefined' || !Voice.isSupported || !Voice.isSupported()) return;

  // Marcar introHeard SOLO cuando la frase con intro efectivamente suena
  // (onEnd de Voice.speak) — no al componerla. Si el TTL descarta el
  // pendiente sin sonar, el usuario conserva su oportunidad de escucharla.
  const onSpoken = includeIntro
    ? () => { if (typeof Config !== 'undefined') Config.set('introHeard', true); }
    : null;

  const speakLang = isFallback ? (AppState.lang || 'es') : localLang;
  if (_audioUnlocked) {
    Voice.speak(text, speakLang, onSpoken);
  } else {
    _pendingWelcome = { text, lang: speakLang, isIntro: includeIntro, ts: Date.now() };  // DA-77
  }
}

/* ── FALLBACK: mostrar bienvenida genérica si no hay ciudad en 10s ── */
function _scheduleWelcomeFallback() {
  setTimeout(() => {
    if (!AppState._cityWelcomeDone) {
      const lang = AppState.lang || 'es';
      const fallback = lang === 'es' ? 'Tu ciudad te espera.' : 'Your city awaits.';
      welcomeCity(fallback);
    }
  }, 10000);
}

/* ── DT-40: INACTIVIDAD DETECTADA — posible fin de caminata ──
   Llamado desde gps.js cuando el usuario lleva 10 min sin moverse >30m.
   No actuar si Care está activo (pausa intencional) o si hay narración. */
function onWalkInactivity() {
  if (AppState.phase === 'rest')     return;  // Care sugirió una pausa — no interrumpir
  if (AppState.phase === 'diastole') return;  // narración en curso
  if (AppState.kmWalked < 0.5)       return;  // caminata demasiado corta para despedirse

  if (typeof Debug !== 'undefined') {
    Debug.log('info', `GPS: inactividad 10min — ${AppState.kmWalked.toFixed(1)}km — evaluar cierre`);
  }
  // DT-45/46: aquí irá la pregunta hablada del narrador + confirmación por tap
  // Pendiente de implementación — por ahora solo se loguea
}

/* ── DT-47: WIZARD DE ENTRADA — coreografía de permisos, solo primera vez ──
   Orden por dependencias: idioma antes de voz (la muestra suena en el idioma
   confirmado), nombre antes de voz (recompensa inmediata en el paso 4).
   El corazón del paso 4 es el gesto confiable que desbloquea speechSynthesis
   (linaje BUG-036 — touchend). */

const WIZ_LANG_TITLE = {
  es: 'Te hablaré en español',
  en: "I'll speak to you in English",
  fr: 'Je te parlerai en français',
  it: 'Ti parlerò in italiano'
};

let _wizLang = 'es';
let _wizName = '';
let _wizDone = false;

function _wizGoTo(n) {
  document.querySelectorAll('#screen-wizard .wizard-step').forEach((s, i) => {
    s.classList.toggle('active', i === n - 1);
  });
}

function _wizUpdateLangUI() {
  const title = document.getElementById('wizLangTitle');
  const code  = document.getElementById('wizLangCode');
  if (title) title.textContent = WIZ_LANG_TITLE[_wizLang];
  if (code)  code.textContent  = _wizLang;
  document.querySelectorAll('#wizLangPills .wizard-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.value === _wizLang);
  });
}

function _startWizard() {
  const detected = (navigator.language || 'es').slice(0, 2).toLowerCase();
  _wizLang = WIZ_LANG_TITLE[detected] ? detected : 'en';
  _wizUpdateLangUI();
  navigateTo('wizard');
  _wizGoTo(1);
}

function initWizard() {
  // Paso 1 — GPS: priming propio, luego el prompt nativo
  const gpsBtn = document.getElementById('wizGpsBtn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', async () => {
      gpsBtn.disabled = true;
      const ok = await requestGPSPermission();
      if (typeof Debug !== 'undefined') {
        Debug.log(ok ? 'info' : 'warn', `Wizard: GPS ${ok ? 'concedido' : 'denegado/timeout'}`);
      }
      // Denegado tambien avanza — nunca mostrar errores, la app tiene fallbacks
      _wizGoTo(2);
    });
  }

  const whyBtn = document.getElementById('wizGpsWhy');
  if (whyBtn) {
    whyBtn.addEventListener('click', () => {
      const t = document.getElementById('wizGpsWhyText');
      if (t) t.classList.toggle('hidden');
    });
  }

  // Paso 2 — idioma
  const langOk = document.getElementById('wizLangOk');
  if (langOk) langOk.addEventListener('click', () => _wizGoTo(3));

  const langChange = document.getElementById('wizLangChange');
  if (langChange) {
    langChange.addEventListener('click', () => {
      const pills = document.getElementById('wizLangPills');
      if (pills) pills.classList.remove('hidden');
    });
  }

  document.querySelectorAll('#wizLangPills .wizard-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      _wizLang = pill.dataset.value;
      _wizUpdateLangUI();
    });
  });

  // Paso 3 — nombre (DA-75)
  const nameOk = document.getElementById('wizNameOk');
  if (nameOk) {
    nameOk.addEventListener('click', () => {
      const input = document.getElementById('wizNameInput');
      _wizName = input ? input.value.trim().slice(0, 24) : '';
      _wizGoTo(4);
    });
  }

  const nameSkip = document.getElementById('wizNameSkip');
  if (nameSkip) {
    nameSkip.addEventListener('click', () => {
      _wizName = '';
      _wizGoTo(4);
    });
  }

  // Paso 4 — corazon: gesto confiable (touchend — BUG-036) + frase de muestra
  const heart = document.getElementById('wizHeartBtn');
  if (heart) {
    heart.addEventListener('touchend', _wizFinish, { once: true });
    heart.addEventListener('click',    _wizFinish, { once: true });
  }
}

function _wizFinish() {
  if (_wizDone) return;
  _wizDone = true;

  // Desbloqueo DENTRO del call stack del gesto — no mover de aqui.
  // Via _unlockAudioOnFirstTap para que la bandera quede marcada y el
  // saludo de ciudad pueda sonar de inmediato al llegar a explore.
  _unlockAudioOnFirstTap();

  // Persistir — esto hace que isFirstTime() sea false en adelante
  Config.setLang(_wizLang);
  Config.setMode('free');              // DA-76: Libre default, Recorrido opt-in (DT-56)
  Config.set('userName', _wizName);    // DA-75
  AppState.lang = _wizLang;
  AppState.mode = 'free';

  if (typeof Debug !== 'undefined') {
    Debug.log('info', `Wizard: completado · lang=${_wizLang} · nombre=${_wizName ? 'si' : 'no'}`);
  }

  // Ratificacion S25c: sin frase de muestra audible — "Soy Follower" se
  // fusiono con el saludo de ciudad real (CITY_INTRO, primera vez que suena).
  // El corazon solo necesita el gesto para desbloquear (ya ocurrido arriba).
  // Pequena pausa de cortesia para que el pulso del corazon no corte en seco.
  setTimeout(() => _enterExploreViaTitleCard(), 400);
}

/* ── EVENT LISTENERS — MODE MODAL ── */
function initModeModal() {
  const btnFree = document.getElementById('btnModeFree');
  if (btnFree) {
    btnFree.addEventListener('click', () => {
      Config.setMode('free');
      AppState.mode = 'free';
      hideModal('mode');
      setTimeout(() => _enterExploreViaTitleCard(), 300);
    });
  }

  const btnRoute = document.getElementById('btnModeRoute');
  if (btnRoute) {
    btnRoute.addEventListener('click', () => {
      Config.setMode('route');
      AppState.mode = 'route';
      hideModal('mode');
      setTimeout(() => _enterExploreViaTitleCard(() => {
        if (typeof Routes !== 'undefined') Routes.showPicker();
      }), 300);
    });
  }
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
      // styleSelector eliminado DA-50
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

}
// DA-50: initStyleSelector() eliminado — narrador unico

/* ── INIT PRINCIPAL ── */
function init() {
  // Herramienta de campo: ?reset=1 limpia localStorage y simula primera vez.
  // iPhone sin Web Inspector no tiene consola — esta es la unica via practica.
  // No toca IndexedDB (los POIs cacheados no afectan el flujo de entrada).
  // Destino: retirar o conservar junto con DT-8 antes de v1.0.
  if (new URLSearchParams(location.search).has('reset')) {
    try { localStorage.clear(); } catch (e) {}
    history.replaceState(null, '', location.pathname);
  }

  AppState.lang  = Config.get('lang');
  AppState.mode  = Config.get('mode');

  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  AppState.offline = !navigator.onLine;

  initWizard();
  initModeModal();
  initExploreListeners();

  runSplash();
}

document.addEventListener('DOMContentLoaded', init);
