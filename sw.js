/* ═══════════════════════════════════════════
   FOLLOWER — sw.js
   Service Worker minimo.
   Proposito principal: garantizar que el
   navegador descargue siempre la version
   mas reciente de los archivos JS/CSS.
   ═══════════════════════════════════════════ */

// Incrementar CACHE_VERSION fuerza descarga de todos los archivos
// en el proximo arranque — incluso si el navegador tiene version cacheada.
const CACHE_VERSION = 'follower-v15';  // DT-52: worship supervivientes a Tier 1 - evidencia campo iPhone Pasto

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
  './js/routes.js',
  './js/debug.js',
  './js/debug-sim.js',
  './css/main.css',
  './css/splash.css',
  './css/explore.css',
  './css/modal.css',
  './css/components.css',
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
