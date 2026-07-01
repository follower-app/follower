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
  let _cityQuery        = '';           // valor del input de ciudad — preservado entre re-renders
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
  let _narrationLayer       = null;   // L.LayerGroup de marcadores narrativos

  const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

  /* ── INIT ── */
  function init() {
    if (typeof Debug === 'undefined') {
      console.warn('DebugSim: Debug no está cargado, no se puede registrar tab');
      return;
    }
    Debug.registerTab('simular', '🎮 Simular', renderTab);
    startAutoRefreshTab();
  }

  /* ── AUTO REFRESH DE LA TAB — timer liviano ── */
  function startAutoRefreshTab() {
    setInterval(() => refreshTabIfActive(), 500);
  }

  /* ── ¿LA TAB SIMULAR ESTÁ VISIBLE AHORA MISMO? ──
     Lee el estado que ya pone switchTab() en el botón — sin esto,
     el timer de arriba pisaría el contenido de otras tabs. */
  function isSimTabActive() {
    const btn   = document.querySelector('.dbg-tab[data-tab="simular"]');
    const panel = document.getElementById('dbg-panel');
    return !!(btn && btn.classList.contains('active') && panel && !panel.classList.contains('hidden'));
  }

  function refreshTabIfActive() {
    if (!isSimTabActive()) return;
    const content = document.getElementById('dbg-content');
    if (!content) return;

    // Si el input tiene foco: solo actualizar stats sin tocar el input
    const cityInput = document.getElementById('dbg-sim-city-input');
    if (cityInput && document.activeElement === cityInput) {
      _updateStatsOnly();
      return;
    }

    content.innerHTML = renderTabInner();
    bindCityInputListeners();
    _updateNarrationMarkers();

    // Restaurar resultados de búsqueda si los había — el timer los habría borrado
    if (_lastCityResults.length > 0) _renderCityResultsInDOM();
  }

  function _updateStatsOnly() {
    const s   = typeof AppState !== 'undefined' ? AppState : {};
    const now = performance.now();

    const inFlight   = (typeof Debug !== 'undefined') ? Debug.getInFlightCount('poi') : 0;
    const poisLoaded = typeof POI !== 'undefined' ? POI.getPOIs().length : 0;
    const narCount   = s._narrationCount || 0;

    let sistoleMs  = s._msTotalSystole  || 0;
    let diastoleMs = s._msTotalDiastole || 0;
    if (s._phaseStart !== null) {
      const currentMs = now - s._phaseStart;
      if (s.phase === 'systole')  sistoleMs  += currentMs;
      if (s.phase === 'diastole') diastoleMs += currentMs;
    }
    const phaseTotal  = sistoleMs + diastoleMs || 1;
    const sistolePct  = Math.round((sistoleMs  / phaseTotal) * 100);
    const diastolePct = Math.round((diastoleMs / phaseTotal) * 100);

    const cells = document.querySelectorAll('.dbg-cell-value');
    if (cells.length >= 5) {
      cells[0].textContent = `${sistolePct}% / ${diastolePct}%`;
      cells[1].textContent = poisLoaded;
      cells[3].textContent = narCount;
      cells[3].className   = `dbg-cell-value ${narCount > 0 ? 'ok' : ''}`;
      cells[4].textContent = inFlight;
      cells[4].className   = `dbg-cell-value ${inFlight > 0 ? 'warn' : 'ok'}`;
    }
  }

  function bindCityInputListeners() {
    const input = document.getElementById('dbg-sim-city-input');
    const btn   = document.getElementById('dbg-sim-city-btn');
    if (!input || !btn) return;

    // oninput guarda el valor en _cityQuery para preservarlo entre re-renders
    input.addEventListener('input', () => { _cityQuery = input.value; });

    // keydown con 'Enter' — compatible con iOS
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        DebugSim.searchCity(input.value);
      }
    });

    btn.addEventListener('click', () => {
      DebugSim.searchCity(input.value);
    });
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

    // Solo pausar GPS real si el mapa ya existe (si no existe,
    // es la primera posición y watchPosition aún no corrió)
    if (GPS.getMap()) GPS.stop();

    // Reset de POIs SOLO en teletransporte (cambio de ciudad),
    // no al agregar waypoints de ruta — eso causaba 15 resets en cadena
    // y 429s de Overpass (BUG-014)
    if (_mode === 'teleport' && typeof POI !== 'undefined' && typeof POI.resetPOIs === 'function') {
      POI.resetPOIs();
    }

    // Invalidar cache de clima al teletransportar — la nueva ciudad tiene otro clima
    // REQ-5: sin esto, Care strip mostraba temperatura de la ciudad anterior
    if (_mode === 'teleport' && typeof Weather !== 'undefined') {
      Weather.invalidateCache();
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `DebugSim: teletransporte a ${lat.toFixed(4)},${lng.toFixed(4)} — clima invalidado`);
      }
    }

    GPS.simulatePosition(lat, lng, 5);

    // Refrescar clima con la nueva posición (async, no bloquea)
    if (_mode === 'teleport' && typeof Weather !== 'undefined') {
      setTimeout(() => {
        if (typeof Weather !== 'undefined') Weather.check();
      }, 1500); // pequeño delay para que GPS.simulatePosition actualice AppState.gps primero
    }

    // Adjuntar el listener de clic DESPUÉS de simulatePosition(),
    // que es cuando initMap() crea el mapa si aún no existía
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

    // No llamar startTestSession aquí — initExplore() ya lo hace
    // El doble reset destruía el unlock de audio: el AudioContext quedaba listo
    // pero AppState se reiniciaba 4s después y el estado de unlock se perdía.
    // GPS.stop() es suficiente para preparar la simulación.
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

    // Actualizar care strip con km/pasos acumulados durante la simulación
    if (typeof updateCareStrip === 'function') updateCareStrip();

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
    _cityQuery = query;

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
    _renderCityResultsInDOM();
  }

  function _renderCityResultsInDOM() {
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

    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);

    // simulatePosition primero — puede crear el mapa si no existia
    teleportTo(lat, lon);

    // setView despues — ahora el mapa si existe
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (map) map.setView([lat, lon], 15);

    const resultsEl = document.getElementById('dbg-sim-city-results');
    if (resultsEl) resultsEl.innerHTML = '';
    _cityQuery = r.display_name.split(',')[0];

    // Refrescar el panel para que refleje que el mapa ya existe
    // (necesario si esta era la primera posición y initMap() acaba de correr)
    setTimeout(refreshTabIfActive, 100);
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

  /* ── TARJETA DE RITMO — resumen de experiencia para la tab Simular ── */
  function _renderRhythmCard() {
    if (typeof Debug === 'undefined') return '';
    const exp = Debug.getExp();
    if (!exp) return '';

    const f  = exp.funnel;
    if (f.pois_narrated === 0) return `
      <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:9px; color:#4a5568; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:6px;">🎬 Ritmo del paseo</div>
        <div style="font-size:10px; color:#4a5568; text-align:center; padding:6px 0;">Sin narraciones aún</div>
        <div class="dbg-poi-btn-row" style="margin-top:6px;">
          <button class="dbg-poi-action map" onclick="Debug.switchTab('exp'); return false;">Ver métricas completas →</button>
        </div>
      </div>
    `;

    // Calcular intervalos
    const ts = exp.narrations.map(n => n.ts);
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(Math.round((ts[i] - ts[i-1]) / 1000));
    const avgInt  = intervals.length ? Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length) : null;
    const maxInt  = intervals.length ? Math.max(...intervals) : null;
    const fmtSec  = (s) => s === null ? '—' : (s >= 60 ? `${Math.floor(s/60)}min ${s%60}s` : `${s}s`);

    const s = typeof AppState !== 'undefined' ? AppState : {};
    const kmWalked = s.kmWalked || 0;
    const mPerNar  = f.pois_narrated > 0 ? Math.round((kmWalked * 1000) / f.pois_narrated) : null;

    // Narration positions count
    const withPos = exp.narrations.filter(n => n.lat && n.lng).length;

    return `
      <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:9px; color:#4a5568; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:6px;">🎬 Ritmo del paseo</div>
        <div class="dbg-grid" style="gap:4px;">
          <div class="dbg-cell">
            <div class="dbg-cell-label">Narraciones</div>
            <div class="dbg-cell-value ${f.pois_narrated > 0 ? 'ok' : ''}">${f.pois_narrated}</div>
          </div>
          <div class="dbg-cell">
            <div class="dbg-cell-label">Completas</div>
            <div class="dbg-cell-value ${f.narrations_completed > 0 ? 'ok' : ''}">${f.narrations_completed}</div>
          </div>
          <div class="dbg-cell">
            <div class="dbg-cell-label">Tiempo medio</div>
            <div class="dbg-cell-value">${fmtSec(avgInt)}</div>
          </div>
          <div class="dbg-cell">
            <div class="dbg-cell-label">Mayor silencio</div>
            <div class="dbg-cell-value ${maxInt !== null && maxInt > 300 ? 'warn' : ''}">${fmtSec(maxInt)}</div>
          </div>
          <div class="dbg-cell">
            <div class="dbg-cell-label">Dist. media</div>
            <div class="dbg-cell-value">${mPerNar !== null ? mPerNar + 'm' : '—'}</div>
          </div>
          <div class="dbg-cell">
            <div class="dbg-cell-label">POIs detectados</div>
            <div class="dbg-cell-value">${f.pois_detected}</div>
          </div>
        </div>
        <div class="dbg-poi-btn-row" style="margin-top:6px;">
          <button class="dbg-poi-action map" onclick="Debug.switchTab('exp'); return false;">Ver score completo →</button>
          ${withPos > 0 ? `<button class="dbg-poi-action narrate" onclick="DebugSim.focusNarrationMap()">🗺️ Ver en mapa (${withPos})</button>` : ''}
        </div>
      </div>
    `;
  }

  /* ── RENDER ── */
  function renderTab() {
    ensureMapClickListener();
    const html = renderTabInner();
    // Los listeners se adjuntan despues de que el HTML se inserta en el DOM —
    // se llama desde renderTab() que a su vez es llamado por Debug.switchTab()
    setTimeout(bindCityInputListeners, 0);
    return html;
  }

  function renderTabInner() {
    const s    = typeof AppState !== 'undefined' ? AppState : {};
    const now  = performance.now();

    // Sístole/Diástole — leído de AppState, igual que debug.js dashboard
    let sistoleMs  = s._msTotalSystole  || 0;
    let diastoleMs = s._msTotalDiastole || 0;
    if (s._phaseStart !== null) {
      const currentMs = now - s._phaseStart;
      if (s.phase === 'systole')  sistoleMs  += currentMs;
      if (s.phase === 'diastole') diastoleMs += currentMs;
    }
    const phaseTotal  = sistoleMs + diastoleMs || 1;
    const sistolePct  = Math.round((sistoleMs  / phaseTotal) * 100);
    const diastolePct = Math.round((diastoleMs / phaseTotal) * 100);

    // Narraciones y POIs — desde AppState real
    const poisLoaded  = typeof POI !== 'undefined' ? POI.getPOIs().length : 0;
    const poisVisited = s.poisVisited || 0;
    const narCount    = s._narrationCount || 0;
    const inFlight    = (typeof Debug !== 'undefined') ? Debug.getInFlightCount('poi') : 0;
    const mapReady    = (typeof GPS !== 'undefined') && !!GPS.getMap();

    return `
      <div class="dbg-poi-meta" style="margin-bottom:8px;">
        ${mapReady
          ? ('Click en el mapa para ' + (_mode === 'teleport' ? 'teletransportar' : 'agregar punto de ruta'))
          : 'Buscá una ciudad abajo para inicializar el mapa'}
      </div>

      <div class="dbg-input-row">
        <input id="dbg-sim-city-input" class="dbg-input" placeholder="Buscar ciudad..."
               value="${escapeHtml(_cityQuery)}" />
        <button class="dbg-btn" id="dbg-sim-city-btn">Buscar</button>
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
          <button class="dbg-poi-action ${_walkSpeedKmh === 14 ? 'narrate' : 'map'}" onclick="DebugSim.setSpeed(14)"
            title="Justo debajo del umbral 15km/h de DA-55 — NO deberia pausar deteccion">
            🚲 Bici 14km/h
          </button>
          <button class="dbg-poi-action ${_walkSpeedKmh === 20 ? 'narrate' : 'map'}" onclick="DebugSim.setSpeed(20)"
            title="Por encima del umbral 15-18km/h de DA-55 — deberia pausar deteccion de POIs">
            🚗 Auto 20km/h
          </button>
        </div>
        ${_walkSpeedKmh === 14 ? `
          <div style="font-size:9px; color:#5dade2; margin-top:4px;">
            🚲 Bajo el umbral de DA-55 (15km/h) — la deteccion de POIs NO deberia pausarse a esta velocidad
          </div>
        ` : ''}
        ${_walkSpeedKmh >= 15 ? `
          <div style="font-size:9px; color:${(typeof GPS !== 'undefined' && GPS.isInTransit()) ? '#2ecc71' : '#f0c87a'}; margin-top:4px;">
            ${(typeof GPS !== 'undefined' && GPS.isInTransit())
              ? '✅ DA-55 activa — detección de POIs pausada (velocidad sostenida detectada)'
              : '⏳ DA-55 implementada — esperando 45s sostenidos a esta velocidad para pausar detección'}
          </div>
        ` : ''}
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
          <div class="dbg-cell-value ${narCount > 0 ? 'ok' : ''}">${narCount}</div>
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
        <button class="dbg-poi-action" style="background:rgba(192,57,43,.15);color:#e74c3c;border:1px solid rgba(192,57,43,.3);" onclick="if(typeof POI!=='undefined'){POI.resetPOIs();}">🗑️ Limpiar POIs</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action narrate" onclick="DebugSim.skipToFreeMode()">🚀 Saltar a Modo Libre</button>
      </div>

      <div class="dbg-poi-meta" style="margin-top:12px; margin-bottom:4px;">Utilidades (antes en tab Estado)</div>
      <div class="dbg-poi-btn-row">
        <button class="dbg-poi-action narrate" onclick="Debug.forceLoadPOIs()">🔄 Recargar POIs</button>
        <button class="dbg-poi-action map" onclick="Debug.testNarration()">🎙️ Test narracion</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action map" onclick="Debug.checkWorker()">☁️ Verificar Worker</button>
        <button class="dbg-poi-action map" onclick="Debug.clearCache()">🗑️ Limpiar cache</button>
      </div>

      <div class="dbg-poi-meta" style="margin-top:12px; margin-bottom:4px;">Test Care — dispara cada trigger sin cooldown, funciona desde el inicio</div>
      <div class="dbg-poi-btn-row">
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('hot');}">☀️ Calor</button>
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('cold');}">🧊 Frío</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('tired');}">☕ Cansancio</button>
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('lunch');}">🍽️ Almuerzo</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('special');}">✨ Zona especial</button>
        <button class="dbg-poi-action" style="background:rgba(26,82,118,.2);color:#5dade2;border:1px solid rgba(26,82,118,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('rain');}">🌧️ Lluvia</button>
      </div>
      <div class="dbg-poi-btn-row" style="margin-top:6px;">
        <button class="dbg-poi-action" style="background:rgba(240,200,122,.2);color:#f0c87a;border:1px solid rgba(240,200,122,.3);" onclick="if(typeof Care!=='undefined'){Care._testTrigger('thirst');}">💧 Sed</button>
      </div>

      ${_renderRhythmCard()}
    `;
  }

  /* ── MARCADORES NARRATIVOS EN MAPA ── */
  function _updateNarrationMarkers() {
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (!map || typeof Debug === 'undefined') return;

    const exp = Debug.getExp();
    if (!exp || !Array.isArray(exp.narrations)) return;

    // Inicializar capa una sola vez
    if (!_narrationLayer) {
      _narrationLayer = L.layerGroup().addTo(map);
    } else {
      _narrationLayer.clearLayers();
    }

    exp.narrations.forEach((n, i) => {
      if (!n.lat || !n.lng) return;
      const color = n.completed   ? '#2ecc71'
                  : n.interrupted ? '#f39c12'
                  : '#c8d4e0';

      L.circleMarker([n.lat, n.lng], {
        radius:      6,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.85,
        weight:      1.5,
      })
        .bindPopup(`<b>${n.poiName || 'POI'}</b><br>${n.completed ? '✅ Completa' : n.interrupted ? '⚠️ Interrumpida' : '⏳ En progreso'}`, { maxWidth: 160 })
        .addTo(_narrationLayer);
    });
  }

  /* ── ENFOCAR MAPA EN NARRACIONES ── */
  function focusNarrationMap() {
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (!map || !_narrationLayer) return;

    const exp = (typeof Debug !== 'undefined') ? Debug.getExp() : null;
    if (!exp) return;

    const withPos = exp.narrations.filter(n => n.lat && n.lng);
    if (withPos.length === 0) return;

    const latlngs = withPos.map(n => [n.lat, n.lng]);
    try {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30], maxZoom: 17 });
    } catch (e) {}

    if (typeof navigateTo === 'function') navigateTo('explore');
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
    skipToFreeMode,
    focusNarrationMap,
  };

})();
