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

  /* ── ESTADO DE EXPERIENCIA ── */
  let _exp = {
    funnel: {
      poi_checks:             0,
      pois_detected:          0,
      pois_eligible:          0,
      pois_narrated:          0,
      narrations_completed:   0,
      narrations_interrupted: 0,
    },
    narrations: [],   // [{ts, lat, lng, poiId, poiName, completed, interrupted}]
    music: {
      activeSince:   null,   // performance.now() cuando empezó a sonar
      totalActiveMs: 0,
      dipStartTs:    null,
      totalDipMs:    0,
      dipCount:      0,
      restoreCount:  0,
    },
  };

  const MAX_LOGS      = 80;
  const MAX_METRICS   = 150;
  const STORAGE_KEY   = 'follower_debug_log';

  /* ── INYECTAR ESTILOS ── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── DEBUG BAR — barra fija de tabs, debajo del care strip ── */
      #dbg-bar {
        position: fixed;
        top: 32px;
        left: 0;
        right: 0;
        z-index: 9990;
        background: rgba(8, 12, 20, 0.98);
        border-bottom: 1px solid rgba(192,57,43,0.35);
        display: flex;
        flex-shrink: 0;
      }

      /* ── DEBUG PANEL — overlay sobre el mapa, oculto por defecto ── */
      #dbg-panel {
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        z-index: 9989;
        background: rgba(8, 12, 20, 0.97);
        border-bottom: 1px solid rgba(192,57,43,0.25);
        font-family: 'Inter', monospace;
        font-size: 11px;
        color: #c8d4e0;
        max-height: 52vh;
        overflow-y: auto;
        overflow-x: hidden;
      }

      #dbg-panel.hidden { display: none; }

      #dbg-tabs {
        display: contents;
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
        border-bottom: 2px solid transparent;
      }

      .dbg-tab.active { color: #c0392b; border-bottom-color: #c0392b; }

      #dbg-content {
        padding: 8px;
      }

      /* ── CELDAS STATUS ── */
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

      /* ── LOGS ── */
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

      .dbg-log-type.gps        { background: rgba(26,82,118,0.5);  color: #5dade2; }
      .dbg-log-type.poi        { background: rgba(39,174,96,0.3);  color: #2ecc71; }
      .dbg-log-type.api        { background: rgba(243,156,18,0.3); color: #f39c12; }
      .dbg-log-type.voice      { background: rgba(155,89,182,0.3); color: #bb8fce; }
      .dbg-log-type.music      { background: rgba(52,152,219,0.3); color: #85c1e9; }
      .dbg-log-type.narration  { background: rgba(192,57,43,0.3);  color: #e74c3c; }
      .dbg-log-type.warn       { background: rgba(243,156,18,0.4); color: #f39c12; }
      .dbg-log-type.error      { background: rgba(192,57,43,0.4);  color: #e74c3c; }
      .dbg-log-type.info       { background: rgba(255,255,255,0.1); color: #c8d4e0; }

      .dbg-log-msg {
        color: #c8d4e0;
        font-size: 11px;
        flex: 1;
        min-width: 0;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      /* ── SEARCH ── */
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

      #dbg-search-input:focus { border-color: rgba(192,57,43,0.6); }

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

      #dbg-search-results { display: flex; flex-direction: column; gap: 4px; }

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

      .dbg-poi-name { font-weight: 600; color: #c8d4e0; margin-bottom: 2px; }
      .dbg-poi-meta { font-size: 10px; color: #4a5568; }

      .dbg-poi-btn-row { display: flex; gap: 6px; margin-top: 6px; }

      .dbg-poi-action {
        font-size: 10px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-family: 'Inter', monospace;
      }

      .dbg-poi-action.narrate { background: rgba(192,57,43,0.5); color: white; }
      .dbg-poi-action.map     { background: rgba(26,82,118,0.5);  color: white; }

      /* ── CLASES REUSABLES (debug-sim.js) ── */
      .dbg-input-row { display: flex; gap: 6px; margin-bottom: 8px; }

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

      .dbg-input:focus { border-color: rgba(192,57,43,0.6); }

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

      .dbg-slider-row { margin: 10px 0; }

      .dbg-slider-label {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #4a5568;
        margin-bottom: 4px;
      }

      .dbg-slider { width: 100%; accent-color: #c0392b; }

      /* ── TIMING ── */
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

      .dbg-timing-ms { font-weight: 700; font-size: 13px; }
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

      .dbg-timing-group {
        padding: 6px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }

      .dbg-timing-group-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dbg-timing-group-sub { font-size: 9px; color: #4a5568; margin-top: 2px; }

      .dbg-section-label {
        font-size: 9px;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin: 10px 0 6px;
      }
      .dbg-section-label:first-child { margin-top: 0; }

      /* Desktop — centrar a 390px */
      @media (min-width: 480px) {
        #dbg-bar, #dbg-panel {
          left: 50%;
          transform: translateX(-50%);
          width: 390px;
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
    // ── Barra de tabs fija ──
    const bar = document.createElement('div');
    bar.id = 'dbg-bar';
    bar.style.display = 'none';   // oculto hasta navigateTo('explore')
    bar.innerHTML = `<div id="dbg-tabs">
      <button class="dbg-tab" data-tab="status"  onclick="Debug.switchTab('status')">Estado</button>
      <button class="dbg-tab" data-tab="search"  onclick="Debug.switchTab('search')">Buscar</button>
      <button class="dbg-tab" data-tab="logs"    onclick="Debug.switchTab('logs')">Logs</button>
      <button class="dbg-tab" data-tab="timing"  onclick="Debug.switchTab('timing')">Tiempos</button>
      <button class="dbg-tab" data-tab="exp"     onclick="Debug.switchTab('exp')">🎬</button>
    </div>`;
    document.body.appendChild(bar);

    // ── Panel de contenido (overlay, oculto por defecto) ──
    const panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.classList.add('hidden');
    panel.innerHTML = `<div id="dbg-content"></div>`;
    document.body.appendChild(panel);

    // Agregar tabs externas registradas antes de que el panel existiera
    Object.entries(_externalTabs).forEach(([name, t]) => _appendTabButton(name, t.label));

    startAutoRefresh();
  }

  /* ── TOGGLE PANEL — ahora lo maneja switchTab ── */
  function togglePanel() {
    const panel = document.getElementById('dbg-panel');
    if (panel) panel.classList.toggle('hidden');
  }

  /* ── SWITCH TAB — tap en tab activa colapsa; tap en otra abre ── */
  function switchTab(tabName) {
    const panel = document.getElementById('dbg-panel');
    const isOpen   = panel && !panel.classList.contains('hidden');
    const isSameTab = tabName === _currentTab;

    // Tap en tab activa con panel abierto → colapsar
    if (isSameTab && isOpen) {
      panel.classList.add('hidden');
      document.querySelectorAll('.dbg-tab').forEach(t => t.classList.remove('active'));
      return;
    }

    // Tap en nueva tab o panel cerrado → abrir/actualizar
    document.querySelectorAll('.dbg-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });

    renderTab(tabName);
    if (panel) panel.classList.remove('hidden');
  }

  /* ── AUTO REFRESH — tab status ── */
  let _currentTab = 'status';
  function startAutoRefresh() {
    setInterval(() => {
      const panel = document.getElementById('dbg-panel');
      if (!panel || panel.classList.contains('hidden')) return;
      if (_currentTab === 'status' || _currentTab === 'exp') renderTab(_currentTab);
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
    else if (tab === 'exp')     content.innerHTML = renderExp();
    else if (_externalTabs[tab]) content.innerHTML = _externalTabs[tab].renderFn();

    if (tab === 'search') bindSearchListeners();
  }

  /* ── RENDER STATUS — Dashboard de Experiencia ── */
  function renderStatus() {
    const s   = typeof AppState !== 'undefined' ? AppState : {};
    const gps = s.gps;
    const now = performance.now();

    // ── Capa 1: ¿El pipeline llega a dispararse? ──
    const poiCount   = typeof POI !== 'undefined' ? POI.getPOIs().length : 0;
    const poiClass   = poiCount > 0 ? 'ok' : 'warn';
    const inFlight   = getInFlightCount('poi');
    const kmWalked   = (s.kmWalked || 0).toFixed(2);
    const narCount   = s._narrationCount || 0;
    const kmPerNar   = narCount > 0 ? (s.kmWalked / narCount).toFixed(2) : '—';

    let timeToFirst = '—';
    if (s._firstNarrationTs !== null && s._sessionStart !== null) {
      timeToFirst = Math.round((s._firstNarrationTs - s._sessionStart) / 1000) + 's';
    } else if (s._sessionStart !== null) {
      timeToFirst = '⏳ esperando...';
    }

    // ── Capa 2: ¿La narración llega a tiempo? ──
    const isNarrating = typeof Narration !== 'undefined' && Narration.isNarrating();
    const isSpeaking  = typeof Voice !== 'undefined' && Voice.isSpeaking();

    // Promedios de voice desde _metrics
    const voiceLagMetrics = _metrics.filter(m => m.category === 'voice' && m.label === 'lag texto→voz' && m.status === 'ok');
    const voiceDurMetrics = _metrics.filter(m => m.category === 'voice' && m.label === 'duración narración hablada' && m.status === 'ok');
    const voiceLagAvg  = voiceLagMetrics.length
      ? Math.round(voiceLagMetrics.reduce((a, b) => a + b.ms, 0) / voiceLagMetrics.length) + 'ms'
      : '—';
    const voiceDurAvg  = voiceDurMetrics.length
      ? Math.round(voiceDurMetrics.reduce((a, b) => a + b.ms, 0) / voiceDurMetrics.length / 1000) + 's'
      : '—';
    const workerMetrics = _metrics.filter(m => m.category === 'narration' && m.label === 'Claude Worker call' && m.status === 'ok');
    const workerAvg = workerMetrics.length
      ? Math.round(workerMetrics.reduce((a, b) => a + b.ms, 0) / workerMetrics.length) + 'ms'
      : '—';

    // ── Capa 3: ¿El ritmo es cinematográfico? ──
    // Acumular la fase actual (que aún no cerró en AppState)
    let sistoleMs  = s._msTotalSystole  || 0;
    let diastoleMs = s._msTotalDiastole || 0;
    if (s._phaseStart !== null) {
      const currentPhaseMs = now - s._phaseStart;
      if (s.phase === 'systole')  sistoleMs  += currentPhaseMs;
      if (s.phase === 'diastole') diastoleMs += currentPhaseMs;
    }
    const totalMs      = sistoleMs + diastoleMs || 1;
    const sistolePct   = Math.round((sistoleMs  / totalMs) * 100);
    const diastolePct  = Math.round((diastoleMs / totalMs) * 100);

    let intervaloStr = '—';
    if (s._lastNarrationTs !== null) {
      const seg = Math.round((now - s._lastNarrationTs) / 1000);
      intervaloStr = `hace ${seg}s`;
    }

    const workerClass = window._dbgWorkerStatus === 'ok'       ? 'ok'
                      : window._dbgWorkerStatus === 'checking' ? 'warn'
                      : 'error';
    const workerVal   = window._dbgWorkerStatus === 'ok'       ? 'OK'
                      : window._dbgWorkerStatus === 'checking' ? 'Verificando...'
                      : 'Sin verificar';

    return `
      <div class="dbg-section-label">🎬 Capa 1 — Pipeline</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">POIs cargados</div>
          <div class="dbg-cell-value ${poiClass}">${poiCount}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Fetches en vuelo</div>
          <div class="dbg-cell-value ${inFlight > 0 ? 'warn' : 'ok'}">${inFlight}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Narraciones</div>
          <div class="dbg-cell-value ${narCount > 0 ? 'ok' : ''}">${narCount}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Km por narración</div>
          <div class="dbg-cell-value">${kmPerNar}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Km caminados</div>
          <div class="dbg-cell-value">${kmWalked}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Primera narración</div>
          <div class="dbg-cell-value ${s._firstNarrationTs ? 'ok' : ''}">${timeToFirst}</div>
        </div>
      </div>

      <div class="dbg-section-label">🎙️ Capa 2 — Narración en tiempo</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Estado</div>
          <div class="dbg-cell-value ${isNarrating ? 'ok' : ''}">
            ${isNarrating ? '🔴 Narrando' : isSpeaking ? '🔊 Hablando' : 'En espera'}
          </div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Worker Claude (avg)</div>
          <div class="dbg-cell-value">${workerAvg}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Lag texto→voz (avg)</div>
          <div class="dbg-cell-value">${voiceLagAvg}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Duración voz (avg)</div>
          <div class="dbg-cell-value">${voiceDurAvg}</div>
        </div>
      </div>

      <div class="dbg-section-label">💓 Capa 3 — Ritmo cinematográfico</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Sístole (caminando)</div>
          <div class="dbg-cell-value">${sistolePct}%</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Diástole (narrando)</div>
          <div class="dbg-cell-value ${diastolePct > 0 ? 'ok' : ''}">${diastolePct}%</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Última narración</div>
          <div class="dbg-cell-value">${intervaloStr}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Fase actual</div>
          <div class="dbg-cell-value">${s.phase || '—'}</div>
        </div>
      </div>

      <div class="dbg-section-label">⚙️ Sistema</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">GPS</div>
          <div class="dbg-cell-value ${gps ? 'ok' : 'error'}">
            ${gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Sin señal'}
          </div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Precisión</div>
          <div class="dbg-cell-value">${gps ? `±${Math.round(gps.accuracy || 0)}m` : '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Worker</div>
          <div class="dbg-cell-value ${workerClass}">${workerVal}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Conectividad</div>
          <div class="dbg-cell-value ${s.offline ? 'error' : 'ok'}">${s.offline ? 'OFFLINE' : 'Online'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">POI activo</div>
          <div class="dbg-cell-value ${s.activePOI ? 'ok' : ''}">${s.activePOI?.name || '—'}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Ciudad · Mood</div>
          <div class="dbg-cell-value">${s.cityName || '—'} · ${s.mood || '—'}</div>
        </div>
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
        <button class="dbg-poi-action narrate" onclick="Debug.forceLoadPOIs()">🔄 POIs</button>
        <button class="dbg-poi-action map" onclick="Debug.testNarration()">🎙️ Test</button>
        <button class="dbg-poi-action map" onclick="Debug.checkWorker()">☁️ Worker</button>
        <button class="dbg-poi-action map" onclick="Debug.clearCache()">🗑️ Cache</button>
        <button class="dbg-poi-action narrate" onclick="Debug.exportLog()">📤 Exportar</button>
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
        exp:     _exp,
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
      if (parsed.exp && typeof parsed.exp === 'object') {
        if (parsed.exp.funnel)     Object.assign(_exp.funnel, parsed.exp.funnel);
        if (Array.isArray(parsed.exp.narrations)) _exp.narrations = parsed.exp.narrations;
        if (parsed.exp.music) {
          Object.assign(_exp.music, parsed.exp.music);
          _exp.music.activeSince = null;  // no restaurar timestamps de performance
          _exp.music.dipStartTs  = null;
        }
      }
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

  /* ── TRACK EXPERIENCE — entrada única desde módulos ── */
  function trackExp(step, data) {
    const perfNow = performance.now();
    const f       = _exp.funnel;
    const m       = _exp.music;

    switch (step) {
      case 'poi_check':
        f.poi_checks++;
        break;
      case 'poi_detected':
        f.pois_detected++;
        break;
      case 'poi_eligible':
        f.pois_eligible++;
        break;
      case 'poi_narrated': {
        f.pois_narrated++;
        const d = data || {};
        _exp.narrations.push({
          ts:          Date.now(),
          lat:         d.lat    || null,
          lng:         d.lng    || null,
          poiId:       d.poiId  || null,
          poiName:     d.poiName || null,
          completed:   false,
          interrupted: false,
        });
        break;
      }
      case 'narration_completed': {
        f.narrations_completed++;
        const last = _exp.narrations[_exp.narrations.length - 1];
        if (last && !last.completed && !last.interrupted) last.completed = true;
        break;
      }
      case 'narration_interrupted': {
        f.narrations_interrupted++;
        const last = _exp.narrations[_exp.narrations.length - 1];
        if (last && !last.completed && !last.interrupted) last.interrupted = true;
        break;
      }
      case 'music_active':
        if (m.activeSince === null) m.activeSince = perfNow;
        break;
      case 'music_stopped':
        if (m.activeSince !== null) {
          m.totalActiveMs += perfNow - m.activeSince;
          m.activeSince = null;
        }
        break;
      case 'music_dip_start':
        m.dipCount++;
        m.dipStartTs = perfNow;
        break;
      case 'music_dip_end':
        m.restoreCount++;
        if (m.dipStartTs !== null) {
          m.totalDipMs += perfNow - m.dipStartTs;
          m.dipStartTs = null;
        }
        break;
    }

    persistState();
    if (_currentTab === 'exp') renderTab('exp');
  }

  function clearExpMetrics() {
    _exp = {
      funnel: {
        poi_checks: 0, pois_detected: 0, pois_eligible: 0,
        pois_narrated: 0, narrations_completed: 0, narrations_interrupted: 0,
      },
      narrations: [],
      music: {
        activeSince: null, totalActiveMs: 0,
        dipStartTs: null, totalDipMs: 0,
        dipCount: 0, restoreCount: 0,
      },
    };
    persistState();
    renderTab('exp');
  }

  function getExp() { return _exp; }

  /* ── HELPERS DE EXPERIENCIA ── */
  function _getNarrationIntervalsSec() {
    const ts = _exp.narrations.map(n => n.ts);
    if (ts.length < 2) return [];
    const out = [];
    for (let i = 1; i < ts.length; i++) {
      out.push(Math.round((ts[i] - ts[i - 1]) / 1000));
    }
    return out;
  }

  function _getSessionDurationMs() {
    const s       = typeof AppState !== 'undefined' ? AppState : {};
    const perfNow = performance.now();
    let totalMs   = (s._msTotalSystole || 0) + (s._msTotalDiastole || 0);
    if (s._phaseStart !== null) totalMs += perfNow - s._phaseStart;
    return totalMs;
  }

  function _computeCinematicScore() {
    const f        = _exp.funnel;
    const music    = _exp.music;
    const intervals = _getNarrationIntervalsSec();
    const perfNow  = performance.now();

    if (f.pois_narrated === 0) return 0;

    let score = 50;

    // Completitud +20
    const compRatio = f.narrations_completed / f.pois_narrated;
    score += Math.round(compRatio * 20);

    // Ritmo narrativo
    if (intervals.length > 0) {
      const avgInt = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if      (avgInt >= 120 && avgInt <= 420) score += 15;  // 2-7min: sweet spot
      else if (avgInt < 60)                   score -= 15;  // saturación
      else if (avgInt > 600)                  score -= 10;  // muy esporádico

      const criticals = intervals.filter(i => i > 600).length;
      score -= criticals * 8;
    }

    // Presencia de música +10
    let totalActiveMs = music.totalActiveMs;
    if (music.activeSince !== null) totalActiveMs += perfNow - music.activeSince;
    const sessionMs = _getSessionDurationMs();
    if (sessionMs > 0) {
      const musicPct = totalActiveMs / sessionMs;
      if      (musicPct >= 0.7) score += 10;
      else if (musicPct >= 0.4) score += 5;
    }

    // Penalización por interrupciones
    const intRatio = f.narrations_interrupted / f.pois_narrated;
    score -= Math.round(intRatio * 15);

    return Math.max(0, Math.min(100, score));
  }

  /* ── RENDER EXP — tab de observabilidad de experiencia ── */
  function renderExp() {
    const f        = _exp.funnel;
    const music    = _exp.music;
    const perfNow  = performance.now();
    const s        = typeof AppState !== 'undefined' ? AppState : {};

    // Embudo
    const fmtConv = (val, prev) => {
      if (prev <= 0) return String(val);
      const pct = Math.round((val / prev) * 100);
      const cls = pct < 30 ? 'color:#c0392b' : pct < 60 ? 'color:#f39c12' : 'color:#2ecc71';
      return `${val} <span style="${cls}; font-size:9px;">(${pct}%)</span>`;
    };

    const funnelHTML = `
      <div class="dbg-timing-row">
        <span class="dbg-timing-label">Chequeos POI</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${f.poi_checks}</span>
      </div>
      <div class="dbg-timing-row" style="padding-left:10px;">
        <span class="dbg-timing-label">↳ POIs detectados</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${fmtConv(f.pois_detected, f.poi_checks)}</span>
      </div>
      <div class="dbg-timing-row" style="padding-left:10px;">
        <span class="dbg-timing-label">↳ POIs elegibles</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${fmtConv(f.pois_eligible, f.pois_detected)}</span>
      </div>
      <div class="dbg-timing-row" style="padding-left:10px;">
        <span class="dbg-timing-label">↳ POIs narrados</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${fmtConv(f.pois_narrated, f.pois_eligible)}</span>
      </div>
      <div class="dbg-timing-row" style="padding-left:20px;">
        <span class="dbg-timing-label">↳ Narraciones completas</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${fmtConv(f.narrations_completed, f.pois_narrated)}</span>
      </div>
      <div class="dbg-timing-row" style="padding-left:20px;">
        <span class="dbg-timing-label">↳ Interrumpidas</span>
        <span style="font-size:12px; font-weight:600; color:#c8d4e0;">${f.narrations_interrupted}</span>
      </div>
    `;

    // Ritmo
    const fmtSec = (s) => {
      if (s === null) return '—';
      if (s >= 3600) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}min`;
      if (s >= 60)   return `${Math.floor(s/60)}min ${s%60}s`;
      return `${s}s`;
    };
    const intervals    = _getNarrationIntervalsSec();
    const avgInt       = intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : null;
    const minInt       = intervals.length ? Math.min(...intervals) : null;
    const maxInt       = intervals.length ? Math.max(...intervals) : null;
    const longSilences = intervals.filter(i => i > 300).length;
    const critSilences = intervals.filter(i => i > 600).length;
    const saturations  = intervals.filter(i => i < 120).length;
    const intPct       = f.pois_narrated > 0 ? Math.round((f.narrations_interrupted / f.pois_narrated) * 100) : 0;

    // Música
    let totalActiveMs = music.totalActiveMs;
    if (music.activeSince !== null) totalActiveMs += perfNow - music.activeSince;
    const sessionMs = _getSessionDurationMs();
    const musicPct  = sessionMs > 0 ? Math.round((totalActiveMs / sessionMs) * 100) : 0;
    let totalDipMs  = music.totalDipMs;
    if (music.dipStartTs !== null) totalDipMs += perfNow - music.dipStartTs;
    const dipPct = totalActiveMs > 0 ? Math.round((totalDipMs / totalActiveMs) * 100) : 0;

    // Calidad de caminata
    const kmWalked  = s.kmWalked || 0;
    const sessionMin = Math.round(sessionMs / 60000);
    const narPerHour = sessionMin > 0 ? ((f.pois_narrated / sessionMin) * 60).toFixed(1) : '—';
    const mPerNar    = f.pois_narrated > 0 ? Math.round((kmWalked * 1000) / f.pois_narrated) : null;

    // Score
    const score      = _computeCinematicScore();
    const scoreColor = score >= 70 ? '#2ecc71' : score >= 40 ? '#f39c12' : '#c0392b';
    const scoreLabel = score >= 70 ? 'Buen ritmo cinematográfico'
                     : score >= 40 ? 'Ritmo mejorable'
                     : score > 0   ? 'Experiencia pobre — revisar pipeline'
                     : 'Sin narraciones';

    // Tiempo hasta primera historia
    const ttf     = (s._firstNarrationTs !== null && s._sessionStart !== null)
                    ? Math.round((s._firstNarrationTs - s._sessionStart) / 1000)
                    : null;
    const ttfStr  = ttf !== null ? fmtSec(ttf) : '—';
    // Semáforo: verde <90s · amarillo 90-300s · rojo >300s
    const ttfColor = ttf === null   ? '#4a5568'
                   : ttf <= 90      ? '#2ecc71'
                   : ttf <= 300     ? '#f39c12'
                   : '#c0392b';
    const ttfLabel = ttf === null   ? 'esperando primera historia'
                   : ttf <= 90      ? 'excelente — primera historia rápida'
                   : ttf <= 300     ? 'aceptable — mejorar densidad o radio'
                   : 'crítico — el usuario esperó demasiado';

    return `
      <!-- Tiempo hasta primera historia — métrica principal -->
      <div style="text-align:center; padding:10px 0 10px; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:8px;">
        <div style="font-size:9px; color:#4a5568; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:4px;">⏱ Tiempo hasta primera historia</div>
        <div style="font-size:36px; font-weight:700; color:${ttfColor}; line-height:1;">${ttfStr}</div>
        <div style="font-size:9px; color:${ttfColor}; margin-top:2px; opacity:0.85;">${ttfLabel}</div>
      </div>

      <!-- Score -->
      <div style="text-align:center; padding:10px 0 8px; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:8px;">
        <div style="font-size:9px; color:#4a5568; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:4px;">🎬 Cinematic Score</div>
        <div style="font-size:36px; font-weight:700; color:${scoreColor}; line-height:1;">${score}</div>
        <div style="font-size:9px; color:#4a5568; margin-top:2px;">/ 100 — ${scoreLabel}</div>
      </div>

      <div class="dbg-section-label">Embudo narrativo</div>
      ${funnelHTML}

      <div class="dbg-section-label">Ritmo narrativo</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Intervalo promedio</div>
          <div class="dbg-cell-value">${fmtSec(avgInt)}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Intervalo mínimo</div>
          <div class="dbg-cell-value ${minInt !== null && minInt < 120 ? 'warn' : ''}">${fmtSec(minInt)}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Mayor silencio</div>
          <div class="dbg-cell-value ${maxInt !== null && maxInt > 300 ? 'warn' : ''}">${fmtSec(maxInt)}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Interrupciones</div>
          <div class="dbg-cell-value ${intPct > 20 ? 'warn' : f.narrations_interrupted === 0 && f.pois_narrated > 0 ? 'ok' : ''}">${f.narrations_interrupted} (${intPct}%)</div>
        </div>
      </div>
      ${longSilences > 0 ? `<div style="color:#f39c12; font-size:10px; padding:4px 0;">⚠️ ${longSilences} silencio${longSilences !== 1 ? 's' : ''} > 5min · ${critSilences} crítico${critSilences !== 1 ? 's' : ''} > 10min</div>` : ''}
      ${saturations > 0 ? `<div style="color:#f39c12; font-size:10px; padding:4px 0;">⚠️ ${saturations} intervalo${saturations !== 1 ? 's' : ''} < 2min (posible saturación)</div>` : ''}

      <div class="dbg-section-label">Calidad de caminata</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Duración sesión</div>
          <div class="dbg-cell-value">${sessionMin}min</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Km caminados</div>
          <div class="dbg-cell-value">${kmWalked.toFixed(2)}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Narraciones/hora</div>
          <div class="dbg-cell-value">${narPerHour}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Metros/narración</div>
          <div class="dbg-cell-value">${mPerNar !== null ? mPerNar + 'm' : '—'}</div>
        </div>
      </div>

      <div class="dbg-section-label">Música</div>
      <div class="dbg-grid">
        <div class="dbg-cell">
          <div class="dbg-cell-label">Presencia música</div>
          <div class="dbg-cell-value ${musicPct >= 70 ? 'ok' : musicPct >= 40 ? 'warn' : 'error'}">${musicPct}%</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Tiempo en dip</div>
          <div class="dbg-cell-value">${dipPct}%</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Dips</div>
          <div class="dbg-cell-value">${music.dipCount}</div>
        </div>
        <div class="dbg-cell">
          <div class="dbg-cell-label">Restores</div>
          <div class="dbg-cell-value">${music.restoreCount}</div>
        </div>
      </div>

      <div class="dbg-actions-row">
        <button id="dbg-export-btn" onclick="Debug.exportLog()">📤 Exportar .txt</button>
        <button id="dbg-clear-btn" onclick="Debug.clearExpMetrics()">Reset exp.</button>
      </div>
    `;
  }

  /* ── EXPORTAR REPORTE A .TXT ── */
  function exportLog() {
    const now   = new Date();
    const stamp = now.toISOString().replace('T', ' ').slice(0, 19);
    const lines = [];
    const s     = typeof AppState !== 'undefined' ? AppState : {};
    const perfNow = performance.now();

    lines.push('═'.repeat(50));
    lines.push('FOLLOWER — REPORTE DE DEBUG');
    lines.push(`Exportado: ${stamp}`);
    lines.push(`User Agent: ${navigator.userAgent}`);
    lines.push('═'.repeat(50));
    lines.push('');

    // ── ANÁLISIS DE EXPERIENCIA ──
    lines.push('ANÁLISIS DE EXPERIENCIA CINEMATOGRÁFICA');
    lines.push('─'.repeat(50));

    // Capa 1
    lines.push('[ Capa 1 — ¿El pipeline llega a dispararse? ]');
    const narCount  = s._narrationCount || 0;
    const kmWalked  = (s.kmWalked || 0).toFixed(2);
    const kmPerNar  = narCount > 0 ? (s.kmWalked / narCount).toFixed(2) : 'n/a';
    lines.push(`  Narraciones disparadas:  ${narCount}`);
    lines.push(`  Km caminados:            ${kmWalked} km`);
    lines.push(`  Km por narración:        ${kmPerNar} km`);
    lines.push(`  POIs visitados:          ${s.poisVisited || 0}`);

    if (s._firstNarrationTs !== null && s._sessionStart !== null) {
      const secsToFirst = Math.round((s._firstNarrationTs - s._sessionStart) / 1000);
      lines.push(`  Tiempo hasta 1ª narración: ${secsToFirst}s`);
    } else {
      lines.push(`  Tiempo hasta 1ª narración: no hubo narraciones en esta sesión`);
    }

    // Embudo POI check → narración desde los logs
    const poiChecks = _logs.filter(l => l.msg.startsWith('POI check')).length;
    lines.push(`  Chequeos de POI:         ${poiChecks}`);
    lines.push(`  Tasa narración/chequeo:  ${poiChecks > 0 ? ((narCount / poiChecks) * 100).toFixed(1) + '%' : 'n/a'}`);
    lines.push('');

    // Capa 2
    lines.push('[ Capa 2 — ¿La narración llega a tiempo? ]');
    const workerOk = _metrics.filter(m => m.category === 'narration' && m.label === 'Claude Worker call' && m.status === 'ok');
    const workerAvg = workerOk.length ? Math.round(workerOk.reduce((a, b) => a + b.ms, 0) / workerOk.length) : null;
    const cacheHits = _metrics.filter(m => m.category === 'narration' && m.label === 'cache lookup' && m.status === 'hit').length;
    const cacheMiss = _metrics.filter(m => m.category === 'narration' && m.label === 'cache lookup' && m.status === 'miss').length;
    const voiceLagOk  = _metrics.filter(m => m.category === 'voice' && m.label === 'lag texto→voz' && m.status === 'ok');
    const voiceDurOk  = _metrics.filter(m => m.category === 'voice' && m.label === 'duración narración hablada' && m.status === 'ok');
    const voiceErrors = _metrics.filter(m => m.category === 'voice' && m.status === 'error').length;
    const lagAvg  = voiceLagOk.length  ? Math.round(voiceLagOk.reduce((a, b)  => a + b.ms, 0) / voiceLagOk.length)  : null;
    const durAvg  = voiceDurOk.length  ? Math.round(voiceDurOk.reduce((a, b)  => a + b.ms, 0) / voiceDurOk.length)  : null;

    lines.push(`  Cache hits / misses:     ${cacheHits} / ${cacheMiss}`);
    lines.push(`  Worker Claude (avg):     ${workerAvg !== null ? workerAvg + 'ms' : 'n/a'}`);
    lines.push(`  Lag texto→voz (avg):     ${lagAvg  !== null ? lagAvg  + 'ms' : 'n/a'}`);
    lines.push(`  Duración voz (avg):      ${durAvg  !== null ? Math.round(durAvg / 1000) + 's' : 'n/a'}`);
    lines.push(`  Errores de síntesis:     ${voiceErrors}`);
    lines.push('');

    // Capa 3
    lines.push('[ Capa 3 — ¿El ritmo es cinematográfico? ]');
    let sistoleMs  = s._msTotalSystole  || 0;
    let diastoleMs = s._msTotalDiastole || 0;
    if (s._phaseStart !== null) {
      const currentMs = perfNow - s._phaseStart;
      if (s.phase === 'systole')  sistoleMs  += currentMs;
      if (s.phase === 'diastole') diastoleMs += currentMs;
    }
    const totalMs   = sistoleMs + diastoleMs || 1;
    const sPct      = Math.round((sistoleMs  / totalMs) * 100);
    const dPct      = Math.round((diastoleMs / totalMs) * 100);
    const totalMin  = Math.round(totalMs / 60000);

    // Intervalos entre narraciones desde los logs
    const intervalLogs = _logs.filter(l => l.msg.startsWith('Intervalo entre narraciones:'));
    const intervalSegs = intervalLogs.map(l => {
      const m = l.msg.match(/(\d+)s/);
      return m ? parseInt(m[1]) : null;
    }).filter(Boolean);
    const avgInterval = intervalSegs.length
      ? Math.round(intervalSegs.reduce((a, b) => a + b, 0) / intervalSegs.length)
      : null;
    const silenciosLargos = _logs.filter(l => l.msg.startsWith('Silencio largo:')).length;

    lines.push(`  Tiempo total de sesión:  ${totalMin}min`);
    lines.push(`  Tiempo en sístole:       ${sPct}% (${Math.round(sistoleMs / 60000)}min)`);
    lines.push(`  Tiempo en diástole:      ${dPct}% (${Math.round(diastoleMs / 60000)}min)`);
    lines.push(`  Intervalo entre nar.:    ${avgInterval !== null ? avgInterval + 's avg' : 'n/a'}`);
    lines.push(`  Silencios > 5min:        ${silenciosLargos}`);
    lines.push('');

    // Veredicto automático
    lines.push('[ Veredicto de sesión ]');
    if (narCount === 0) {
      lines.push('  ⚠️  CRÍTICO: cero narraciones en toda la sesión.');
      lines.push('  Revisar: candado de poi.js, estado del Worker, radio de detección.');
    } else if (kmPerNar !== 'n/a' && parseFloat(kmPerNar) > 1.5) {
      lines.push(`  ⚠️  Densidad baja: una narración cada ${kmPerNar}km. La experiencia puede sentirse vacía.`);
    } else if (dPct < 5) {
      lines.push('  ⚠️  Muy poco tiempo en diástole. El pipeline funciona pero raramente narra.');
    } else {
      lines.push('  ✅  Pipeline activo. Revisar tiempos individuales para ajuste fino.');
    }
    lines.push('');
    lines.push('═'.repeat(50));
    lines.push('');

    // ── MÉTRICAS DE EXPERIENCIA (DETALLE AVANZADO) ──
    lines.push('MÉTRICAS DE EXPERIENCIA');
    lines.push('─'.repeat(50));

    // Embudo
    lines.push('[ Embudo narrativo ]');
    const ef = _exp.funnel;
    const fmtConvExport = (val, prev, label) => {
      const pctStr = prev > 0 ? ` (${Math.round((val/prev)*100)}%)` : '';
      lines.push(`  ${label}: ${val}${pctStr}`);
    };
    lines.push(`  Chequeos POI:            ${ef.poi_checks}`);
    fmtConvExport(ef.pois_detected,         ef.poi_checks,         '  ↳ POIs detectados     ');
    fmtConvExport(ef.pois_eligible,         ef.pois_detected,      '  ↳ POIs elegibles      ');
    fmtConvExport(ef.pois_narrated,         ef.pois_eligible,      '  ↳ POIs narrados       ');
    fmtConvExport(ef.narrations_completed,  ef.pois_narrated,      '  ↳ Narraciones completas');
    lines.push(`  ↳ Narraciones interrumpidas: ${ef.narrations_interrupted}`);
    lines.push('');

    // Ritmo
    lines.push('[ Ritmo narrativo ]');
    const expIntervals = _getNarrationIntervalsSec();
    if (expIntervals.length > 0) {
      const avgI = Math.round(expIntervals.reduce((a,b)=>a+b,0)/expIntervals.length);
      const minI = Math.min(...expIntervals);
      const maxI = Math.max(...expIntervals);
      const fmtS = (sec) => sec >= 60 ? `${Math.floor(sec/60)}min ${sec%60}s` : `${sec}s`;
      lines.push(`  Intervalo promedio:       ${fmtS(avgI)}`);
      lines.push(`  Intervalo mínimo:         ${fmtS(minI)}`);
      lines.push(`  Mayor silencio:           ${fmtS(maxI)}`);
      lines.push(`  Silencios > 5min:         ${expIntervals.filter(i=>i>300).length}`);
      lines.push(`  Silencios críticos > 10min: ${expIntervals.filter(i=>i>600).length}`);
      lines.push(`  Saturaciones < 2min:      ${expIntervals.filter(i=>i<120).length}`);
    } else {
      lines.push('  Sin datos de ritmo (< 2 narraciones)');
    }
    lines.push('');

    // Calidad de caminata
    lines.push('[ Calidad de caminata ]');
    const expKm      = s.kmWalked || 0;
    const expSessMs  = _getSessionDurationMs();
    const expSessMin = Math.round(expSessMs / 60000);
    const expNarHz   = expSessMin > 0 ? ((ef.pois_narrated / expSessMin) * 60).toFixed(1) : 'n/a';
    const expMPerNar = ef.pois_narrated > 0 ? Math.round((expKm * 1000) / ef.pois_narrated) : null;
    lines.push(`  Duración sesión:          ${expSessMin}min`);
    lines.push(`  Narraciones por hora:     ${expNarHz}`);
    lines.push(`  Metros por narración:     ${expMPerNar !== null ? expMPerNar + 'm' : 'n/a'}`);
    lines.push('');

    // Música
    lines.push('[ Música ]');
    let expActiveMs = _exp.music.totalActiveMs;
    // activeSince ya no tiene valor útil en exportación — usar totalActiveMs directo
    const expMusicPct = expSessMs > 0 ? Math.round((expActiveMs / expSessMs) * 100) : 0;
    lines.push(`  Presencia de música:      ${expMusicPct}% de la sesión`);
    lines.push(`  Dips:                     ${_exp.music.dipCount}`);
    lines.push(`  Restores:                 ${_exp.music.restoreCount}`);
    lines.push('');

    // Tiempo hasta primera historia — métrica principal
    const expTTF = (s._firstNarrationTs !== null && s._sessionStart !== null)
                   ? Math.round((s._firstNarrationTs - s._sessionStart) / 1000)
                   : null;
    const expTTFLabel = expTTF === null  ? 'sin primera historia'
                      : expTTF <= 90    ? 'excelente'
                      : expTTF <= 300   ? 'aceptable'
                      : 'crítico';
    lines.push(`⏱ Tiempo hasta 1ª historia: ${expTTF !== null ? expTTF + 's' : '—'} — ${expTTFLabel}`);
    lines.push('');

    // Cinematic Score
    const expScore = _computeCinematicScore();
    lines.push(`🎬 Cinematic Score:         ${expScore}/100`);
    const expLabel = expScore >= 70 ? 'Buen ritmo cinematográfico'
                   : expScore >= 40 ? 'Ritmo mejorable'
                   : expScore > 0   ? 'Experiencia pobre'
                   : 'Sin narraciones';
    lines.push(`   Veredicto:               ${expLabel}`);
    lines.push('');
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push('RESUMEN TÉCNICO DE TIEMPOS');
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

  /* ── VERIFICAR WORKER DE CLOUDFLARE ── */
  async function checkWorker() {
    window._dbgWorkerStatus = 'checking';

    try {
      const url = (typeof Narration !== 'undefined' && Narration._configUrl)
        ? Narration._configUrl.replace('/narration', '/weather')
        : 'https://followernarration.jaimeand.workers.dev/weather';

      const res = await fetch(url);
      window._dbgWorkerStatus = res.status ? 'ok' : 'error';
      log('info', `Worker Cloudflare: respondió status=${res.status}`);

    } catch (e) {
      window._dbgWorkerStatus = 'error';
      log('error', `Worker Cloudflare inaccesible: ${e.message}`);
    }

    const panel = document.getElementById('dbg-panel');
    if (panel && !panel.classList.contains('hidden') && _currentTab === 'status') {
      renderTab('status');
    }
  }

  /* ── INIT ── */
  function init() {
    loadPersistedState();
    injectStyles();
    createPanel();
    interceptConsole();

    log('info', `Follower Debug v0.5 — panel overlay activo`);
    log('info', `User Agent: ${navigator.userAgent.slice(0, 60)}...`);
    if (_metrics.length > 0) {
      log('info', `${_metrics.length} mediciones restauradas de la sesión anterior`);
    }

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
    trackExp,
    getExp,
    clearExpMetrics,
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
