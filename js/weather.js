/* ═══════════════════════════════════════════
   FOLLOWER — weather.js
   Clima en tiempo real con OpenWeatherMap.
   Alertas de lluvia, cache 30 min, fallback.
   ═══════════════════════════════════════════ */

const Weather = (() => {

  /* ── ESTADO INTERNO ── */
  let _weather      = null;    // datos de clima actuales
  let _lastFetch    = 0;       // timestamp del último fetch
  let _alertShown   = false;   // para no repetir la alerta
  let _checkTimer   = null;    // timer de chequeo periódico

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    API_KEY:        KEYS.openWeatherMap, // reemplazar con .env
    API_URL:        'https://api.openweathermap.org/data/2.5/weather',
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
      const url = `${CONFIG.API_URL}?lat=${lat}&lon=${lng}&appid=${CONFIG.API_KEY}&units=metric`;
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

  /* ── MOSTRAR ALERTA DE LLUVIA ── */
  function showRainAlert(weather) {
    if (_alertShown) return;
    _alertShown = true;

    const careCard = document.getElementById('careCard');
    if (!careCard) return;

    // Estilo lluvia
    careCard.classList.add('rain');

    // Contenido
    const title  = document.getElementById('careTitle');
    const badge  = document.getElementById('careBadge');
    const meta   = document.getElementById('careMeta');
    const text   = document.getElementById('careText');
    const btnAcc = document.getElementById('btnCareAccept');
    const btnDis = document.getElementById('btnCareDismiss');

    if (title)  title.textContent  = `${weather.icon} Se viene lluvia`;
    if (badge)  badge.textContent  = `${weather.temp}°C`;
    if (meta)   meta.textContent   = weather.description;
    if (text)   text.textContent   = 'Va a llover en los próximos minutos. Busquemos un lugar cercano donde esperar.';
    if (btnAcc) {
      btnAcc.textContent = 'Ver refugio cercano →';
      btnAcc.onclick     = () => findNearbyRefuge();
    }
    if (btnDis) {
      btnDis.textContent = 'Seguir igual';
      btnDis.onclick     = () => dismissAlert();
    }

    // Cambiar fase a alerta
    setPhase('alert');

    // Mostrar card
    careCard.classList.remove('hidden');
  }

  /* ── BUSCAR REFUGIO CERCANO ── */
  function findNearbyRefuge() {
    // Buscar café, bar, museo o biblioteca cercano
    if (!AppState.gps) return;

    const { lat, lng } = AppState.gps;
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"~"cafe|bar|library|museum"](around:400,${lat},${lng});
      );
      out 3;
    `;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body:   `data=${encodeURIComponent(query)}`
    })
    .then(r => r.json())
    .then(data => {
      const places = data.elements || [];
      if (places.length > 0) {
        const place = places[0];
        showRefugeSuggestion(place);
      }
    })
    .catch(() => dismissAlert());
  }

  /* ── MOSTRAR SUGERENCIA DE REFUGIO ── */
  function showRefugeSuggestion(place) {
    const tags = place.tags || {};
    const name = tags.name || 'lugar cercano';
    const type = tags.amenity || 'refugio';

    const icons = { cafe: '☕', bar: '🍺', library: '📚', museum: '🖼️' };
    const icon  = icons[type] || '🏠';

    const title  = document.getElementById('careTitle');
    const meta   = document.getElementById('careMeta');
    const text   = document.getElementById('careText');
    const btnAcc = document.getElementById('btnCareAccept');

    if (title)  title.textContent = `${icon} ${name}`;
    if (meta)   meta.textContent  = `${type} · a pocos metros`;
    if (text)   text.textContent  = 'Perfecto para esperar que pase la lluvia y continuar explorando.';
    if (btnAcc) {
      btnAcc.textContent = 'Ir aquí →';
      btnAcc.onclick     = () => {
        // Centrar mapa en el refugio
        const map = GPS.getMap();
        if (map) map.setView([place.lat, place.lon], 18, { animate: true });
        dismissAlert();
      };
    }
  }

  /* ── DESCARTAR ALERTA ── */
  function dismissAlert() {
    const careCard = document.getElementById('careCard');
    if (careCard) {
      careCard.classList.add('hidden');
      careCard.classList.remove('rain');
    }

    // Volver a la fase anterior
    if (AppState.activePOI) {
      setPhase('diastole');
    } else {
      setPhase('systole');
    }
  }

  /* ── CHEQUEAR CLIMA ── */
  async function check() {
    if (!AppState.gps) return;

    const { lat, lng } = AppState.gps;
    const weather = await fetchWeather(lat, lng);

    if (!weather) return;

    // Actualizar top pill con temperatura si hay espacio
    // (solo si no hay POI activo para no saturar)
    if (!AppState.activePOI) {
      const moodEl = document.getElementById('topMood');
      if (moodEl && AppState.phase !== 'alert') {
        // Mostrar temp discretamente
        const label = Config.getMoodLabel();
        moodEl.textContent = `${label} · ${weather.temp}°C`;
      }
    }

    // Alertar si llueve y no hemos alertado ya
    if (weather.isRaining && !_alertShown) {
      showRainAlert(weather);
    }

    // Resetear alerta si ya no llueve
    if (!weather.isRaining && _alertShown) {
      _alertShown = false;
    }
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

  /* ── GETTERS ── */
  function getWeather() { return _weather; }

  /* ── API PÚBLICA ── */
  return {
    start,
    stop,
    check,
    getWeather
  };

})();
