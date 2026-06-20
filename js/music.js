/* ═══════════════════════════════════════════
   FOLLOWER — music.js
   Música cinematográfica por mood.
   Web Audio API nativa — sin dependencias.
   DA-3: fadeMusic() función única.
   ═══════════════════════════════════════════ */

const Music = (() => {

  /* ── ESTADO INTERNO ── */
  let _context     = null;    // AudioContext
  let _source      = null;    // BufferSourceNode activo
  let _gainNode    = null;    // GainNode para volumen/fade
  let _buffer      = null;    // AudioBuffer cargado
  let _currentMood = null;    // mood actual
  let _isPlaying   = false;
  let _isFading    = false;
  let _fadeTimer   = null;

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    VOL_AMBIENT:   0.35,    // volumen música de fondo
    VOL_NARRATION: 0.15,    // volumen durante narración (se baja)
    FADE_IN_MS:    2000,    // duración fade in (ms)
    FADE_OUT_MS:   1500,    // duración fade out (ms)
    FADE_DIP_MS:   800,     // duración dip durante narración
    LOOP:          true     // música en loop
  };

  /* ── TRACKS POR MOOD ── */
  const TRACKS = {
    epic:     'assets/sounds/epic.mp3',
    romantic: 'assets/sounds/romantic.mp3',
    mystery:  'assets/sounds/mystery.mp3',
    curious:  'assets/sounds/curious.mp3'
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
      ? Debug.metricStart('music', 'cargar track')
      : null;
    try {
      const res     = await fetch(url);
      const buffer  = await res.arrayBuffer();
      const decoded = await _context.decodeAudioData(buffer);
      if (dbgId) Debug.metricEnd(dbgId, 'ok', { url });
      return decoded;
    } catch (e) {
      console.warn('Music: no se pudo cargar el track:', url);
      if (dbgId) Debug.metricEnd(dbgId, 'error', { url, message: e.message });
      return null;
    }
  }

  /* ── REPRODUCIR BUFFER ── */
  function playBuffer(buffer) {
    if (!_context || !_gainNode || !buffer) return;

    // Detener source anterior
    if (_source) {
      try { _source.stop(); } catch (e) {}
      _source = null;
    }

    _source             = _context.createBufferSource();
    _source.buffer      = buffer;
    _source.loop        = CONFIG.LOOP;
    _source.connect(_gainNode);
    _source.start(0);
    _isPlaying = true;
  }

  /* ── FADE — DA-3 función única ── */
  function fadeMusic(targetVol, durationMs, onComplete = null) {
    if (!_context || !_gainNode) return;
    if (_fadeTimer) clearTimeout(_fadeTimer);

    const startVol  = _gainNode.gain.value;
    const startTime = _context.currentTime;
    const endTime   = startTime + (durationMs / 1000);

    _gainNode.gain.cancelScheduledValues(startTime);
    _gainNode.gain.setValueAtTime(startVol, startTime);
    _gainNode.gain.linearRampToValueAtTime(targetVol, endTime);

    if (onComplete) {
      _fadeTimer = setTimeout(onComplete, durationMs);
    }
  }

  /* ── PLAY — iniciar música por mood ── */
  async function play(mood) {
    if (!initContext()) return;

    // Reanudar contexto si estaba suspendido (política autoplay)
    if (_context.state === 'suspended') {
      await _context.resume();
    }

    const track = TRACKS[mood] || TRACKS.epic;

    // Si es el mismo mood y está sonando, no recargar
    if (_currentMood === mood && _isPlaying) {
      fadeMusic(CONFIG.VOL_AMBIENT, CONFIG.FADE_IN_MS);
      return;
    }

    _currentMood = mood;

    // Fade out del track anterior si hay uno
    if (_isPlaying) {
      fadeMusic(0, CONFIG.FADE_OUT_MS, async () => {
        _buffer = await loadTrack(track);
        playBuffer(_buffer);
        fadeMusic(CONFIG.VOL_AMBIENT, CONFIG.FADE_IN_MS);
      });
    } else {
      _buffer = await loadTrack(track);
      playBuffer(_buffer);
      fadeMusic(CONFIG.VOL_AMBIENT, CONFIG.FADE_IN_MS);
    }
  }

  /* ── DIP — bajar volumen durante narración ── */
  function dipForNarration() {
    fadeMusic(CONFIG.VOL_NARRATION, CONFIG.FADE_DIP_MS);
  }

  /* ── RESTORE — subir volumen después de narración ── */
  function restoreAfterNarration() {
    fadeMusic(CONFIG.VOL_AMBIENT, CONFIG.FADE_DIP_MS);
  }

  /* ── FADE TO AMBIENT — entre POIs (sístole) ── */
  function fadeToAmbient() {
    fadeMusic(CONFIG.VOL_AMBIENT, CONFIG.FADE_IN_MS);
  }

  /* ── STOP ── */
  function stop() {
    fadeMusic(0, CONFIG.FADE_OUT_MS, () => {
      if (_source) {
        try { _source.stop(); } catch (e) {}
        _source = null;
      }
      _isPlaying = false;
    });
  }

  /* ── CAMBIAR MOOD ── */
  async function changeMood(mood) {
    if (mood === _currentMood) return;
    await play(mood);
  }

  /* ── ACTUALIZAR VOLUMEN desde config ── */
  function setVolume(vol) {
    if (!_gainNode) return;
    const target = Math.min(1, Math.max(0, vol)) * CONFIG.VOL_AMBIENT;
    fadeMusic(target, 300);
  }

  /* ── GETTERS ── */
  function isPlaying()    { return _isPlaying; }
  function currentMood()  { return _currentMood; }

  /* ── API PÚBLICA ── */
  return {
    play,
    stop,
    changeMood,
    fadeMusic,
    dipForNarration,
    restoreAfterNarration,
    fadeToAmbient,
    setVolume,
    isPlaying,
    currentMood
  };

})();
