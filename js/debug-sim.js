/* ═══════════════════════════════════════════
   FOLLOWER — debug-sim.js
   Simulador de GPS para probar sin caminar.
   Se registra como 5ta tab de debug.js vía
   Debug.registerTab() — debug.js no lo conoce
   por nombre, responsabilidad separada.

   Principio: nunca duplica lógica de GPS real.
   Todo movimiento entra por GPS.simulatePosition(),
   el mismo onPosition() que usa watchPosition real.
   ═══════════════════════════════════════════ */

const DebugSim = (() => {

  /* ── ESTADO INTERNO ── */
  let _mode             = 'teleport';  // 'teleport' | 'route'
  let _routePoints       = [];          // [{lat,lng}, ...] clicks en modo ruta
  let _routeLine          = null;        // L.Polyline de la ruta dibujada
  let _routeMarkers       = [];          // marcadores de cada waypoint
  let _walking             = false;       // si la interpolación está corriendo
  let _walkSpeedKmh        = 5;           // 3 | 5 | 8
  let _tickIntervalMs      = 5000;        // throttle de chequeo de POIs
  let _animFrameId         = null;
  let _walkStartTs          = null;
  let _clickHandlerBound    = false;
  let _lastCityResults      = [];

  // Acumulado sístole/diástole — no existe en otro lado, AppState solo
  // guarda la fase ACTUAL, no el historial de tiempo en cada una
  let _phaseAccum   = { systole: 0, diastole: 0, rest: 0 };
  let _lastPhase    = null;
  let _lastPhaseTs  = null;
  let _narrationsTriggered = 0;

  const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

  /* ── INIT ── */
  function init() {
    if (typeof Debug === 'undefined') {
      console.warn('DebugSim: Debug no está cargado, no se puede registrar tab');
      return;
    }
    Debug.registerTab('simular', '🎮 Simular', renderTab);
    startBackgroundTracking();
  }

  /* ── TRACKING DE FASE + AUTO-REFRESH — un solo timer liviano ── */
  function startBackgroundTracking() {
    setInterval(() => {
      if (typeof AppState === 'undefined') return;
      const now   = performance.now();
      const phase = AppState.phase || 'systole';

      if (_lastPhase !== null && _lastPhaseTs !== null) {
        const elapsed = now - _lastPhaseTs;
        if (_phaseAccum[_lastPhase] !== undefined) {
          _phaseAccum[_lastPhase] += elapsed;
        }
      }

      // Transición systole -> diastole = una narración se disparó
      if (_lastPhase === 'systole' && phase === 'diastole') {
        _narrationsTriggered++;
      }

      _lastPhase   = phase;
      _lastPhaseTs = now;

      refreshTabIfActive();
    }, 500);
  }

  /* ── ¿LA TAB SIMULAR ESTÁ VISIBLE AHORA MISMO? ──
     Lee el estado que ya pone switchTab() en el botón — sin esto,
     el timer de arriba pisaría el contenido de otras tabs. */
  function isSimTabActive() {
    const btn = document.querySelector('.dbg-tab[data-tab="simular"]');
    return !!(btn && btn.classList.contains('active'));
  }

  function refreshTabIfActive() {
    if (!isSimTabActive()) return;
    const content = document.getElementById('dbg-content');
    if (!content) return;
    content.innerHTML = renderTabInner();
  }

  /* ── LISTENER DE CLICK EN EL MAPA — una sola vez ── */
  function ensureMapClickListener() {
    if (_clickHandlerBound) return;
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (!map) return;
    map.on('click', handleMapClick);
    _clickHandlerBound = true;
  }

  function handleMapClick(e) {
    const { lat, lng } = e.latlng;
    if (_mode === 'teleport') {
      teleportTo(lat, lng);
    } else {
      addRoutePoint(lat, lng);
    }
  }

  /* ── MODO TELETRANSPORTAR ── */
  function teleportTo(lat, lng) {
    if (typeof GPS === 'undefined') return;
    GPS.stop(); // pausar GPS real — nunca deben competir los dos
    GPS.simulatePosition(lat, lng, 5);
    ensureMapClickListener();
    refreshTabIfActive();
  }

  /* ── MODO DIBUJAR RUTA ── */
  function addRoutePoint(lat, lng) {
    const map = GPS.getMap();
    if (!map) return;

    _routePoints.push({ lat, lng });

    const marker = L.circleMarker([lat, lng], {
      radius:      5,
      color:       '#f0c87a',
      fillColor:   '#f0c87a',
      fillOpacity: 1,
      weight:      2
    }).addTo(map);
    _routeMarkers.push(marker);

    const latlngs = _routePoints.map(p => [p.lat, p.lng]);
    if (_routeLine) {
      _routeLine.setLatLngs(latlngs);
    } else {
      _routeLine = L.polyline(latlngs, {
        color:       '#f0c87a',
        weight:      3,
        dashArray:   '5,4'
      }).addTo(map);
    }

    refreshTabIfActive();
  }

  function clearRoute() {
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (map) {
      if (_routeLine) map.removeLayer(_routeLine);
      _routeMarkers.forEach(m => map.removeLayer(m));
    }
    _routeLine    = null;
    _routeMarkers = [];
    _routePoints  = [];
    stopWalking();
    refreshTabIfActive();
  }

  /* ── CAMINAR LA RUTA — interpolación con requestAnimationFrame ── */
  function startWalking() {
    if (_routePoints.length < 2) {
      if (typeof Debug !== 'undefined') {
        Debug.log('error', 'DebugSim: hace falta al menos 2 puntos para caminar');
      }
      return;
    }
    if (typeof GPS === 'undefined') return;

    GPS.stop();
    _walking     = true;
    _walkStartTs = null;
    _animFrameId = requestAnimationFrame(walkStep);
    refreshTabIfActive();
  }

  function pauseWalking() {
    _walking = false;
    if (_animFrameId) cancelAnimationFrame(_animFrameId);
    _animFrameId = null;
    refreshTabIfActive();
  }

  function stopWalking() {
    pauseWalking();
  }

  function walkStep(ts) {
    if (!_walking) return;
    if (!_walkStartTs) _walkStartTs = ts;

    const elapsedS = (ts - _walkStartTs) / 1000;
    const speedMps = (_walkSpeedKmh * 1000) / 3600;
    const traveledM = speedMps * elapsedS;

    const point = pointAtDistance(_routePoints, traveledM);

    if (!point) {
      // Llegó al final de la ruta
      pauseWalking();
      return;
    }

    GPS.simulatePosition(point.lat, point.lng, 5);
    _animFrameId = requestAnimationFrame(walkStep);
  }

  /* ── INTERPOLACIÓN LINEAL a lo largo de los waypoints ──
     Suficiente para tramos urbanos cortos — no es geodesia exacta,
     pero para probar el pipeline de POIs no hace falta más precisión. */
  function pointAtDistance(points, distanceM) {
    let remaining = distanceM;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const segMeters = GPS.distanceMeters(a.lat, a.lng, b.lat, b.lng);

      if (remaining <= segMeters) {
        const frac = segMeters === 0 ? 0 : remaining / segMeters;
        return {
          lat: a.lat + (b.lat - a.lat) * frac,
          lng: a.lng + (b.lng - a.lng) * frac
        };
      }
      remaining -= segMeters;
    }
    return null; // se acabó la ruta
  }

  /* ── BÚSQUEDA DE CIUDAD (Nominatim /search) ──
     Mismo proveedor que ya usa gps.js para reverse geocoding,
     sin key nueva, solo el endpoint /search en vez de /reverse. */
  async function searchCity(query) {
    if (!query || query.trim().length < 2) return;

    const resultsEl = document.getElementById('dbg-sim-city-results');
    if (resultsEl) resultsEl.innerHTML = '<div class="dbg-poi-meta">Buscando...</div>';

    try {
      const url  = `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const res  = await fetch(url);
      const data = await res.json();
      renderCityResults(data);
    } catch (e) {
      if (resultsEl) resultsEl.innerHTML = '<div class="dbg-poi-meta">Error buscando ciudad</div>';
    }
  }

  function renderCityResults(results) {
    _lastCityResults = results || [];
    const el = document.getElementById('dbg-sim-city-results');
    if (!el) return;

    if (_lastCityResults.length === 0) {
      el.innerHTML = '<div class="dbg-poi-meta">Sin resultados</div>';
      return;
    }

    el.innerHTML = _lastCityResults.map((r, i) => `
      <div class="dbg-result-item" onclick="DebugSim.jumpToCityResult(${i})">
        <div class="dbg-poi-name">${escapeHtml(r.display_name.split(',')[0])}</div>
        <div class="dbg-poi-meta">${escapeHtml(r.display_name)}</div>
      </div>
    `).join('');
  }

  function jumpToCityResult(i) {
    const r = _lastCityResults[i];
    if (!r) return;

    teleportTo(parseFloat(r.lat), parseFloat(r.lon));

    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (map) map.setView([parseFloat(r.lat), parseFloat(r.lon)], 15);

    const resultsEl = document.getElementById('dbg-sim-city-results');
    if (resultsEl) resultsEl.innerHTML = '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  /* ── CONTROLES DE UI ── */
  function setMode(mode) {
    _mode = mode;
    if (mode === 'teleport') stopWalking();
    refreshTabIfActive();
  }

  function setSpeed(kmh) {
    _walkSpeedKmh = kmh;
    refreshTabIfActive();
  }

  function setTickInterval(ms) {
    _tickIntervalMs = parseInt(ms, 10);
    if (typeof GPS !== 'undefined') GPS.setPOICheckInterval(_tickIntervalMs);
  }

  function backToRealGPS() {
    stopWalking();
    if (typeof GPS !== 'undefined') {
      GPS.setPOICheckInterval(5000); // restaurar default de producción
      GPS.start();
    }
    refreshTabIfActive();
  }

  function skipToFreeMode() {
    if (typeof hideModal === 'function')  hideModal('config');
    if (typeof hideModal === 'function')  hideModal('mode');
    if (typeof Config !== 'undefined')    Config.setMode('free');
    if (typeof AppState !== 'undefined')  AppState.mode = 'free';
    if (typeof navigateTo === 'function') navigateTo('explore');
    if (typeof initExplore === 'function') initExplore();
  }

  /* ── RENDER ── */
  function renderTab() {
    ensureMapClickListener();
    return renderTabInner();
  }

  function renderTabInner() {
    const phaseTotal   = _phaseAccum.systole + _phaseAccum.diastole + _phaseAccum.rest || 1;
    const sistolePct   = Math.round((_phaseAccum.systole / phaseTotal) * 100);
    const diastolePct  = Math.round((_phaseAccum.diastole / phaseTotal) * 100);

    const poisLoaded  = (typeof AppState !== 'undefined') ? (AppState.nearbyPOIs?.length || 0) : 0;
    const poisVisited = (typeof AppState !== 'undefined') ? (AppState.poisVisited || 0) : 0;
    const inFlight     = (typeof Debug !== 'undefined') ? Debug.getInFlightCount('poi') : 0;
    const mapReady      = (typeof GPS !== 'undefined') && !!GPS.getMap();

    return `
      <div class="dbg-poi-meta" style="margin-bottom:8px;">
        ${mapReady
          ? ('Click en el mapa para ' + (_mode === 'teleport' ? 'teletransportar' : 'agregar punto de ruta'))
          : 'Buscá una ciudad abajo para inicializar el mapa'}
      </div>

      <div class="dbg-input-row">
        <input id="dbg-sim-city-input" class="dbg-input" placeholder="Buscar ciudad..."
               onkeydown="if(event.key==='Enter'){DebugSim.searchCity(this.value); event.preventDefault();}" />
        <button class="dbg-btn" onclick="DebugSim.searchCity(document.getElementById('dbg-sim-city-input').value)">Buscar</button>
      </div>
      <div id="dbg-sim-city-results"></div>

      <div class="dbg-poi-btn-row" style="margin-top:10px;">
        <button class="dbg-poi-action ${_mode === 'teleport' ? 'narrate' : 'map'}" onclick="DebugSim.setMode('teleport')">📍 Teletransportar</button>
        <button class="dbg-poi-action ${_mode === 'route' ? 'narrate' : 'map'}" onclick="DebugSim.setMode('route')">🛤️ Dibujar ruta</button>
      </div>

      ${_mode === 'route' ? `
        <div class="dbg-poi-meta" style="margin:8px 0 4px;">${_routePoints.length} puntos en la ruta</div>
        <div class="dbg-poi-btn-row">
          <button class="dbg-poi-action narrate" onclick="DebugSim.${_walking ? 'pauseWalking' : 'startWalking'}()">${_walking ? '⏸ Pausar' : '▶ Caminar'}</button>
          <button class="dbg-poi-action map" onclick="DebugSim.clearRoute()">🗑️ Limpiar ruta</button>
        </div>
      ` : ''}

      <div class="dbg-slider-row">
        <div class="dbg-slider-label"><span>Velocidad de caminata</span></div>
        <div class="dbg-poi-btn-row">
          <button class="dbg-poi-action ${_walkSpeedKmh === 3 ? 'narrate' : 'map'}" onclick="DebugSim.setSpeed(3)">3 km/h</button>
          <button class="dbg-poi-action ${_walkSpeedKmh === 5 ? 'narrate' : 'map'}" onclick="DebugSim.setSpeed(5)">5 km/h</button>
          <button class="dbg-poi-action ${_walkSpeedKmh === 8 ? 'narrate' : 'map'}" onclick="DebugSim.setSpeed(8)">8 km/h</button>
        </div>
      </div>

      <div class="dbg-slider-row">
        <div class="dbg-slider-label"><span>Intervalo chequeo POI</span><span id="dbg-sim-tick-val">${_tickIntervalMs}ms</span></div>
        <input type="range" class="dbg-slider" min="1500" max="5000" step="250" value="${_tickIntervalMs}"
               oninput="DebugSim.setTickInterval(this.value); document.getElementById('dbg-sim-tick-val').textContent = this.value + 'ms'" />
      </div>

      <div class="dbg-grid" style="margin-top:10px;">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Sístole / Diástole</div>
          <div class="dbg-cell-value">${sistolePct}% / ${diastolePct}%</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">POIs cargados</div>
          <div class="dbg-cell-value">${poisLoaded}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">POIs visitados</div>
          <div class="dbg-cell-value">${poisVisited}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Narraciones</div>
          <div class="dbg-cell-value ${_narrationsTriggered > 0 ? 'ok' : ''}">${_narrationsTriggered}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Fetches Overpass en vuelo</div>
          <div class="dbg-cell-value ${inFlight > 0 ? 'warn' : 'ok'}">${inFlight}</div>
        </div>
      </div>
      <div class="dbg-poi-meta" style="margin-top:4px;">
        <a href="#" onclick="Debug.switchTab('timing'); return false;" style="color:#c0392b;">Ver detalle en tab Tiempos →</a>
      </div>

      <div class="dbg-poi-btn-row" style="margin-top:12px;">
        <button class="dbg-poi-action map" onclick="DebugSim.backToRealGPS()">📡 Volver a GPS real</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action narrate" onclick="DebugSim.skipToFreeMode()">🚀 Saltar a Modo Libre</button>
      </div>
    `;
  }

  init();

  /* ── API PÚBLICA ── */
  return {
    searchCity,
    jumpToCityResult,
    setMode,
    setSpeed,
    setTickInterval,
    startWalking,
    pauseWalking,
    clearRoute,
    backToRealGPS,
    skipToFreeMode
  };

})();
