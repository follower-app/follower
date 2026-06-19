/* ═══════════════════════════════════════════
   FOLLOWER — debug.js
   Panel de debugging flotante.
   Solo para desarrollo — NO subir a producción.
   Agregar al final de index.html ANTES de </body>:
   <script src="js/debug.js"></script>
   ═══════════════════════════════════════════ */

const Debug = (() => {

  /* ── ESTADO DEL PANEL ── */
  let _visible   = true;
  let _logs      = [];       // historial de eventos
  let _timers    = {};       // timers para medir tiempos
  const MAX_LOGS = 40;

  /* ── INYECTAR ESTILOS ── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #dbg-toggle {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 9999;
        background: rgba(192,57,43,0.92);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 6px 14px;
        font-family: 'Inter', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        cursor: pointer;
        backdrop-filter: blur(8px);
      }

      #dbg-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9998;
        background: rgba(8, 12, 20, 0.97);
        border-top: 1px solid rgba(192,57,43,0.4);
        font-family: 'Inter', monospace;
        font-size: 11px;
        color: #c8d4e0;
        max-height: 55vh;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(12px);
      }

      #dbg-panel.hidden { display: none; }

      #dbg-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        flex-shrink: 0;
      }

      .dbg-tab {
        flex: 1;
        padding: 8px 4px;
        text-align: center;
        cursor: pointer;
        color: #4a5568;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        border: none;
        background: none;
        font-family: 'Inter', monospace;
        transition: color 0.2s;
      }

      .dbg-tab.active { color: #c0392b; border-bottom: 2px solid #c0392b; }

      #dbg-content {
        overflow-y: auto;
        flex: 1;
        padding: 8px;
      }

      /* ── SECCIÓN STATUS ── */
      .dbg-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 8px;
      }

      .dbg-cell {
        background: rgba(255,255,255,0.04);
        border-radius: 6px;
        padding: 6px 8px;
      }

      .dbg-cell-label {
        font-size: 9px;
        color: #4a5568;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 2px;
      }

      .dbg-cell-value {
        font-size: 12px;
        font-weight: 600;
        color: #c8d4e0;
        word-break: break-all;
      }

      .dbg-cell-value.ok    { color: #2ecc71; }
      .dbg-cell-value.warn  { color: #f39c12; }
      .dbg-cell-value.error { color: #c0392b; }

      /* ── SECCIÓN LOGS ── */
      .dbg-log-item {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        display: flex;
        gap: 8px;
        align-items: flex-start;
        line-height: 1.4;
      }

      .dbg-log-time {
        color: #4a5568;
        flex-shrink: 0;
        font-size: 10px;
        padding-top: 1px;
      }

      .dbg-log-type {
        flex-shrink: 0;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 1px 5px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .dbg-log-type.gps     { background: rgba(26,82,118,0.5);  color: #5dade2; }
      .dbg-log-type.poi     { background: rgba(39,174,96,0.3);  color: #2ecc71; }
      .dbg-log-type.api     { background: rgba(243,156,18,0.3); color: #f39c12; }
      .dbg-log-type.voice   { background: rgba(155,89,182,0.3); color: #bb8fce; }
      .dbg-log-type.error   { background: rgba(192,57,43,0.4);  color: #e74c3c; }
      .dbg-log-type.info    { background: rgba(255,255,255,0.1); color: #c8d4e0; }

      .dbg-log-msg { color: #c8d4e0; font-size: 11px; }

      /* ── SECCIÓN SEARCH ── */
      #dbg-search-wrap {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }

      #dbg-search-input {
        flex: 1;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 7px 10px;
        color: #c8d4e0;
        font-family: 'Inter', monospace;
        font-size: 12px;
        outline: none;
      }

      #dbg-search-input:focus {
        border-color: rgba(192,57,43,0.6);
      }

      #dbg-search-btn {
        background: #c0392b;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 7px 14px;
        font-family: 'Inter', monospace;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }

      #dbg-search-results {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .dbg-poi-result {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 8px 10px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .dbg-poi-result:hover,
      .dbg-poi-result:active {
        background: rgba(192,57,43,0.2);
        border-color: rgba(192,57,43,0.4);
      }

      .dbg-poi-name {
        font-weight: 600;
        color: #c8d4e0;
        margin-bottom: 2px;
      }

      .dbg-poi-meta {
        font-size: 10px;
        color: #4a5568;
      }

      .dbg-poi-btn-row {
        display: flex;
        gap: 6px;
        margin-top: 6px;
      }

      .dbg-poi-action {
        font-size: 10px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-family: 'Inter', monospace;
      }

      .dbg-poi-action.narrate {
        background: rgba(192,57,43,0.5);
        color: white;
      }

      .dbg-poi-action.map {
        background: rgba(26,82,118,0.5);
        color: white;
      }

      /* ── SECCIÓN TIMING ── */
      .dbg-timing-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }

      .dbg-timing-label {
        color: #4a5568;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .dbg-timing-ms {
        font-weight: 700;
        font-size: 13px;
      }

      .dbg-timing-ms.fast { color: #2ecc71; }
      .dbg-timing-ms.med  { color: #f39c12; }
      .dbg-timing-ms.slow { color: #c0392b; }

      #dbg-clear-btn {
        margin-top: 8px;
        width: 100%;
        background: rgba(255,255,255,0.05);
        color: #4a5568;
        border: none;
        border-radius: 6px;
        padding: 6px;
        font-family: 'Inter', monospace;
        font-size: 10px;
        cursor: pointer;
        letter-spacing: 0.08em;
      }

      /* ancho máximo en desktop / chrome browser */
      @media (min-width: 480px) {
        #dbg-panel {
          left: 50%;
          transform: translateX(-50%);
          width: 390px;
        }
        #dbg-toggle {
          right: calc(50% - 195px + 12px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── CREAR HTML DEL PANEL ── */
  function createPanel() {
    const btn = document.createElement('button');
    btn.id        = 'dbg-toggle';
    btn.textContent = '🐛 DEBUG';
    btn.onclick   = togglePanel;
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.innerHTML = `
      <div id="dbg-tabs">
        <button class="dbg-tab active" onclick="Debug.switchTab('status')">Estado</button>
        <button class="dbg-tab" onclick="Debug.switchTab('search')">Buscar POI</button>
        <button class="dbg-tab" onclick="Debug.switchTab('logs')">Logs</button>
        <button class="dbg-tab" onclick="Debug.switchTab('timing')">Tiempos</button>
      </div>
      <div id="dbg-content">
        <!-- contenido dinámico -->
      </div>
    `;
    document.body.appendChild(panel);

    renderTab('status');
    startAutoRefresh();
  }

  /* ── TOGGLE PANEL ── */
  function togglePanel() {
    const panel = document.getElementById('dbg-panel');
    _visible = !_visible;
    panel.classList.toggle('hidden', !_visible);
    document.getElementById('dbg-toggle').textContent = _visible ? '🐛 DEBUG' : '🐛';
  }

  /* ── SWITCH TAB ── */
  function switchTab(tabName) {
    document.querySelectorAll('.dbg-tab').forEach((t, i) => {
      const names = ['status', 'search', 'logs', 'timing'];
      t.classList.toggle('active', names[i] === tabName);
    });
    renderTab(tabName);
  }

  /* ── AUTO REFRESH — tab status ── */
  let _currentTab = 'status';
  function startAutoRefresh() {
    setInterval(() => {
      if (_currentTab === 'status') renderTab('status');
    }, 1500);
  }

  /* ── RENDER TAB ── */
  function renderTab(tab) {
    _currentTab = tab;
    const content = document.getElementById('dbg-content');
    if (!content) return;

    if      (tab === 'status')  content.innerHTML = renderStatus();
    else if (tab === 'search')  content.innerHTML = renderSearch();
    else if (tab === 'logs')    content.innerHTML = renderLogs();
    else if (tab === 'timing')  content.innerHTML = renderTiming();

    // Search necesita listeners
    if (tab === 'search') bindSearchListeners();
  }

  /* ── RENDER STATUS ── */
  function renderStatus() {
    const s = typeof AppState !== 'undefined' ? AppState : {};
    const gps    = s.gps;
    const poiCount = typeof POI !== 'undefined' ? POI.getPOIs().length : '?';

    const gpsClass = gps ? 'ok' : 'error';
    const gpsVal   = gps
      ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`
      : 'Sin señal';
    const accVal   = gps ? `±${Math.round(gps.accuracy || 0)}m` : '—';

    const offlineClass = s.offline ? 'error' : 'ok';
    const offlineVal   = s.offline ? 'OFFLINE' : 'Online';

    const poiClass = poiCount > 0 ? 'ok' : 'warn';

    const keysOk = typeof KEYS !== 'undefined'
      && KEYS.gemini
      && KEYS.gemini !== 'TU_API_KEY_GEMINI';
    const keysClass = keysOk ? 'ok' : 'error';
    const keysVal   = keysOk ? 'Keys OK' : '⚠️ Placeholder!';

    return `
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">GPS</div>
          <div class="dbg-cell-value ${gpsClass}">${gpsVal}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Precisión GPS</div>
          <div class="dbg-cell-value">${accVal}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Conectividad</div>
          <div class="dbg-cell-value ${offlineClass}">${offlineVal}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">API Keys</div>
          <div class="dbg-cell-value ${keysClass}">${keysVal}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">POIs cargados</div>
          <div class="dbg-cell-value ${poiClass}">${poiCount}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">POI activo</div>
          <div class="dbg-cell-value ${s.activePOI ? 'ok' : ''}">${s.activePOI?.name || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Fase</div>
          <div class="dbg-cell-value">${s.phase || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Ciudad</div>
          <div class="dbg-cell-value">${s.cityName || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Mood</div>
          <div class="dbg-cell-value">${s.mood || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Idioma</div>
          <div class="dbg-cell-value">${s.lang || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Narrando</div>
          <div class="dbg-cell-value ${typeof Narration !== 'undefined' && Narration.isNarrating() ? 'ok' : ''}">
            ${typeof Narration !== 'undefined' && Narration.isNarrating() ? '🔴 Sí' : 'No'}
          </div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Pantalla</div>
          <div class="dbg-cell-value">${s.screen || '—'}</div>
        </div>
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="dbg-poi-action narrate" onclick="Debug.forceLoadPOIs()">
          🔄 Recargar POIs
        </button>
        <button class="dbg-poi-action map" onclick="Debug.testNarration()">
          🎙️ Test narración
        </button>
        <button class="dbg-poi-action map" onclick="Debug.clearCache()">
          🗑️ Limpiar cache
        </button>
      </div>
    `;
  }

  /* ── RENDER SEARCH ── */
  function renderSearch() {
    const pois = typeof POI !== 'undefined' ? POI.getPOIs() : [];
    const count = pois.length;

    return `
      <div style="margin-bottom:6px; font-size:10px; color:#4a5568;">
        ${count} POIs cargados en memoria
      </div>
      <div id="dbg-search-wrap">
        <input id="dbg-search-input" placeholder="Buscar POI por nombre..." />
        <button id="dbg-search-btn">Buscar</button>
      </div>
      <div id="dbg-search-results">
        ${renderPOIList(pois.slice(0, 8))}
      </div>
    `;
  }

  function renderPOIList(pois) {
    if (pois.length === 0) {
      return `<div style="color:#4a5568; font-size:11px; padding:12px 0; text-align:center;">
        Sin resultados — ¿se cargaron los POIs?
      </div>`;
    }

    return pois.map(poi => `
      <div class="dbg-poi-result">
        <div class="dbg-poi-name">${poi.icon || '📍'} ${poi.name}</div>
        <div class="dbg-poi-meta">
          ${poi.type} · ${poi._distanceMeters != null ? poi._distanceMeters + 'm' : 'distancia ?'}
          · ${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)}
        </div>
        <div class="dbg-poi-btn-row">
          <button class="dbg-poi-action narrate"
            onclick="Debug.activatePOI('${poi.id}')">
            🎙️ Narrar
          </button>
          <button class="dbg-poi-action map"
            onclick="Debug.flyToPOI('${poi.id}')">
            📍 Ver en mapa
          </button>
        </div>
      </div>
    `).join('');
  }

  function bindSearchListeners() {
    const input = document.getElementById('dbg-search-input');
    const btn   = document.getElementById('dbg-search-btn');
    if (!input || !btn) return;

    const doSearch = () => {
      const q    = input.value.trim().toLowerCase();
      const pois = typeof POI !== 'undefined' ? POI.getPOIs() : [];
      const filtered = q
        ? pois.filter(p => p.name.toLowerCase().includes(q))
        : pois.slice(0, 8);

      const results = document.getElementById('dbg-search-results');
      if (results) results.innerHTML = renderPOIList(filtered.slice(0, 15));
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  }

  /* ── RENDER LOGS ── */
  function renderLogs() {
    if (_logs.length === 0) {
      return `<div style="color:#4a5568; font-size:11px; padding:12px 0; text-align:center;">
        Sin logs aún — los eventos aparecerán aquí
      </div>`;
    }

    const items = [..._logs].reverse().map(l => `
      <div class="dbg-log-item">
        <span class="dbg-log-time">${l.time}</span>
        <span class="dbg-log-type ${l.type}">${l.type}</span>
        <span class="dbg-log-msg">${l.msg}</span>
      </div>
    `).join('');

    return items + `<button id="dbg-clear-btn" onclick="Debug.clearLogs()">Limpiar logs</button>`;
  }

  /* ── RENDER TIMING ── */
  function renderTiming() {
    const t = window._dbgTimings || {};
    const keys = Object.keys(t);

    if (keys.length === 0) {
      return `<div style="color:#4a5568; font-size:11px; padding:12px 0; text-align:center;">
        Sin tiempos registrados aún — activa una narración
      </div>`;
    }

    const rows = keys.map(k => {
      const ms  = t[k];
      const cls = ms < 2000 ? 'fast' : ms < 6000 ? 'med' : 'slow';
      return `
        <div class="dbg-timing-row">
          <span class="dbg-timing-label">${k}</span>
          <span class="dbg-timing-ms ${cls}">${ms}ms</span>
        </div>
      `;
    }).join('');

    return rows + `<button id="dbg-clear-btn" onclick="Debug.clearTimings()">Limpiar tiempos</button>`;
  }

  /* ── LOGGING PÚBLICO ── */
  function log(type, msg) {
    const now  = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    _logs.push({ type, msg, time });
    if (_logs.length > MAX_LOGS) _logs.shift();

    // Si estamos en tab logs, re-renderizar
    if (_currentTab === 'logs') renderTab('logs');
  }

  /* ── TIMERS PÚBLICOS ── */
  function timeStart(label) {
    _timers[label] = performance.now();
  }

  function timeEnd(label) {
    if (!_timers[label]) return;
    const ms = Math.round(performance.now() - _timers[label]);
    if (!window._dbgTimings) window._dbgTimings = {};
    window._dbgTimings[label] = ms;
    log('api', `${label}: ${ms}ms`);
    delete _timers[label];
    if (_currentTab === 'timing') renderTab('timing');
  }

  /* ── ACCIONES RÁPIDAS ── */
  function activatePOI(poiId) {
    const pois = typeof POI !== 'undefined' ? POI.getPOIs() : [];
    const poi  = pois.find(p => p.id === poiId);
    if (!poi) { log('error', `POI no encontrado: ${poiId}`); return; }

    log('poi', `Activando manualmente: ${poi.name}`);
    AppState.activePOI = poi;
    navigateTo('explore');

    if (typeof Narration !== 'undefined') {
      timeStart('narración Gemini');
      const originalTrigger = Narration.trigger;
      Narration.trigger(poi, AppState.mood, AppState.lang);
      timeEnd('narración Gemini');
    }

    // Mostrar card
    if (typeof POI !== 'undefined') {
      const card = document.getElementById('poiCard');
      if (card) {
        document.getElementById('poiCardName').textContent = poi.name;
        document.getElementById('poiCardMeta').textContent = poi.type;
        card.classList.remove('hidden');
      }
    }
  }

  function flyToPOI(poiId) {
    const pois = typeof POI !== 'undefined' ? POI.getPOIs() : [];
    const poi  = pois.find(p => p.id === poiId);
    if (!poi) return;
    log('poi', `Volando a: ${poi.name}`);
    if (typeof GPS !== 'undefined') GPS.flyTo(poi.lat, poi.lng);
    navigateTo('explore');
  }

  function forceLoadPOIs() {
    log('poi', 'Forzando recarga de POIs...');
    if (!AppState.gps) {
      log('error', 'GPS no disponible para cargar POIs');
      return;
    }
    timeStart('carga POIs Overpass');
    // Llamar internamente a loadPOIs del módulo POI no es público,
    // así que disparamos detectNearby con _pois = [] trick
    if (typeof POI !== 'undefined') {
      POI.detectNearby(AppState.gps.lat, AppState.gps.lng, 80, 300);
    }
    // Timer se cierra cuando llegan los POIs — aproximación
    setTimeout(() => timeEnd('carga POIs Overpass'), 100);
    log('poi', `GPS: ${AppState.gps.lat.toFixed(4)}, ${AppState.gps.lng.toFixed(4)}`);
  }

  function testNarration() {
    const testPOI = {
      id:          'test_001',
      name:        AppState.cityName || 'Ciudad de prueba',
      description: 'Lugar de prueba para debugging',
      lat:         AppState.gps?.lat || 0,
      lng:         AppState.gps?.lng || 0,
      type:        'test',
      icon:        '🧪',
      tags:        {}
    };

    log('api', 'Iniciando test de narración...');
    timeStart('narración completa');

    if (typeof Narration !== 'undefined') {
      Narration.trigger(testPOI, AppState.mood, AppState.lang);
    }

    // El timer se mide hasta que voice empieza — aproximación con timeout
    setTimeout(() => {
      if (typeof Narration !== 'undefined' && Narration.isNarrating()) {
        timeEnd('narración completa');
        log('voice', 'Voz iniciada correctamente');
      } else {
        timeEnd('narración completa');
        log('error', 'Narración no inició — revisar consola');
      }
    }, 3000);
  }

  function clearCache() {
    indexedDB.deleteDatabase('follower_db');
    log('info', 'IndexedDB eliminada — recarga la página');
  }

  function clearLogs() {
    _logs = [];
    renderTab('logs');
  }

  function clearTimings() {
    window._dbgTimings = {};
    renderTab('timing');
  }

  /* ── INTERCEPCIÓN DE CONSOLE — captura errores automáticamente ── */
  function interceptConsole() {
    const orig = {
      warn:  console.warn.bind(console),
      error: console.error.bind(console),
      log:   console.log.bind(console)
    };

    console.warn = (...args) => {
      orig.warn(...args);
      log('error', args.join(' ').slice(0, 120));
    };

    console.error = (...args) => {
      orig.error(...args);
      log('error', args.join(' ').slice(0, 120));
    };

    // Solo capturar logs con prefijo Narration/GPS/POI
    console.log = (...args) => {
      orig.log(...args);
      const msg = args.join(' ');
      if (msg.includes('Narration:') || msg.includes('GPS:') || msg.includes('POI:')) {
        log('info', msg.slice(0, 120));
      }
    };
  }

  /* ── PARCHE: exponer flyTo en GPS si no existe ── */
  function patchGPS() {
    // Se llama después de que GPS esté listo
    setTimeout(() => {
      if (typeof GPS !== 'undefined' && !GPS.flyTo) {
        // GPS no expone flyTo — agregarlo vía hack del mapa Leaflet
        GPS.flyTo = (lat, lng) => {
          const mapEl = document.getElementById('map');
          if (mapEl && mapEl._leaflet_map) {
            mapEl._leaflet_map.flyTo([lat, lng], 18, { duration: 1.2 });
          }
        };
      }
    }, 3000);
  }

  /* ── INIT ── */
  function init() {
    injectStyles();
    createPanel();
    interceptConsole();
    patchGPS();

    // Log inicial
    log('info', `Follower Debug v0.4 iniciado`);
    log('info', `User Agent: ${navigator.userAgent.slice(0, 60)}...`);

    // Verificar keys al inicio
    setTimeout(() => {
      if (typeof KEYS !== 'undefined') {
        if (KEYS.gemini === 'TU_API_KEY_GEMINI') {
          log('error', '⚠️ KEYS.gemini es placeholder — narración no funcionará');
        } else {
          log('info', '✓ KEYS.gemini configurada');
        }
        if (KEYS.openWeatherMap === 'TU_API_KEY_OPENWEATHERMAP') {
          log('error', '⚠️ KEYS.openWeatherMap es placeholder');
        }
      }
    }, 500);
  }

  // Auto-init cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── API PÚBLICA ── */
  return {
    log,
    timeStart,
    timeEnd,
    switchTab,
    activatePOI,
    flyToPOI,
    forceLoadPOIs,
    testNarration,
    clearCache,
    clearLogs,
    clearTimings
  };

})();
