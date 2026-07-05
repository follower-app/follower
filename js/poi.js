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
  let _visitedInSession = new Set(); // BUG-044: IDs narrados en esta sesión — sobrevive resetPOIs()
  let _isFetchingPOIs = false;    // candado — evita fetches paralelos a Overpass (BUG-014)

  /* ── DT-52: UMBRALES DE LA CASCADA COMPUESTA ──
     COMPOSITE_THRESHOLD: neto Wikipedia post-filtros por debajo del cual
     se consulta Overpass como complemento (Sesion 22 — Pasto tenia 3 netos
     y ~26 elementos OSM con nombre que la cascada vieja nunca veia).
     EMERGENCY_MIN: minimo vital por debajo del cual dispara en.wikipedia
     como ultimo paracaidas (antes vivia dentro de fetchWikipediaPOIs —
     la Opcion A la reposiciona al final de la cascada). */
  const COMPOSITE_THRESHOLD = 8;
  const EMERGENCY_MIN       = 3;

  /* ── COLA NARRATIVA (S2-A2) ── */
  const QUEUE_MAX_SIZE = 3;          // máximo POIs en cola simultáneamente
  const QUEUE_TTL_MS   = 4 * 60000;  // 4 minutos — después el lugar quedó atrás
  let _narrationQueue  = [];         // [{ poi, enqueuedAt }]

  /* ── CONFIGURACIÓN ── */
  const CONFIG = {
    FETCH_RADIUS_KM:    2,      // radio de fetch de POIs desde OSM
    REFETCH_KM:         2,      // refetch si nos movemos más de 2km
    POI_CACHE_VERSION:  3,      // v3: worship supervivientes a Tier 1 (evidencia campo iPhone)
                                // REGLA: incrementar en el MISMO commit que cambie
                                // query, filtros o normalización de POIs (Sesión 21)
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

  /* ── PURGA VERSIONADA DEL CACHE DE POIs (Sesión 21 — Punto 3) ──
     Un cambio de criterio de fuente (query, filtros, normalización)
     invalida los POIs guardados con el criterio anterior — los 359 POIs
     heredados con bancos y provincias nacieron de esta ausencia.
     La versión vive en localStorage; si difiere de POI_CACHE_VERSION
     se purga el store completo. El cache de narraciones NO se toca aquí
     (tiene su propia DT — mismo patrón, sesión aparte). */
  function clearPOIsFromDB() {
    if (!_db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = _db.transaction(CONFIG.STORE_POIS, 'readwrite');
      tx.objectStore(CONFIG.STORE_POIS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();  // el cache nunca rompe el arranque
    });
  }

  async function checkCacheVersion() {
    const KEY = 'follower_poi_cache_version';
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) { /* Safari modo privado */ }

    if (stored !== String(CONFIG.POI_CACHE_VERSION)) {
      await clearPOIsFromDB();
      try { localStorage.setItem(KEY, String(CONFIG.POI_CACHE_VERSION)); } catch (e) {}
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `POI: cache purgado — criterio v${stored || '0'} → v${CONFIG.POI_CACHE_VERSION}`);
      }
    }
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
  /* ── FETCH POIs DESDE WIKIPEDIA GEOSEARCH — fuente primaria (v0.8) ──
     Si un lugar tiene artículo de Wikipedia, alguien lo consideró notable:
     ese es el filtro editorial que Follower necesita. 99.9% uptime, <500ms.
  ── */
  async function fetchWikipediaPOIs(lat, lng, radiusKm, opts = {}) {
    // DT-52: emergencyOnly=true consulta SOLO en.wikipedia (la cascada
    // compuesta la invoca como ultimo paracaidas — Opcion A Sesion 22)
    const emergencyOnly = opts.emergencyOnly === true;
    const radius = radiusKm * 1000; // metros
    const limit  = 50;

    // DA-49 + DT-41: idioma local de la ciudad vía COUNTRY_LANG de narration.js
    // (fuente única — sin tabla de rangos lat/lng duplicada). Si el reverse
    // geocoding aún no llenó countryCode, degradar a [es, en].
    const cityLang = (typeof AppState !== 'undefined' && AppState.countryCode
                      && typeof Narration !== 'undefined'
                      && typeof Narration.getLocalLang === 'function')
      ? Narration.getLocalLang(AppState.countryCode)
      : null;

    // Cadena de idiomas (Sesión 21 — Punto 1): local y es se consultan
    // ACUMULANDO — nada pisa lo ya encontrado (el bug de Pasto era un
    // `places =` que reemplazaba resultados en cada vuelta del loop).
    // en.wikipedia queda degradada a EMERGENCIA (Opcion A, Sesion 22): la
    // cascada compuesta en loadPOIs la invoca con emergencyOnly=true solo
    // si ni Wikipedia ni Overpass alcanzaron EMERGENCY_MIN. Sus POIs se
    // marcan _lang:'en' para el grounding (DT-51).
    // Excepción: si el idioma local ES inglés (EEUU, UK...), en.wikipedia
    // es primaria por derecho propio.
    const ENOUGH        = 10;  // con esto ya no vale la pena otra llamada

    const EN_URL = 'https://en.wikipedia.org/w/api.php';
    const primaryUrls = [...new Set([
      ...(cityLang ? [`https://${cityLang}.wikipedia.org/w/api.php`] : []),
      'https://es.wikipedia.org/w/api.php',
    ])];
    const emergencyUrl = primaryUrls.includes(EN_URL) ? null : EN_URL;

    const params = new URLSearchParams({
      action:   'query',
      list:     'geosearch',
      gscoord:  `${lat}|${lng}`,
      gsradius: radius,
      gslimit:  limit,
      gsprop:   'type|name', // Punto 2 — tipo de coordenada para filtro editorial
      format:   'json',
      origin:   '*',     // CORS — necesario para llamadas desde el browser
    });

    const t0 = performance.now();
    let places = [];

    async function fetchLang(baseUrl, isEmergency) {
      try {
        const controller = new AbortController();
        const tid        = setTimeout(() => controller.abort(), 8000); // 8s — mucho menos que Overpass

        const res = await fetch(`${baseUrl}?${params}`, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(tid);

        if (!res.ok) {
          if (typeof Debug !== 'undefined') {
            Debug.log('warn', `Wikipedia: ${baseUrl.split('/')[2]} → status=${res.status} — probando siguiente`);
          }
          return;
        }

        const data    = await res.json();
        const results = data?.query?.geosearch || [];
        if (isEmergency) results.forEach(r => { r._lang = 'en'; });

        places.push(...results);  // ACUMULA — nunca reemplaza

      } catch (err) {
        if (typeof Debug !== 'undefined') {
          Debug.log('warn', `Wikipedia: fetch falló (${err.message}) — probando siguiente`);
        }
      }
    }

    if (emergencyOnly) {
      // Modo emergencia: solo en.wikipedia. Si el idioma local ya ES
      // ingles, la primaria ya la consulto — no hay nada nuevo que pedir.
      if (!emergencyUrl) return [];
      if (typeof Debug !== 'undefined') {
        Debug.log('info', 'Wikipedia: emergencia en.wikipedia activada (cascada DT-52)');
      }
      await fetchLang(emergencyUrl, true);
    } else {
      for (const baseUrl of primaryUrls) {
        await fetchLang(baseUrl, false);
        if (places.length >= ENOUGH) break;
      }
    }

    const elapsed = Math.round(performance.now() - t0);

    if (typeof Debug !== 'undefined') {
      if (places.length > 0) {
        Debug.log('info', `Wikipedia: ${places.length} POIs en ${elapsed}ms`);
      } else {
        Debug.log('warn', `Wikipedia: 0 POIs en ${elapsed}ms — usando siguiente fuente`);
      }
    }

    if (places.length === 0) return [];

    // Filtro editorial (Sesión 21 — Punto 2): GeoSearch devuelve CUALQUIER
    // artículo geoetiquetado — la propia ciudad, provincias, eventos
    // ("Pasto, Colombia", "Provincia de Buenaventura", "Solar Decathlon").
    // Blacklist de tipos, no whitelist: type null PASA (la mayoría de
    // iglesias, teatros y plazas no tienen tipo asignado en Wikipedia).
    // Agujero residual documentado: basura SIN tipo se cuela — la cierra
    // el grounding con extracts (sesión futura), no este filtro.
    const TYPE_BLACKLIST = new Set([
      'city', 'adm1st', 'adm2nd', 'adm3rd',
      'country', 'continent', 'event', 'satellite'
    ]);
    const cityNorm = (typeof AppState !== 'undefined' && AppState.city)
      ? AppState.city.trim().toLowerCase()
      : null;

    const beforeFilter = places.length;
    places = places.filter(p => {
      if (p.type && TYPE_BLACKLIST.has(p.type)) return false;
      // Cinturón: el artículo de la propia ciudad puede venir sin tipo
      // en alguna Wikipedia — comparar título base contra AppState.city
      if (cityNorm) {
        const titleNorm = p.title.split(',')[0].trim().toLowerCase();
        if (titleNorm === cityNorm) return false;
      }
      return true;
    });

    if (typeof Debug !== 'undefined' && beforeFilter !== places.length) {
      Debug.log('info', `Wikipedia: ${beforeFilter - places.length} artículos no-lugar descartados (filtro editorial)`);
    }

    if (places.length === 0) return [];

    // Deduplicar por coordenadas aproximadas (mismo lugar en idiomas distintos)
    // El orden importa: local/es llegaron primero, así que ante duplicado
    // cross-idioma sobrevive el título en el idioma correcto.
    const seen = new Set();
    places = places.filter(p => {
      const key = `${Math.round(p.lat * 1000)},${Math.round(p.lon * 1000)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (typeof Debug !== 'undefined') {
      Debug.log('info', `Wikipedia: ${places.length} POIs únicos tras deduplicación`);
    }

    // Normalizar al mismo schema que normalizePOI() produce
    // para que detectNearby(), activatePOI() y el cache no noten la diferencia
    return places.map(p => ({
      id:          `wiki_${p.pageid}`,
      name:        p.title,
      lat:         p.lat,
      lng:         p.lon,
      icon:        '🏛️',          // icono genérico — Wikipedia no tiene tipo OSM
      type:        'historic',    // tipo por defecto — el más narrable
      description: '',            // Wikipedia no devuelve descripción en geosearch
      tags:        {},            // sin tags OSM — QuickFacts mostrará solo distancia y tipo
      visited:     false,
      cachedAt:    Date.now(),
      _source:     'wiki',        // contrato DT-52: 'wiki' garantiza articulo → grounding (DT-51)
      _lang:       p._lang || null, // 'en' si vino de la emergencia — insumo para grounding futuro
    }));
  }

  /* ── FETCH POIs DESDE OVERPASS (OSM) — complemento de la cascada DT-52 ── */
  async function fetchPOIsFromOSM(lat, lng, radiusKm) {
    // El guard BUG-041 ("si ya hay POIs no disparar Overpass") se elimino
    // en DT-52: su intencion la hereda la logica de umbral de la cascada
    // (Overpass solo se consulta si neto < COMPOSITE_THRESHOLD), que ademas
    // es correcta en refetch por movimiento — el guard devolvia el set del
    // area anterior directo a la fusion.

    // Candado — evita fetches paralelos que causan 429 en cadena (BUG-014)
    if (_isFetchingPOIs) {
      if (typeof Debug !== 'undefined') {
        Debug.log('info', 'POI: fetch en curso — ignorando llamada paralela (BUG-014)');
      }
      // DT-52: devolver [] y no _pois — un llamador paralelo de la cascada
      // no debe fusionar un set viejo (posible mezcla de areas)
      return [];
    }
    _isFetchingPOIs = true;

    const radius = radiusKm * 1000; // metros

    // Query optimizada: usa (around:...) UNA sola vez por bloque
    // en vez de repetirlo en cada cláusula — mucho más rápido para Overpass.
    // BUG-045: el comentario de "artwork excluido" quedaba dentro del filtro
    // de tourism, sin cerrar la comilla ni el corchete antes del comentario.
    // Eso rompia la sintaxis de Overpass QL — 100% de las queries fallaban
    // con HTTP 400 desde que se agrego este comentario en Sesion 18.
    const query  = `
      [out:json][timeout:25];
      (
        nwr(around:${radius},${lat},${lng})["historic"];
        nwr(around:${radius},${lat},${lng})["tourism"~"museum|attraction|viewpoint|gallery"];
        nwr(around:${radius},${lat},${lng})["amenity"~"place_of_worship|fountain|theatre"];
        nwr(around:${radius},${lat},${lng})["leisure"~"park|garden"];
        nwr(around:${radius},${lat},${lng})["man_made"~"monument|memorial|statue"];
      );
      out center;
    `;
    // artwork excluido del filtro de tourism a proposito: murales de
    // artistas foraneos sin valor editorial local (fix post-campo Sesion 18)

    // Mirrors de Overpass en orden de prioridad
    // Si el primero falla (429, 504, timeout), se intenta el siguiente
    const OVERPASS_MIRRORS = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
    ];

    console.log(`POI: fetching lat=${lat} lng=${lng} radius=${radius}m`);

    const dbgId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('poi', 'Overpass fetch')
      : null;

    let data      = null;
    let lastError = null;

    try {
      // Fetch con fallback automático entre mirrors
      for (const mirrorUrl of OVERPASS_MIRRORS) {
        try {
          const controller = new AbortController();
          const timeoutId  = setTimeout(() => controller.abort(), 20000); // 20s por mirror

          const res = await fetch(mirrorUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    `data=${encodeURIComponent(query)}`,
            signal:  controller.signal
          });

          clearTimeout(timeoutId);

          console.log(`POI: ${mirrorUrl.split('/')[2]} respondió status=${res.status}`);

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`POI: mirror ${mirrorUrl.split('/')[2]} error ${res.status} — ${errText.slice(0, 200)} — probando siguiente`);
            lastError = new Error(`Overpass API error ${res.status}`);
            continue; // probar siguiente mirror
          }

          data = await res.json();
          console.log(`POI: mirror ${mirrorUrl.split('/')[2]} OK — ${(data.elements||[]).length} elementos`);
          break; // éxito — salir del loop

        } catch (mirrorErr) {
          lastError = mirrorErr;
          console.warn(`POI: mirror ${mirrorUrl.split('/')[2]} falló (${mirrorErr.message}) — probando siguiente`);
          continue;
        }
      }

      if (!data) {
        if (dbgId) Debug.metricEnd(dbgId, 'error', { message: lastError?.message || 'all mirrors failed' });
        throw lastError || new Error('All Overpass mirrors failed');
      }

      const elements = data.elements || [];
      console.log(`POI: Overpass devolvió ${elements.length} elementos crudos`);

      // Curaduria editorial DT-52: compuerta 0 + blacklist + clasificacion en tiers
      const curated = [];
      for (const el of elements) {
        const tier = classifyOSMElement(el);
        if (tier !== null) curated.push({ el, tier });
      }
      console.log(`POI: curaduria DT-52 — ${elements.length} crudos → ${curated.length} curados`);

      let normalized = curated
        .map(({ el, tier }) => {
          const poi = normalizePOI(el);
          if (poi) {
            poi._tier    = tier;
            poi._source  = 'osm';     // contrato DT-52: 'osm' = sin articulo —
            poi._osmType = poi.type;  // el grounding (DT-51) narrara lo observable
          }
          return poi;
        })
        .filter(Boolean);

      // Dedup fina DT-49 — antes del cap para que el limite cuente POIs unicos
      const preDedup = normalized.length;
      normalized = dedupOSMPOIs(normalized);
      if (normalized.length < preDedup) {
        console.log(`POI: dedup DT-49 — ${preDedup} → ${normalized.length} POIs unicos`);
      }

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
          Debug.log('info', `POI: ${curated.length} → limitado a ${MAX_POIS} POIs más relevantes (BUG-025)`);
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
    } finally {
      _isFetchingPOIs = false;   // liberar candado siempre, éxito o error (BUG-014)
    }
  }

  /* ── DT-52: CURADURIA EDITORIAL DEL RAMAL OSM ──
     Compuerta 0: sin nombre no hay historia — descarte duro.
     Blacklist: cadenas comerciales (brand) y locales de culto sin
     valor narrativo (denominacion o palabra clave en nombre).
     Tiers: 1 = entra siempre que Overpass sea consultado
                (incluye worship supervivientes — Sesion 22);
            2 = parks/gardens/fountains, solo si neto < COMPOSITE_THRESHOLD
     (la admision de Tier 2 la decide la cascada, no este filtro).
     Evidencia: export overpass-turbo Sesion 22, centro de Pasto. */

  const OSM_WORSHIP_DENOM_BLACKLIST = ['jehovahs_witness', 'pentecostal', 'mormon'];
  const OSM_NAME_KEYWORD_BLACKLIST  = ['salon del reino', 'pentecostal',
                                       'ministerial', 'testigos', 'gnosis'];

  /* Normalizacion de texto para comparaciones editoriales:
     minusculas, sin tildes, espacios colapsados */
  function _normText(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  /* Devuelve 1 (Tier 1), 2 (Tier 2) o null (descarte) */
  function classifyOSMElement(el) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:es'] || tags['name:en'];

    // Compuerta 0 — mata memoriales anonimos y parques sin nombre
    if (!name) return null;

    // Cadenas comerciales — un logo repetido no es un lugar con alma
    if (tags.brand || tags['brand:wikidata']) return null;

    const normName = _normText(name);
    if (OSM_NAME_KEYWORD_BLACKLIST.some(k => normName.includes(k))) return null;

    if (tags.amenity === 'place_of_worship' &&
        OSM_WORSHIP_DENOM_BLACKLIST.includes(tags.denomination)) return null;

    // ── Tier 1: entra siempre ──
    if (tags.wikidata || tags.heritage) return 1;   // catalogado = notable
    if (/^(museum|gallery|viewpoint|attraction)$/.test(tags.tourism || '')) return 1;
    if (tags.amenity === 'theatre') return 1;
    if (tags.historic === 'monument') return 1;
    if (tags.historic === 'memorial') return 1;     // con nombre (decision Sesion 22:
                                                    // la placa de Ahumada es oro narrativo)

    // Worship supervivientes: Tier 1 (Sesion 22, evidencia de campo iPhone —
    // Lourdes, San Felipe Neri y Santiago Apostol quedaban en Tier 2 y en
    // Pasto Tier 2 nunca entra porque Tier 1 sacia el umbral. La blacklist
    // YA es el filtro editorial: lo que la sobrevive es arquitectura con
    // historia. Una caminata por Pasto que calla frente a Lourdes es una
    // audioguia coja. Absorbe la promocion previa de catedrales/basilicas.)
    if (tags.amenity === 'place_of_worship') return 1;

    // ── Tier 2: parks, gardens, fountains — el relleno genuino ──
    return 2;
  }

  /* ── DT-49: DEDUP FINA ──
     Regla: clave normalizada igual + distancia < DEDUP_DISTANCE_M → duplicado.
     La normalizacion elimina prefijos de TIPOLOGIA (estatua, monumento,
     templo, parroquia...) pero JAMAS sustantivos con identidad
     (Museo, Catedral, Teatro distinguen lugares reales distintos).
     Evidencia Sesion 22: "Estatua Corazon de Jesus" (node) y "Monumento
     al Corazon de Jesus" (way) a 20cm; "Parroquia de Nuestra Senora de
     Fatima" y "Templo Nuestra Senora de Fatima" a ~10m (enmienda Fatima). */

  const DEDUP_DISTANCE_M = 25;   // intra-OSM: nodes/ways del mismo objeto
  const FUSE_DISTANCE_M  = 60;   // inter-fuente: geotag de Wikipedia es menos
                                 // preciso que un center de OSM — umbral mas generoso

  const TYPOLOGY_PREFIX_RE = new RegExp(
    '^(estatua|monumento|busto(?: homenaje)?|memorial|' +
    'parroquia|templo|capilla|iglesia|santuario(?: eucaristico)?)' +
    '(?: (?:de la|de los|de las|de|del|a|al))? '
  );

  function _dedupKey(name) {
    return _normText(name).replace(TYPOLOGY_PREFIX_RE, '').trim();
  }

  /* Puntaje de superviviente: wikidata pesa mas que cualquier
     cantidad de tags; a igualdad, gana el mas informado */
  function _dedupScore(poi) {
    const t = poi.tags || {};
    return (t.wikidata ? 1000 : 0) + Object.keys(t).length;
  }

  /* Transferencia de tags utiles del perdedor al superviviente —
     informacion gratis, cero costo (decision Sesion 22: inscription
     es texto grabado en piedra, el grounding mas duro posible) */
  function _transferUsefulTags(from, to) {
    const ft = from.tags || {};
    if (!to.tags) to.tags = {};
    if (ft.inscription && !to.tags.inscription) to.tags.inscription = ft.inscription;
    if (ft.wikidata    && !to.tags.wikidata)    to.tags.wikidata    = ft.wikidata;
  }

  function dedupOSMPOIs(pois) {
    const kept = [];
    for (const poi of pois) {
      const key = _dedupKey(poi.name);
      const rivalIdx = kept.findIndex(k =>
        k.__dk === key &&
        GPS.distanceMeters(k.lat, k.lng, poi.lat, poi.lng) < DEDUP_DISTANCE_M
      );
      if (rivalIdx === -1) {
        poi.__dk = key;
        kept.push(poi);
        continue;
      }
      const rival  = kept[rivalIdx];
      const winner = _dedupScore(poi) > _dedupScore(rival) ? poi : rival;
      const loser  = winner === poi ? rival : poi;
      _transferUsefulTags(loser, winner);
      winner._tier = Math.min(winner._tier || 2, loser._tier || 2);
      winner.__dk  = key;
      kept[rivalIdx] = winner;
    }
    kept.forEach(p => delete p.__dk);   // clave temporal — no persiste al cache
    return kept;
  }

  /* ── DT-52: FUSION INTER-FUENTE — Wikipedia gana SIEMPRE ──
     Un POI wiki tiene articulo → tiene extract → tiene grounding (DT-51).
     El gemelo OSM muere, pero lega sus tags utiles antes.
     (La cascada compuesta la conecta en el siguiente commit.) */
  function fuseWithWikipedia(wikiPOIs, osmPOIs) {
    const result = [...wikiPOIs];
    let fusionados = 0;
    for (const osm of osmPOIs) {
      const key  = _dedupKey(osm.name);
      const twin = wikiPOIs.find(w =>
        _dedupKey(w.name) === key &&
        GPS.distanceMeters(w.lat, w.lng, osm.lat, osm.lng) < FUSE_DISTANCE_M
      );
      if (twin) {
        _transferUsefulTags(osm, twin);
        fusionados++;
      } else {
        result.push(osm);
      }
    }
    if (fusionados > 0) {
      console.log(`POI: fusion DT-52 — ${fusionados} duplicados OSM cedieron a Wikipedia`);
    }
    return result;
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

  /* ── CARGAR POIs — cascada compuesta DT-52 (Opcion A, Sesion 22) ──
     wiki local+es → si neto < COMPOSITE_THRESHOLD → Overpass curado
     (Tier 1 siempre, Tier 2 solo si sigue habiendo hambre, fusion wiki-gana)
     → si neto < EMERGENCY_MIN → en.wikipedia → IndexedDB (ultimo recurso) */
  async function loadPOIs(lat, lng) {
    if (!AppState.offline) {

      let pois = [];

      // ── 1. WIKIPEDIA GEOSEARCH (primaria — local + es acumulativa) ──
      try {
        pois = await fetchWikipediaPOIs(lat, lng, CONFIG.FETCH_RADIUS_KM);
      } catch (wikiErr) {
        console.warn(`POI: Wikipedia falló (${wikiErr.message}) — continuando cascada`);
      }

      // ── 2. OVERPASS COMPLEMENTARIO — solo donde hay hambre (DT-52) ──
      if (pois.length < COMPOSITE_THRESHOLD) {
        console.log(`POI: neto Wikipedia ${pois.length} < ${COMPOSITE_THRESHOLD} — consultando Overpass complementario (DT-52)`);
        try {
          const osmPOIs = await fetchPOIsFromOSM(lat, lng, CONFIG.FETCH_RADIUS_KM);
          if (osmPOIs.length > 0) {
            // Admision por tiers: Tier 1 entra siempre que Overpass fue
            // consultado; Tier 2 solo si Tier 1 no sacio el umbral
            const tier1 = osmPOIs.filter(p => p._tier === 1);
            let admitted = tier1;
            if (pois.length + tier1.length < COMPOSITE_THRESHOLD) {
              admitted = admitted.concat(osmPOIs.filter(p => p._tier === 2));
            }
            const conTier2 = admitted.length > tier1.length;
            pois = fuseWithWikipedia(pois, admitted);
            console.log(`POI: fuente compuesta — ${pois.length} netos (Tier 1: ${tier1.length}${conTier2 ? ' + Tier 2' : ', Tier 2 no necesario'})`);
          }
        } catch (e) {
          console.warn(`POI: Overpass falló (${e.message}) — continuando cascada`);
        }
      } else {
        console.log(`POI: neto Wikipedia ${pois.length} ≥ ${COMPOSITE_THRESHOLD} — Overpass no necesario (DT-52)`);
      }

      // ── 3. EMERGENCIA en.wikipedia — ultimo paracaidas (Opcion A) ──
      // Solo si ni Wikipedia ni OSM alcanzaron el minimo vital. Dedup
      // contra lo existente SOLO por coordenada (<FUSE_DISTANCE_M): los
      // nombres cross-idioma no comparan ("Carnival Museum" ≠ "Museo del
      // Carnaval") y el existente gana — nombre local sobre ingles.
      if (pois.length < EMERGENCY_MIN) {
        try {
          const enPOIs = await fetchWikipediaPOIs(lat, lng, CONFIG.FETCH_RADIUS_KM, { emergencyOnly: true });
          for (const en of enPOIs) {
            const twin = pois.find(p =>
              GPS.distanceMeters(p.lat, p.lng, en.lat, en.lng) < FUSE_DISTANCE_M);
            if (!twin) pois.push(en);
          }
          if (enPOIs.length > 0) {
            console.log(`POI: emergencia en.wikipedia — ${pois.length} netos tras fusion`);
          }
        } catch (e) {
          console.warn(`POI: emergencia en.wikipedia falló (${e.message})`);
        }
      }

      // ── Resultado de la cascada online ──
      if (pois.length > 0) {
        // BUG-044: restaurar visited para POIs ya narrados en esta sesión
        pois.forEach(p => {
          if (_visitedInSession.has(p.id)) p.visited = true;
        });
        _pois = pois;
        await savePOIsToDB(pois);
        _lastFetchPos = { lat, lng };
        renderAllMarkers();
        console.log(`POI: ${pois.length} POIs cargados y renderizados (cascada DT-52)`);
        _flushPendingDetect();  // DT-38: chequeo inmediato sin esperar el siguiente tick GPS
        return;
      }
      console.warn('POI: cascada online sin resultados — usando cache IndexedDB');
    } else {
      console.log('POI: AppState.offline=true, saltando fetch a OSM');
    }

    // Fallback: cargar desde IndexedDB
    const dbgId = (typeof Debug !== 'undefined')
      ? Debug.metricStart('poi', 'cache IndexedDB load')
      : null;
    const cached = await loadPOIsFromDB();

    // Filtro geográfico: solo POIs dentro del radio de fetch × 1.5 (margen
    // generoso) — previene mostrar POIs de otra ciudad si el cache tiene varias
    const CACHE_RADIUS_M = CONFIG.FETCH_RADIUS_KM * 1500;
    const nearby = typeof GPS !== 'undefined'
      ? cached.filter(p => GPS.distanceMeters(lat, lng, p.lat, p.lng) <= CACHE_RADIUS_M)
      : cached; // si GPS no está listo, usar todos como antes

    if (dbgId) Debug.metricEnd(dbgId, 'fallback', { count: cached.length, nearby: nearby.length });
    console.log(`POI: cache IndexedDB tiene ${cached.length} POIs · ${nearby.length} en radio ${CACHE_RADIUS_M/1000}km`);
    if (nearby.length > 0) {
      // BUG-044: restaurar visited para POIs ya narrados en esta sesión
      nearby.forEach(p => {
        if (_visitedInSession.has(p.id)) p.visited = true;
      });
      _pois = nearby;
      _lastFetchPos = { lat, lng };
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

      // S2-A2: si hay narración activa, encolar en lugar de ignorar
      const narrando = typeof Narration !== 'undefined' && Narration.isNarrating();
      if (narrando) {
        enqueuePOI(closestPOI);
      } else {
        activatePOI(closestPOI);
      }
    } else if (!closestPOI && AppState.activePOI) {
      // Nos alejamos del POI activo
      deactivatePOI();
    }
  }

  /* ── ENCOLAR POI — detectado durante narración activa (S2-A2) ──
     Solo encola si la narración está activa y el POI es nuevo y no visitado.
     Máximo QUEUE_MAX_SIZE entradas — descarta el más antiguo si se supera.
  ── */
  function enqueuePOI(poi) {
    // No encolar si ya está en la cola
    if (_narrationQueue.some(e => e.poi.id === poi.id)) return;

    // No encolar si ya fue visitado
    if (poi.visited) return;

    // Si la cola está llena, descartar el más antiguo (FIFO)
    if (_narrationQueue.length >= QUEUE_MAX_SIZE) {
      const descartado = _narrationQueue.shift();
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Cola: descartando ${descartado.poi.name} (cola llena)`);
      }
    }

    _narrationQueue.push({ poi, enqueuedAt: Date.now() });

    if (typeof Debug !== 'undefined') {
      Debug.log('info', `Cola: encolado ${poi.name} · cola=[${_narrationQueue.map(e => e.poi.name).join(', ')}]`);
    }
  }

  /* ── PROCESAR COLA — se llama al terminar cada narración (S2-A2) ──
     Verifica expiración y proximidad antes de narrar el siguiente.
     Si el usuario se alejó, descarta silenciosamente.
  ── */
  function processQueue() {
    // Limpiar entradas expiradas (TTL)
    const now = Date.now();
    const antes = _narrationQueue.length;
    _narrationQueue = _narrationQueue.filter(e => {
      const expired = (now - e.enqueuedAt) > QUEUE_TTL_MS;
      if (expired && typeof Debug !== 'undefined') {
        Debug.log('info', `Cola: expirado ${e.poi.name} (>${QUEUE_TTL_MS/60000}min en cola)`);
      }
      return !expired;
    });

    if (antes !== _narrationQueue.length && typeof Debug !== 'undefined') {
      Debug.log('info', `Cola: ${antes - _narrationQueue.length} entradas expiradas eliminadas`);
    }

    if (_narrationQueue.length === 0) return;

    // Tomar el primero y verificar proximidad actual
    const entry = _narrationQueue[0];
    const poi   = entry.poi;

    // Calcular distancia actual al POI
    const lat = AppState.gps?.lat;
    const lng = AppState.gps?.lng;
    if (!lat || !lng) {
      _narrationQueue.shift();
      return;
    }

    const distActual  = GPS.distanceMeters(lat, lng, poi.lat, poi.lng);
    const radioActivo = (typeof GPS.getRadiusConfig === 'function')
      ? GPS.getRadiusConfig().poiRadius
      : 120; // fallback — mismo valor que POI_RADIUS_METERS

    if (distActual > radioActivo * 1.5) {
      // Usuario se alejó — descartar
      _narrationQueue.shift();
      if (typeof Debug !== 'undefined') {
        Debug.log('info', `Cola: descartando ${poi.name} — usuario se alejó (${Math.round(distActual)}m > ${radioActivo * 1.5}m)`);
      }
      // Intentar con el siguiente de la cola
      if (_narrationQueue.length > 0) processQueue();
      return;
    }

    // Usuario sigue cerca — narrar
    _narrationQueue.shift();
    if (typeof Debug !== 'undefined') {
      Debug.log('info', `Cola: narrando ${poi.name} (${Math.round(distActual)}m del usuario)`);
    }
    activatePOI(poi);
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
    await checkCacheVersion();  // purga versionada — Sesión 21
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
    processQueue,      // S2-A2 — llamado desde narration.js al completar narración
    markVisited: (id) => {  // BUG-044 — registrar POI narrado en Set de sesión
      _visitedInSession.add(id);
    },
    resetVisited: () => {   // llamado al iniciar nueva sesión
      _visitedInSession.clear();
    },
    renderExpanded,
    onMarkerTap,
    onDepthPill,
    activateFromBar,
    resetPOIs,
    getPOIs: () => _pois
  };

})();
