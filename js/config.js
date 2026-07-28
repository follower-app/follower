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
    unitSystem: 'metric',
    userName:   '',       // DA-75: solo welcome/farewell, nunca viaja al Worker
    introHeard: false,    // ratificacion S25c: "Soy Follower" solo se dice una vez en la vida
    narratedCities: []    // DA-86: ciudades cuya tesis ya se narro — marca durable en
                          // localStorage (sobrevive al desalojo de IndexedDB en iOS) e
                          // independiente de idioma/userName: cambiar la config en el
                          // wizard NO vuelve a narrar. Gate de NARRAR, no de MOSTRAR.
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

  /* ── DA-86: MARCA DE CIUDAD NARRADA ──
     La tesis se MUESTRA siempre (identidad de la ciudad, viene del cache);
     se NARRA solo la primera vez en esa ciudad. Esta marca es la fuente de
     verdad de "primera vez": por nombre de ciudad (sin pais), en
     localStorage — no en IndexedDB, que iOS desaloja y re-narraria. */
  function isCityNarrated(city) {
    if (!city) return false;
    const list = _config.narratedCities || [];
    return list.includes(city);
  }

  function markCityNarrated(city) {
    if (!city) return;
    const list = _config.narratedCities || [];
    if (list.includes(city)) return;
    _config.narratedCities = [...list, city];
    save();
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
    isCityNarrated,   // DA-86
    markCityNarrated, // DA-86
    reset
  };

})();
