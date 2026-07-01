/* ═══════════════════════════════════════════
   FOLLOWER — weather.js
   Clima en tiempo real con OpenWeatherMap.
   Cache 30 min, fallback.
   DT-42: ya no decide UI de lluvia — solo entrega datos.
   Care.checkCareContext() lee AppState.weather.isRaining
   con su propio timer (2min) y cooldown (20min), misma
   voz generativa que el resto de Care. Antes este archivo
   tenia su propio sistema de alerta (showRainAlert,
   findNearbyRefuge, dismissAlert) con texto hardcodeado,
   sin idioma, sin cooldown propio — migrado por completo.
   ═══════════════════════════════════════════ */

const Weather = (() => {

  /* ── ESTADO INTERNO ── */
  let _weather      = null;    // datos de clima actuales
  let _lastFetch    = 0;       // timestamp del último fetch
  let _checkTimer   = null;    // timer de chequeo periódico

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    API_URL:        'https://followernarration.jaimeand.workers.dev/weather',
    CACHE_MS:       30 * 60 * 1000,  // 30 minutos
    CHECK_INTERVAL: 10 * 60 * 1000,  // chequear cada 10 min
    RAIN_CODES:     [2, 3, 5],        // grupos de condición: tormenta, llovizna, lluvia
    RAIN_THRESHOLD: 0.3               // mm/h mínimo para alertar
  };

  /* ── ÍCONOS DE CLIMA ── */
  const WEATHER_ICONS = {
    clear:   '☀️',
    clouds:  '⛅',
    rain:    '🌧️',
    drizzle: '🌦️',
    thunder: '⛈️',
    snow:    '❄️',
    mist:    '🌫️',
    default: '🌤️'
  };

  /* ── FETCH CLIMA ── */
  async function fetchWeather(lat, lng) {
    if (AppState.offline) return null;

    // Usar cache si es reciente
    const now = Date.now();
    if (_weather && (now - _lastFetch) < CONFIG.CACHE_MS) {
      return _weather;
    }

    try {
      const url = `${CONFIG.API_URL}?lat=${lat}&lon=${lng}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Weather API error ${res.status}`);

      const data = await res.json();
      _weather   = parseWeatherData(data);
      _lastFetch = now;

      // Guardar en AppState
      AppState.weather = _weather;

      // Guardar en localStorage como fallback
      try {
        localStorage.setItem('follower_weather', JSON.stringify({
          data: _weather,
          at:   now
        }));
      } catch (e) {}

      return _weather;

    } catch (e) {
      console.warn('Weather: error de API:', e.message);
      return loadFromCache();
    }
  }

  /* ── PARSEAR DATOS DE OPENWEATHERMAP ── */
  function parseWeatherData(data) {
    const conditionId   = data.weather?.[0]?.id || 800;
    const conditionMain = data.weather?.[0]?.main?.toLowerCase() || 'clear';
    const desc          = data.weather?.[0]?.description || '';

    return {
      temp:        Math.round(data.main?.temp || 20),
      feelsLike:   Math.round(data.main?.feels_like || 20),
      humidity:    data.main?.humidity || 0,
      conditionId,
      conditionMain,
      description: desc,
      icon:        getWeatherIcon(conditionMain),
      isRaining:   isRaining(conditionId),
      rainMmH:     data.rain?.['1h'] || 0,
      windKmH:     Math.round((data.wind?.speed || 0) * 3.6),
      cityName:    data.name || AppState.cityName
    };
  }

  /* ── OBTENER ÍCONO ── */
  function getWeatherIcon(condition) {
    return WEATHER_ICONS[condition] || WEATHER_ICONS.default;
  }

  /* ── DETECTAR LLUVIA ── */
  function isRaining(conditionId) {
    // Códigos OWM: 2xx tormenta, 3xx llovizna, 5xx lluvia
    const group = Math.floor(conditionId / 100);
    return CONFIG.RAIN_CODES.includes(group);
  }

  /* ── CARGAR DESDE CACHE ── */
  function loadFromCache() {
    try {
      const saved = localStorage.getItem('follower_weather');
      if (!saved) return null;
      const { data, at } = JSON.parse(saved);
      // Cache válido por 2 horas aunque no haya conexión
      if (Date.now() - at < 2 * 60 * 60 * 1000) return data;
    } catch (e) {}
    return null;
  }

  /* ── CHEQUEAR CLIMA — DT-42: solo actualiza datos, ya no decide UI.
     La decision de mostrar algo (y que) vive en Care.checkCareContext(),
     que lee AppState.weather.isRaining con su propio timer y cooldown. ── */
  async function check() {
    if (!AppState.gps) return;

    const { lat, lng } = AppState.gps;
    const weather = await fetchWeather(lat, lng);

    if (!weather) return;

    // Actualizar care strip con datos de clima
    if (typeof updateCareStrip === 'function') updateCareStrip();
  }

  /* ── INICIAR CHEQUEO PERIÓDICO ── */
  function start() {
    // Primer chequeo inmediato
    check();

    // Chequeos periódicos
    if (_checkTimer) clearInterval(_checkTimer);
    _checkTimer = setInterval(check, CONFIG.CHECK_INTERVAL);
  }

  /* ── DETENER ── */
  function stop() {
    if (_checkTimer) {
      clearInterval(_checkTimer);
      _checkTimer = null;
    }
  }

  /* ── INVALIDAR CACHE — forzar fetch en la próxima llamada ──
     Usado al teletransportar a otra ciudad: el clima anterior
     no es válido para la nueva posición. */
  function invalidateCache() {
    _weather   = null;
    _lastFetch = 0;
    try {
      localStorage.removeItem('follower_weather');
    } catch (e) {}
    if (typeof Debug !== 'undefined') {
      Debug.log('info', 'Weather: cache invalidado — próximo fetch será forzado');
    }
  }

  /* ── REFRESH — invalidar y disparar fetch inmediato con posición actual ── */
  async function refresh() {
    invalidateCache();
    if (AppState.gps) {
      await check();
    }
  }

  /* ── GETTERS ── */
  function getWeather() { return _weather; }

  /* ── API PÚBLICA ── */
  return {
    start,
    stop,
    check,
    refresh,
    invalidateCache,
    getWeather
  };

})();
