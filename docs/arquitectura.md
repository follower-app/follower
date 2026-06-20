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
│   ├── gps.js              → Leaflet, watchPosition, Haversine, Nominatim
│   ├── poi.js              → Overpass OSM (lz4 mirror), IndexedDB, detectPOI, renderExpanded
│   ├── narration.js        → Claude API vía Worker, prompts×4moods×2langs, fallback
│   ├── voice.js            → Web Speech API, 12 idiomas BCP-47
│   ├── music.js            → Web Audio API, fadeMusic, dip/restore
│   ├── weather.js          → OpenWeatherMap vía Worker, lluvia, cache 30min
│   ├── care.js             → checkCareContext, 4 prioridades, cooldown
│   ├── routes.js           → 5 recorridos Roma, Leaflet polyline, picker
│   └── debug.js            → panel debug flotante (Estado/Buscar POI/Logs/Tiempos)
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

---

## Flujo de datos

```
GPS tick (cada 3s)
    │
    ├── updateUserPosition() → Leaflet marker
    ├── updateDistance()     → AppState.kmWalked, steps
    └── detectNearby()       → poi.js
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
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker (DA-11) | — |

---

*Follower — Arquitectura v0.5 | Junio 2026*
