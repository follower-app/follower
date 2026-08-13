/* ═══════════════════════════════════════════
   FOLLOWER — sw.js
   Service Worker minimo.
   Proposito principal: garantizar que el
   navegador descargue siempre la version
   mas reciente de los archivos JS/CSS.
   ═══════════════════════════════════════════ */

// Incrementar CACHE_VERSION fuerza descarga de todos los archivos
// en el proximo arranque — incluso si el navegador tiene version cacheada.
const CACHE_VERSION = 'follower-v78';  // S43: sesion de curaduria — cuatro archivos servidos. debug.js: conteo de aperturas de capitulos por PROMPT_VERSION, leyendo el store narrations (BUG-071, foto del antes). gps.js + poi.js: piso metrico RHYTHM_MIN_METERS=200 entre narraciones, medido en metros caminados, con descarte silencioso y pin conservado (DT-74). poi.js: familias tematicas derivadas del icono, mapa local de 25 simbolos, sin llamada ni bump de POI_CACHE_VERSION (DT-75). narration.js: regla 1 sin deixis lateral e identificacion dentro de las dos primeras frases, en ambos idiomas, con PROMPT_VERSION v3.8->v3.9 (BUG-071). POI_CACHE_VERSION sigue en 7: nada toca query, filtros ni normalizacion. v77: DT-89 — inventario de POIs en el export de debug (nombre, coordenada a 6 decimales, distancia recalculada, _source, _iconSource, visited; tope 40). El panel ya mostraba coordenadas en pantalla pero el export no las llevaba: diagnosticar la coordenada falsa de "Las novias del gato" (617m de desvio en Wikipedia) obligo a inferirla desde el comportamiento. POI_CACHE_VERSION NO sube: no cambia query, filtros ni normalizacion

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/config.js',
  './js/app.js',
  './js/gps.js',
  './js/poi.js',
  './js/narration.js',
  './js/voice.js',
  './js/weather.js',
  './js/care.js',
  './js/walkmode.js',
  './js/routes.js',
  './js/debug.js',
  './js/debug-sim.js',
  './css/main.css',
  './css/splash.css',
  './css/explore.css',
  './css/poi.css',
  './css/modal.css',
  './css/wizard.css',
  './css/components.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

// ── INSTALL: cachear assets estaticos ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // No llamar skipWaiting() automaticamente — esperar al proximo arranque
  // para no interrumpir una sesion de audio activa
});

// ── MESSAGE: activacion forzada BAJO DEMANDA (boton "Actualizar app" del
// panel de debug) — no cambia el comportamiento automatico de arriba, solo
// da una via explicita para saltarse la espera cuando el usuario lo pide. ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── ACTIVATE: limpiar caches viejos ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Tomar control de todas las pestanas abiertas inmediatamente
  self.clients.claim();
});

// ── FETCH: network-first para JS/CSS, cache-first para el resto ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requests externos (APIs, CDN) — siempre red, nunca cachear
  if (url.origin !== self.location.origin) {
    return;
  }

  // JS y CSS — network-first para garantizar version actualizada
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Actualizar cache con la version nueva
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, servir desde cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Todo lo demas — cache-first (HTML, imagenes, manifest)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
