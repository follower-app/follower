# 🏗️ Follower — Arquitectura v0.6

> Junio 2026 — Sprint de UI: rediseño pantalla exploración, estilos de narrador, debug overlay

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
│   │                         (top-pill y vol-control eliminados en v0.6)
│   ├── splash.css          → latido, rings, expand animation
│   ├── modal.css           → modales, care card, route picker
│   ├── explore.css         → mapa, care strip, bottom bar sólida,
│   │                         pills simétricos, heart-compass, style-selector
│   └── poi.css             → héroe, player, narración, acciones
│
├── js/
│   ├── keys.js             → API keys LOCAL ONLY (.gitignore)
│   ├── config.js           → idioma, mood, mode, volúmenes, localStorage
│   ├── app.js              → AppState, navigateTo(), setPhase(),
│   │                         updateCareStrip(), updateHistCount(),
│   │                         initStyleSelector(), updateExplorePhase()
│   ├── gps.js              → Leaflet, watchPosition, Haversine, Nominatim,
│   │                         simulatePosition() (DA-14)
│   ├── poi.js              → Overpass OSM (lz4 mirror), IndexedDB,
│   │                         detectPOI, candado concurrencia (BUG-014),
│   │                         activateFromBar()
│   ├── narration.js        → Claude API vía Worker, STYLE_PROMPTS
│   │                         (system+user separados, 4 estilos × 2 langs),
│   │                         cache por estilo, fallback (DA-17)
│   ├── voice.js            → Web Speech API, 12 idiomas BCP-47
│   ├── music.js            → Web Audio API, fadeMusic, dip/restore
│   ├── weather.js          → OpenWeatherMap vía Worker, updateCareStrip()
│   ├── care.js             → checkCareContext, 4 prioridades, cooldown
│   ├── routes.js           → 5 recorridos Roma, Leaflet polyline, picker
│   ├── debug.js            → barra fija de tabs (DA-20), overlay panel,
│   │                         métricas técnicas + experiencia (DA-19+),
│   │                         trackExp(), getExp(), export .txt
│   └── debug-sim.js        → simulador GPS, tab registrada vía registerTab(),
│                             updateCareStrip() en cada tick, botón Test Care
│
├── cloudflare/
│   └── worker.js           → proxy Claude API + OpenWeatherMap
│
├── assets/
│   ├── logo.svg            → pendiente
│   ├── sounds/             → epic.mp3, romantic.mp3, mystery.mp3, curious.mp3
│   └── icons/              → icon-192.png, icon-512.png (pendiente logo)
│
└── docs/
    ├── producto.md
    ├── arquitectura.md     ← este archivo
    ├── bitacora.md
    └── contexto_maestro.md
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
  weather, cityName,
  // v0.6 — estilo de narrador (reemplaza mood como driver de prompts)
  narrationStyle:      'storyteller',   // storyteller|historian|poet|detective
  narrationStyleLabel: 'Cuentero',      // label visible en UI
  // métricas de experiencia (DA-16)
  _phaseStart, _msTotalSystole, _msTotalDiastole,
  _lastNarrationTs, _narrationCount, _sessionStart, _firstNarrationTs
}
```

### DA-3 — Funciones únicas por responsabilidad

| Función | Archivo | Nota v0.6 |
|---------|---------|-----------|
| `detectNearby()` | poi.js | |
| `trigger(poi, _unused, lang, topic)` | narration.js | `mood` reemplazado por `AppState.narrationStyle` |
| `fadeMusic(targetVol, durationMs)` | music.js | |
| `checkCareContext()` | care.js | |
| `setPhase(phase)` | app.js | llama `updateExplorePhase()` |
| `navigateTo(screen)` | app.js | |
| `updateCareStrip()` | app.js | nuevo v0.6 |
| `updateHistCount()` | app.js | nuevo v0.6 |

### DA-4 — Sístole / Diástole como sistema CSS
`setPhase()` cambia clase en `body`. CSS hace el resto. Nunca estilos inline desde JS.
En v0.6, `setPhase()` también llama `updateExplorePhase()` que muestra/oculta
`#barSystole` / `#barDiastole` en el bottom bar.

### DA-5 — Offline por 4 capas
```
Capa 1 — sw.js      → shell HTML, CSS, JS
Capa 2 — Leaflet    → tiles del mapa
Capa 3 — IndexedDB  → POIs, narraciones, config
Capa 4 — Cache API  → música, assets
```

