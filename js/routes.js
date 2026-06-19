/* ═══════════════════════════════════════════
   FOLLOWER — routes.js
   Recorridos temáticos curados.
   Modo Recorrido opt-in — DA-8.
   Narración siempre AI en tiempo real.
   ═══════════════════════════════════════════ */

const Routes = (() => {

  /* ── ESTADO INTERNO ── */
  let _activeRoute   = null;   // recorrido activo
  let _currentStep   = 0;      // POI actual en el recorrido
  let _routeLayer    = null;   // capa Leaflet del trazado
  let _routeMarkers  = [];     // marcadores del recorrido

  /* ── RECORRIDOS DISPONIBLES ── */
  // Los POIs se buscan en OSM por nombre — no están hardcodeados
  const ROUTES = {
    rome: [
      {
        id:       'rome_imperial',
        name:     'Roma Imperial',
        icon:     '🏛️',
        mood:     'epic',
        km:       3.2,
        duration: '2h',
        pois:     ['Colosseum', 'Roman Forum', 'Palatine Hill',
                   'Circus Maximus', 'Arch of Constantine',
                   'Temple of Venus', 'Capitoline Hill', 'Vittoriano'],
        desc:     'El corazón del Imperio Romano en un solo recorrido.'
      },
      {
        id:       'rome_nocturna',
        name:     'Roma Nocturna',
        icon:     '🌙',
        mood:     'mystery',
        km:       2.1,
        duration: '1.5h',
        pois:     ['Piazza Navona', 'Campo de Fiori',
                   'Fontana di Trevi', 'Spanish Steps',
                   'Piazza del Popolo', 'Castel Sant\'Angelo'],
        desc:     'Los secretos que Roma guarda cuando cae la noche.'
      },
      {
        id:       'rome_romantica',
        name:     'Roma Romántica',
        icon:     '🌹',
        mood:     'romantic',
        km:       2.8,
        duration: '2h',
        pois:     ['Fontana di Trevi', 'Pincian Hill',
                   'Villa Borghese', 'Piazza del Popolo',
                   'Trastevere', 'Ponte Sisto', 'Campo de Fiori'],
        desc:     'Los rincones más íntimos y poéticos de la ciudad eterna.'
      },
      {
        id:       'rome_secreta',
        name:     'Roma Secreta',
        icon:     '🔮',
        mood:     'mystery',
        km:       4.0,
        duration: '2.5h',
        pois:     ['Knights of Malta Keyhole', 'Crypta Balbi',
                   'Basilica of San Clemente', 'Mouth of Truth',
                   'Protestant Cemetery', 'Pyramid of Cestius',
                   'Aventine Orange Garden', 'Santa Sabina',
                   'Order of Malta', 'Piazza dei Cavalieri di Malta'],
        desc:     'La Roma que los turistas no ven. Misterios y leyendas.'
      },
      {
        id:       'rome_curiosa',
        name:     'Roma Curiosa',
        icon:     '😄',
        mood:     'curious',
        km:       3.5,
        duration: '2h',
        pois:     ['Pantheon', 'Elephant Obelisk', 'Sant\'Ivo alla Sapienza',
                   'Piazza della Rotonda', 'Largo di Torre Argentina',
                   'Jewish Ghetto', 'Portico d\'Ottavia',
                   'Piazza Mattei', 'Campo de Fiori'],
        desc:     'Datos que nadie te cuenta. La Roma sorprendente.'
      }
    ]
  };

  /* ── DETECTAR CIUDAD Y OBTENER RECORRIDOS ── */
  function getRoutesForCity() {
    const city = AppState.cityName?.toLowerCase() || '';

    if (city.includes('roma') || city.includes('rome')) return ROUTES.rome;
    // Aquí se agregan más ciudades en futuras versiones
    return [];
  }

  /* ── MOSTRAR SELECTOR DE RECORRIDOS ── */
  function showPicker() {
    const routes = getRoutesForCity();

    // Construir modal de recorridos dinámicamente
    let modal = document.getElementById('modal-routes');

    if (!modal) {
      modal = document.createElement('div');
      modal.id        = 'modal-routes';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-handle"></div>
          <h2 class="modal-title">Elige tu recorrido</h2>
          <p class="modal-subtitle">${AppState.cityName} · narración AI en tiempo real</p>
          <div class="routes-list" id="routesList"></div>
          <button class="btn-secondary" id="btnRouteSkip">Explorar libremente</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Rellenar lista de recorridos
    const list = document.getElementById('routesList');
    if (list) {
      if (routes.length === 0) {
        list.innerHTML = `
          <div style="text-align:center;padding:24px;color:var(--color-smoke-3);font-family:var(--font-ui);font-size:13px;">
            Recorridos para ${AppState.cityName} próximamente.<br>Por ahora explora libremente.
          </div>
        `;
      } else {
        list.innerHTML = routes.map(r => `
          <div class="route-card" data-id="${r.id}" onclick="Routes.selectRoute('${r.id}')">
            <div class="route-icon">${r.icon}</div>
            <div class="route-info">
              <div class="route-name">${r.name}</div>
              <div class="route-meta">${r.km} km · ${r.duration} · ${r.pois.length} lugares</div>
            </div>
            <div class="route-mood">${r.mood}</div>
          </div>
        `).join('');
      }
    }

    // Botón modo libre
    const btnSkip = document.getElementById('btnRouteSkip');
    if (btnSkip) {
      btnSkip.onclick = () => {
        hideModal('routes');
        Config.setMode('free');
        AppState.mode = 'free';
      };
    }

    showModal('routes');
  }

  /* ── SELECCIONAR RECORRIDO ── */
  function selectRoute(routeId) {
    const routes  = getRoutesForCity();
    const route   = routes.find(r => r.id === routeId);
    if (!route) return;

    _activeRoute        = route;
    _currentStep        = 0;
    AppState.activeRoute = route;

    // Cambiar mood al del recorrido
    Config.setMood(route.mood);
    AppState.mood = route.mood;
    if (typeof Music !== 'undefined') Music.changeMood(route.mood);

    // Cerrar modal
    hideModal('routes');

    // Buscar POIs del recorrido en OSM y trazarlos
    loadRoutePOIs(route);

    // Mostrar indicador de recorrido activo
    showRouteIndicator(route);
  }

  /* ── CARGAR POIs DEL RECORRIDO DESDE OSM ── */
  async function loadRoutePOIs(route) {
    if (!AppState.gps || AppState.offline) return;

    const { lat, lng } = AppState.gps;
    const poisQuery    = route.pois
      .map(name => `node["name"="${name}"](around:5000,${lat},${lng});`)
      .join('\n');

    const query = `
      [out:json][timeout:20];
      (${poisQuery});
      out;
    `;

    try {
      const res  = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body:   `data=${encodeURIComponent(query)}`
      });
      const data = await res.json();
      const pois = data.elements || [];

      if (pois.length > 0) {
        drawRouteOnMap(pois, route);
      }
    } catch (e) {
      console.warn('Routes: no se pudieron cargar los POIs del recorrido');
    }
  }

  /* ── TRAZAR RECORRIDO EN EL MAPA ── */
  function drawRouteOnMap(pois, route) {
    const map = GPS.getMap();
    if (!map) return;

    // Limpiar trazado anterior
    clearRoute();

    // Coordenadas en orden del recorrido
    const coords = pois.map(p => [p.lat, p.lon]);

    if (coords.length < 2) return;

    // Línea punteada dorada
    _routeLayer = L.polyline(coords, {
      color:     '#f0c87a',
      weight:    2,
      opacity:   0.7,
      dashArray: '5, 4'
    }).addTo(map);

    // Marcadores numerados del recorrido
    pois.forEach((poi, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:24px;height:24px;
          border-radius:50%;
          background:${i === _currentStep ? '#f0c87a' : '#1e2d3d'};
          border:2px solid ${i === _currentStep ? '#f0c87a' : '#4a5568'};
          display:flex;align-items:center;justify-content:center;
          font-family:Inter,sans-serif;font-size:10px;font-weight:500;
          color:${i === _currentStep ? '#633806' : '#c8d4e0'};
        ">${i + 1}</div>`,
        iconSize:   [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([poi.lat, poi.lon], { icon }).addTo(map);
      _routeMarkers.push(marker);
    });

    // Centrar mapa en el primer POI
    map.setView(coords[0], 17, { animate: true });
  }

  /* ── LIMPIAR RECORRIDO DEL MAPA ── */
  function clearRoute() {
    if (_routeLayer) {
      _routeLayer.remove();
      _routeLayer = null;
    }
    _routeMarkers.forEach(m => m.remove());
    _routeMarkers = [];
  }

  /* ── MOSTRAR INDICADOR DE RECORRIDO ── */
  function showRouteIndicator(route) {
    let indicator = document.getElementById('routeIndicator');

    if (!indicator) {
      indicator    = document.createElement('div');
      indicator.id = 'routeIndicator';
      indicator.className = 'route-indicator';
      document.getElementById('screen-explore')?.appendChild(indicator);
    }

    updateRouteIndicator();
    indicator.classList.remove('hidden');
  }

  /* ── ACTUALIZAR INDICADOR ── */
  function updateRouteIndicator() {
    const indicator = document.getElementById('routeIndicator');
    if (!indicator || !_activeRoute) return;

    const total = _activeRoute.pois.length;
    indicator.innerHTML = `
      <span class="route-indicator-name">${_activeRoute.icon} ${_activeRoute.name}</span>
      <span class="route-indicator-progress">${_currentStep + 1}/${total}</span>
    `;
  }

  /* ── AVANZAR AL SIGUIENTE POI ── */
  function nextStep() {
    if (!_activeRoute) return;

    _currentStep++;
    updateRouteIndicator();

    // Si terminamos el recorrido
    if (_currentStep >= _activeRoute.pois.length) {
      completeRoute();
    }
  }

  /* ── COMPLETAR RECORRIDO ── */
  function completeRoute() {
    clearRoute();

    const indicator = document.getElementById('routeIndicator');
    if (indicator) indicator.classList.add('hidden');

    // Mostrar resumen
    navigateTo('summary');

    _activeRoute        = null;
    _currentStep        = 0;
    AppState.activeRoute = null;
  }

  /* ── SALIR DEL RECORRIDO ── */
  function exitRoute() {
    clearRoute();

    const indicator = document.getElementById('routeIndicator');
    if (indicator) indicator.classList.add('hidden');

    Config.setMode('free');
    AppState.mode        = 'free';
    AppState.activeRoute = null;
    _activeRoute         = null;
    _currentStep         = 0;
  }

  /* ── SUGERIR RECORRIDO CERCANO ── */
  function suggestNearbyRoute() {
    if (AppState.mode === 'route') return;
    if (!AppState.gps) return;

    const routes = getRoutesForCity();
    if (routes.length === 0) return;

    // Mostrar sugerencia discreta en top pill
    const moodEl = document.getElementById('topMood');
    if (moodEl) {
      const route = routes[0];
      moodEl.textContent = `${route.icon} ${route.name} cercano`;
      moodEl.style.cursor = 'pointer';
      moodEl.onclick = () => showPicker();

      // Resetear después de 8 segundos
      setTimeout(() => {
        moodEl.textContent  = Config.getMoodLabel();
        moodEl.style.cursor = '';
        moodEl.onclick      = null;
      }, 8000);
    }
  }

  /* ── API PÚBLICA ── */
  return {
    showPicker,
    selectRoute,
    nextStep,
    exitRoute,
    suggestNearbyRoute,
    getActive: () => _activeRoute,
    getStep:   () => _currentStep
  };

})();
