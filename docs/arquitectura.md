# 🏗️ Follower — Arquitectura v0.5

> Junio 2026 — Migración a Cloudflare Worker (DT-6 resuelto anticipadamente)

---

## Principio General

**Sin frameworks. Sin npm. Sin build step.**

HTML + CSS + JS Vanilla. Mismo stack que Organiza2.

---

## Estructura de Archivos

```
follower/
├── index.html              → shell mínimo
├── manifest.json           → PWA config
├── sw.js                   → service worker (pendiente — siempre último)
├── REGLAS_IA.md
├── README_follower.md
│
├── css/
│   ├── main.css            → variables, reset, tipografía, fases
│   ├── components.css      → botones, pills, cards, waves, badges
│   ├── splash.css          → latido, rings, expand animation
│   ├── modal.css           → modales, care card, route picker
│   ├── explore.css         → mapa, pins POI, card pequeña, bottom bar
│   └── poi.css             → héroe, player, narración, acciones
│
├── js/
│   ├── keys.js             → API keys LOCAL ONLY (.gitignore) — vacío salvo legacy
│   ├── config.js           → idioma, mood, mode, volúmenes, localStorage
│   ├── app.js              → AppState, navigateTo(), setPhase(), init
│   ├── gps.js              → Leaflet, watchPosition, Haversine, Nominatim, simulatePosition() (DA-14)
│   ├── poi.js              → Overpass OSM (lz4 mirror), IndexedDB, detectPOI, candado de concurrencia (BUG-014)
│   ├── narration.js        → Claude API vía Worker, prompts×4moods×2langs, fallback
│   ├── voice.js            → Web Speech API, 12 idiomas BCP-47
│   ├── music.js            → Web Audio API, fadeMusic, dip/restore
│   ├── weather.js          → OpenWeatherMap vía Worker, lluvia, cache 30min
│   ├── care.js             → checkCareContext, 4 prioridades, cooldown
│   ├── routes.js           → 5 recorridos Roma, Leaflet polyline, picker
│   ├── debug.js            → panel debug flotante + métricas con historial (DA-12), registro de tabs externas (DA-15), export .txt
│   └── debug-sim.js        → simulador GPS, 5ta tab registrada vía Debug.registerTab()
│
├── cloudflare/
│   └── worker.js           → proxy Claude API + OpenWeatherMap (referencia, no afecta deploy)
│
├── assets/
│   ├── logo.svg            → pendiente
│   ├── sounds/             → epic.mp3, romantic.mp3, mystery.mp3, curious.mp3
│   └── icons/              → icon-192.png, icon-512.png (pendiente logo)
│
└── docs/
    ├── producto_v0.4.md
    ├── arquitectura_v0.4.md
    └── bitacora_v0.4.md
```

---

## Decisiones Arquitecturales

### DA-1 — index.html es solo shell
Sin lógica, sin estilos inline. Solo estructura HTML, links CSS, scripts JS al final.

### DA-2 — AppState centralizado en app.js
```js
const AppState = {
  screen, phase, mode, mood, lang,
  gps, nearbyPOIs, activePOI, activeRoute,
  offline, steps, kmWalked, poisVisited,
  weather, cityName
}
```

### DA-3 — Funciones únicas por responsabilidad

| Función | Archivo |
|---------|---------|
| `detectPOI()` | poi.js |
| `triggerNarration(poi, mood, lang, topic)` | narration.js |
| `fadeMusic(targetVol, durationMs)` | music.js |
| `checkCareContext()` | care.js |
| `setPhase(phase)` | app.js |
| `navigateTo(screen)` | app.js |

### DA-4 — Sístole / Diástole como sistema CSS
`setPhase()` cambia clase en `body`. CSS hace el resto. Nunca estilos inline desde JS.

```js
setPhase('diastole') // body.phase-diastole → CSS cambia colores
```

### DA-5 — Offline por 4 capas
```
Capa 1 — sw.js      → shell HTML, CSS, JS
Capa 2 — Leaflet    → tiles del mapa
Capa 3 — IndexedDB  → POIs, narraciones, config
Capa 4 — Cache API  → música, assets
```

### DA-6 — Narración con fallback obligatorio
```
1. Cache IndexedDB (key: poiId_mood_lang_topic)
2. Claude API vía Cloudflare Worker (timeout 15s)
3. Texto genérico con datos OSM
→ Nunca error visible al usuario
```

### DA-7 — GPS nunca se interrumpe
`watchPosition` continuo en `gps.js`. Ni durante narración ni durante modales.

### DA-8 — Modo Libre es default
`AppState.mode = 'free'` siempre al iniciar. Modo recorrido solo por acción explícita.

### DA-9 — sw.js siempre último en commits
Orden obligatorio: archivos → commit → push → esperar → sw.js → commit → push.

