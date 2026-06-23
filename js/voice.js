/* ═══════════════════════════════════════════
   FOLLOWER — voice.js
   Web Speech API — síntesis de voz nativa.
   Sin costo, sin dependencias externas.
   Soporta múltiples idiomas y voces.
   ═══════════════════════════════════════════ */

const Voice = (() => {

  /* ── ESTADO INTERNO ── */
  let _utterance   = null;    // SpeechSynthesisUtterance activa
  let _isSpeaking  = false;
  let _isPaused    = false;
  let _voices      = [];      // voces disponibles en el dispositivo
  let _safetyTimer = null;    // timer de seguridad — dispara callback si onend no llega
  let _keepAlive   = null;    // interval iOS — evita que Safari congele la síntesis
  let _speakDone   = false;   // flag — evita que el callback se ejecute dos veces

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
      if (typeof Debug !== 'undefined') Debug.log('error', 'Voice: Web Speech API no disponible');
      if (onEnd) onEnd();
      return;
    }

    // Cancelar narración anterior (limpia timers del speak anterior)
    stop();
    _speakDone = false;

    const bcp47 = LANG_MAP[lang] || LANG_MAP.es;

    _utterance         = new SpeechSynthesisUtterance(text);
    _utterance.lang    = bcp47;
    _utterance.rate    = CONFIG.RATE;
    _utterance.pitch   = CONFIG.PITCH;
    _utterance.volume  = CONFIG.VOLUME;

    const voice = getBestVoice(lang);
    if (voice) _utterance.voice = voice;

    // ── Función única de cierre — se llama desde onend, onerror o safety timer ──
    // `source` identifica quién la disparó para diagnóstico en campo
    const _finish = (source) => {
      if (_speakDone) return;   // garantía de ejecución única
      _speakDone = true;

      clearTimeout(_safetyTimer);
      clearInterval(_keepAlive);
      _safetyTimer = null;
      _keepAlive   = null;
      _isSpeaking  = false;
      _isPaused    = false;
      _utterance   = null;

      if (source !== 'onend' && typeof Debug !== 'undefined') {
        Debug.log('warn', `Voice: callback por ${source} · ${text.length} chars · lang=${lang}`);
      }

      if (onEnd) onEnd();
    };

    // ── Métricas ──
    const lagId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('voice', 'lag texto→voz')
      : null;
    let durId = null;

    // ── Estimación de duración para el safety timer ──
    // ~12 chars/segundo en español a rate 0.92 + 5s de buffer
    const estimatedMs = Math.max(8000, Math.ceil(text.length / 12) * 1000 + 5000);

    // ── Eventos ──
    _utterance.onstart = () => {
      _isSpeaking = true;
      _isPaused   = false;

      if (lagId) Debug.metricEnd(lagId, 'ok', { lang, chars: text.length });
      durId = (typeof Debug !== 'undefined')
        ? Debug.metricStart('voice', 'duración narración hablada')
        : null;

      // Safety timer: arranca cuando la voz empieza de verdad (no antes)
      _safetyTimer = setTimeout(() => {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Voice: safety timer — onend no llegó en ${Math.round(estimatedMs/1000)}s`);
        }
        if (durId) Debug.metricEnd(durId, 'safety-timer', { chars: text.length });
        _finish('safety-timer');
      }, estimatedMs);

      // iOS keep-alive: pause/resume cada 10s para evitar congelamiento silencioso
      // Safari deja de hablar sin disparar onend si el audio buffer se "agota"
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        _keepAlive = setInterval(() => {
          if (_isSpeaking && !_isPaused && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);
      }
    };

    _utterance.onend = () => {
      if (durId) Debug.metricEnd(durId, 'ok', { lang, chars: text.length });
      _finish('onend');
    };

    _utterance.onerror = (e) => {
      if (lagId) Debug.metricEnd(lagId, 'error', { error: e.error });
      if (durId) Debug.metricEnd(durId, 'error', { error: e.error });
      if (typeof Debug !== 'undefined') {
        Debug.log('error', `Voice: síntesis fallida — ${e.error} · lang=${lang}`);
      }
      _finish('onerror');
    };

    // Workaround Chrome/iOS — evita congelamiento con setTimeout antes de speak()
    const utteranceRef = _utterance;
    setTimeout(() => {
      if (utteranceRef) window.speechSynthesis.speak(utteranceRef);
    }, 100);

    _isSpeaking = true;
  }

  /* ── STOP ── */
  function stop() {
    clearTimeout(_safetyTimer);
    clearInterval(_keepAlive);
    _safetyTimer = null;
    _keepAlive   = null;
    _speakDone   = true;   // evita que safety timer dispare después del stop

    if (isSupported()) window.speechSynthesis.cancel();
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
