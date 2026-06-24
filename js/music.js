/* ═══════════════════════════════════════════
   FOLLOWER — music.js
   Intros narrativas por narrador (10-15s).
   Web Audio API nativa — sin dependencias.
   DA-3: playNarratorIntro() función única.
   ═══════════════════════════════════════════ */

const Music = (() => {

  /* ── ESTADO INTERNO ── */
  let _context        = null;   // AudioContext
  let _source         = null;   // BufferSourceNode activo
  let _gainNode       = null;   // GainNode para volumen/fade
  let _isPlaying      = false;
  let _currentNarrator = null;  // narrador cuya intro está sonando

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    VOL_INTRO:   0.7,    // volumen de la intro narrativa
    FADE_IN_MS:  600,    // fade in suave al arrancar
    FADE_OUT_MS: 800,    // fade out al terminar
    SAFETY_MS:   16000   // tiempo máximo de espera si onended no llega (iOS)
  };

  /* ── TRACKS DE INTRO POR NARRADOR ── */
  const INTROS = {
    storyteller: 'assets/sounds/storyteller-intro.mp3',
    historian:   'assets/sounds/historian-intro.mp3',
    explorer:    'assets/sounds/explorer-intro.mp3',
    local:       'assets/sounds/local-intro.mp3'
  };

  /* ── INICIALIZAR AUDIO CONTEXT ── */
  function initContext() {
    if (_context) return true;
    try {
      _context  = new (window.AudioContext || window.webkitAudioContext)();
      _gainNode = _context.createGain();
      _gainNode.connect(_context.destination);
      _gainNode.gain.value = 0;
      return true;
    } catch (e) {
      console.warn('Music: Web Audio API no disponible');
      return false;
    }
  }

  /* ── CARGAR AUDIO ── */
  async function loadTrack(url) {
    const dbgId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('music', `cargar intro: ${url}`)
      : null;
    try {
      const res     = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer  = await res.arrayBuffer();
      const decoded = await _context.decodeAudioData(buffer);
      if (dbgId) Debug.metricEnd(dbgId, 'ok');
      return decoded;
    } catch (e) {
      console.warn('Music: no se pudo cargar intro:', url, e.message);
      if (dbgId) Debug.metricEnd(dbgId, 'error', { message: e.message });
      return null;
    }
  }

  /* ── FADE ── */
  function fadeMusic(targetVol, durationMs) {
    if (!_context || !_gainNode) return;
    const startTime = _context.currentTime;
    const endTime   = startTime + (durationMs / 1000);
    _gainNode.gain.cancelScheduledValues(startTime);
    _gainNode.gain.setValueAtTime(_gainNode.gain.value, startTime);
    _gainNode.gain.linearRampToValueAtTime(targetVol, endTime);
  }

  /* ── PLAY NARRATOR INTRO — DA-3 función única ── */
  /* Devuelve una Promise que resuelve cuando la intro termina (o fallback silencioso) */
  function playNarratorIntro(narrator) {
    return new Promise(async (resolve) => {

      // Fallback silencioso si no hay contexto de audio
      if (!initContext()) { resolve(); return; }

      // Reanudar contexto si estaba suspendido (política autoplay)
      if (_context.state === 'suspended') {
        try { await _context.resume(); } catch (e) { resolve(); return; }
      }

      const url = INTROS[narrator] || INTROS.storyteller;

      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Music: cargando intro [${narrator}] → ${url}`);
      }

      const buffer = await loadTrack(url);

      // Fallback silencioso si el MP3 no existe aún
      if (!buffer) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Music: intro no disponible para [${narrator}] — continuando sin música`);
        }
        resolve();
        return;
      }

      // Detener cualquier fuente anterior
      if (_source) {
        try { _source.stop(); } catch (e) {}
        _source = null;
      }

      _source              = _context.createBufferSource();
      _source.buffer       = buffer;
      _source.loop         = false;
      _currentNarrator     = narrator;
      _source.connect(_gainNode);

      // Fade in
      _gainNode.gain.setValueAtTime(0, _context.currentTime);
      _source.start(0);
      _isPlaying = true;
      fadeMusic(CONFIG.VOL_INTRO, CONFIG.FADE_IN_MS);

      if (typeof Debug !== 'undefined') Debug.trackExp('music_intro_start');

      // Safety timer — iOS Safari a veces no dispara onended
      let _resolved = false;
      const safetyTimer = setTimeout(() => {
        if (!_resolved) {
          _resolved = true;
          if (typeof Debug !== 'undefined') {
            Debug.log('warn', 'Music: safety timer disparado — onended no llegó');
          }
          _finishIntro(resolve);
        }
      }, CONFIG.SAFETY_MS);

      _source.onended = () => {
        if (!_resolved) {
          _resolved = true;
          clearTimeout(safetyTimer);
          _finishIntro(resolve);
        }
      };
    });
  }

  /* ── TERMINAR INTRO — fade out y limpiar ── */
  function _finishIntro(resolve) {
    fadeMusic(0, CONFIG.FADE_OUT_MS);
    setTimeout(() => {
      if (_source) {
        try { _source.stop(); } catch (e) {}
        _source = null;
      }
      _isPlaying       = false;
      _currentNarrator = null;
      if (typeof Debug !== 'undefined') Debug.trackExp('music_intro_end');
      resolve();
    }, CONFIG.FADE_OUT_MS);
  }

  /* ── STOP — interrumpir intro si está sonando ── */
  function stop() {
    if (!_isPlaying) return;
    fadeMusic(0, CONFIG.FADE_OUT_MS);
    setTimeout(() => {
      if (_source) {
        try { _source.stop(); } catch (e) {}
        _source = null;
      }
      _isPlaying       = false;
      _currentNarrator = null;
      if (typeof Debug !== 'undefined') Debug.trackExp('music_stopped');
    }, CONFIG.FADE_OUT_MS);
  }

  /* ── GETTERS ── */
  function isPlaying()       { return _isPlaying; }
  function currentNarrator() { return _currentNarrator; }

  /* ── API PÚBLICA ── */
  return {
    playNarratorIntro,
    stop,
    isPlaying,
    currentNarrator
  };

})();