### DA-10 — CSS variables en main.css
Todos los colores en `:root`. Nunca hardcoded en otros archivos CSS o JS.

### DA-11 — Cloudflare Worker como proxy de API keys
Repo es público (requisito de GitHub Pages gratis). Keys de Claude y OpenWeatherMap
nunca viven en código del repo — viven como Secrets en Cloudflare, invisibles.
`narration.js` y `weather.js` llaman al Worker, nunca directo a los proveedores.
Resuelve DT-6 antes de lo planeado, por necesidad: probar en celular vía GitHub
Pages exponía las keys directamente, causando revocación automática (pasó con
Gemini y casi con OpenAI).

```
App (GitHub Pages, pública)
    ↓ fetch sin key visible
Cloudflare Worker (followernarration.jaimeand.workers.dev)
    ├── /narration → agrega CLAUDE_API_KEY → Claude API
    └── /weather    → agrega OPENWEATHER_API_KEY → OpenWeatherMap
```

### DA-12 — Métricas de tiempo con id único, no por label fijo

`Debug.metricStart(category, label)` devuelve un id único
(`category|label|timestamp|random`); `Debug.metricEnd(id, status, meta)`
cierra esa medición específica. Evita que dos operaciones concurrentes del
mismo tipo (ej. dos narraciones activándose casi al mismo tiempo) se pisen
entre sí. El historial completo vive en un arreglo, no en un objeto que se
sobreescribe, y se persiste en `localStorage` (`follower_debug_log`) para
sobrevivir recargas de página durante pruebas en campo.

Categorías instrumentadas:
- `poi` — Overpass fetch, cache IndexedDB load, chequeos detectNearby
- `narration` — cache lookup, Claude Worker call, narración total
- `voice` — lag texto→voz, duración narración hablada, errores de síntesis
- `music` — cargar track

El estado de la experiencia cinematográfica (sístole/diástole, primera
narración, intervalos) vive en `AppState` (ver DA-16), no en `_metrics`,
porque son acumulados de sesión, no mediciones discretas con duración.

### DA-13 — CartoDB Voyager como proveedor de tiles del mapa

Se iteró en vivo contra capturas reales de campo: el filtro
`brightness/saturate` original sobre OSM Mapnik desaturaba todo el mapa por
igual, parques incluidos (BUG-017). Se probó CartoDB Dark Matter (resultó
ilegible con luz de sol directa en iPhone), luego CartoDB Positron
(demasiado minimalista — sin parques/agua/etiquetas suficientes, por
diseño: los basemaps "soft" de CARTO están pensados como fondo para que la
app superponga sus propios datos, no como mapa de referencia completo tipo
Google Maps). Voyager quedó como el balance final: color + información
manteniendo legibilidad.

```js
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: CONFIG.MAP_ZOOM_MAX, attribution: '', subdomains: 'abcd', detectRetina: true
})
```

Nota pendiente: ni Voyager ni el OSM Mapnik anterior muestran atribución
visible (`attribution: ''`), igual que antes del cambio de proveedor —
ambos la requieren técnicamente en su tier gratuito. No bloqueante a corto
plazo, pero a revisar si el uso crece (ver Deuda técnica).

### DA-14 — GPS.simulatePosition() como único punto de entrada para mockear posición

El simulador de GPS (`debug-sim.js`) nunca duplica lógica de `onPosition()`
— arma un objeto position falso (`{coords: {latitude, longitude, accuracy}}`)
y se lo pasa directo a la misma función que usa `watchPosition` real. Así,
el mapa se auto-inicializa en la primera posición simulada exactamente
igual que con GPS real, y los chequeos de POI respetan el mismo throttle de
producción. Regla para cualquier código futuro que necesite mockear GPS:
nunca llamar a `POI.detectNearby()` u otras funciones internas directo —
siempre entrar por `GPS.simulatePosition()`.

```js
GPS.simulatePosition(lat, lng, accuracy)  // → onPosition() real, sin atajos
GPS.setPOICheckInterval(ms)               // setter controlado de CONFIG.POI_CHECK_INTERVAL
GPS.getRadiusConfig()                     // copia de solo lectura de POI_RADIUS_METERS/NEARBY_RADIUS
```

### DA-15 — Debug.registerTab() para tabs externas sin acoplamiento

`debug.js` no conoce a `debug-sim.js` por nombre. Cualquier módulo puede
agregarse como tab nueva del panel llamando a
`Debug.registerTab(name, label, renderFn)`, sin tocar el archivo `debug.js`.
Efecto secundario necesario: `switchTab()` matcheaba la tab activa por
posición en un array hardcodeado (`['status','search','logs','timing']`) —
se hubiera roto en silencio con cualquier tab agregada dinámicamente. Se
corrigió a matching por atributo `data-tab`, que escala a cualquier
cantidad de tabs.

