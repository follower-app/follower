# 🎬 Follower

> **Your city soundtrack.**

PWA de exploración cinematográfica: narración AI en tiempo real disparada por GPS, más cuidado contextual. Caminar una ciudad extraña debería sentirse como protagonizar una película, no como consultar un índice turístico.

Follower no es un mapa, no es una audioguía y no es Wikipedia hablada. Es un acompañante invisible — el teléfono va en el bolsillo y la app orquesta el resto.

**App:** [follower-app.github.io/follower](https://follower-app.github.io/follower)
**Worker:** `followernarration.jaimeand.workers.dev`

---

## Cómo funciona

Al caminar, el GPS detecta proximidad a puntos de interés. Cada uno dispara un capítulo narrado en el momento, en una sola voz. Entre capítulos, la ciudad. La app alterna dos fases: **sístole** mientras se camina y **diástole** mientras se narra.

Funciona offline una vez cargada la zona: los POIs, las narraciones y los assets quedan cacheados.

## Despliegue

No hay build step ni entorno local: HTML, CSS y JS vanilla servidos estáticamente por GitHub Pages desde `main`. Un push es un despliegue.

Dos cosas que importan al desplegar:

- `index.html` se sirve **cache-first** y `skipWaiting()` está deshabilitado a propósito, para no cortar una narración en curso. Un F5 no trae la versión nueva: hay que usar el botón de actualizar del panel de debug o cerrar todas las pestañas.
- Si cambió un archivo servido, **sube `CACHE_VERSION` en `sw.js`**, en un commit aparte y al final.

Para probar el GPS sin caminar, el panel de debug incluye un simulador de rutas y teletransporte.

## Stack

Vanilla HTML/CSS/JS · Leaflet.js + CARTO Voyager · Claude Haiku vía Cloudflare Worker · Web Speech API · Wikipedia GeoSearch + Overpass OSM + Nominatim · OpenWeatherMap · IndexedDB · Service Worker · PWA.

Sin frameworks, sin npm, sin build step. Es una decisión, no una limitación.

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/contexto_maestro.md`](docs/contexto_maestro.md) | **Empezar aquí para el porqué.** Qué es Follower, qué NO es, hipótesis, ADN del producto, filosofía de experiencia |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Decisiones de arquitectura ratificadas y su razonamiento |
| [`docs/producto.md`](docs/producto.md) | Tickets, estado y alcance |
| [`docs/bitacora.md`](docs/bitacora.md) | Qué pasó en cada sesión, con qué evidencia |
| [`docs/manifiesto_narrativo.md`](docs/manifiesto_narrativo.md) | Vara editorial de la narración |
| [`docs/manifiesto_pois.md`](docs/manifiesto_pois.md) | Criterio de admisión y selección de POIs |
| [`docs/manifiesto_care_strip.md`](docs/manifiesto_care_strip.md) | Vara editorial del cuidado contextual |
| [`REGLAS_IA.md`](REGLAS_IA.md) | Mapa de qué documento manda sobre qué |

**El estado real vive en el código.** Versiones, tickets abiertos y pendientes no se documentan aquí porque caducan: están en `docs/producto.md` y en los propios archivos.

## Estructura

```
index.html · sw.js · manifest.json
css/     estilos y tokens de diseño (:root en main.css)
js/      app · config · gps · poi · narration · voice
         weather · care · walkmode · routes · debug · debug-sim
assets/  logo, iconos, imágenes
docs/    documentación viva
cloudflare/worker.js
```

## Licencia

Proyecto personal. Todos los derechos reservados.