### DA-6 — Narración con fallback obligatorio
```
Cache key: poiId_style_lang_topic   ← v0.6: "style" en vez de "mood"

1. Cache IndexedDB (key: poiId_style_lang_topic)
2. Claude API vía Cloudflare Worker
   └── system prompt: personalidad del narrador (DA-17)
   └── user prompt:   contexto del POI y la solicitud
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

```
App (GitHub Pages, pública)
    ↓ fetch sin key visible
Cloudflare Worker (followernarration.jaimeand.workers.dev)
    ├── /narration → agrega CLAUDE_API_KEY → Claude API
    └── /weather    → agrega OPENWEATHER_API_KEY → OpenWeatherMap
```

### DA-12 — Métricas de tiempo con id único
`Debug.metricStart(category, label)` → id único; `Debug.metricEnd(id, status, meta)`
cierra esa medición. Historial persiste en `localStorage` (`follower_debug_log`).

### DA-13 — CartoDB Voyager como proveedor de tiles
Elegido sobre Dark Matter (ilegible con sol en iPhone) y Positron (demasiado minimalista).
Voyager: color + información + legibilidad en campo.

### DA-14 — GPS.simulatePosition() como único punto de entrada para mockear posición
El simulador nunca llama a `POI.detectNearby()` directo — siempre entra por
`GPS.simulatePosition()` → `onPosition()`. Garantiza que la simulación y el GPS
real ejecutan exactamente el mismo código.

### DA-15 — Debug.registerTab() para tabs externas sin acoplamiento
`debug.js` no conoce a `debug-sim.js` por nombre. Cualquier módulo puede
agregarse como tab llamando a `Debug.registerTab(name, label, renderFn)`.

### DA-16 — Estado de experiencia en AppState, no en métricas de tiempo
Métricas discretas → `_metrics` de `debug.js`.
Estado acumulado de sesión → `AppState` (sístole/diástole, narraciones, intervalos).
`setPhase()` es la única función que acumula tiempos de fase.

### DA-17 — Estilos de narrador con prompts separados (system + user)

En v0.6, los `MOOD_PROMPTS` se reemplazan por `STYLE_PROMPTS` con separación
explícita de system prompt (personalidad permanente del narrador) y user prompt
(solicitud específica del POI y el tema).

```js
STYLE_PROMPTS = {
  storyteller: { system: { es, en }, user: { es, en } },
  historian:   { system: { es, en }, user: { es, en } },
  poet:        { system: { es, en }, user: { es, en } },
  detective:   { system: { es, en }, user: { es, en } }
}
```

El `trigger()` ignora el parámetro `mood` heredado y lee `AppState.narrationStyle`.
La cache usa `style` en la key (`poiId_style_lang_topic`) — cada estilo guarda
su propia narración para el mismo POI.

El mapeo estilo → música para `Music.changeMood()`:
- `storyteller` → epic
- `historian`   → epic (pendiente track clásico)
- `poet`        → romantic
- `detective`   → mystery

### DA-18 — Bottom bar sólida sin gradiente ni blur

En v0.6, el bottom bar:
- `position: absolute; bottom: 0`
- `background: var(--color-night)` (sólido)
- `border-top: 1px solid var(--color-border)` (límite limpio)
- **Sin** `backdrop-filter: blur()`, **sin** gradiente transparente
- Estado-aware: `#barSystole` visible en sístole, `#barDiastole` en diástole
- `updateExplorePhase(phase)` en `app.js` hace el switch

Layout sístole: dos pills simétricos + corazón-brújula al centro
```
[🎭 Cuentero ↓]    💗    [🏛️ La Merced ↑]
```

Layout diástole: mini-player completo
```
[ Iglesia La Merced          · 48m ]
[ ████████░░░░░░             ⏸  ⏹ ]
[ ≋≋≋≋≋≋  Cuentero                ]
```

### DA-19 — Care strip como contexto permanente arriba

El care strip reemplaza la top-pill. Ocupa los primeros 32px de la pantalla de exploración.
```
☀️ 28° | 👣 3,240 pasos | 📍 1.4 km
```

- `position: absolute; top: 0; z-index: var(--z-notch)`
- El debug bar (en dev) arranca en `top: 32px` para no superponerse
- Cuando se quita debug.js antes de v1.0, el care strip queda solo en el top
- Datos en alerta (temp ≥ 30° o ≤ 5°) se marcan con `.alert` (color dorado)
- `updateCareStrip()` en `app.js` es la función única de actualización,
  llamada desde: weather.js al recibir datos, updateStats(), simulador en cada tick

### DA-20 — Debug panel como barra fija de tabs + overlay (no bottom panel)

En v0.6, el debug panel cambia completamente de estructura:

```
Antes: botón flotante rojo top-right + panel desde bottom (55vh)
Ahora: barra de tabs fija en top:32px + panel overlay en top:64px
```

