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

      // DT-19: si el MP3 no existe, reproducir tono sintético de placeholder
      // Desbloquea pruebas de campo sin necesitar archivos de audio definitivos
      if (!buffer) {
        if (typeof Debug !== 'undefined') {
          Debug.log('info', `Music: MP3 no encontrado para [${narrator}] — usando tono sintético placeholder`);
        }
        try {
          // Tono suave de 2.5s: pad ambiental generado con oscilador
          const oscDuration = 2.5;
          const osc         = _context.createOscillator();
          const gain        = _context.createGain();

          osc.type      = 'sine';
          osc.frequency.value = narrator === 'historian'   ? 220  // La2 — sobrio
                              : narrator === 'explorer'    ? 330  // Mi3 — curioso
                              : narrator === 'local'       ? 294  // Re3 — cálido
                              : 261;                               // Do3 — storyteller

          gain.gain.setValueAtTime(0, _context.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, _context.currentTime + 0.3);
          gain.gain.linearRampToValueAtTime(0.10, _context.currentTime + oscDuration - 0.5);
          gain.gain.linearRampToValueAtTime(0, _context.currentTime + oscDuration);

          osc.connect(gain);
          gain.connect(_context.destination);
          osc.start(_context.currentTime);
          osc.stop(_context.currentTime + oscDuration);

          osc.onended = () => resolve();
        } catch (synthErr) {
          if (typeof Debug !== 'undefined') {
            Debug.log('warn', `Music: tono sintético falló (${synthErr.message}) — continuando sin música`);
          }
          resolve();
        }
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

  /* ── INICIALIZAR DESDE GESTO — llamar desde un tap del usuario (iOS Safari) ── */
  function initFromGesture() {
    if (!initContext()) return;

    // iOS Safari: speechSynthesis solo funciona mientras AudioContext está en estado
    // 'running' con audio activo. Un contexto silencioso o suspendido bloquea la voz.
    // Solución: reproducir 1s de silencio real desde el gesto del usuario.
    // Esto mantiene el contexto 'running' y desbloquea speechSynthesis para llamadas
    // async posteriores (ej: después de que Claude devuelve el texto ~6s más tarde).
    const resume = (_context.state === 'suspended')
      ? _context.resume()
      : Promise.resolve();

    resume.then(() => {
      try {
        const silenceBuffer = _context.createBuffer(1, _context.sampleRate, _context.sampleRate);
        const silenceSource = _context.createBufferSource();
        silenceSource.buffer = silenceBuffer;
        silenceSource.connect(_context.destination);
        silenceSource.start(0);
        if (typeof Debug !== 'undefined') {
          Debug.log('info', `Music: AudioContext desbloqueado · state=${_context.state}`);
        }
      } catch (e) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Music: initFromGesture falló · ${e.message}`);
        }
      }
    }).catch(e => {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', `Music: resume desde gesto falló · ${e.message}`);
      }
    });
  }

  /* ── GETTERS ── */
  function isPlaying()       { return _isPlaying; }
  function currentNarrator() { return _currentNarrator; }

  /* ── API PÚBLICA ── */
  return {
    playNarratorIntro,
    initFromGesture,
    stop,
    isPlaying,
    currentNarrator
  };

})();
