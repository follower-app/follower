/* ═══════════════════════════════════════════
   FOLLOWER — voice.js
   Web Speech API — síntesis de voz nativa.
   Sin costo, sin dependencias externas.
   Soporta múltiples idiomas y voces.
   ═══════════════════════════════════════════ */

const Voice = (() => {

  /* ── ESTADO INTERNO ── */
  let _utterance  = null;    // SpeechSynthesisUtterance activa
  let _isSpeaking = false;
  let _isPaused   = false;
  let _voices     = [];      // voces disponibles en el dispositivo

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    RATE:   0.92,    // velocidad — ligeramente más lento que normal
    PITCH:  1.0,     // tono natural
    VOLUME: 1.0      // volumen máximo (música lo controla music.js)
  };

  /* ── MAPA DE IDIOMAS → código BCP-47 ── */
  const LANG_MAP = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
    de: 'de-DE',
    pt: 'pt-BR',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
    nl: 'nl-NL',
    ru: 'ru-RU',
    ar: 'ar-SA'
  };

  /* ── VERIFICAR SOPORTE ── */
  function isSupported() {
    return 'speechSynthesis' in window;
  }

  /* ── CARGAR VOCES DISPONIBLES ── */
  function loadVoices() {
    _voices = window.speechSynthesis.getVoices();

    // En algunos navegadores las voces cargan async
    if (_voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        _voices = window.speechSynthesis.getVoices();
      };
    }
  }

  /* ── SELECCIONAR MEJOR VOZ para el idioma ── */
  function getBestVoice(lang) {
    if (_voices.length === 0) loadVoices();

    const bcp47 = LANG_MAP[lang] || LANG_MAP.es;
    const base  = bcp47.split('-')[0]; // 'es', 'en', etc.

    // Prioridad: voz exacta → mismo idioma → default
    return (
      _voices.find(v => v.lang === bcp47 && !v.localService) ||  // online exacta
      _voices.find(v => v.lang === bcp47) ||                      // local exacta
      _voices.find(v => v.lang.startsWith(base)) ||               // mismo idioma
      _voices[0] ||                                               // cualquier voz
      null
    );
  }

  /* ── HABLAR ── */
  function speak(text, lang = 'es', onEnd = null) {
    if (!isSupported()) {
      console.warn('Voice: Web Speech API no disponible');
      if (onEnd) onEnd();
      return;
    }

    // Cancelar narración anterior
    stop();

    const bcp47 = LANG_MAP[lang] || LANG_MAP.es;

    _utterance         = new SpeechSynthesisUtterance(text);
    _utterance.lang    = bcp47;
    _utterance.rate    = CONFIG.RATE;
    _utterance.pitch   = CONFIG.PITCH;
    _utterance.volume  = CONFIG.VOLUME;

    // Asignar mejor voz disponible
    const voice = getBestVoice(lang);
    if (voice) _utterance.voice = voice;

    // Eventos
    _utterance.onstart = () => {
      _isSpeaking = true;
      _isPaused   = false;
    };

    _utterance.onend = () => {
      _isSpeaking = false;
      _isPaused   = false;
      _utterance  = null;
      if (onEnd) onEnd();
    };

    _utterance.onerror = (e) => {
      console.warn('Voice: error de síntesis:', e.error);
      _isSpeaking = false;
      _utterance  = null;
      if (onEnd) onEnd();
    };

    // Workaround Chrome — a veces se congela sin este timeout
    setTimeout(() => {
      window.speechSynthesis.speak(_utterance);
    }, 100);

    _isSpeaking = true;
  }

  /* ── STOP ── */
  function stop() {
    if (isSupported()) {
      window.speechSynthesis.cancel();
    }
    _isSpeaking = false;
    _isPaused   = false;
    _utterance  = null;
  }

  /* ── PAUSE ── */
  function pause() {
    if (!isSupported() || !_isSpeaking) return;
    window.speechSynthesis.pause();
    _isPaused = true;
  }

  /* ── RESUME ── */
  function resume() {
    if (!isSupported() || !_isPaused) return;
    window.speechSynthesis.resume();
    _isPaused = false;
  }

  /* ── GETTERS ── */
  function isSpeaking() { return _isSpeaking; }
  function isPaused()   { return _isPaused; }

  /* ── LISTAR IDIOMAS DISPONIBLES ── */
  function getAvailableLangs() {
    if (_voices.length === 0) loadVoices();
    const available = new Set(_voices.map(v => v.lang.split('-')[0]));
    return Object.keys(LANG_MAP).filter(l => available.has(l));
  }

  /* ── INICIALIZAR ── */
  if (isSupported()) {
    loadVoices();
  }

  /* ── API PÚBLICA ── */
  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    getAvailableLangs
  };

})();
