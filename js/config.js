/* ═══════════════════════════════════════════
   FOLLOWER — config.js
   Configuración del usuario: idioma, narrador,
   preferencias. Se carga antes que todo.
   ═══════════════════════════════════════════ */

const Config = (() => {

  /* ── VALORES POR DEFECTO ── */
  const DEFAULTS = {
    lang:       'es',
    narrator:   'storyteller',
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

  function setNarrator(narrator) {
    const valid = ['storyteller', 'historian', 'explorer', 'local'];
    if (!valid.includes(narrator)) {
      console.warn(`Config: narrador inválido "${narrator}"`);
      return;
    }
    set('narrator', narrator);
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

  /* ── LABELS DE NARRADOR ── */
  const NARRATOR_LABELS = {
    storyteller: { es: '🎭 Storyteller', en: '🎭 Storyteller' },
    historian:   { es: '🏛️ Historiador', en: '🏛️ Historian'  },
    explorer:    { es: '🔎 Explorador',  en: '🔎 Explorer'   },
    local:       { es: '❤️ Local',       en: '❤️ Local'      }
  };

  function getNarratorLabel() {
    const narrator = _config.narrator;
    const lang     = _config.lang;
    return NARRATOR_LABELS[narrator]?.[lang] || NARRATOR_LABELS[narrator]?.['es'] || narrator;
  }

  /* ── INICIALIZAR ── */
  load();

  /* ── API PÚBLICA ── */
  return {
    get,
    getAll,
    set,
    setLang,
    setNarrator,
    setMode,
    setVolVoice,
    isFirstTime,
    reset,
    getNarratorLabel
  };

})();
