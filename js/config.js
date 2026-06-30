/* ═══════════════════════════════════════════
   FOLLOWER — config.js
   Configuracion del usuario: idioma, preferencias.
   DA-50: narrator eliminado — voz unica v2.7.
   ═══════════════════════════════════════════ */

const Config = (() => {

  /* ── VALORES POR DEFECTO ── */
  const DEFAULTS = {
    lang:       'es',
    mode:       'free',
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

  function setMode(mode) {
    const valid = ['free', 'route'];
    if (!valid.includes(mode)) {
      console.warn(`Config: modo inválido "${mode}"`);
      return;
    }
    set('mode', mode);
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

  /* ── INICIALIZAR ── */
  load();

  /* ── API PÚBLICA ── */
  return {
    get,
    getAll,
    set,
    setLang,
    setMode,
    setVolVoice,
    isFirstTime,
    reset
  };

})();
