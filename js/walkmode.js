/* ═══════════════════════════════════════════
   FOLLOWER — walkmode.js
   DT-54: wake lock + modo caminata (version minima, S31).

   Dos responsabilidades, un solo modulo:

   1. WAKE LOCK — navigator.wakeLock.request('screen') al iniciar la
      caminata (initExplore). Sin el, iOS suspende JS/GPS/speechSynthesis
      al apagarse la pantalla y la experiencia completa muere en el
      bolsillo. Re-adquisicion en visibilitychange (el lock se libera
      solo al ocultar la app). Fallo SIEMPRE silencioso — si el navegador
      no soporta la API, el comportamiento es el actual, nunca un error.

   2. MODO CAMINATA — overlay casi negro (negro OLED ~ pantalla apagada
      en consumo) con solo el corazon latiendo en fase sistole/diastole.
      Entrada C ratificada (S31): automatica, SOLO cuando hay movimiento
      GPS sostenido Y sin interaccion reciente — quien camina no esta
      mirando la pantalla. Salida: tap en cualquier parte.

   Version minima deliberada: sin transiciones elaboradas ni textos.
   El refinamiento "momento de marca" (spec S24) queda para despues de
   la validacion de campo.
   ═══════════════════════════════════════════ */

const WalkMode = (() => {

  /* ── CONSTANTES — ajustables tras campo sin tocar logica ── */
  const CONFIG = {
    MOVE_WINDOW_READINGS: 4,      // lecturas GPS consecutivas evaluadas
    MOVE_MIN_METERS:      25,     // metros acumulados en la ventana => "caminando"
    IDLE_MIN_MS:          15000,  // ms sin tocar pantalla => "no esta mirando"
    CHECK_INTERVAL_MS:    3000,   // frecuencia de evaluacion de condiciones
    FADE_MS:              600     // duracion del fade del overlay (espeja CSS)
  };

  /* ── ESTADO INTERNO ── */
  let _wakeLock        = null;    // sentinel del wake lock activo
  let _active          = false;   // modo caminata visible ahora
  let _started         = false;   // start() ya corrio esta sesion
  let _lastInteraction = Date.now();
  let _recentMoves     = [];      // metros entre lecturas recientes (ventana deslizante)
  let _lastPos         = null;    // ultima posicion recibida via onMove
  let _checkTimer      = null;
  let _retryOnGesture  = false;   // BUG-057/campo 15-jul: iOS rechazo el wake lock
                                  // (NotAllowedError) justo tras cargar la pagina —
                                  // reintentar en el primer gesto real del usuario

  /* ══════════════ 1. WAKE LOCK ══════════════ */

  async function _acquireWakeLock() {
    // Silencioso por diseno: sin soporte o sin permiso => comportamiento actual
    if (!('wakeLock' in navigator)) {
      if (typeof Debug !== 'undefined') {
        Debug.log('info', 'WalkMode: Wake Lock API no soportada — sin cambio de comportamiento');
      }
      return;
    }
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _retryOnGesture = false;   // adquirido — no hace falta reintentar
      if (typeof Debug !== 'undefined') {
        Debug.log('info', 'WalkMode: wake lock adquirido — pantalla no se apagara sola');
      }
      // El sistema puede soltarlo (bloqueo manual, cambio de app) — solo registrar
      _wakeLock.addEventListener('release', () => {
        if (typeof Debug !== 'undefined') {
          Debug.log('info', 'WalkMode: wake lock liberado por el sistema');
        }
      });
    } catch (e) {
      // Bateria baja, Modo de Bajo Consumo, politica del navegador, o
      // peticion sin activacion de usuario reciente (iOS tras cargar la
      // pagina — evidencia de campo 15-jul). Nunca mostrar error.
      // Programar reintento en el primer gesto real del usuario.
      _retryOnGesture = true;
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `WalkMode: wake lock rechazado (${e.name}) · visibility=${document.visibilityState} · msg=${e.message || 'n/a'} — reintento programado al primer gesto`);
      }
      _wakeLock = null;
    }
  }

  function _onVisibilityChange() {
    // Spec S24: bloqueo manual del usuario = suspension aceptada,
    // reanudacion limpia al volver. Re-adquirir al hacerse visible.
    if (document.visibilityState === 'visible' && _started) {
      _acquireWakeLock();
    }
  }

  /* ══════════════ 2. MODO CAMINATA ══════════════ */

  /* Alimentado desde gps.js onPosition — una llamada por lectura real.
     El simulador pasa por el mismo camino (simulatePosition -> onPosition),
     asi que el modo ruta del debug tambien lo ejercita. */
  function onMove(lat, lng) {
    if (_lastPos && typeof GPS !== 'undefined' && GPS.distanceMeters) {
      const m = GPS.distanceMeters(_lastPos.lat, _lastPos.lng, lat, lng);
      _recentMoves.push(m);
      if (_recentMoves.length > CONFIG.MOVE_WINDOW_READINGS) _recentMoves.shift();
    }
    _lastPos = { lat, lng };
  }

  function _isMovingSustained() {
    if (_recentMoves.length < CONFIG.MOVE_WINDOW_READINGS) return false;
    const total = _recentMoves.reduce((a, b) => a + b, 0);
    return total >= CONFIG.MOVE_MIN_METERS;
  }

  function _isIdle() {
    return (Date.now() - _lastInteraction) >= CONFIG.IDLE_MIN_MS;
  }

  function _registerInteraction() {
    _lastInteraction = Date.now();
    // BUG-057/campo 15-jul: si iOS rechazo el wake lock al cargar,
    // este gesto real es la oportunidad de reintentarlo
    if (_retryOnGesture) {
      _retryOnGesture = false;
      _acquireWakeLock();
    }
  }

  function _check() {
    if (_active) return;                       // ya esta activo
    if (document.visibilityState !== 'visible') return;
    if (AppState && AppState.screen !== 'explore') return;  // solo en explore
    if (_isMovingSustained() && _isIdle()) {
      _enter();
    }
  }

  function _enter() {
    const el = document.getElementById('walkmodeOverlay');
    if (!el) return;
    _active = true;
    el.classList.remove('hidden');
    // reflow para que el fade CSS corra desde opacity 0
    el.offsetHeight;
    el.classList.add('visible');
    if (typeof Debug !== 'undefined') {
      Debug.log('info', 'WalkMode: modo caminata ON — movimiento sostenido sin interaccion');
    }
  }

  function _exit() {
    const el = document.getElementById('walkmodeOverlay');
    if (!el || !_active) return;
    _active = false;
    _registerInteraction();  // el tap de salida cuenta como interaccion
    _recentMoves = [];       // exigir movimiento sostenido NUEVO antes de reentrar
    el.classList.remove('visible');
    setTimeout(() => { el.classList.add('hidden'); }, CONFIG.FADE_MS);
    if (typeof Debug !== 'undefined') {
      Debug.log('info', 'WalkMode: modo caminata OFF — tap del usuario');
    }
  }

  /* ══════════════ CICLO DE VIDA ══════════════ */

  function start() {
    if (_started) {
      // Nueva caminata en la misma carga de pagina: re-adquirir por si acaso
      _acquireWakeLock();
      return;
    }
    _started = true;

    _acquireWakeLock();
    document.addEventListener('visibilitychange', _onVisibilityChange);

    // Cualquier toque pospone el modo caminata (salvaguarda ratificada:
    // caminar MIRANDO el mapa no debe fundir a negro). touchend por la
    // misma razon que DA-77/BUG-036 — touchstart passive de Leaflet.
    document.addEventListener('touchend', _registerInteraction, { passive: true });
    document.addEventListener('click',    _registerInteraction, { passive: true });

    const overlay = document.getElementById('walkmodeOverlay');
    if (overlay) overlay.addEventListener('click', _exit);

    _checkTimer = setInterval(_check, CONFIG.CHECK_INTERVAL_MS);
  }

  function stop() {
    if (_checkTimer) { clearInterval(_checkTimer); _checkTimer = null; }
    if (_wakeLock) {
      try { _wakeLock.release(); } catch (e) { /* silencioso */ }
      _wakeLock = null;
    }
    if (_active) _exit();
    _started = false;
  }

  /* ── API PUBLICA ── */
  return {
    start,
    stop,
    onMove,
    isActive: () => _active
  };

})();