### DA-16 — Estado de experiencia en AppState, no en métricas de tiempo

Las métricas discretas (duración de un fetch, lag de voz) viven en
`_metrics` de `debug.js`. El estado de la experiencia cinematográfica —
que es acumulado a lo largo de toda la sesión — vive en `AppState`:

```javascript
AppState._phaseStart        // timestamp inicio de la fase actual
AppState._msTotalSystole    // ms acumulados en sístole (caminando)
AppState._msTotalDiastole   // ms acumulados en diástole (narrando)
AppState._lastNarrationTs   // timestamp de la última narración
AppState._narrationCount    // total de narraciones en la sesión
AppState._sessionStart      // timestamp de inicio de sesión (initExplore)
AppState._firstNarrationTs  // timestamp de la primera narración
```

`setPhase()` en `app.js` es la única función que acumula los tiempos de
fase — cualquier transición sístole/diástole pasa por ahí, tanto en GPS
real como en el simulador (que entra por `GPS.simulatePosition()` → 
`onPosition()` → `detectNearby()` → `activatePOI()` → `setPhase()`).

Regla: `debug-sim.js` nunca calcula sus propios acumulados de experiencia
— siempre lee de `AppState`. Esto garantiza que el dashboard muestre los
mismos números en una sesión de campo real y en una sesión simulada.

```js
const id = Debug.metricStart('narration', 'Claude Worker call');
// ... operación async ...
Debug.metricEnd(id, 'ok', { poi: poi.name });
```

Toda instrumentación en `poi.js`, `narration.js` y `music.js` queda detrás de
`typeof Debug !== 'undefined'` — si `debug.js` se quita antes de v1.0 (DT-8),
ningún archivo se rompe.

---

## Flujo de datos

```
watchPosition() dispara onPosition() — sin timer propio, depende de
cuándo el dispositivo reporta movimiento real (o de simulatePosition()
en debug-sim.js, DA-14)
    │
    ├── updateUserPosition() → Leaflet marker
    ├── updateDistance()     → AppState.kmWalked, steps
    └── throttle CONFIG.POI_CHECK_INTERVAL (5000ms, ajustable vía
        GPS.setPOICheckInterval() — DA-14) → detectNearby() → poi.js
            │
            ├── detectPOI()
            │       ├── activatePOI() → setPhase('diastole')
            │       │       ├── showPOICard()
            │       │       └── Narration.trigger()
            │       │               ├── cache check
            │       │               ├── Claude API
            │       │               ├── Voice.speak()
            │       │               └── Music.dipForNarration()
            │       └── deactivatePOI() → setPhase('systole')
            └── Care.check()
                    └── checkCareContext()
                            ├── weather check
                            ├── steps check
                            └── showCareCard()
```

---

## APIs Externas

| API | Endpoint | Auth | Fallback |
|-----|----------|------|---------|
| Claude API | `followernarration.jaimeand.workers.dev/narration` (proxy) | Secret en Worker | Cache + texto genérico |
| Overpass OSM | `lz4.overpass-api.de/api/interpreter` | Ninguna | IndexedDB |
| Nominatim | `nominatim.openstreetmap.org/reverse` | Ninguna | IP fallback |
| OpenWeatherMap | `followernarration.jaimeand.workers.dev/weather` (proxy) | Secret en Worker | localStorage 2h |
| ipapi.co | `ipapi.co/json/` | Ninguna | cityName = 'Tu ciudad' |

---

## Gestión de API Keys

- **Claude y OpenWeatherMap** — keys como Secrets en Cloudflare Worker, nunca en el repo (DA-11)
- **`js/keys.js`** — local, en `.gitignore`, queda vacío o sin uso real; nunca sube a GitHub
- Repo es público (GitHub Pages gratis) por lo que ninguna key puede vivir en código versionado
- Worker gratis (100k requests/día), sin tarjeta de crédito requerida

---

## Deuda técnica

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-9 | Revocar key OpenAI residual expuesta en `keys.js` (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` visto en log de campo durante fetches solapados — probablemente Safari cerrando conexiones idle al backgroundear la app, no confirmado si el candado de poi.js (BUG-014) lo resuelve solo | Media |
| DT-11 | Worker Cloudflare responde 400 en cada arranque de sesión (5/5 en log de campo) — sin diagnosticar qué ruta lo dispara | Baja |
| DT-12 | Atribución CARTO/OSM no se muestra (`attribution: ''` en gps.js, DA-13) — requerida técnicamente en el tier gratuito, no bloqueante a corto plazo | Baja |
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker (DA-11) | — |

---

*Follower — Arquitectura v0.5 | Junio 2026*
