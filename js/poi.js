/* ═══════════════════════════════════════════
   FOLLOWER — poi.js
   Detección de POIs cercanos desde OSM,
   cache en IndexedDB, renderizado en mapa
   y card pequeña. DA-3: detectPOI() única.
   ═══════════════════════════════════════════ */

const POI = (() => {

  /* ── ESTADO INTERNO ── */
  let _pois           = [];       // POIs cargados para la zona actual
  let _markers        = {};       // marcadores Leaflet { poi.id: marker }
  let _lastFetchPos   = null;     // última posición donde se hicieron fetch
  let _db             = null;     // instancia IndexedDB
  let _pendingDetect  = null;     // DT-38: posición pendiente de detectPOI tras carga inicial

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    FETCH_RADIUS_KM:    2,      // radio de fetch de POIs desde OSM
    REFETCH_KM:         2,      // refetch si nos movemos más de 2km
    DB_NAME:            'follower_db',
    DB_VERSION:         1,
    STORE_POIS:         'pois',
    STORE_NARRATIONS:   'narrations'
  };

  /* ── CATEGORÍAS OSM → icono + tipo ── */
  const OSM_CATEGORIES = {
    'historic':      { icon: '🏛️', type: 'historic' },
    'tourism':       { icon: '📍', type: 'tourism'  },
    'amenity':       { icon: '☕', type: 'amenity'  },
    'museum':        { icon: '🖼️', type: 'museum'   },
    'church':        { icon: '⛪', type: 'church'   },
    'castle':        { icon: '🏰', type: 'castle'   },
    'ruins':         { icon: '🏚️', type: 'ruins'    },
    'monument':      { icon: '🗿', type: 'monument' },
    'fountain':      { icon: '⛲', type: 'fountain' },
    'artwork':       { icon: '🎨', type: 'artwork'  },
    'viewpoint':     { icon: '🔭', type: 'viewpoint'},
    'archaeological_site': { icon: '⚱️', type: 'archaeological' }
  };

  /* ── INICIALIZAR INDEXEDDB ── */
  function initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(CONFIG.STORE_POIS)) {
          db.createObjectStore(CONFIG.STORE_POIS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CONFIG.STORE_NARRATIONS)) {
          db.createObjectStore(CONFIG.STORE_NARRATIONS, { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        _db = e.target.result;
        resolve(_db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /* ── GUARDAR POIs EN INDEXEDDB ── */
  async function savePOIsToDB(pois) {
    if (!_db) return;
    const tx    = _db.transaction(CONFIG.STORE_POIS, 'readwrite');
    const store = tx.objectStore(CONFIG.STORE_POIS);
    pois.forEach(poi => store.put(poi));
  }

  /* ── CARGAR POIs DESDE INDEXEDDB ── */
  async function loadPOIsFromDB() {
    if (!_db) return [];
    return new Promise((resolve) => {
      const tx    = _db.transaction(CONFIG.STORE_POIS, 'readonly');
      const store = tx.objectStore(CONFIG.STORE_POIS);
      const req   = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => resolve([]);
    });
  }

  /* ── FETCH POIs DESDE OVERPASS (OSM) ── */
  async function fetchPOIsFromOSM(lat, lng, radiusKm) {
    const radius = radiusKm * 1000; // metros

    // Query optimizada: usa (around:...) UNA sola vez por bloque
    // en vez de repetirlo en cada cláusula — mucho más rápido para Overpass.
    const query  = `
      [out:json][timeout:25];
      (
        node(around:${radius},${lat},${lng})["historic"];
        node(around:${radius},${lat},${lng})["tourism"~"museum|attraction|viewpoint|gallery"
        // artwork excluido: murales de artistas foraneos sin valor editorial local];
        node(around:${radius},${lat},${lng})["amenity"~"place_of_worship|fountain|theatre|cinema"];
        node(around:${radius},${lat},${lng})["leisure"~"park|garden"];
        node(around:${radius},${lat},${lng})["man_made"~"monument|memorial|statue"];
        way(around:${radius},${lat},${lng})["historic"];
        way(around:${radius},${lat},${lng})["tourism"~"museum|attraction"];
      );
      out center;
    `;

    const url = 'https://lz4.overpass-api.de/api/interpreter';
    console.log(`POI: fetching lat=${lat} lng=${lng} radius=${radius}m`);

    const dbgId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('poi', 'Overpass fetch')
      : null;

    try {
      const res = await fetch(url, {
        method: 'POST',
        body:   `data=${encodeURIComponent(query)}`
      });

      console.log(`POI: Overpass respondió status=${res.status}`);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`POI: Overpass API error ${res.status} — ${errText.slice(0, 200)}`);
        if (dbgId) Debug.metricEnd(dbgId, 'error', { httpStatus: res.status });
        throw new Error('Overpass API error');
      }

      const data     = await res.json();
      const elements = data.elements || [];
      console.log(`POI: Overpass devolvió ${elements.length} elementos crudos`);

      const withName = elements.filter(el => el.tags?.name);
      console.log(`POI: ${withName.length} elementos tienen nombre`);

      let normalized = withName
        .map(el => normalizePOI(el))
        .filter(Boolean);

      // BUG-025: limitar a 80 POIs en ciudades densas
      // Ordenar por relevancia: historic > tourism > amenity > leisure
      const MAX_POIS = 80;
      if (normalized.length > MAX_POIS) {
        const PRIORITY = { historic: 4, museum: 3, monument: 3,
                           place_of_worship: 2, theatre: 2, viewpoint: 2,
                           fountain: 1, park: 1, garden: 1 };
        normalized = normalized
          .sort((a, b) => (PRIORITY[b.type] || 0) - (PRIORITY[a.type] || 0))
          .slice(0, MAX_POIS);
        if (typeof Debug !== 'undefined') {
          Debug.log('info', `POI: ${withName.length} → limitado a ${MAX_POIS} POIs más relevantes (BUG-025)`);
        }
      }

      console.log(`POI: ${normalized.length} POIs normalizados correctamente`);

      if (dbgId) {
        Debug.metricEnd(dbgId, 'ok', { raw: elements.length, normalizados: normalized.length, radiusKm });
      }

      return normalized;

    } catch (e) {
      if (dbgId) Debug.metricEnd(dbgId, 'error', { message: e.message });
      throw e;
    }
  }

  /* ── NORMALIZAR ELEMENTO OSM → POI ── */
  function normalizePOI(el) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:es'] || tags['name:en'];
    if (!name) return null;

    // Coordenadas — node directo o centroide de way
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) return null;

    // Determinar tipo e icono
    let icon = '📍';
    let type = 'generic';

    for (const [key, val] of Object.entries(OSM_CATEGORIES)) {
      if (tags[key] || tags['tourism'] === key || tags['historic'] === key) {
        icon = val.icon;
        type = val.type;
        break;
      }
    }

    // Descripción base desde OSM
    const description = tags['description']
                     || tags['wikipedia']?.split(':').pop()?.replace(/_/g, ' ')
                     || '';

    return {
      id:          `osm_${el.type}_${el.id}`,
      name,
      lat,
      lng,
      icon,
      type,
      description,
      tags,
      visited:     false,
      cachedAt:    Date.now()
    };
  }

  /* ── CARGAR POIs — con fallback a cache ── */
  async function loadPOIs(lat, lng) {
    // Intentar desde OSM si hay conexión
    if (!AppState.offline) {
      try {
        const fresh = await fetchPOIsFromOSM(lat, lng, CONFIG.FETCH_RADIUS_KM);
        if (fresh.length > 0) {
          _pois = fresh;
          await savePOIsToDB(fresh);
          _lastFetchPos = { lat, lng };
          renderAllMarkers();
          console.log(`POI: ${fresh.length} POIs cargados y renderizados`);
          _flushPendingDetect();  // DT-38: chequeo inmediato sin esperar el siguiente tick GPS
          return;
        } else {
          console.warn('POI: Overpass respondió OK pero 0 POIs normalizados — revisar query/zona');
        }
      } catch (e) {
        console.warn('POI: error fetching desde OSM, usando cache —', e.message);
      }
    } else {
      console.log('POI: AppState.offline=true, saltando fetch a OSM');
    }

    // Fallback: cargar desde IndexedDB
    const dbgId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('poi', 'cache IndexedDB load')
      : null;
    const cached = await loadPOIsFromDB();
    if (dbgId) Debug.metricEnd(dbgId, 'fallback', { count: cached.length });
    console.log(`POI: cache IndexedDB tiene ${cached.length} POIs`);
    if (cached.length > 0) {
      _pois = cached;
      renderAllMarkers();
      _flushPendingDetect();  // DT-38: también al restaurar desde cache
    }
  }

  /* ── DT-38: ejecutar detectPOI pendiente inmediatamente tras carga ── */
  function _flushPendingDetect() {
    if (_pendingDetect) {
      const { lat, lng, activeRadius, nearbyRadius } = _pendingDetect;
      _pendingDetect = null;
      detectPOI(lat, lng, activeRadius, nearbyRadius);
      if (typeof Debug !== 'undefined') {
        Debug.log('info', 'POI: chequeo inmediato post-carga (DT-38)');
      }
    }
  }


  /* ── DETECTAR POI CERCANO — DA-3 función única ── */
  function detectPOI(lat, lng, activeRadius, nearbyRadius) {
    if (_pois.length === 0) return;

    let closestPOI  = null;
    let closestDist = Infinity;
    let detectedCount = 0;

    _pois.forEach(poi => {
      const dist = GPS.distanceMeters(lat, lng, poi.lat, poi.lng);
      poi._distanceMeters = Math.round(dist);

      if (dist < activeRadius) {
        detectedCount++;
        if (dist < closestDist) {
          closestDist = dist;
          closestPOI  = poi;
        }
      }
    });

    // BUG-024: una llamada por chequeo, no una por cada POI encontrado
    if (detectedCount > 0 && typeof Debug !== 'undefined') {
      Debug.trackExp('poi_detected');
    }

    // Actualizar POIs cercanos para los marcadores
    AppState.nearbyPOIs = _pois.filter(
      poi => poi._distanceMeters <= nearbyRadius
    );

    // Actualizar contador de historias en bottom bar
    if (typeof updateHistCount === 'function') updateHistCount();

    // Actualizar marcadores en el mapa
    updateMarkersState();

    // Si hay un POI activo y no es el mismo que ya narrabamos
    if (closestPOI && closestPOI.id !== AppState.activePOI?.id) {
      if (typeof Debug !== 'undefined') Debug.trackExp('poi_eligible');
      activatePOI(closestPOI);
    } else if (!closestPOI && AppState.activePOI) {
      // Nos alejamos del POI activo
      deactivatePOI();
    }
  }

  /* ── ACTIVAR POI — iniciar narración ── */
  function activatePOI(poi) {
    AppState.activePOI = poi;
    setPhase('diastole');

    if (typeof Debug !== 'undefined') {
      Debug.trackExp('poi_narrated', {
        lat:     AppState.gps?.lat,
        lng:     AppState.gps?.lng,
        poiId:   poi.id,
        poiName: poi.name,
      });
    }

    // Mostrar card pequeña
    showPOICard(poi);

    // Iniciar narración
    if (typeof Narration !== 'undefined') {
      Narration.trigger(poi, Config.get('narrator'), Config.get('lang'));
    }

    // Marcar como visitado
    if (!poi.visited) {
      poi.visited = true;
      AppState.poisVisited++;
      updateStats();
    }
  }

  /* ── DESACTIVAR POI — usuario se alejó ── */
  function deactivatePOI() {
    AppState.activePOI = null;
    setPhase('systole');
    hidePOICard();

    if (typeof Narration !== 'undefined') {
      Narration.stop();
    }
    // Music.stop() no hace falta — las intros son cortas y ya terminaron
  }

  /* ── MOSTRAR INFO POI EN BOTTOM BAR ── */
  function showPOICard(poi) {
    // Actualizar bottom bar — estado diástole
    const barName = document.getElementById('barPoiName');
    const barDist = document.getElementById('barPoiDist');
    if (barName) barName.textContent = poi.name;
    if (barDist) barDist.textContent = `a ${poi._distanceMeters || '?'}m`;

    // Ghost div — backward compat (oculto siempre)
    const name = document.getElementById('poiCardName');
    const meta = document.getElementById('poiCardMeta');
    const text = document.getElementById('poiCardText');
    if (name) name.textContent = poi.name;
    if (meta) meta.textContent = `${AppState.cityName} · a ${poi._distanceMeters}m`;
    if (text) text.textContent = poi.description || 'Descubriendo la historia de este lugar...';
  }

  /* ── LIMPIAR INFO POI EN BOTTOM BAR ── */
  function hidePOICard() {
    const barName = document.getElementById('barPoiName');
    const barDist = document.getElementById('barPoiDist');
    if (barName) barName.textContent = '--';
    if (barDist) barDist.textContent = '--';
  }

  /* ── RENDERIZAR TODOS LOS MARCADORES ── */
  function renderAllMarkers() {
    // Limpiar marcadores existentes
    Object.values(_markers).forEach(m => m.remove());
    _markers = {};

    // Agregar marcadores de los top 20 POIs más cercanos
    const sorted = [..._pois]
      .sort((a, b) => (a._distanceMeters || 999) - (b._distanceMeters || 999))
      .slice(0, 20);

    sorted.forEach(poi => {
      const marker = GPS.addPOIMarker(poi);
      if (marker) _markers[poi.id] = marker;
    });
  }

  /* ── ACTUALIZAR ESTADO VISUAL DE MARCADORES ── */
  function updateMarkersState() {
    // Re-renderizar marcadores para reflejar estados actualizados
    renderAllMarkers();
  }

  /* ── RENDER PANTALLA EXPANDIDA ── */
  function renderExpanded(poi) {
    // Título y meta
    const title   = document.getElementById('poiTitle');
    const metaRow = document.getElementById('poiMetaRow');
    const badge   = document.getElementById('poiMoodBadge');

    if (title)   title.textContent   = poi.name;
    if (badge)   badge.textContent   = `${Config.getNarratorLabel()} · diástole`;

    if (metaRow) {
      const year = poi.tags?.['start_date']
                || poi.tags?.['year']
                || '';
      metaRow.innerHTML = `
        <span>${AppState.cityName}</span>
        ${year ? `<span class="poi-meta-dot">·</span><span>${year}</span>` : ''}
        <span class="poi-meta-dot">·</span>
        <span>a ${poi._distanceMeters || '?'}m</span>
      `;
    }

    // Player music — intro por narrador (sin mood)
    const musicName = document.getElementById('playerMusicName');
    const musicMood = document.getElementById('playerMusicMood');
    if (musicName) musicName.textContent = Config.getNarratorLabel();
    if (musicMood) musicMood.textContent = '';

    // Narración en curso
    const narText = document.getElementById('narrationText');
    if (narText && typeof Narration !== 'undefined') {
      narText.innerHTML = Narration.getCurrentText() || 'Generando narración...';
    }

    // Datos rápidos desde tags OSM
    renderQuickFacts(poi);

    // Pills de profundidad
    renderDepthPills(poi);
  }

  /* ── DATOS RÁPIDOS desde OSM tags ── */
  function renderQuickFacts(poi) {
    const container = document.getElementById('quickFacts');
    if (!container) return;

    const facts = [];
    const tags  = poi.tags || {};

    if (tags['capacity'])    facts.push({ value: tags['capacity'],    label: 'capacidad' });
    if (tags['start_date'])  facts.push({ value: tags['start_date'],  label: 'año' });
    if (tags['height'])      facts.push({ value: tags['height'] + 'm',label: 'altura' });
    if (tags['wikipedia'])   facts.push({ value: 'Wikipedia', label: 'fuente' });

    // Siempre mostrar al menos distancia y tipo
    facts.unshift({ value: `${poi._distanceMeters || '?'}m`, label: 'distancia' });
    facts.unshift({ value: poi.type || 'lugar', label: 'tipo' });

    container.innerHTML = facts
      .slice(0, 4)
      .map(f => `
        <div class="fact">
          <div class="fact-value">${f.value}</div>
          <div class="fact-label">${f.label}</div>
        </div>
      `).join('');
  }

  /* ── PILLS DE PROFUNDIDAD ── */
  function renderDepthPills(poi) {
    const container = document.getElementById('depthPills');
    if (!container) return;

    const pills = ['historia', 'arquitectura', 'curiosidades', 'hoy en día'];

    container.innerHTML = pills.map((p, i) => `
      <div class="depth-pill ${i === 0 ? 'active' : ''}"
           onclick="POI.onDepthPill('${p}', this)">
        ${p}
      </div>
    `).join('');
  }

  /* ── TAP EN PILL DE PROFUNDIDAD ── */
  function onDepthPill(topic, el) {
    document.querySelectorAll('.depth-pill')
      .forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    if (typeof Narration !== 'undefined' && AppState.activePOI) {
      Narration.trigger(AppState.activePOI, Config.get('mood'), Config.get('lang'), topic);
    }
  }

  /* ── TAP EN MARCADOR DEL MAPA ── */
  function onMarkerTap(poi) {
    AppState.activePOI = poi;
    navigateTo('poi');
    renderExpanded(poi);
  }

  /* ── DETECTAR NEARBY — función pública principal ── */
  function detectNearby(lat, lng, activeRadius, nearbyRadius) {
    if (typeof Debug !== 'undefined') Debug.trackExp('poi_check');

    // Si no hay POIs o nos movimos mucho → refetch
    if (_pois.length === 0) {
      // DT-38: guardar posición para detectPOI inmediato al terminar la carga
      _pendingDetect = { lat, lng, activeRadius, nearbyRadius };
      loadPOIs(lat, lng);
      return;
    }

    if (_lastFetchPos) {
      const kmMoved = GPS.distanceMeters(
        _lastFetchPos.lat, _lastFetchPos.lng, lat, lng
      ) / 1000;

      if (kmMoved > CONFIG.REFETCH_KM && !AppState.offline) {
        loadPOIs(lat, lng);
      }
    }

    detectPOI(lat, lng, activeRadius, nearbyRadius);
  }

  /* ── INICIALIZAR ── */
  async function init() {
    await initDB();
  }

  /* ── ACTIVAR DESDE LISTA DEL BOTTOM BAR ── */
  function activateFromBar(poiId) {
    const poi = _pois.find(p => p.id === poiId);
    if (poi) activatePOI(poi);
  }

  init();

  /* ── RESET POIs — para uso desde debug-sim cuando se teletransporta a otra ciudad ── */
  function resetPOIs() {
    // Limpiar marcadores del mapa
    Object.values(_markers).forEach(m => m.remove());
    _markers = {};

    // Resetear estado
    _pois         = [];
    _lastFetchPos = null;
    AppState.nearbyPOIs  = [];
    AppState.activePOI   = null;
    AppState.poisVisited = 0;

    if (typeof updateHistCount === 'function') updateHistCount();
    if (typeof Debug !== 'undefined') Debug.log('info', 'POI: reset — listo para nueva ciudad');
  }

  /* ── API PÚBLICA ── */
  return {
    detectNearby,
    renderExpanded,
    onMarkerTap,
    onDepthPill,
    activateFromBar,
    resetPOIs,
    getPOIs: () => _pois
  };

})();