- `#dbg-bar`: `position: fixed; top: 32px` — siempre visible en dev, solo tabs
- `#dbg-panel`: `position: fixed; top: 64px; max-height: 52vh` — oculto por defecto
- Tap en tab cerrada → abre panel con contenido de esa tab
- Tap en tab activa (panel abierto) → colapsa el panel
- Auto-refresh solo cuando el panel está visible (no consume CPU innecesariamente)
- Botón Exportar .txt: **solo en tab Logs** (no en otras tabs)
- Tabs internas: Estado, Buscar, Logs, Tiempos, 🎬 Exp
- Tabs externas: Simular (registrada por debug-sim.js vía registerTab)

### DA-21 — Care conectado al simulador

En v0.6, el simulador alimenta care correctamente:

1. **`updateCareStrip()`** se llama en cada tick del simulador — el km del
   care strip se actualiza en tiempo real durante la simulación
2. **Botón "🧡 Test Care"** en el tab Simular fuerza `Care.check()` inmediatamente,
   sin esperar el timer real de 5 minutos — permite validar la experiencia de
   cuidado en simulaciones de caminata
3. Las fuentes de datos que care lee (`AppState.kmWalked`, `AppState.steps`,
   `AppState.gps`) se actualizan correctamente porque el simulador entra por
   `GPS.simulatePosition()` → `onPosition()` (DA-14)

---

## Flujo de datos

```
watchPosition() dispara onPosition() — sin timer propio
    │
    ├── updateUserPosition() → Leaflet marker
    ├── updateDistance()     → AppState.kmWalked, steps
    ├── updateCareStrip()    → care strip km (cada N updates)
    └── throttle 5000ms → detectNearby() → poi.js
            │
            ├── Debug.trackExp('poi_check')
            ├── detectPOI()
            │   ├── Debug.trackExp('poi_detected') por cada poi en radio
            │   ├── Debug.trackExp('poi_eligible') si hay candidato
            │   └── activatePOI()
            │       ├── Debug.trackExp('poi_narrated', {lat, lng, poiId})
            │       ├── setPhase('diastole') → updateExplorePhase()
            │       ├── showPOICard() → actualiza #barPoiName, #barPoiDist
            │       └── Narration.trigger()
            │           ├── AppState.narrationStyle → STYLE_PROMPTS
            │           ├── cache IndexedDB (key: poiId_style_lang_topic)
            │           ├── Claude API (system + user prompt separados)
            │           ├── Voice.speak()
            │           │   └── Debug.trackExp('narration_completed')
            │           └── Music.dipForNarration()
            │               └── Debug.trackExp('music_dip_start')
            └── updateHistCount() → actualiza pills y nearbySelector
```

---

## APIs Externas

| API | Endpoint | Auth | Fallback |
|-----|----------|------|---------|
| Claude API | `followernarration.jaimeand.workers.dev/narration` | Secret en Worker | Cache + texto genérico |
| Overpass OSM | `lz4.overpass-api.de/api/interpreter` | Ninguna | IndexedDB |
| Nominatim | `nominatim.openstreetmap.org/reverse` | Ninguna | IP fallback |
| OpenWeatherMap | `followernarration.jaimeand.workers.dev/weather` | Secret en Worker | localStorage 2h |
| ipapi.co | `ipapi.co/json/` | Ninguna | cityName = 'Tu ciudad' |

---

## Gestión de API Keys

- **Claude y OpenWeatherMap** — keys como Secrets en Cloudflare Worker, nunca en el repo (DA-11)
- **`js/keys.js`** — local, en `.gitignore`; nunca sube a GitHub
- Repo es público (GitHub Pages gratis)

---

## Deuda técnica

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por estilo (4 MP3, renombrar a estilos) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` + `debug-sim.js` deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` — Safari backgrounding | Media |
| DT-11 | Worker 400 en arranque — sin diagnosticar | Baja |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-13 | Botones `btnBookmark`/`btnShare` huérfanos en splash | Baja |
| DT-14 | Corazón-brújula: diseño final como brújula sólida con N S E O y aguja rota bicolor (blanco/rojo) que gira con bearing real (DeviceOrientationEvent) | Media |
| DT-15 | Prompts de estilos de narrador: refinar con pruebas de campo — definir largo exacto, ejemplos de salida esperada, tests A/B | Alta |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Config modal: reemplazar "Mood" por selector de estilo de narrador para alinear con v0.6 | Media |
| DT-18 | Track de música para estilo Historiador — hoy usa "epic" por fallback | Baja |
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker (DA-11) | — |

---

*Follower — Arquitectura v0.6 | Junio 2026*
