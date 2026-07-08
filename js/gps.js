/* ═══════════════════════════════════════════
   FOLLOWER — gps.js
   Ubicación en tiempo real, mapa Leaflet,
   detección de movimiento, ciudad actual.
   El GPS nunca se interrumpe — DA-7
   ═══════════════════════════════════════════ */

const GPS = (() => {

  /* ── ESTADO INTERNO ── */
  let _map          = null;   // instancia de Leaflet
  let _userMarker   = null;   // marcador del usuario en el mapa
  let _watchId      = null;   // ID del watchPosition
  let _lastPos      = null;   // última posición conocida
  let _lastPOICheck = 0;      // timestamp del ultimo checkeo de POIs
  let _lastSigMoveTs  = null;  // DT-40: timestamp del ultimo movimiento significativo
  let _lastSigMovePos = null;  // DT-40: posicion del ultimo movimiento significativo

  /* ── DA-55: pausa de deteccion en transito rapido ── */
  let _lastPosTs             = null;   // timestamp de la ultima lectura (para calcular velocidad)
  let _transitSustainedStart = null;   // ts desde que la velocidad supera el umbral sin cortarse
  let _inTransitPause        = false;  // true = detectNearby() pausado, GPS sigue corriendo

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    POI_CHECK_INTERVAL: 5000,    // ms entre chequeos de POIs cercanos
    POI_RADIUS_METERS:  120,     // radio para activar narración (era 80 — muy estricto con GPS urbano)
    NEARBY_RADIUS:      300,     // radio para mostrar pin como "cercano"
    STEPS_PER_METER:    1.3,     // pasos por metro (estimado)
    CITY_UPDATE_KM:     0.5,     // actualizar nombre de ciudad cada 500m
    MAP_ZOOM:           17,      // zoom inicial del mapa
    MAP_ZOOM_MIN:       14,
    MAP_ZOOM_MAX:       19,
    // DA-55: pausa de deteccion durante transito rapido (taxi, bus, metro)
    TRANSIT_SPEED_KMH:  15,       // umbral inferior del rango 15-18 — conservador, prefiere no perder POIs reales
    TRANSIT_WINDOW_MS:  45000     // 45s — punto medio del rango 30-60s sostenidos, evita falsos positivos por caminata energ.
  };

  /* ── INICIALIZAR MAPA LEAFLET ── */
  function initMap(lat, lng) {
    if (_map) return;

    _map = L.map('map', {
      center:          [lat, lng],
      zoom:            CONFIG.MAP_ZOOM,
      zoomControl:     false,
      attributionControl: false,
      dragging:        true,
      touchZoom:       true,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      minZoom:         CONFIG.MAP_ZOOM_MIN,
      maxZoom:         CONFIG.MAP_ZOOM_MAX
    });

    // Tiles CartoDB Voyager — DA-13 revisado otra vez: Positron resultó
    // demasiado minimalista (sin parques/agua/etiquetas suficientes).
    // Voyager da color + info manteniendo legibilidad, más cerca de Google Maps
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom:      CONFIG.MAP_ZOOM_MAX,
      attribution:  '',
      subdomains:   'abcd',
      detectRetina: true
    }).addTo(_map);

    // Marcador del usuario — se crea con posición inicial
    _userMarker = L.marker([lat, lng], {
      icon:         _buildUserIcon(false, 0),
      zIndexOffset: 1000
    }).addTo(_map);
  }

  /* ── CONSTRUIR ICON DEL USUARIO (con o sin cono) ── */
  function _buildUserIcon(showCone, heading) {
    const coneHtml = showCone ? `
      <svg style="position:absolute;top:0;left:0;width:80px;height:80px;overflow:visible;pointer-events:none;"
           viewBox="-40 -40 80 80">
        <defs>
          <radialGradient id="coneG" cx="50%" cy="100%" r="100%">
            <stop offset="0%"   stop-color="#1a5276" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#1a5276" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <g transform="rotate(${heading})">
          <path d="M0,0 L-16,-36 A38,38 0 0,1 16,-36 Z" fill="url(#coneG)"/>
          <line x1="0" y1="0" x2="-16" y2="-36" stroke="rgba(26,82,118,0.3)" stroke-width="1"/>
          <line x1="0" y1="0" x2="16"  y2="-36" stroke="rgba(26,82,118,0.3)" stroke-width="1"/>
        </g>
      </svg>` : '';

    return L.divIcon({
      className:  '',
      html: `<div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
               ${coneHtml}
               <div class="user-marker" style="position:relative;z-index:2;">
                 <div class="user-pulse"></div>
                 <div class="user-pulse"></div>
                 <div class="user-dot"></div>
               </div>
             </div>`,
      iconSize:   [80, 80],
      iconAnchor: [40, 40]
    });
  }

  /* ── ACTUALIZAR ICON DEL USUARIO ── */
  function _updateUserIcon(showCone, heading) {
    if (_userMarker) {
      _userMarker.setIcon(_buildUserIcon(showCone, heading));
    }
  }

  /* ── ACTUALIZAR POSICIÓN EN EL MAPA ── */
  function updateUserPosition(lat, lng) {
    if (!_map || !_userMarker) return;
    _userMarker.setLatLng([lat, lng]);
  }

  /* ── CONO DE DIRECCIÓN ── */
  let _coneActive  = false;
  let _coneHeading = 0;

  function showHeadingCone(visible) {
    _coneActive = visible;
    _updateUserIcon(visible, _coneHeading);
  }

  function updateHeadingCone(heading) {
    _coneHeading = heading;
    if (_coneActive) _updateUserIcon(true, heading);
  }

  /* ── CENTRAR MAPA EN EL USUARIO ── */
  function centerMap() {
    if (!_map || !AppState.gps) return;
    _map.setView(
      [AppState.gps.lat, AppState.gps.lng],
      CONFIG.MAP_ZOOM,
      { animate: true, duration: 0.5 }
    );
  }

  /* ── CALCULAR DISTANCIA entre dos puntos (metros) ── */
  function distanceMeters(lat1, lng1, lat2, lng2) {
    const R    = 6371000; // radio tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(lat1 * Math.PI / 180) *
                 Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ── CALCULAR KM RECORRIDOS ── */
  function updateDistance(newLat, newLng) {
    if (!_lastPos) return;

    const meters = distanceMeters(
      _lastPos.lat, _lastPos.lng,
      newLat, newLng
    );

    // Filtrar saltos GPS (> 50m en un tick = error de GPS)
    if (meters > 50) return;

    AppState.kmWalked += meters / 1000;
    AppState.steps    += Math.round(meters * CONFIG.STEPS_PER_METER);

    updateStats();
  }

  /* ── OBTENER NOMBRE DE CIUDAD (Nominatim) ── */
  async function fetchCityName(lat, lng) {
    // Instrumentacion puente S25d — sin esta visibilidad no se puede
    // diagnosticar por que Nominatim no resuelve (red, CORS, sin campo de
    // ciudad). Diseño DT-60 (mover esta llamada al wizard) depende de saber
    // cuanto tarda esto en la practica.
    if (AppState.offline) {
      if (typeof Debug !== 'undefined') {
        Debug.log('warn', 'fetchCityName: abortado — AppState.offline=true');
      }
      return;
    }

    const _t0 = performance.now();

    try {
      const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res  = await fetch(url);
      const data = await res.json();
      const _ms  = Math.round(performance.now() - _t0);

      const city = data.address?.city
                || data.address?.town
                || data.address?.village
                || data.address?.county
                || '';

      const country = data.address?.country_code?.toUpperCase() || '';

      if (city) {
        const isFirst = !AppState.cityName;
        AppState.cityName   = country ? `${city}, ${country}` : city;
        AppState.countryCode = country;  // DT-41: para getLocalLang en bienvenida
        updateCareStrip();  // BUG-048: updateTopPill no existe desde v0.6 (refactor v0.6 incompleto)

        if (typeof Debug !== 'undefined') {
          Debug.log('info', `fetchCityName: OK "${city}, ${country}" · ${_ms}ms · status=${res.status}`);
        }

        // Bienvenida de ciudad — solo la primera vez que se detecta
        if (isFirst && typeof welcomeCity === 'function') {
          welcomeCity(city, country);
        }
      } else if (typeof Debug !== 'undefined') {
        Debug.log('warn', `fetchCityName: sin campo de ciudad utilizable · ${_ms}ms · status=${res.status} · address=${JSON.stringify(data.address || {})}`);
      }
    } catch (e) {
      const _ms = Math.round(performance.now() - _t0);
      if (typeof Debug !== 'undefined') {
        Debug.log('error', `fetchCityName: excepcion tras ${_ms}ms — ${e.message}`);
      }
      // Sin conexión o error — mantener cityName anterior (comportamiento sin cambios)
    }
  }

  /* ── DA-55: PAUSA DE DETECCIÓN EN TRÁNSITO RÁPIDO ──
     GPS nunca se detiene — solo se suspende la evaluación de detectNearby().
     Requiere velocidad sostenida (no un pico instantáneo) para evitar
     falsos positivos por caminata enérgica o trote cuesta abajo. */
  function _updateTransitState(lat, lng, now) {
    if (_lastPos && _lastPosTs) {
      const meters = distanceMeters(_lastPos.lat, _lastPos.lng, lat, lng);
      const dtS = (now - _lastPosTs) / 1000;

      // Ignorar ticks demasiado seguidos (ruido) o gaps largos (app en background)
      if (dtS > 0.5 && dtS < 30) {
        const speedKmh = (meters / dtS) * 3.6;

        if (speedKmh >= CONFIG.TRANSIT_SPEED_KMH) {
          if (_transitSustainedStart === null) _transitSustainedStart = now;

          if (!_inTransitPause && (now - _transitSustainedStart) >= CONFIG.TRANSIT_WINDOW_MS) {
            _inTransitPause = true;
            if (typeof Debug !== 'undefined') {
              Debug.log('info', `GPS: pausando detección de POIs — tránsito sostenido a ${Math.round(speedKmh)}km/h`);
            }
          }
        } else {
          _transitSustainedStart = null;
          if (_inTransitPause) {
            _inTransitPause = false;
            if (typeof Debug !== 'undefined') {
              Debug.log('info', 'GPS: reanudando detección de POIs — velocidad normal');
            }
          }
        }
      }
    }
    _lastPosTs = now;
  }

  /* ── CALLBACK PRINCIPAL DE POSICIÓN ── */
  function onPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const acc = position.coords.accuracy;

    // Actualizar AppState
    const prevPos = AppState.gps;
    AppState.gps = { lat, lng, accuracy: acc };

    // Inicializar mapa si es la primera posición
    if (!_map) {
      initMap(lat, lng);
      fetchCityName(lat, lng);
    }

    // Actualizar marcador en el mapa
    updateUserPosition(lat, lng);

    // Actualizar distancia recorrida
    if (_lastPos) {
      updateDistance(lat, lng);

      // DA-55: velocidad sostenida — necesita _lastPos ANTES de sobreescribirlo abajo
      _updateTransitState(lat, lng, Date.now());

      // Actualizar ciudad si nos movimos más de CITY_UPDATE_KM
      const kmMoved = distanceMeters(
        _lastPos.lat, _lastPos.lng, lat, lng
      ) / 1000;

      if (kmMoved > CONFIG.CITY_UPDATE_KM) {
        fetchCityName(lat, lng);
      }
    }

    _lastPos = { lat, lng };

    // Chequear POIs cercanos — con throttle
    const now = Date.now();
    if (now - _lastPOICheck > CONFIG.POI_CHECK_INTERVAL) {
      _lastPOICheck = now;
      // DA-55: en tránsito sostenido se pausa SOLO detectNearby() — Care sigue
      // evaluando (lluvia/calor pueden anunciarse igual yendo en taxi)
      if (!_inTransitPause) {
        if (typeof POI !== 'undefined') {
          POI.detectNearby(lat, lng, CONFIG.POI_RADIUS_METERS, CONFIG.NEARBY_RADIUS);
        }
      }
      if (typeof Care !== 'undefined') {
        Care.check();
        Care.checkSpecialZone(lat, lng);  // DT-43: densidad de POIs
      }
    }

    // DT-40: detectar inactividad para posible cierre de caminata
    const INACT_THRESHOLD_MS = 10 * 60 * 1000;  // 10 minutos
    const INACT_MIN_MOVE_M   = 30;               // movimiento minimo significativo
    const INACT_MIN_KM       = 0.5;              // caminata minima para activarse

    if (AppState.kmWalked >= INACT_MIN_KM) {
      if (_lastSigMovePos) {
        const movedM = distanceMeters(lat, lng, _lastSigMovePos.lat, _lastSigMovePos.lng);
        if (movedM >= INACT_MIN_MOVE_M) {
          _lastSigMoveTs  = now;
          _lastSigMovePos = { lat, lng };
        } else if ((now - _lastSigMoveTs) >= INACT_THRESHOLD_MS) {
          if (typeof onWalkInactivity === 'function') {
            onWalkInactivity();
          }
          _lastSigMoveTs = now;  // reset — no volver a disparar hasta otro periodo
        }
      } else {
        _lastSigMoveTs  = now;
        _lastSigMovePos = { lat, lng };
      }
    }
  }

  /* ── CALLBACK DE ERROR ── */
  function onError(error) {
    console.warn('GPS error:', error.message);

    // Si no hay posición previa, intentar con IP (muy impreciso pero algo)
    if (!AppState.gps && !AppState.offline) {
      fetchCityByIP();
    }
  }

  /* ── FALLBACK — ciudad por IP ── */
  async function fetchCityByIP() {
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.city) {
        AppState.cityName = `${data.city}, ${data.country_code || ''}`;
        updateCareStrip();  // BUG-048

        // Bienvenida de ciudad — fallback por IP
        if (typeof welcomeCity === 'function') {
          welcomeCity(data.city);
        }

        // Inicializar mapa en la ciudad detectada
        if (data.latitude && data.longitude && !_map) {
          initMap(data.latitude, data.longitude);
        }
      }
    } catch (e) {
      AppState.cityName = 'Tu ciudad';
      updateCareStrip();  // BUG-048
    }
  }

  /* ── INICIAR GPS ── */
  function start() {
    if (!navigator.geolocation) {
      console.warn('GPS: geolocalización no disponible');
      fetchCityByIP();
      return;
    }

    // Primera posición rápida
    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout:            10000,
      maximumAge:         0
    });

    // Seguimiento continuo — NUNCA se detiene (DA-7)
    _watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout:            15000,
      maximumAge:         3000
    });
  }

  /* ── DETENER GPS — solo en emergencias ── */
  function stop() {
    if (_watchId !== null) {
      navigator.geolocation.clearWatch(_watchId);
      _watchId = null;
    }
  }

  /* ── SIMULAR POSICIÓN (para debug-sim.js) ──
     Arma un objeto position falso con la misma forma que entrega
     watchPosition real, y lo pasa directo a onPosition(). El simulador
     nunca duplica lógica de GPS real — entra por el mismo camino. */
  function simulatePosition(lat, lng, accuracy = 5) {
    onPosition({
      coords: {
        latitude:  lat,
        longitude: lng,
        accuracy:  accuracy
      },
      timestamp: Date.now()
    });
  }

  /* ── AJUSTAR THROTTLE DE CHEQUEO DE POIs (para debug-sim.js) ──
     Permite al simulador bajar el intervalo (ej. 1500-2000ms) para
     estresar el candado de concurrencia de poi.js a demanda. */
  function setPOICheckInterval(ms) {
    if (typeof ms === 'number' && ms > 0) {
      CONFIG.POI_CHECK_INTERVAL = ms;
    }
  }

  /* ── EXPONER RADIOS DE CONFIG (solo lectura) ──
     Devuelve una copia, no la referencia — el simulador puede leer
     pero no mutar CONFIG directamente. */
  function getRadiusConfig() {
    return {
      poiRadius:     CONFIG.POI_RADIUS_METERS,
      nearbyRadius:  CONFIG.NEARBY_RADIUS
    };
  }

  /* ── AGREGAR MARCADOR POI AL MAPA ── */
  function addPOIMarker(poi) {
    if (!_map) return null;

    const isActive  = AppState.activePOI?.id === poi.id;
    const distMeters = AppState.gps
      ? distanceMeters(AppState.gps.lat, AppState.gps.lng, poi.lat, poi.lng)
      : 999;
    const isNearby  = distMeters <= 300;

    const pinClass  = isActive ? 'active' : isNearby ? 'nearby' : 'far';
    const labelClass = isActive ? 'active' : '';

    const icon = L.divIcon({
      className: '',
      html: `<div class="poi-marker-wrap">
               <div class="poi-pin ${pinClass}">
                 <div class="poi-pin-inner">${poi.icon || '📍'}</div>
               </div>
               <div class="poi-pin-label ${labelClass}">
                 ${poi.name}${isActive ? ` · ${Math.round(distMeters)}m` : ''}
               </div>
             </div>`,
      iconSize:   [80, 60],
      iconAnchor: [40, 48]
    });

    const marker = L.marker([poi.lat, poi.lng], { icon })
      .addTo(_map)
      .on('click', () => {
        if (typeof POI !== 'undefined') POI.onMarkerTap(poi);
      });

    return marker;
  }

  /* ── API PÚBLICA ── */
  return {
    start,
    stop,
    centerMap,
    distanceMeters,
    addPOIMarker,
    showHeadingCone,
    updateHeadingCone,
    getMap: () => _map,
    simulatePosition,
    setPOICheckInterval,
    getRadiusConfig,
    isInTransit: () => _inTransitPause  // DA-55: para mostrar estado en tab Simular
  };

})();
