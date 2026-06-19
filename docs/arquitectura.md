# 🏗️ Follower — Arquitectura v0.4

> Junio 2026 — Código base completo

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
│   ├── keys.js             → API keys LOCAL ONLY (.gitignore)
│   ├── config.js           → idioma, mood, mode, volúmenes, localStorage
│   ├── app.js              → AppState, navigateTo(), setPhase(), init
│   ├── gps.js              → Leaflet, watchPosition, Haversine, Nominatim
│   ├── poi.js              → Overpass OSM, IndexedDB, detectPOI, renderExpanded
│   ├── narration.js        → Claude API, prompts×4moods×2langs, fallback
│   ├── voice.js            → Web Speech API, 12 idiomas BCP-47
│   ├── music.js            → Web Audio API, fadeMusic, dip/restore
│   ├── weather.js          → OpenWeatherMap, lluvia, cache 30min
│   ├── care.js             → checkCareContext, 4 prioridades, cooldown
│   └── routes.js           → 5 recorridos Roma, Leaflet polyline, picker
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
2. Claude API (timeout 8s)
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
| Claude API | `api.anthropic.com/v1/messages` | `KEYS.claude` | Cache + texto genérico |
| Overpass OSM | `overpass-api.de/api/interpreter` | Ninguna | IndexedDB |
| Nominatim | `nominatim.openstreetmap.org/reverse` | Ninguna | IP fallback |
| OpenWeatherMap | `api.openweathermap.org/data/2.5/weather` | `KEYS.openWeatherMap` | localStorage 2h |
| ipapi.co | `ipapi.co/json/` | Ninguna | cityName = 'Tu ciudad' |

---

## Gestión de API Keys

- **`js/keys.js`** — archivo local, en `.gitignore`, nunca sube a GitHub
- Para piloto: keys en `keys.js` local
- Para producción: migrar a backend proxy (Cloudflare Workers / Vercel Functions)

---

## Deuda técnica

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-6 | Backend proxy para API keys | Baja (post-piloto) |

---

*Follower — Arquitectura v0.4 | Junio 2026*
