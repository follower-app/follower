/* ═══════════════════════════════════════════
   FOLLOWER — debug.js
   Panel de debugging flotante.
   Solo para desarrollo — NO subir a producción.
   Agregar al final de index.html ANTES de </body>:
   <script src="js/debug.js"></script>
   ═══════════════════════════════════════════ */

const Debug = (() => {

  /* ── ESTADO DEL PANEL ── */
  let _visible       = true;
  let _logs          = [];       // historial de eventos
  let _metrics       = [];       // historial de mediciones de tiempo
  let _metricStarts  = {};       // mediciones en curso { id: { t, category, label } }
  const MAX_LOGS      = 80;
  const MAX_METRICS   = 150;
  const STORAGE_KEY   = 'follower_debug_log';

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
        overflow-x: hidden;
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

      .dbg-log-msg {
        color: #c8d4e0;
        font-size: 11px;
        flex: 1;
        min-width: 0;
        overflow-wrap: break-word;
        word-break: break-word;
      }

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

      /* ── CLASES GENÉRICAS REUSABLES (debug-sim.js y futuros tabs) ──
         Mismo estilo visual que #dbg-search-*, pero por clase en vez
         de ID para poder reusarse en más de un lugar del panel. ── */
      .dbg-input-row {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }

      .dbg-input {
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

      .dbg-input:focus {
        border-color: rgba(192,57,43,0.6);
      }

      .dbg-btn {
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

      .dbg-result-item {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 8px 10px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .dbg-result-item:hover,
      .dbg-result-item:active {
        background: rgba(192,57,43,0.2);
        border-color: rgba(192,57,43,0.4);
      }

      .dbg-slider-row {
        margin: 10px 0;
      }

      .dbg-slider-label {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #4a5568;
        margin-bottom: 4px;
      }

      .dbg-slider {
        width: 100%;
        accent-color: #c0392b;
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

      .dbg-actions-row {
        display: flex;
        gap: 6px;
        margin-top: 8px;
      }

      #dbg-clear-btn {
        flex: 1;
        background: rgba(255,255,255,0.05);
        color: #4a5568;
        border: none;
        border-radius: 6px;
        padding: 7px;
        font-family: 'Inter', monospace;
        font-size: 10px;
        cursor: pointer;
        letter-spacing: 0.08em;
      }

      #dbg-export-btn {
        flex: 1;
        background: rgba(46,204,113,0.14);
        color: #2ecc71;
        border: 1px solid rgba(46,204,113,0.3);
        border-radius: 6px;
        padding: 7px;
        font-family: 'Inter', monospace;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.08em;
      }

      /* ── RESUMEN DE TIEMPOS POR CATEGORÍA ── */
      .dbg-timing-group {
        padding: 6px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }

      .dbg-timing-group-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dbg-timing-group-sub {
        font-size: 9px;
        color: #4a5568;
        margin-top: 2px;
      }

      .dbg-section-label {
        font-size: 9px;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin: 10px 0 6px;
      }
      .dbg-section-label:first-child { margin-top: 0; }

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
  /* ── TABS REGISTRADAS EXTERNAMENTE (ej. debug-sim.js) ──
     Permite que otros módulos se agreguen como tab sin que debug.js
     tenga que conocerlos por nombre — mantiene single responsibility. */
  let _externalTabs = {};   // { name: { label, renderFn } }

  function _appendTabButton(name, label) {
    const tabsEl = document.getElementById('dbg-tabs');
    if (!tabsEl || tabsEl.querySelector(`[data-tab="${name}"]`)) return;
    const btn = document.createElement('button');
    btn.className   = 'dbg-tab';
    btn.dataset.tab = name;
    btn.textContent = label;
    btn.onclick     = () => switchTab(name);
    tabsEl.appendChild(btn);
  }

  function registerTab(name, label, renderFn) {
    _externalTabs[name] = { label, renderFn };
    _appendTabButton(name, label);
  }

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
        <button class="dbg-tab active" data-tab="status" onclick="Debug.switchTab('status')">Estado</button>
        <button class="dbg-tab" data-tab="search" onclick="Debug.switchTab('search')">Buscar POI</button>
        <button class="dbg-tab" data-tab="logs" onclick="Debug.switchTab('logs')">Logs</button>
        <button class="dbg-tab" data-tab="timing" onclick="Debug.switchTab('timing')">Tiempos</button>
      </div>
      <div id="dbg-content">
        <!-- contenido dinámico -->
      </div>
    `;
    document.body.appendChild(panel);

    // Agregar botones de tabs registradas externamente antes de que
    // el panel existiera (orden de carga de scripts no garantizado)
    Object.entries(_externalTabs).forEach(([name, t]) => _appendTabButton(name, t.label));

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
    document.querySelectorAll('.dbg-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
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
    else if (_externalTabs[tab]) content.innerHTML = _externalTabs[tab].renderFn();

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

    const workerClass = window._dbgWorkerStatus === 'ok' ? 'ok'
                       : window._dbgWorkerStatus === 'checking' ? 'warn'
                       : 'error';
    const workerVal   = window._dbgWorkerStatus === 'ok' ? 'Worker OK'
                       : window._dbgWorkerStatus === 'checking' ? 'Verificando...'
                       : '⚠️ Sin verificar';

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
          <div class="dbg-cell-label">Cloudflare Worker</div>
          <div class="dbg-cell-value ${workerClass}">${workerVal}</div>
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
        <button class="dbg-poi-action map" onclick="Debug.checkWorker()">
          ☁️ Verificar Worker
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
      </div>
      <div class="dbg-actions-row">
        <button id="dbg-export-btn" onclick="Debug.exportLog()">📤 Exportar .txt</button>
      </div>`;
    }

    const items = [..._logs].reverse().map(l => `
      <div class="dbg-log-item">
        <span class="dbg-log-time">${l.time}</span>
        <span class="dbg-log-type ${l.type}">${l.type}</span>
        <span class="dbg-log-msg">${l.msg}</span>
      </div>
    `).join('');

    return items + `
      <div class="dbg-actions-row">
        <button id="dbg-export-btn" onclick="Debug.exportLog()">📤 Exportar .txt</button>
        <button id="dbg-clear-btn" onclick="Debug.clearLogs()">Limpiar logs</button>
      </div>
    `;
  }

  /* ── RENDER TIMING ── */
  function renderTiming() {
    if (_metrics.length === 0) {
      return `<div style="color:#4a5568; font-size:11px; padding:12px 0; text-align:center;">
        Sin tiempos registrados aún — explora, narra o carga POIs y se irán llenando
      </div>
      <div class="dbg-actions-row">
        <button id="dbg-export-btn" onclick="Debug.exportLog()">📤 Exportar .txt</button>
      </div>`;
    }

    // Agrupar por categoría + label
    const groups = {};
    _metrics.forEach(m => {
      const key = `${m.category}|${m.label}`;
      (groups[key] = groups[key] || []).push(m);
    });

    const summaryRows = Object.entries(groups).map(([key, items]) => {
      const [category, label] = key.split('|');
      const times    = items.map(i => i.ms);
      const avg      = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const min      = Math.min(...times);
      const max      = Math.max(...times);
      const cls      = avg < 2000 ? 'fast' : avg < 6000 ? 'med' : 'slow';
      const statusCounts = {};
      items.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });
      const statusStr = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(' · ');

      return `
        <div class="dbg-timing-group">
          <div class="dbg-timing-group-top">
            <span class="dbg-timing-label">[${category}] ${label}</span>
            <span class="dbg-timing-ms ${cls}">${avg}ms avg</span>
          </div>
          <div class="dbg-timing-group-sub">
            ${items.length} mediciones · min ${min}ms · max ${max}ms · ${statusStr}
          </div>
        </div>
      `;
    }).join('');

    // Últimas 12 mediciones individuales, más recientes primero
    const recentRows = [..._metrics].reverse().slice(0, 12).map(m => {
      const cls = m.ms < 2000 ? 'fast' : m.ms < 6000 ? 'med' : 'slow';
      return `
        <div class="dbg-timing-row">
          <span class="dbg-timing-label">${m.time} · [${m.category}] ${m.label} · ${m.status}</span>
          <span class="dbg-timing-ms ${cls}">${m.ms}ms</span>
        </div>
      `;
    }).join('');

    return `
      <div class="dbg-section-label">Promedios por medición</div>
      ${summaryRows}
      <div class="dbg-section-label">Últimas mediciones</div>
      ${recentRows}
      <div class="dbg-actions-row">
        <button id="dbg-export-btn" onclick="Debug.exportLog()">📤 Exportar .txt</button>
        <button id="dbg-clear-btn" onclick="Debug.clearTimings()">Limpiar tiempos</button>
      </div>
    `;
  }

  /* ── HELPERS DE TIEMPO/PERSISTENCIA ── */
  function nowTimeString() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  }

  function metaToString(meta) {
    if (!meta) return '';
    try {
      return Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(' ');
    } catch (e) {
      return '';
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        logs:    _logs,
        metrics: _metrics,
        savedAt: Date.now()
      }));
    } catch (e) {
      // localStorage lleno o no disponible — no romper la app por esto
    }
  }

  function loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.logs))    _logs    = parsed.logs.slice(-MAX_LOGS);
      if (Array.isArray(parsed.metrics)) _metrics = parsed.metrics.slice(-MAX_METRICS);
    } catch (e) {
      // Datos corruptos de una sesión anterior — arrancar limpio
    }
  }

  /* ── LOGGING PÚBLICO ── */
  function log(type, msg) {
    _logs.push({ type, msg, time: nowTimeString(), ts: Date.now() });
    if (_logs.length > MAX_LOGS) _logs.shift();
    persistState();

    // Si estamos en tab logs, re-renderizar
    if (_currentTab === 'logs') renderTab('logs');
  }

  /* ── MÉTRICAS DE TIEMPO — historial, no se sobreescriben ── */
  function metricStart(category, label) {
    const id = `${category}|${label}|${Date.now()}|${Math.random().toString(36).slice(2, 8)}`;
    _metricStarts[id] = { t: performance.now(), category, label };
    return id;
  }

  function metricEnd(id, status = 'ok', meta = null) {
    const start = _metricStarts[id];
    if (!start) return null;

    const ms = Math.round(performance.now() - start.t);
    const record = {
      category: start.category,
      label:    start.label,
      ms,
      status,
      meta,
      time:     nowTimeString(),
      ts:       Date.now()
    };

    _metrics.push(record);
    if (_metrics.length > MAX_METRICS) _metrics.shift();
    delete _metricStarts[id];

    const metaStr = meta ? ' · ' + metaToString(meta) : '';
    log(start.category, `${start.label}: ${ms}ms [${status}]${metaStr}`);

    persistState();
    if (_currentTab === 'timing') renderTab('timing');
    return record;
  }

  /* ── CONTAR MEDICIONES EN VUELO (para debug-sim.js) ──
     Cuántos metricStart de una categoría siguen sin su metricEnd —
     usa _metricStarts, que ya existía para esto exacto. */
  function getInFlightCount(category) {
    return Object.values(_metricStarts)
      .filter(m => m.category === category)
      .length;
  }

  /* ── EXPORTAR REPORTE A .TXT ── */
  function exportLog() {
    const now   = new Date();
    const stamp = now.toISOString().replace('T', ' ').slice(0, 19);
    const lines = [];

    lines.push('═'.repeat(50));
    lines.push('FOLLOWER — REPORTE DE DEBUG');
    lines.push(`Exportado: ${stamp}`);
    lines.push(`User Agent: ${navigator.userAgent}`);
    lines.push('═'.repeat(50));
    lines.push('');

    lines.push('RESUMEN DE TIEMPOS POR MEDICIÓN');
    lines.push('─'.repeat(50));
    if (_metrics.length === 0) {
      lines.push('Sin mediciones registradas.');
    } else {
      const groups = {};
      _metrics.forEach(m => {
        const key = `${m.category}|${m.label}`;
        (groups[key] = groups[key] || []).push(m);
      });
      Object.entries(groups).forEach(([key, items]) => {
        const [category, label] = key.split('|');
        const times = items.map(i => i.ms);
        const avg   = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const statusCounts = {};
        items.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });
        const statusStr = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(' · ');
        lines.push(`[${category}] ${label}`);
        lines.push(`  mediciones: ${items.length} · promedio: ${avg}ms · min: ${Math.min(...times)}ms · max: ${Math.max(...times)}ms`);
        lines.push(`  estados: ${statusStr}`);
        lines.push('');
      });
    }

    lines.push('DETALLE CRONOLÓGICO DE TIEMPOS');
    lines.push('─'.repeat(50));
    if (_metrics.length === 0) {
      lines.push('(sin datos)');
    } else {
      _metrics.forEach(m => {
        const metaStr = m.meta ? ' · ' + metaToString(m.meta) : '';
        lines.push(`${m.time}  [${m.category}] ${m.label} — ${m.ms}ms — ${m.status}${metaStr}`);
      });
    }
    lines.push('');

    lines.push('LOGS / EVENTOS');
    lines.push('─'.repeat(50));
    if (_logs.length === 0) {
      lines.push('(sin logs)');
    } else {
      _logs.forEach(l => lines.push(`${l.time}  [${l.type}] ${l.msg}`));
    }
    lines.push('');
    lines.push('═'.repeat(50));
    lines.push('Fin del reporte');

    const text     = lines.join('\n');
    const blob     = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url      = URL.createObjectURL(blob);
    const filename = `follower-debug-${now.toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    const a        = document.createElement('a');

    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    log('info', `Exportado reporte: ${filename}`);
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
      Narration.trigger(poi, AppState.mood, AppState.lang);
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
    const map = (typeof GPS !== 'undefined') ? GPS.getMap() : null;
    if (map) map.setView([poi.lat, poi.lng], 17, { animate: true, duration: 0.5 });
    navigateTo('explore');
  }

  function forceLoadPOIs() {
    log('poi', 'Forzando recarga de POIs...');
    if (!AppState.gps) {
      log('error', 'GPS no disponible para cargar POIs');
      return;
    }
    if (typeof POI !== 'undefined') {
      POI.detectNearby(AppState.gps.lat, AppState.gps.lng, 80, 300);
    }
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

    if (typeof Narration !== 'undefined') {
      Narration.trigger(testPOI, AppState.mood, AppState.lang);
    } else {
      log('error', 'Narration no está cargado');
    }
  }

  function clearCache() {
    indexedDB.deleteDatabase('follower_db');
    log('info', 'IndexedDB eliminada — recarga la página');
  }

  function clearLogs() {
    _logs = [];
    persistState();
    renderTab('logs');
  }

  function clearTimings() {
    _metrics = [];
    persistState();
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

  /* ── VERIFICAR WORKER DE CLOUDFLARE ── */
  async function checkWorker() {
    window._dbgWorkerStatus = 'checking';
    if (_currentTab === 'status') renderTab('status');

    try {
      // Ping liviano a /weather sin lat/lon — esperamos 400, lo que confirma que el Worker responde
      const url = (typeof Narration !== 'undefined' && Narration._configUrl)
        ? Narration._configUrl.replace('/narration', '/weather')
        : 'https://followernarration.jaimeand.workers.dev/weather';

      const res = await fetch(url);
      // Cualquier respuesta del servidor (200, 400, etc) confirma que el Worker está vivo
      window._dbgWorkerStatus = res.status ? 'ok' : 'error';
      log('info', `Worker Cloudflare: respondió status=${res.status}`);

    } catch (e) {
      window._dbgWorkerStatus = 'error';
      log('error', `Worker Cloudflare inaccesible: ${e.message}`);
    }

    if (_currentTab === 'status') renderTab('status');
  }

  /* ── INIT ── */
  function init() {
    loadPersistedState();
    injectStyles();
    createPanel();
    interceptConsole();
    patchGPS();

    // Log inicial
    log('info', `Follower Debug v0.5 iniciado`);
    log('info', `User Agent: ${navigator.userAgent.slice(0, 60)}...`);
    if (_metrics.length > 0) {
      log('info', `${_metrics.length} mediciones restauradas de la sesión anterior`);
    }

    // Verificar que el Worker de Cloudflare responda
    setTimeout(checkWorker, 500);
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
    metricStart,
    metricEnd,
    exportLog,
    switchTab,
    activatePOI,
    flyToPOI,
    forceLoadPOIs,
    testNarration,
    checkWorker,
    clearCache,
    clearLogs,
    clearTimings,
    getInFlightCount,
    registerTab
  };

})();
