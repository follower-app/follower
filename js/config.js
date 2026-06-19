/* ═══════════════════════════════════════════
   FOLLOWER — config.js
   Configuración del usuario: idioma, mood,
   preferencias. Se carga antes que todo.
   ═══════════════════════════════════════════ */

const Config = (() => {

  /* ── VALORES POR DEFECTO ── */
  const DEFAULTS = {
    lang:       'es',
    mood:       'epic',
    mode:       'free',
    volMusic:   0.65,
    volVoice:   1.0,
    unitSystem: 'metric'
  };

  /* ── CLAVE EN LOCALSTORAGE ── */
  const STORAGE_KEY = 'follower_config';

  /* ── ESTADO INTERNO ── */
  let _config = { ...DEFAULTS };

  /* ── CARGAR DESDE STORAGE ── */
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        _config = { ...DEFAULTS, ...parsed };
      }
    } catch (e) {
      console.warn('Config: no se pudo cargar desde storage, usando defaults');
      _config = { ...DEFAULTS };
    }
  }

  /* ── GUARDAR EN STORAGE ── */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_config));
    } catch (e) {
      console.warn('Config: no se pudo guardar en storage');
    }
  }

  /* ── GETTERS ── */
  function get(key) {
    return _config[key];
  }

  function getAll() {
    return { ..._config };
  }

  /* ── SETTERS ── */
  function set(key, value) {
    if (!(key in DEFAULTS)) {
      console.warn(`Config: clave desconocida "${key}"`);
      return;
    }
    _config[key] = value;
    save();
  }

  function setLang(lang) {
    set('lang', lang);
  }

  function setMood(mood) {
    const valid = ['epic', 'romantic', 'mystery', 'curious'];
    if (!valid.includes(mood)) {
      console.warn(`Config: mood inválido "${mood}"`);
      return;
    }
    set('mood', mood);
  }

  function setMode(mode) {
    const valid = ['free', 'route'];
    if (!valid.includes(mode)) {
      console.warn(`Config: modo inválido "${mode}"`);
      return;
    }
    set('mode', mode);
  }

  function setVolMusic(vol) {
    set('volMusic', Math.min(1, Math.max(0, vol)));
  }

  function setVolVoice(vol) {
    set('volVoice', Math.min(1, Math.max(0, vol)));
  }

  /* ── VERIFICAR SI ES PRIMERA VEZ ── */
  function isFirstTime() {
    return !localStorage.getItem(STORAGE_KEY);
  }

  /* ── RESET ── */
  function reset() {
    _config = { ...DEFAULTS };
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ── HELPERS DE MOOD ── */
  const MOOD_LABELS = {
    epic:     { es: '🎬 épico',     en: '🎬 epic' },
    romantic: { es: '🌹 romántico', en: '🌹 romantic' },
    mystery:  { es: '🔮 misterio',  en: '🔮 mystery' },
    curious:  { es: '😄 curioso',   en: '😄 curious' }
  };

  function getMoodLabel() {
    const mood = _config.mood;
    const lang = _config.lang;
    return MOOD_LABELS[mood]?.[lang] || MOOD_LABELS[mood]?.['es'] || mood;
  }

  /* ── HELPERS DE MÚSICA POR MOOD ── */
  const MOOD_MUSIC = {
    epic:     'assets/sounds/epic.mp3',
    romantic: 'assets/sounds/romantic.mp3',
    mystery:  'assets/sounds/mystery.mp3',
    curious:  'assets/sounds/curious.mp3'
  };

  function getMusicTrack() {
    return MOOD_MUSIC[_config.mood] || MOOD_MUSIC['epic'];
  }

  /* ── INICIALIZAR ── */
  load();

  /* ── API PÚBLICA ── */
  return {
    get,
    getAll,
    set,
    setLang,
    setMood,
    setMode,
    setVolMusic,
    setVolVoice,
    isFirstTime,
    reset,
    getMoodLabel,
    getMusicTrack
  };

})();
