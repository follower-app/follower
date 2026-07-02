# 🏗️ Follower — Arquitectura v0.7

> Junio 2026 — Redefinición de experiencia: narradores, intros musicales, bienvenida de ciudad, care card desde arriba

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

### DA-22 — Brújula: 3 estados + cono de dirección GPS

La brújula es un botón en la columna derecha del mapa (junto a +/−), mismo
tamaño (34px). Tres estados:

**Estado 1 — Reposo:** aguja estática apuntando al norte. Corazón Follower
como fondo sutil del dial (12% opacidad, identidad sin interferir).
Tick norte en rojo (coherencia semántica: todo lo rojo = norte).
Sin letra "N" — el tick largo es suficiente para usuarios con cualquier brújula.

**Estado 2 — Latido (~450ms):** al tocar, animación CSS en el corazón de fondo
(`heart-pulse`) + ring exterior (`pulse-ring-anim`). Transición cinematográfica
que conecta el gesto del usuario con la identidad de Follower (el corazón late).

**Estado 3 — Activo:** `DeviceOrientationEvent` listener activo.
- iOS: `webkitCompassHeading` (grados desde norte, clockwise)
- Android: `360 - alpha`
- Aguja rota: `rotate(${-heading}deg)` — contra-rotación para mantener norte
- Cono GPS: `L.divIcon` con SVG SVG triangular semitransparente en la posición
  del usuario, rota con `rotate(${heading}deg)`
- Borde del botón en rojo activo
- Permisos iOS 13+: `DeviceOrientationEvent.requestPermission()` antes de activar

Tap de nuevo → estado 1, cono GPS desaparece, listener removido.

**Archivos:** `index.html`, `explore.css`, `app.js`, `gps.js`

---

### DA-23 — Narradores reemplazan moods como identidad de la experiencia

En v0.7, el concepto de **mood** (épico/romántico/misterio/curioso) se elimina
completamente. Es reemplazado por **narradores** — personajes con voz y perspectiva
propias que el usuario elige como compañero de viaje.

Los 4 narradores definitivos:

| Narrador | Clave | Prioriza |
|----------|-------|----------|
| 🎭 Storyteller | `storyteller` | personajes reales, emoción, suspenso |
| 🏛️ Historiador | `historian` | fechas, arquitectura, contexto histórico |
| 🔎 Explorador | `explorer` | secretos, detalles ocultos, revelaciones |
| ❤️ Local | `local` | costumbres reales, cultura viva, voz del barrio |

`poet` y `detective` eliminados. `Familiar` reservado para v1.x.

Cambios de nomenclatura:
- `AppState.mood` → eliminado
- `Config.get('mood')` → `Config.get('narrator')`
- `Config.setMood()` → `Config.setNarrator()`
- `MOOD_LABELS` → `NARRATOR_LABELS` en `config.js`
- `MOOD_MUSIC` y `getMusicTrack()` → eliminados
- `STYLE_PROMPTS` en `narration.js` — reescrito completamente con los 4 narradores

**Pregunta rectora aplicada:** "¿Esto nos acerca a una experiencia cinematográfica?"
Un narrador es un personaje. Un mood es una abstracción. El usuario se conecta con personajes.

---

### DA-24 — Música: intros narrativas reemplazan loops continuos

En v0.7, la música continua de fondo se elimina. Su función cambia radicalmente:

**Antes:** loops ambiente por mood durante toda la caminata
**Ahora:** clip corto (10-15s) antes de cada narración — anuncia que algo interesante está por ocurrir

```
GPS → POI detectado → playNarratorIntro(narrator) → await → Voice.speak()
```

`playNarratorIntro(narrator)` devuelve una Promise que resuelve cuando el clip termina.
`Voice.speak()` solo arranca después del await — orden garantizado.

Tracks:
```
assets/sounds/storyteller-intro.mp3   — emocional, cálida
assets/sounds/historian-intro.mp3     — elegante, clásica
assets/sounds/explorer-intro.mp3      — curiosa, ligera
assets/sounds/local-intro.mp3         — cercana, urbana
```

**Fallback silencioso:** si el MP3 no existe, `playNarratorIntro()` resuelve
inmediatamente y la narración continúa. El error nunca es visible al usuario.

**Safety timer:** 16s máximo de espera si `onended` no llega (iOS Safari).
Mismo patrón que `voice.js` (DA-22 / BUG-022).

Funciones eliminadas de `music.js`: `play()`, `changeMood()`, `dipForNarration()`,
`restoreAfterNarration()`, `fadeToAmbient()`, `TRACKS`.

---

### DA-25 — Bienvenida de ciudad: texto sobre el mapa, una vez por sesión

Al detectar la ciudad (GPS o IP fallback), el narrador activo presenta la ciudad
con una frase corta en tipografía cinematográfica.

**Comportamiento:**
- Una sola vez por sesión (`AppState._cityWelcomeDone`)
- Solo texto — sin voz, sin música
- Fade in 600ms → 5 segundos visible → fade out 400ms
- Tap para cerrar antes
- Posición: centrado sobre el mapa, DM Serif Display 22px

**Implementación:**
- `welcomeCity(city)` en `app.js` — lee narrador activo, llama `Narration.getCityWelcome()`
- `getCityWelcome(city, style, lang)` en `narration.js` — devuelve la frase
- Hook en `gps.js` → `fetchCityName()`: `if (isFirst) welcomeCity(city)`
- `#cityWelcome` en `index.html`, `.city-welcome` en `explore.css`

**Una frase por narrador:**
- 🎭 `"Cali. Aquí cada esquina tiene un personaje esperando ser contado."`
- 🏛️ `"Cali. Cada piedra de esta ciudad tiene una fecha y una razón."`
- 🔎 `"Cali. La mayoría pasa por aquí sin notar lo que realmente esconde."`
- ❤️ `"Cali. Bienvenido. Acá te cuento cómo es esto de verdad."`

---

### DA-26 — Care card reemplaza al care strip (no se superponen)

En v0.7, la care card deja de flotar sobre el mapa desde abajo (`bottom: 120px`).
Ahora reemplaza al care strip en su mismo espacio (`top: 0`, `height: 32px`).

**Antes:** care card flotante + care strip visible simultáneamente
**Ahora:** care strip hace fade out → care card ocupa su lugar → dismiss → care strip vuelve

```css
/* Care strip con clase cuando la card está activa */
.care-strip.care-active { opacity: 0; pointer-events: none; }

/* Care card en la misma posición */
.care-card { position: absolute; top: 0; height: 32px; }
```

`care.js` → `showCareCard()` agrega `.care-active` al strip.
`care.js` → `dismiss()` remueve `.care-active` y restaura el strip.

**Ventaja:** el mapa nunca se desplaza. El layout es estable siempre.

---

### Estructura de archivos actualizada (v0.7)

```
assets/sounds/
├── storyteller-intro.mp3   → pendiente (DT-19)
├── historian-intro.mp3     → pendiente (DT-19)
├── explorer-intro.mp3      → pendiente (DT-19)
└── local-intro.mp3         → pendiente (DT-19)
```

`epic.mp3`, `romantic.mp3`, `mystery.mp3`, `curious.mp3` → **eliminados**

### DA-3 actualizada — Funciones únicas por responsabilidad (v0.7 · Sesión 11)

| Función | Archivo | Nota |
|---------|---------|------|
| `detectNearby()` | poi.js | sin cambios |
| `resetPOIs()` | poi.js | nuevo sesión 11 — limpia marcadores y estado al teletransportar |
| `trigger(poi, _unused, lang, topic)` | narration.js | Promise.race 3s en await de música |
| `playNarratorIntro(narrator)` | music.js | reemplaza `fadeMusic/dip/restore` |
| `initFromGesture()` | music.js | nuevo sesión 11 — activa AudioContext desde tap del usuario |
| `welcomeCity(city)` | app.js | doble rAF para transición CSS correcta |
| `getCityWelcome(city, style, lang)` | narration.js | sin cambios |
| `checkCareContext()` | care.js | sin cambios |
| `setPhase(phase)` | app.js | sin cambios |
| `navigateTo(screen)` | app.js | sin cambios |

### Flujo de datos actualizado (v0.7)

```
watchPosition() → onPosition()
    │
    ├── fetchCityName() [primera vez]
    │   └── welcomeCity(city) → #cityWelcome fade in/out
    │
    └── throttle 5000ms → detectNearby() → poi.js
            └── activatePOI()
                └── Narration.trigger()
                    ├── cache / Claude API / fallback → text
                    ├── await Music.playNarratorIntro(style)  ← nuevo v0.7
                    │   └── onended / safety 16s → resolve
                    └── Voice.speak(text, lang, callback)
```

### Deuda técnica actualizada (v0.7 · Sesión 11)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` + `debug-sim.js` deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-19 | 4 MP3 de intro por narrador (storyteller/historian/explorer/local) | Alta |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 al inicio — pendiente diagnóstico | Baja |
| ~~DT-2~~ | ~~Archivos de música por mood~~ — reemplazado por DT-19 | — |
| ~~DT-13~~ | ~~Botones btnBookmark/btnShare huérfanos~~ — eliminados del HTML en BUG-032, reimplementar como DT-17 | — |
| ~~DT-15~~ | ~~Prompts de estilos~~ — resuelto en v0.7 con 4 narradores definitivos | — |
| ~~DT-18~~ | ~~Track historiador~~ — eliminado junto con sistema de música continua | — |

### Nota de arquitectura — AudioContext en iOS Safari (BUG-029)

`AudioContext` en iOS Safari solo puede activarse desde un `addEventListener`
de tap/click disparado directamente por el usuario (trusted event). Cualquier
llamada programática posterior (setTimeout, callback async, Promise chain)
cae fuera del trusted event y `resume()` falla silenciosamente.

**Patrón establecido:** `Music.initFromGesture()` se llama desde el listener
de `btnStartExplore` — único punto del flujo con gesto directo. El pipeline
de narración (`trigger()`) usa `Promise.race` con timeout 3s para que un
fallo de música nunca bloquee la voz.

---

*Follower — Arquitectura v0.7 | Junio 2026*
---

## Sprint S1 + LAB-01 — v0.7s (25 Junio 2026)

### DA-27 — Selección de voz: prioridad latinoamericana con dos pasadas

`getBestVoice()` en `voice.js` opera en dos pasadas para español:

1. Primera pasada: voces **locales** (`localService=true`) en orden `ES_PRIORITY`
2. Segunda pasada: si no hay ninguna local, acepta online en el mismo orden

```
ES_PRIORITY = ['es-CO', 'es-MX', 'es-US', 'es-419', 'es-AR', 'es-CL', 'es-PE', 'es-VE', 'es-ES']
```

Razón de las dos pasadas: voces online (Google TTS) ignoran el parámetro `rate` de SpeechSynthesisUtterance — la duración es impredecible. Una voz local `es-ES` es preferible a una voz online `es-US`.

`LANG_MAP.es` cambiado de `'es-ES'` a `'es-419'` como código BCP-47 preferido.

Log de diagnóstico: `Voice.getVoiceList()` expuesto en API pública. Al arrancar, `_logAvailableVoices()` lista todas las voces ES del dispositivo en tab Logs.

---

### DA-28 — Sanitización de narraciones antes de la voz

`sanitizeNarration(text)` en `narration.js` — función pura aplicada antes de `updateNarrationUI()` y `Voice.speak()`. Elimina: encabezados `#`, negritas `**`, cursivas `*`, código `` ` ``, listas `- ` y `* `, listas numeradas, saltos múltiples.

Razón: Claude Haiku puede responder con formato markdown aunque el prompt lo prohíba. La voz lee esos caracteres literalmente. La sanitización es la única defensa confiable.

---

### DA-29 — Longitud de narraciones como decisión arquitectural

Los prompts de narración tienen un límite explícito de longitud: **70 palabras por párrafo, 180-220 palabras total, objetivo 30-40 segundos hablado**. `max_tokens` bajó de 450 a 350.

Razón arquitectural: una narración de 90 segundos no es solo un problema de UX — bloquea el sistema entero. Durante 90s, todos los POIs detectados se marcan como `visited` y se pierden. La longitud de narración es una decisión de pipeline, no solo de experiencia.

---

### DA-30 — AudioContext keep-alive para iOS Safari (fix definitivo)

`initFromGesture()` en `music.js` reproduce un buffer de 1 segundo de silencio real desde el gesto del usuario:

```javascript
const silenceBuffer = _context.createBuffer(1, _context.sampleRate, _context.sampleRate);
const silenceSource = _context.createBufferSource();
silenceSource.buffer = silenceBuffer;
silenceSource.connect(_context.destination);
silenceSource.start(0);
```

Razón: iOS Safari suspende el AudioContext cuando no hay audio activo. El buffer de silencio mantiene el contexto en `state=running`. Mientras el contexto esté activo, `speechSynthesis` funciona después de operaciones async (ej: respuesta de Claude ~6s).

Este fix extiende el patrón establecido en BUG-029 (sesión 11). El workaround anterior (solo `_context.resume()`) era insuficiente porque no producía audio real.

---

### DA-31 — Candado `_isFetchingPOIs` en Overpass (`poi.js`)

```javascript
let _isFetchingPOIs = false;

async function fetchPOIsFromOSM(lat, lng, radiusKm) {
  if (_isFetchingPOIs) { return _pois.length > 0 ? _pois : []; }
  _isFetchingPOIs = true;
  try {
    // ... fetch
  } finally {
    _isFetchingPOIs = false;  // siempre liberar
  }
}
```

Razón: el simulador puede disparar múltiples llamadas a `loadPOIs()` antes de que Overpass responda (8-15s de latencia). Sin candado, las llamadas paralelas generan 429s en cadena. El `finally` garantiza liberación incluso en error/timeout.

---

### DA-32 — Reset de POIs solo en modo teleport (`debug-sim.js`)

`teleportTo()` llama `POI.resetPOIs()` solo cuando `_mode === 'teleport'`. En modo `route`, los clicks del mapa agregan waypoints sin resetear.

Razón: en modo `route`, cada click en el mapa disparaba un reset completo → 15 fetches paralelos → 429s en cadena (la misma causa que DA-31 pero desde el simulador).

---

### DA-33 — Laboratorio: sesión de prueba aislada (`startTestSession`)

`Debug.startTestSession()` es la función centralizada de reset de sesión. Resetea en un solo lugar todos los contadores de sesión en AppState y en Debug.

Todos los puntos de inicio de sesión la llaman:
- `initExplore()` en `app.js` — exploración real en iPhone
- `startWalking()` en `debug-sim.js` — simulación desde ▶ Caminar

`_sessionMetrics[]` — array paralelo a `_metrics[]`. Contiene solo las mediciones de la sesión activa. El tab Tiempos lo usa como fuente principal cuando está disponible, con fallback al histórico.

---

### DA-34 — Invalidación de clima al teletransportar (`weather.js`)

`Weather.invalidateCache()` — función pública que limpia `_weather`, `_lastFetch`, `_alertShown` y el localStorage. Se llama desde `teleportTo()` en modo teleport para que el Care strip muestre el clima de la nueva ciudad.

`Weather.refresh()` — invalida y dispara `check()` inmediato con la posición actual.

Nota: se detectó que `invalidateCache` también se dispara al dibujar waypoints en modo ruta (DT-26). Fix pendiente.

---

### DA-35 — Query Overpass ampliada para OSM Latinoamérica

La query en `fetchPOIsFromOSM()` se amplió para capturar lugares frecuentes en OSM Colombia que antes no aparecían:

```
node["building"~"cathedral|church|mosque|temple|synagogue|chapel"]
node["amenity"~"...arts_centre|library|university|college"]
node["leisure"~"park|garden|stadium"]
node["man_made"~"monument|memorial|statue|tower"]
node["shop"~"mall"]
way["building"~"cathedral|church|..."]
way["leisure"~"park|garden|stadium"]
way["amenity"~"university|college|theatre|cinema"]
```

`OSM_CATEGORIES` ampliado con 15 tipos nuevos: `cathedral`, `chapel`, `mosque`, `temple`, `memorial`, `statue`, `theatre`, `cinema`, `arts_centre`, `library`, `university`, `college`, `stadium`, `park`, `mall`.

---

### DA-3 actualizada — Funciones únicas (v0.7s · Sesión 12)

| Función | Archivo | Nota |
|---------|---------|------|
| `startTestSession()` | debug.js | nuevo — reset centralizado de sesión completa |
| `getBestVoice(lang)` | voice.js | dos pasadas: local primero, online como fallback |
| `sanitizeNarration(text)` | narration.js | nuevo — elimina markdown antes de voice |
| `invalidateCache()` | weather.js | nuevo — fuerza fetch en próxima llamada |
| `refresh()` | weather.js | nuevo — invalida + check() inmediato |
| `initFromGesture()` | music.js | ampliado — buffer de silencio real (iOS keep-alive) |

### Deuda técnica actualizada (v0.7s · Sesión 12)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-19 | 4 MP3 de intro por narrador (Alta — DT-19 es el mayor gap de experiencia hoy) | Alta |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 en arranque — endpoint /weather sin key configurada | Baja |
| DT-22 | `visited = true` al completar narración, no al activar POI | Alta |
| DT-23 | Cola narrativa — POIs encolados durante narración, no perdidos | Alta |
| DT-24 | Cache agresivo Overpass — priorizar IndexedDB en sesión activa | Alta |
| DT-25 | Backoff Overpass — esperar 30-60s después de 429 | Alta |
| DT-26 | Weather.invalidateCache() en modo ruta — solo debe dispararse en teleport | Media |
| DT-27 | clearCache() en debug.js no recarga la página — estado inconsistente | Media |

---

*Follower — Arquitectura v0.7s | Sesión 12 | 25 Junio 2026*

---

## Auditoría quirúrgica poi.js — v0.7s (26 Junio 2026)

### DA-36 — Content-Type obligatorio en POST a Overpass

Todo fetch a Overpass debe incluir `Content-Type: application/x-www-form-urlencoded`. Sin este header, bajo carga los mirrors ignoran el body silenciosamente y devuelven `elements: []` con HTTP 200.

```javascript
fetch(mirrorUrl, {
  method:  'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body:    `data=${encodeURIComponent(query)}`,
  signal:  controller.signal
})
```

Este es el patrón correcto para todos los futuros fetches a Overpass en el proyecto.

---

### DA-37 — Sintaxis `nwr` para queries Overpass

`nwr` (node + way + relation) reemplaza las cláusulas `node`/`way` separadas. Una sola pasada por el dataset en lugar de N pasadas independientes. Reducción de tiempo de servidor ~3x bajo carga.

```
// Patrón incorrecto (lento)
node(around:R,LAT,LNG)["historic"];
way(around:R,LAT,LNG)["historic"];

// Patrón correcto (rápido)
nwr(around:R,LAT,LNG)["historic"];
```

`relation` está incluido automáticamente — captura áreas OSM como parques y plazas que solo existen como relaciones.

---

### DA-38 — Cache IndexedDB particionado por proximidad geográfica

`loadPOIsFromDB()` devuelve todos los POIs del store. Sin filtro, una sesión en Madrid cargaba 601 POIs de Cali como fallback.

El filtro se aplica en `loadPOIs()` antes de asignar a `_pois`:

```javascript
const CACHE_RADIUS_M = CONFIG.FETCH_RADIUS_KM * 1500;
const nearby = cached.filter(p =>
  GPS.distanceMeters(lat, lng, p.lat, p.lng) <= CACHE_RADIUS_M
);
```

No requiere cambios en el schema de IndexedDB. Los POIs de otras ciudades permanecen almacenados y se activan si el usuario regresa a esa ciudad.

Radio del filtro: `FETCH_RADIUS_KM × 1500` (3km para FETCH_RADIUS_KM=2) — 50% de margen sobre el radio de fetch para no descartar POIs en los bordes.

---

### DA-39 — Sistema de mirrors Overpass con fallback automático

Tres mirrors en orden de prioridad. Si uno falla (429, 504, timeout, error de red), el siguiente se prueba automáticamente. Timeout de 20s por mirror via `AbortController`.

```javascript
const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',  // más estable
  'https://overpass-api.de/api/interpreter',         // oficial
  'https://lz4.overpass-api.de/api/interpreter',     // último recurso
];
```

Tiempo máximo total: 20s × 3 = 60s. Antes: un solo mirror bloqueaba hasta 131s.

Si todos los mirrors fallan → `throw` → `loadPOIs()` cae al cache geográfico (DA-38).

Si Overpass devuelve HTTP 200 con `elements: []` → se trata como fallo del servidor (no como zona sin POIs) → mismo path al cache.

---

### Deuda técnica actualizada (v0.7s · Sesión 13)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-19 | 4 MP3 de intro por narrador | Alta |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 en arranque — endpoint /weather sin key configurada | Baja |
| DT-22 | `visited = true` al completar narración, no al activar POI | Alta |
| DT-23 | Cola narrativa — POIs encolados durante narración, no perdidos | Alta |
| DT-25 | Backoff Overpass — esperar 30-60s después de 429 | Media |
| DT-26 | Weather.invalidateCache() en modo ruta — solo debe dispararse en teleport | Media |
| DT-27 | clearCache() en debug.js no recarga la página — estado inconsistente | Media |
| DT-28 | Verificar que `nwr` no supera el cap de 80 POIs en ciudades muy densas | Baja |
| ~~DT-24~~ | ~~Cache agresivo Overpass~~ — resuelto: filtro geográfico + raw=0 como fallo | — |

---

*Follower — Arquitectura v0.7s | Sesión 13 | 26 Junio 2026*

---

## Experimento Wikipedia + Decisión POI — v0.8 (26 Junio 2026)

### DA-40 — Wikipedia GeoSearch como fuente primaria de POIs

**Decisión:** Wikipedia GeoSearch reemplaza a Overpass como fuente primaria de POIs en Follower v0.8. Overpass se mantiene como fallback. IndexedDB cache geográfico como último recurso.

**Orden de resolución en `loadPOIs()`:**
```
1. Wikipedia GeoSearch (~300ms, 99.9% uptime)
2. Overpass OSM        (8-60s, ~30% fallo en producción)
3. IndexedDB cache     (<10ms, datos de sesiones anteriores filtrados por proximidad)
```

**Justificación de producto:**
Un lugar con artículo en Wikipedia es, por definición, un lugar que alguien consideró suficientemente notable para documentar. Ese es exactamente el filtro editorial que Follower necesita. Wikipedia no devuelve buzones ni bancos — devuelve lugares que merecen ser narrados. La pregunta "¿tiene artículo en Wikipedia?" es un filtro de relevancia narrativa mejor que cualquier combinación de tags OSM.

**Justificación técnica:**
Overpass público demostró ser indefendible como fuente primaria: timeouts de 131s, mirrors que colapsan simultáneamente, respuestas vacías con HTTP 200, sin SLA. Wikipedia: ~300-500ms, infraestructura Wikimedia con 99.9%+ uptime, GET simple sin autenticación, CORS habilitado con `origin=*`, sin límites de rate agresivos, completamente gratuita.

**Validación de campo:**
Madrid, Calle de Alcalá — `Wikipedia: 50 POIs en 513ms`. Lugares narrados: Lhardy (1839), Café Universal, Real Gabinete de Historia Natural, Real Casa de la Aduana. TTF: <1s desde cache, estimado <30s desde sesión limpia.

---

### DA-41 — Schema de POI unificado entre providers

El objeto POI tiene un schema canónico que todos los providers deben respetar. Wikipedia produce un subconjunto compatible:

```javascript
{
  id:          `wiki_${pageid}`,    // identificador único por fuente
  name:        title,               // nombre canónico de Wikipedia
  lat, lng,                         // coordenadas directas del geosearch
  icon:        '🏛️',               // genérico en v0.8 — mejorar con Wikidata en v0.9
  type:        'historic',          // genérico en v0.8
  description: '',                  // no disponible en geosearch básico
  tags:        {},                  // sin tags OSM — QuickFacts muestra distancia y tipo
  visited:     false,
  cachedAt:    Date.now(),
  _source:     'wikipedia',         // metadato de diagnóstico — no afecta consumers
}
```

`_source` permite al debugger distinguir el origen de los POIs en los logs. Ningún módulo downstream lo usa — es transparente para detectPOI, activatePOI, renderAllMarkers y Narration.

---

### DA-42 — Estrategia de providers: experimento antes de arquitectura

Principio establecido: **no refactorizar la arquitectura hasta validar la hipótesis**.

v0.8 implementa Wikipedia como función privada `fetchWikipediaPOIs()` dentro de `poi.js` — sin nuevos archivos, sin Provider Layer, sin OverpassProvider.js. Si Wikipedia valida en tres ciudades (Madrid, Barcelona, Cali), entonces v0.9 puede formalizar la arquitectura de providers.

La separación en archivos distintos (`providers/wikipedia.js`, `providers/overpass.js`) es sobreingeniería prematura para un proyecto sin bundler. El beneficio de organización no justifica el riesgo de regresión y la complejidad de carga de scripts.

---

### DA-43 — Wikipedia en español como idioma primario para LATAM

`fetchWikipediaPOIs()` usa `es.wikipedia.org` por defecto y `en.wikipedia.org` solo cuando `AppState.lang === 'en'`. Para ciudades latinoamericanas, la cobertura en Wikipedia en español es mejor que en inglés para lugares locales.

Cobertura esperada por región:
- Ciudades europeas turísticas: excelente en ambos idiomas
- Cali, Medellín, Bogotá centro: buena en es.wikipedia.org
- Ciudades secundarias LATAM: variable — Overpass como fallback cubre los gaps

---

### Deuda técnica actualizada (v0.8 · Sesión 14)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Bookmark y share (Web Share API) | Baja |
| DT-19 | 4 MP3 de intro por narrador | Alta |
| DT-20 | Test en campo con brújula real — iOS DeviceOrientation | Alta |
| DT-21 | Worker 400 en arranque — endpoint /weather sin key | Baja |
| DT-22 | `visited = true` al completar narración, no al activar | Alta |
| DT-23 | Cola narrativa — POIs encolados durante narración | Alta |
| DT-25 | Backoff Overpass — esperar 30-60s después de 429 | Media |
| DT-26 | Weather.invalidateCache() en modo ruta — solo en teleport real | Media |
| DT-27 | clearCache() en debug.js no recarga la página | Media |
| DT-28 | Verificar cap de 80 POIs con nwr en ciudades densas | Baja |
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico de Cali | Alta |
| DT-30 | Confirmar TTF con Wikipedia desde sesión nueva sin cache | Alta |
| DT-31 | Mejorar type/icon de POIs Wikipedia con categorías Wikidata | Baja |
| ~~DT-24~~ | ~~Cache agresivo Overpass~~ — resuelto: Wikipedia primaria + filtro geográfico | — |

---

*Follower — Arquitectura v0.8 | Sesión 14 | 26 Junio 2026*

---

## Sprint S2 — v0.8 (26 Junio 2026)

### DA-44 — visited = true al completar narración, no al activar

**Decisión:** `poi.visited = true` se marca en el callback de `Voice.speak()`, no en `activatePOI()`.

**Razón:** marcar visited al activar quemaba el POI antes de que el usuario recibiera la narración. Cualquier interrupción — error de voz, salida del radio, error de red, iOS suspendiendo el AudioContext — dejaba el POI marcado como visitado aunque nunca se narrara.

**Implementación:**

```javascript
// poi.js — activatePOI(): visited removido de aquí
// narration.js — Voice.speak() callback:
if (poi && !poi.visited) {
  poi.visited = true;
  AppState.poisVisited++;
  if (typeof updateStats === 'function') updateStats();
}
```

**Invariante establecida:** `AppState.poisVisited` solo incrementa cuando `Voice.speak()` completó. Si la narración se interrumpe, el POI vuelve a estar disponible en la próxima detección GPS.

---

### DA-45 — Cola narrativa básica

**Decisión:** POIs detectados durante una narración activa entran a una cola con TTL y validación de proximidad al procesar. No se ignoran ni se narran inmediatamente.

**Parámetros de la cola:**
```javascript
QUEUE_MAX_SIZE = 3       // máximo entradas simultáneas
QUEUE_TTL_MS   = 240000  // 4 minutos por entrada
RADIO_VALIDACION = 180m  // activeRadius × 1.5 al procesar
```

**Flujo de la cola:**
```
detectPOI() → Narration.isNarrating() → enqueuePOI(poi)
Voice.speak() onEnd → POI.processQueue()
processQueue() → filtrar expirados → verificar distancia actual
               → dentro de 180m → activatePOI()
               → fuera de 180m  → descartar, probar siguiente
```

**Regla de descarte en enqueuePOI:**
- Duplicado del mismo POI → ignorar
- POI ya visitado → ignorar
- Cola llena (>3) → descartar el más antiguo (FIFO), agregar nuevo

**Integración con DA-44:** `processQueue()` solo activa POIs no visitados. Como visited se marca al completar (DA-44), los POIs de la cola que fueron activados pero interrumpidos siguen disponibles.

**API pública:** `POI.processQueue()` expuesto para que `narration.js` lo llame sin acoplamiento directo al estado interno.

---

### DA-46 — Música de placeholder con Web Audio API (DT-19 desbloqueado)

**Decisión:** En ausencia de archivos MP3, `music.js` genera un tono sintético de 2.5s usando `OscillatorNode` del Web Audio API en lugar de fallar silenciosamente.

**Frecuencias por narrador:**
```javascript
historian:   220 Hz  // La2 — tono sobrio, académico
local:       294 Hz  // Re3 — tono cálido, cercano
storyteller: 261 Hz  // Do3 — tono narrativo, neutro
explorer:    330 Hz  // Mi3 — tono curioso, activo
```

**Razón de la elección sobre placeholder MP3:**
- Sin dependencia de archivos externos
- Sin cambios cuando lleguen los MP3 definitivos — el sistema los usará automáticamente
- Permite validar el sistema de música en campo (AudioContext, volumen, timing)
- Diferenciación auditiva por narrador desde el primer día

**Ruta de migración a MP3 definitivos:** cero cambios de código. Cuando `loadTrack(url)` tenga éxito, el oscilador no se ejecuta. Los MP3 pueden agregarse en cualquier momento.

---

### Deuda técnica actualizada (v0.8 · Sesión 15)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js deshabilitado antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI de commits históricos | Alta |
| DT-10 | IndexedDB "connection is closing" Safari | Media |
| DT-12 | Atribución CARTO/OSM | Baja |
| DT-16 | Pantalla POI expandida | Media |
| DT-17 | Bookmark y share | Baja |
| DT-19 | MP3 definitivos 4 narradores (tono sintético como placeholder activo) | Media |
| DT-20 | Test en campo con brújula real — iOS | Alta |
| DT-21 | Worker 400 en arranque | Baja |
| DT-25 | Backoff Overpass 30-60s después de 429 | Media |
| DT-26 | Weather.invalidateCache en modo ruta — solo en teleport | Media |
| DT-27 | clearCache() sin reload de página | Media |
| DT-28 | Cap 80 POIs con nwr en ciudades densas | Baja |
| DT-29 | Cobertura Wikipedia Cali — confirmado ✅ | — |
| DT-30 | TTF desde sesión nueva sin cache previo | Alta |
| DT-31 | Mejorar type/icon POIs Wikipedia con Wikidata | Baja |
| DT-32 | Confirmar cola narrativa en prueba de campo real | Alta |
| DT-33 | MP3 definitivos 4 narradores (reemplazar tono sintético) | Media |
| DT-34 | Cooldown mínimo entre narraciones — evaluar post prueba de campo | Media |
| ~~DT-22~~ | ~~visited = true al activar~~ — resuelto: movido al callback de voz | — |
| ~~DT-23~~ | ~~Sin cola narrativa~~ — resuelto: cola básica implementada | — |
| ~~DT-24~~ | ~~Cache agresivo Overpass~~ — resuelto: Wikipedia + filtro geográfico | — |

---

*Follower — Arquitectura v0.8 | Sesión 15 | 26 Junio 2026*

---

## Sprint S2 continuación — v0.8 (27-28 Junio 2026)

### DA-47 — Contexto del entorno en prompts de narración

`buildContext(lang)` en `narration.js` calcula distancias GPS en tiempo real y construye una lista de hasta 8 POIs cercanos en 600m para incluir en cada prompt.

```javascript
const withDist = allPOIs
  .map(p => ({ name: p.name, dist: GPS.distanceMeters(lat, lng, p.lat, p.lng) }))
  .filter(p => p.dist <= 600)
  .sort((a, b) => a.dist - b.dist)
  .slice(0, 8);
```

Envuelto en try/catch — nunca debe interrumpir `trigger()`. Los 8 user prompts actualizados: cada narrador recibe el contexto del entorno y tiene instrucción de usarlo para el ángulo más memorable, no solo el POI activado.

Uso de distancia en tiempo real (no `_distanceMeters` cacheado) porque los POIs de Wikipedia tienen `_distanceMeters=null` hasta que `detectPOI()` los procesa en el siguiente tick.

---

### DA-48 — Wikipedia en idioma local por coordenadas geográficas

`fetchWikipediaPOIs()` detecta el idioma local según las coordenadas antes de consultar Wikipedia:

```javascript
if (lt > 36 && lt < 42 && ln > -10 && ln < -6)  return 'pt'; // Portugal
if (lt > 41 && lt < 52 && ln > -5 && ln < 10)   return 'fr'; // Francia
if (lt > 36 && lt < 48 && ln > 6  && ln < 19)   return 'it'; // Italia
if (lt > 36 && lt < 44 && ln > -6 && ln < 5)    return 'es'; // España
if (lt > -34 && lt < 6 && ln > -80 && ln < -34) return 'pt'; // Brasil
```

Loop: si el primer idioma devuelve <10 POIs, intenta el siguiente (es → en). Deduplicación por coordenadas aproximadas entre idiomas. Validado: Lisboa 37 POIs, Barcelona 41 POIs, Cali 37 POIs.

---

### DA-49 — _visitedInSession: memoria de narración entre recargas de POIs

`_visitedInSession = new Set()` en `poi.js` persiste entre recargas de `_pois[]`. Cuando `resetPOIs()` crea objetos POI frescos, el Set restaura `visited=true` en los que ya fueron narrados en la sesión.

```javascript
// Al cargar POIs (Wikipedia/Overpass/cache):
pois.forEach(p => {
  if (_visitedInSession.has(p.id)) p.visited = true;
});

// Al completar narración (narration.js callback):
POI.markVisited(poi.id);

// Al iniciar nueva sesión (startTestSession + initExplore):
POI.resetVisited();
```

Sin este mecanismo, cada `resetPOIs()` olvidaba qué había sido narrado y los POIs se repetían.

---

### Deuda técnica actualizada (v0.8 · Sesión 16)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker | Alta |
| DT-8 | debug.js deshabilitado antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI de commits históricos | Alta |
| DT-19 | MP3 definitivos 4 narradores | Media |
| DT-20 | Test en campo con brújula real — iOS | Alta |
| DT-25 | Backoff Overpass 30-60s | Media |
| DT-26 | Weather.invalidateCache en modo ruta | Media |
| DT-33 | MP3 definitivos (tono sintético activo mientras tanto) | Media |
| DT-34 | Cooldown mínimo entre narraciones — evaluar post campo | Media |
| DT-35 | BUG-036 iOS voz silenciosa — logs de diagnóstico pendientes | Crítica |
| DT-36 | Limpiar nombres POIs Wikipedia antes del prompt | Alta |
| DT-37 | Confirmar buildContext llega a Claude en narraciones | Alta |
| DT-38 | Chequeo inmediato al cargar POIs — reducir TTF | Media |
| ~~DT-22~~ | visited on complete — resuelto S2-A1 | — |
| ~~DT-23~~ | Cola narrativa — resuelta S2-A2 | — |
| ~~DT-24~~ | Cache agresivo — resuelto Wikipedia + filtro geográfico | — |
| ~~DT-29~~ | Cobertura Wikipedia Cali — confirmada | — |
| ~~DT-30~~ | TTF desde sesión nueva — confirmado <90s | — |

---

*Follower — Arquitectura v0.8 | Sesión 16 | 27-28 Junio 2026*





## Sprint S3 — Narrador único, Care con voz propia, ciudad sonora — v0.9 (30 Junio 2026)

> Sesión de definición pura — sin código implementado todavía. Esta sección
> documenta las decisiones de arquitectura acordadas a partir de tres
> documentos fundacionales nuevos: `manifiesto_narrativo.md`,
> `prompt_maestro_follower.md` (v2.7 oficial) y `manifiesto_care_strip.md`.

---

### DA-50 — Narrador único reemplaza los 4 estilos (DA-17 derogada)

**Decisión:** `STYLE_PROMPTS` (4 narradores × 2 idiomas) se elimina por completo.
Un solo system prompt — el Prompt Maestro v2.7 — define la voz de Follower.
Los cuatro registros anteriores (storyteller, historian, explorer, local) no
desaparecen como *capacidades*: el narrador único los absorbe implícitamente,
eligiendo el ángulo según el POI, no según una preferencia de configuración.

**Impacto en archivos:**

| Archivo | Cambio |
|---------|--------|
| `narration.js` | `STYLE_PROMPTS` → prompt único `es`/`en`. `style` sale de `trigger()`, `buildPrompt()`, claves de caché |
| `config.js` | `narrator` sale de `DEFAULTS`. Se eliminan `setNarrator()`, `NARRATOR_LABELS`, `getNarratorLabel()` |
| `app.js` | `AppState.narrationStyle` / `narrationStyleLabel` se eliminan. `initStyleSelector()` se elimina |
| `index.html` | Selector de narrador (style-cards) se elimina de la UI |
| IndexedDB | Clave de caché: `poiId_style_lang_topic` → `poiId_lang_topic`. Caché anterior queda huérfano (no se migra, simplemente deja de coincidir) |

**Razón:** coherencia con el manifiesto narrativo — "el narrador es un compañero
invisible... no existen cuatro personalidades intercambiables, existe una sola
voz: el amigo más culto que conoces, que nunca presume de lo que sabe."

---

### DA-51 — Prompt Maestro v2.7 con límites de tokens explícitos

**Decisión:** se adopta el Prompt Maestro v2.7 (oficial) como system prompt único,
con un techo duro de `max_tokens` que el prompt por sí solo no garantiza.

```javascript
CONFIG.max_tokens = 480   // antes: 350 (v0.7) — techo duro, no objetivo
```

**Razón del valor:** el v2.7 declara "objetivo ideal 220-280 palabras, puede
superar ligeramente cuando la complejidad lo justifique" — una regla flexible
a propósito, por calidad editorial. 480 tokens (~330-350 palabras en español)
da margen real a ese "ligeramente" sin reabrir el problema ya documentado en
Sesión 12 (S1-4): narraciones largas bloqueaban el pipeline y se perdían POIs
detectados durante la espera.

**Riesgo a vigilar en campo:** la sección "AUTOEVALUACIÓN INTERNA" del v2.7
(7 criterios de verificación antes de entregar) puede aumentar el tiempo de
respuesta de Claude de forma no cuantificada todavía. Se valida con datos
reales de latencia por llamada, comparando contra el prompt anterior (v0.7,
sin autoevaluación).

---

### DA-52 — Memoria de sesión limitada al capítulo anterior

**Decisión:** cada nueva narración recibe como contexto **solo el capítulo
inmediatamente anterior** de la caminata (idea central + recurso sensorial/sonoro
usado) — nunca el historial completo. El historial completo solo se usa una vez,
en la llamada de despedida (DA-54).

```javascript
AppState._walkChapters = []  // array de { poiId, ideaCentral, recursoSensorial, texto, ts }

// En cada trigger() nuevo:
const previo = AppState._walkChapters.at(-1) || null;
// Solo `previo` viaja en el prompt de continuidad — no el array completo
```

**Razón:** mantiene el tamaño de input constante sin importar cuán larga sea
la caminata (capítulo 8 carga lo mismo que capítulo 2), y resuelve mejor la
repetición turno-a-turno que comparar contra todo el historial (dos capítulos
consecutivos con la misma idea es lo que rompe la inmersión; repetir contra
un capítulo de hace 20 minutos es comparativamente inofensivo).

**Pendiente de diseño:** formato exacto en que Claude debe devolver
`ideaCentral` y `recursoSensorial` de forma extraíble junto al capítulo
(JSON estructurado vs. separador de texto). Sin esto, no hay de dónde sacar
los metadatos para pasarlos al siguiente capítulo.

---

### DA-53 — Eliminación de `music.js` — la ciudad sonora vive en el prompt, no en audio

**Decisión:** `music.js` se elimina por completo. No hay reemplazo de audio
generado. Lo que el v0.7 llamaba "música por mood" o "intro por narrador" se
sustituye por la sección "CIUDAD SONORA" del Prompt Maestro v2.7, que instruye
al narrador a evocar textualmente los sonidos reales del entorno (campanas,
mercados, tranvías) en vez de que la app reproduzca algo de fondo.

**Impacto en archivos:**

| Archivo | Cambio |
|---------|--------|
| `music.js` | Eliminado |
| `narration.js` | `trigger()` ya no llama a `Music.playNarratorIntro()`. La voz inicia directo tras cargar el texto |
| `app.js` | `Music.initFromGesture()` en `_unlockAudioOnFirstTap()` se elimina |
| `config.js` | si existiera algún control de volumen de música, se revisa su vigencia |

**Regla derogada:** "La narración siempre va SOBRE la música — nunca antes,
nunca sin música de fondo" (regla crítica de README/REGLAS_IA) se retira como
regla de audio. Se reemplaza por: la presencia sonora de la ciudad es
responsabilidad narrativa del prompt, no del sistema de audio.

**Deuda técnica resuelta sin implementar:** DT-19/DT-33 (4 MP3 de narrador)
quedan obsoletas — no hay narrador múltiple ni intro que producir.

---

### DA-54 — Cierre de caminata: pregunta hablada + confirmación por tap (sin botón explícito)

**Decisión:** no existe un botón "Terminar paseo" visible permanentemente.
El cierre se activa por una combinación de señales, preservando la filosofía
de manos libres:

1. **Trigger:** inactividad de movimiento prolongada, **cruzada con el estado
   de Care** — para no confundir una pausa sugerida por Care (lluvia, calor,
   cansancio) con el fin real de la caminata.
2. **Pregunta hablada** (misma voz narrativa, no un modal frío):
   *"Veo que llevas un rato sin moverte. ¿Cerramos nuestro capítulo de
   [ciudad] por hoy?"*
3. **Confirmación por tap** — UI mínima, binaria (sí/no), aparece solo en
   ese momento puntual. Se descarta interacción por voz (`SpeechRecognition`)
   para esta fase: incompatible con "teléfono en el bolsillo", soporte
   fragmentado en iOS Safari, alta tasa de error por ruido de calle. Queda
   anotada como visión a futuro, no como deuda técnica de esta versión.
4. **Si confirma** → se dispara `Narration.getFarewell()` con
   `AppState._walkChapters` completo (única vez que el historial completo
   viaja en un prompt).
5. **Si no confirma o ignora** → no hay insistencia. Vuelve a sístole normal.
6. **Reset:** cada cierre real de la app (no solo de pestaña) resetea
   `_walkChapters[]` — cada apertura nueva de Follower es una caminata nueva,
   sin estado narrativo previo. Vive solo en memoria de sesión, nunca en
   localStorage/IndexedDB.

**Pendiente de definir:** umbral exacto de minutos de inactividad antes de
considerar el cierre (a validar en campo).

**Nueva función requerida:** `Narration.getFarewell()` — no existe hoy
(solo existe `getCityWelcome()` como saludo de entrada). Construye un prompt
de despedida distinto al de capítulo normal, usando la sección DESPEDIDA del
v2.7 (explícitamente condicional: "solo cuando se solicite el cierre de una
caminata completa").

---

### DA-55 — Pausa de detección durante tránsito rápido (taxi, bus, metro)

**✅ Implementado — Sesión 19, 1 Julio 2026.** Estaba documentada desde
Sesión 17 pero sin código — se detectó y cerró en la misma sesión donde se
armó el banco de pruebas del simulador.

**Decisión:** se calcula velocidad de desplazamiento a partir de los puntos
GPS ya disponibles (distancia/tiempo entre lecturas consecutivas). Si la
velocidad sostenida supera un umbral durante una ventana mínima, se pausa la
detección activa de POIs — el GPS (`watchPosition`) nunca se detiene, solo se
suspende temporalmente la evaluación de `detectNearby()`.

```javascript
UMBRAL_VELOCIDAD = 15-18 km/h   // sostenido, no pico instantáneo
VENTANA_MINIMA   = 30-60s       // evita falsos positivos por caminata enérgica
```

**Valores implementados:** `TRANSIT_SPEED_KMH: 15` (extremo inferior del
rango, conservador — prefiere no perder POIs reales), `TRANSIT_WINDOW_MS:
45000` (45s, punto medio del rango).

**Implementación real (`gps.js`):** nueva función `_updateTransitState(lat,
lng, now)`, llamada en cada tick de `onPosition()` — sin throttle propio,
corre siempre, en el mismo punto donde ya se calculaba `updateDistance()`
usando el `_lastPos` anterior a que se sobreescriba. Mantiene un contador
`_transitSustainedStart`: si la velocidad instantánea entre dos lecturas
consecutivas supera el umbral, arranca el contador; si se sostiene 45s
seguidos, activa `_inTransitPause = true`. Cualquier lectura bajo el umbral
resetea el contador y reanuda.

El guard se aplica **solo** sobre `POI.detectNearby()` dentro del bloque
throttleado de chequeo — `Care.check()` y `Care.checkSpecialZone()` se
excluyeron deliberadamente del guard: lluvia o calor extremo tienen sentido
anunciados aunque el usuario vaya en taxi, coherente con la separación de
categorías de Care definida en DA-49 (protección real vs. bienestar).

Estado expuesto vía `GPS.isInTransit()` — usado por `debug-sim.js` para
mostrar en vivo si la pausa está activa mientras se prueba con el botón
"🚗 Auto 20km/h" del simulador.

**Razón de la decisión (vs. narrar el salto):** se descartó la alternativa de
pedirle al modelo que reconozca narrativamente una transición en vehículo.
Resolverlo en el pipeline (antes de llegar a Claude) es más simple, no añade
complejidad al prompt, y es coherente con DA-7 ("GPS nunca se interrumpe —
es el latido de la app": el latido sigue, solo se pausa la narración).

**Vive en:** nuevo guard en `gps.js` o `poi.js`, antes de `detectNearby()`.
No toca `narration.js` ni el prompt maestro.

**Riesgo a vigilar:** falsos positivos en caminatas rápidas o trote cuesta
abajo — de ahí la ventana mínima de 30-60s sostenidos, no un solo pico.

---

### DA-56 — Splash mínimo + bienvenida de ciudad como pantalla de carga real (reemplaza DA-?? city welcome overlay)

**Decisión:** se rediseña el flujo de arranque. Hoy es:
`splash (corazón) → explore (mapa) → welcomeCity() superpuesto, auto-cierra a 5s`.

Pasa a ser:
`splash mínimo (logo, mientras carga GPS) → pantalla de bienvenida animada
(haciendo de pantalla de carga real de POIs) → explore`.

**Idioma del saludo — cambio de criterio:** el saludo ya no usa
`Config.get('lang')` (idioma del usuario). Usa el **idioma local de la
ciudad detectada**, resuelto vía una tabla simple país→idioma a partir del
`country_code` que ya devuelve el reverse geocoding en `gps.js`.

```javascript
// Ejemplo de tabla — extensión de la lógica ya usada en DA-48
COUNTRY_LANG = { CO: 'es', US: 'en', PT: 'pt', JP: 'ja', ... }
```

Aceptado como simplificación consciente: casos ambiguos (Bruselas, Barcelona,
Montreal) no se resuelven con precisión en esta versión — se refina con
evidencia de campo si hace falta.

**Animación:** texto tipo "Hola Cali" / "Hello Atlanta" dibujado letra por
letra, en el idioma resuelto arriba. Debe coincidir en duración con la carga
real de POIs (Wikipedia GeoSearch, normalmente <1s según datos de campo ya
confirmados en DA-48).

**Fallback:** si GPS o geocoding tardan más de lo esperado, se usa el saludo
genérico ya existente ("Tu ciudad te espera" / "Your city awaits"), en el
idioma del **usuario** (`Config.get('lang')`) — no se omite la pantalla.

**Impacto en archivos:**

| Archivo | Cambio |
|---------|--------|
| `app.js` | `runSplash()` se acorta. `welcomeCity()` deja de ser overlay opcional — se vuelve parte bloqueante del flujo de entrada |
| `narration.js` | `getCityWelcome(city, style, lang)` pierde el parámetro `style` (ya no aplica, DA-50). Cambia de qué idioma recibe — ya no es `AppState.lang`, es el idioma resuelto de la ciudad |
| `gps.js` | expone o reutiliza `country_code` ya disponible en el reverse geocoding para alimentar la tabla país→idioma |

---

### DA-57 — Care Strip con voz generativa (deroga el sistema de `MESSAGES` estáticos)

**✅ Implementado — Sesión 19 (continuación), 1 Julio 2026.** El alcance
real terminó siendo mayor al descrito abajo: 7 triggers en vez de 5 (se
sumaron `rain` y `thirst`, ver DA-64/DA-65), y `special` usa POIs de
Wikipedia ya cargados en vez de Overpass. `getCareMessage(type, places,
ctx)` implementada en `narration.js`, `care.js` reescrito por completo.
Detalle de implementación completo en `docs/dt42_care_miniprompt.md` v2.

**Decisión:** `care.js` deja de usar plantillas de texto fijas
(`MESSAGES.tired`, `.hot`, `.cold`, `.lunch`). Cada sugerencia se genera vía
una **única llamada a Claude** que hace dos cosas a la vez:

1. Selecciona, entre 3-5 candidatos que ya trae Overpass, cuál lugar "se
   siente más propio del lugar" (criterio editorial, no popularidad/rating)
2. Redacta el mensaje de la sugerencia, con la misma voz narrativa del
   Prompt Maestro — no un segundo narrador, no un sistema separado

**Decisión técnica explícita:** se descarta sumar un proveedor con rating
(Foursquare u otro). Razones: (a) fricción de API key/billing que el proyecto
ya evitó conscientemente con Gemini/OpenAI; (b) un rating de popularidad mide
exactamente lo opuesto al criterio editorial que pide el manifiesto de Care
("un café tradicional puede ser más valioso que el más famoso"). Se mantiene
el stack actual — Overpass como fuente de candidatos, Claude como criterio
de selección.

```javascript
// Antes (v0.7):
MESSAGES.tired.es(km) → string fijo interpolado

// Después (v0.9):
Narration.getCareMessage(type, candidatos, contextoCiudad)
  → { lugarElegido, mensaje }   // una sola llamada, mismo "yo" narrativo
```

`max_tokens` bajo para esta llamada (mensaje corto: título + 1-2 frases, no
narración completa de capítulo).

**Nuevo trigger — "momentos memorables" (categoría que no existía):**
densidad de POIs en un radio pequeño (~150m) como proxy de "zona especial"
(plaza, centro histórico), calculado localmente sobre los POIs de Wikipedia
GeoSearch ya cargados — sin llamadas de red adicionales. Extiende el
aprendizaje ya documentado ("Wikipedia como filtro editorial") a una lectura
de densidad, no solo de existencia individual del POI.

**Regla de "momento correcto" — sin timers fijos:**
se descarta un margen de gracia por tiempo fijo (60-90s tras narración).
En su lugar, Care se divide en dos categorías de trigger:

- **Bienestar/contemplación** (cansancio, almuerzo, atardecer, zona especial)
  → esperan a que el usuario retome el movimiento real (GPS) después de
  cualquier narración, antes de evaluar.
- **Protección real** (lluvia inminente, calor/frío extremo) → pueden
  anunciarse aunque el usuario siga detenido — ahí Care cumple su función
  más básica de cuidado, no compite por atención con un momento narrativo.

**Pendiente de diseño:** redacción del mini-prompt de Care (versión corta del
Prompt Maestro, mismo "yo", intención de hospitalidad en vez de narración).
Se resuelve en sesión de redacción de prompts.

---

### Resumen de archivos afectados — Sprint S3

| Archivo | Tipo de cambio |
|---------|-----------------|
| `narration.js` | Mayor — prompt único v2.7, memoria de un capítulo, `getFarewell()`, `getCareMessage()` nuevas, `max_tokens` 480 |
| `config.js` | Eliminar `narrator` y funciones asociadas |
| `music.js` | Eliminado |
| `app.js` | Flujo de splash/bienvenida rediseñado, lógica de cierre de caminata (señal + pregunta + tap), eliminar referencias a `Music` y a estilo de narrador |
| `care.js` | Mayor — de `MESSAGES` estáticos a generación vía Claude, nuevo trigger de densidad de POIs, regla de momento correcto sin timers |
| `gps.js` / `poi.js` | ✅ Implementado (Sesión 19) — guard de velocidad `_updateTransitState()` en gps.js, pausa solo `detectNearby()` |
| `index.html` | Eliminar selector de narrador |
| IndexedDB | Clave de caché de narraciones sin `style` |

**Sin cambios:** `voice.js`, `weather.js`, `routes.js`, `debug.js`,
`debug-sim.js` — el pipeline de detección/voz/debug no se toca en este sprint.

---

### Deuda técnica nueva (v0.9 · Sprint S3)

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-39 | Definir formato de extracción de metadatos (idea central + recurso sensorial) en cada respuesta de Claude | Alta |
| DT-40 | Definir umbral exacto de minutos de inactividad para disparar pregunta de cierre | Alta |
| DT-41 | Tabla país→idioma para saludo de ciudad — cobertura inicial de países prioritarios | Alta |
| DT-42 | Redactar mini-prompt de Care (voz de hospitalidad, corto, mismo "yo") | Media |
| DT-43 | Definir umbral de densidad de POIs (cuántos en cuántos metros) para trigger de "zona especial" | Media |
| DT-44 | Medir en campo si la autoevaluación interna del v2.7 incrementa latencia de forma significativa | Alta |
| DT-45 | Diseño de UI: pantalla de bienvenida animada (splash mínimo + texto letra por letra) | Alta |
| DT-46 | Diseño de UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración tipo Organiza2 (reemplaza modal único actual) | Media |

### Deuda técnica derogada — ya no aplica con narrador único / sin música

| ID | Descripción |
|----|-------------|
| ~~DT-19~~ | 4 MP3 de intro por narrador — obsoleto, no hay narrador múltiple ni música |
| ~~DT-33~~ | MP3 definitivos (reemplazar tono sintético) — obsoleto, `music.js` eliminado |

---

*Follower — Arquitectura v0.9 | Sprint S3 | 30 Junio 2026*

---

### DA-58 — Formato de memoria de capítulo (DA-52 implementada)

**Decisión:** el texto completo del capítulo anterior se inyecta en el user
message de cada nueva narración. No se hace una llamada de extracción separada.

```
Capítulo anterior — {poi_name}:
{texto_completo}

---

Estoy en "{poi_name}" en {city}. Escribe el capítulo de este lugar.
{context}
```

**Razón:** el v2.7 ya sabe identificar idea central y recurso sensorial desde
el texto — "Antes de escribir, identifica: la idea central, el recurso
sensorial o sonoro utilizado." Una extracción separada costaría ~130 tokens
en una segunda llamada; pasar el texto completo cuesta ~350 tokens extra pero
elimina un punto de falla y latencia adicional. A precio de Haiku: diferencia
de ~$0.000055 por narración — irrelevante.

**Storage:** `AppState._walkChapters[]` — array de `{ poiId, poiName, text,
ts }`. Solo se almacenan capítulos reales (`source !== 'fallback'`). El
historial completo solo se usa en la despedida final (DA-54 — pendiente).

---

### DA-59 — Idioma local para bienvenida de ciudad

**Decisión:** la frase de bienvenida se pronuncia en el idioma local de la
ciudad detectada, no en el idioma del usuario. Simplificación consciente:
ciudades multilingües (Bruselas, Montreal, Barcelona) usan el idioma principal
del país.

**Implementación:** `COUNTRY_LANG` en `narration.js` — 35+ códigos ISO 3166-1
alpha-2 → idioma BCP-47. `getLocalLang(countryCode)` expuesto en API pública.
`AppState.countryCode` almacenado cuando Nominatim responde en `gps.js`.
`CITY_WELCOME` expandido de 2 a 18 idiomas.

---

### DA-60 — Detección de inactividad para posible cierre de caminata

**Decisión:** movimiento < 30m en 10 minutos con ≥ 500m caminados → disparar
`onWalkInactivity()`. El handler no actúa si `phase === 'rest'` (pausa de
Care intencional) ni si `phase === 'diastole'` (narración en curso).

**Estado actual:** `onWalkInactivity()` solo loguea. La pregunta hablada del
narrador y la confirmación por tap (DA-54 / DT-45/46) bloquean la
implementación completa.

---

### DA-61 — Zona especial: trigger por densidad de POIs Wikipedia

**Decisión:** ≥ 3 POIs en radio de 150m → trigger "zona especial" en Care.
Reset al alejarse > 200m desde el punto de disparo. Calculado localmente
sobre `POI.getPOIs()` — sin llamadas de red adicionales.

**Mensaje actual:** placeholder estático en `MESSAGES.special`. Será
reemplazado por Care generativo (DA-57 / DT-42) cuando el mini-prompt esté
validado en campo.

---

### Resumen de archivos — Sesión 18

| Archivo | Cambios |
|---------|---------|
| `narration.js` | DA-50 completo + DT-36 + DT-39 (prevBlock) + DT-41 (COUNTRY_LANG, CITY_WELCOME×18, getLocalLang) |
| `config.js` | DA-50: narrator eliminado de config |
| `app.js` | DA-50: narrationStyle eliminado + DT-39 (_walkChapters) + DT-40 (onWalkInactivity) + DT-41 (countryCode, localLang) |
| `index.html` | DA-50: selectores de narrador eliminados |
| `music.js` | DA-50: stub vacío |
| `poi.js` | DT-38: _pendingDetect + _flushPendingDetect() |
| `debug.js` | DT-26: Weather.invalidateCache() removido de startTestSession() |
| `gps.js` | DT-40: inactividad tracking + DT-41: countryCode + Care.checkSpecialZone() |
| `care.js` | DT-43: checkSpecialZone() + MESSAGES.special placeholder |
| `sw.js` | v2 (DA-50) → v3 (DT-39/40/41/43) |
| `docs/dt42_care_miniprompt.md` | DT-42: prompt de Care redactado, listo para implementar |

---

### DA-62 — Debug panel consolidado a 3 tabs (Simular / POIs / Logs)

**Decisión:** las tabs Estado, Tiempos y 🎬 (Score) se sacan de la barra
visible de `debug.js`. No se borran — sus funciones de render y los datos
que alimentan (`_metrics`, `_exp`) siguen vivos, solo dejan de tener botón
propio. Siguen alcanzables por link directo (`Debug.switchTab('timing')`,
usado desde la rhythm card de Simular) para consulta puntual sin volver a
mostrarlas en la barra.

**Razón:** uso diario del panel es casi exclusivamente simulación (moverse,
cargar POIs, probar Care) — Estado/Tiempos/Score son vistas de análisis que
se consultan rara vez y competían por espacio visual sin aportar al flujo
principal. El dato no se pierde: `exportLog()` ya arma un reporte único con
tiempos y score completos independientemente de si hay tab visible.

**Cambios de `debug.js`:**
- Barra reducida a `POIs` (antes "Buscar") y `Logs` — Simular sigue
  registrándose aparte vía `Debug.registerTab()` desde `debug-sim.js`
- Un solo botón de exportar, en Logs — eliminado de los 4 lugares donde
  estaba duplicado (Estado, Tiempos ×2 estados, 🎬)
- `renderSearch()`: ordena por `_distanceMeters` (ya existía el dato, no se
  usaba para ordenar), muestra 20 resultados en vez de 8, auto-refresco cada
  1.5s salvo que el input de filtro tenga foco

**Cambios de `debug-sim.js`:**
- Botón "🚗 Auto 20km/h" agregado a la fila de velocidad — sirve para
  validar DA-55 en el momento, con indicador en vivo (`GPS.isInTransit()`)
- 4 utilidades movidas desde la extinta tab Estado: recargar POIs, test de
  narración, verificar Worker, limpiar cache
- 5 botones de test de Care (`Care._testTrigger()`, ver DA-63) — colocados
  en el cuerpo fijo del tab, no en la rhythm card, porque esa card solo
  aparece después de la primera narración y hubiera bloqueado probar Care
  justo en el momento más útil (recién llegado a una ciudad nueva)

---

### DA-63 — `Care._testTrigger()`: forzar triggers de Care sin condiciones reales

**Decisión:** nueva función en `care.js`, exclusiva para testing desde el
simulador. Bypasea `checkCareContext()` por completo — no respeta cooldown
de 20 min, clima real ni hora real — y llama `triggerSuggestion(type, lang,
valorDePrueba)` directo con un valor razonable por tipo (32°C calor, 3°C
frío, 2.5km cansancio, 4 POIs zona especial).

**Por qué no reusar `Care.check()`:** ese es el flujo real, con todos los
filtros — perfecto para producción, inútil para probar los 5 triggers en
ráfaga y medir latencia. `_testTrigger()` es deliberadamente un atajo de
testing, nunca debe llamarse desde código de producción.

**Vigencia de esta implementación:** al momento de crear `_testTrigger()`
disparaba los mensajes estáticos de `MESSAGES` — Care generativo (DT-42)
se implementó más tarde, en la misma sesión (ver DA-57 actualizada). El
mismo botón siguió funcionando sin cambios una vez que `triggerSuggestion()`
pasó a llamar `Narration.getCareMessage()` — el cableado de testing fue
deliberadamente independiente de qué había detrás.

---

### DA-64 — Ampliación de Care a 7 triggers: `thirst` nuevo, `sunset` descartado

**Decisión:** revisión completa de los triggers de Care contra el manifiesto
(`manifiesto_care_strip.md`) antes de implementar DT-42, para no tener que
tocar `narration.js` dos veces.

**`thirst` (sed/hidratación) — nuevo, estructuralmente distinto al resto:**

```javascript
THIRST_TEMP_MIN: 22   // banda inferior — por debajo no hace sentido
THIRST_TEMP_MAX: 29   // banda superior — por encima ya es 'hot' (30)
THIRST_MIN_KM:   1.2  // menor que MIN_KM_FOR_REST (2.0) — adelanta el aviso
```

No usa `findNearbyRestPlace()` — no hay candidatos, no hay `places_list` en
el prompt, la card muestra un solo botón de cierre en vez del par
"Ir aquí / Seguir igual". Se dispara **una sola vez por caminata**
(`_thirstShownThisWalk`), no por el cooldown estándar de 20 min — reseteado
junto con `AppState._walkChapters` (mismo ciclo de vida que DA-58).

**Iteración de diseño documentada:** la primera versión (calor moderado +
distancia, sin límite de frecuencia) se descartó al notar que en climas
como Cali, 22-29°C es el estado normal del día — el trigger dispararía en
casi toda caminata, rompiendo "el caminante nunca debe sentir que una
máquina le está dando instrucciones". El límite de una vez por caminata
resolvió el problema sin perder el valor del recordatorio.

**`sunset` (atardecer) — evaluado y descartado.** Sin datos de elevación o
línea de vista, un trigger basado solo en hora sugeriría un atardecer con
la vista tapada por edificios la mayoría de las veces en un centro urbano
denso. Rompe el principio de "solo lo verificable" del Prompt Maestro.
Queda anotado como posible visión futura si se suma alguna fuente de datos
de elevación — no es deuda técnica de esta versión, es una decisión de
alcance consciente.

**Orden de prioridad final en `checkCareContext()`:**
```
1. rain    — proteccion real, ver DA-65
2. hot     — temp >= 30°C
3. cold    — temp <= 5°C
4. lunch   — 12-14h + km > 1
5. thirst  — 22-29°C + km >= 1.2, una vez por caminata
6. tired   — km >= 2.0 o pasos >= 2600
```
`special` se evalúa aparte, en cada tick de GPS vía `checkSpecialZone()`.

---

### DA-65 — Migración de `rain` desde `weather.js` a Care

**Decisión:** eliminado el sistema paralelo completo que vivía en
`weather.js` — `showRainAlert()`, `findNearbyRefuge()`,
`showRefugeSuggestion()`, `dismissAlert()`, `_alertShown`, y el disparo
directo dentro de `Weather.check()` sobre su propio timer de 10 min.

**Por qué era un problema real, no solo inconsistencia:** el manifiesto de
Care es explícito — *"No existe un segundo narrador. No existe un sistema
separado."* La lluvia lo era, literalmente: texto 100% hardcodeado en
español sin pasar por `lang` (única alerta de Care sin bilingüe), cooldown
propio que no respetaba los 20 min del resto de Care, y una búsqueda de
refugio (`findNearbyRefuge`) casi idéntica pero separada de
`findNearbyRestPlace()`.

**Después de la migración:** `Weather.check()` solo actualiza
`AppState.weather` — cero decisiones de UI. `Care.checkCareContext()` lee
`weather.isRaining` como prioridad 1, con el mismo cooldown de 20 min y la
misma voz generativa que cualquier otro trigger. `findNearbyRestPlace()`
unificada — amenity `cafe|bar|library|museum` para `rain` (heredado de
`findNearbyRefuge`), configurado vía `TRIGGER_META`. La fase `'alert'`
deja de dispararse — rain usa el mismo flujo `systole`/`diastole`/`rest`
que el resto de Care.

**Deuda cosmética generada:** `'alert'` sigue en la lista de fases válidas
de `setPhase()` en `app.js`, sin uso real — pendiente de limpieza, no
bloqueante.

---

### Resumen de archivos — Sesión 19 (completa)

| Archivo | Cambios |
|---------|---------|
| `gps.js` | DA-55: `_updateTransitState()`, `isInTransit()` expuesto |
| `debug.js` | DA-62: barra a 2 tabs, export único en Logs, POIs ordenado por distancia · fix flex-wrap en `.dbg-poi-btn-row` |
| `debug-sim.js` | DA-62: modo Auto 20km/h, utilidades movidas · preset bici 14km/h · 7 botones de test de Care (DA-63 + DA-64/65) |
| `care.js` | DA-63: `_testTrigger()` · DA-57/64/65: `triggerSuggestion()` reescrito, `TRIGGER_META`, `generateAndShowCard()`, `matchChosenPlace()`, `resetWalk()` (sin cablear en app.js) |
| `narration.js` | DA-57: `getCareMessage()`, `CARE_SYSTEM_PROMPT`, `buildCarePrompt()`, `callClaude()` con `maxTokens` parametrizable |
| `weather.js` | DA-65: sistema de alerta de lluvia eliminado por completo |
| `sw.js` | v4 → v8 |

**Pendiente para Sesión 20:** cablear `Care.resetWalk()` en `app.js`.

---

### DA-66 — Prompt Maestro v2.7: 4 correcciones tras laboratorio de campo

**Decisión:** revisión del `SYSTEM_PROMPT` (ambos idiomas) contra evidencia
real — dos capítulos completos recibidos en campo (Palacio de San
Francisco, Catedral Metropolitana de Cali) mostraron un patrón repetido de
prosa sobrecargada. Se armó un laboratorio comparando prompt actual vs.
propuesta sobre el mismo POI (Iglesia de San Francisco / Torre Mudéjar,
con datos verificados) antes de tocar código.

**Cuatro correcciones, todas con evidencia de campo que las motiva:**

1. **Metáfora sin freno → límite estricto de una por capítulo.** El
   capítulo del Palacio acumuló 6 metáforas/personificaciones en 174
   palabras ("código genético arquitectónico", "la ciudad se mira al
   espejo", "sería el latido... sería la mente", etc.). Sección RIESGO
   CULTURAL ahora dice explícito: "como máximo una metáfora o imagen
   central por capítulo... el resto se mantiene concreto". Sumado a EVITA:
   ejemplo explícito de personificación prohibida (ciudad que "decide",
   "se mira al espejo", "tiene código genético", "late", "siente").

2. **IDEA CENTRAL sin fe/espiritualidad → agregada a la lista.** La
   narración de la Catedral negó explícitamente el significado religioso
   ("las campanas... no llaman a la oración. Llaman a la pausa") para
   poder encajar en una de las diez ideas permitidas, ninguna de las
   cuales era fe. Se agregaron `fe` y `espiritualidad` a la lista de IDEA
   CENTRAL, con instrucción explícita de no negar artificialmente el
   significado religioso de un lugar de culto.

3. **Estructura invertida — apertura ahora es nombre + dato histórico.**
   Cambio de mayor alcance de los cuatro: el punto 1 de ESTRUCTURA DEL
   CAPÍTULO pasó de "Experiencia presente" (regla previa: "nunca empieces
   con una fecha") a "Apertura" (nombre del lugar + hecho verificable,
   sin metáfora). La experiencia sensorial pasa al punto 2, conectada al
   dato de apertura en vez de reemplazarlo. **Decisión de producto
   explícita, no solo técnica** — revierte un principio fundacional
   documentado en `contexto_maestro.md` y `manifiesto_narrativo.md`
   ("primero se vive, después se comprende"). Ambos documentos se
   actualizaron en el mismo commit para no dejar la contradicción que ya
   se había encontrado dos veces antes en esta sesión (ver DA-64/65).
   Razón: los hechos verificables son el dato que sostiene toda la
   credibilidad de Follower — quedaban diluidos entre metáforas cuando no
   abrían el capítulo.

4. **Título inventado, no pedido en ningún lado del prompt.** Ambos
   capítulos de campo traían un título tipo "Donde la ciudad aprendió a
   tener memoria" / "La catedral que escucha antes de creer" — formato
   que el modelo generó por su cuenta, y que además tendía a la misma
   personificación que el punto 1. Nueva sección FORMATO — SIN TÍTULO,
   explícita: el capítulo arranca directo con la primera frase, sin
   encabezado, sin guion largo tipo "Nombre — frase poética".

**Efecto colateral positivo:** el conteo de palabras del laboratorio (174
en la versión problema, 136 en la propuesta) confirma que quitar el título
inventado y limitar la metáfora también resuelve el problema de longitud
que se venía reportando — sin necesidad de bajar `max_tokens` ni acortar
artificialmente el contenido real.

**AUTOEVALUACIÓN INTERNA** ampliada con 4 verificaciones nuevas
correspondientes a cada corrección — el modelo se autochequea contra las
mismas reglas antes de entregar, no solo se le pide seguirlas.

**Pendiente de campo:** validar que las correcciones se sostienen con
narraciones nuevas, no solo con el laboratorio manual hecho en esta
sesión — el laboratorio comparó dos versiones escritas a mano siguiendo
cada set de reglas, no dos llamadas reales a Claude Haiku vía el Worker.

---

*Follower — Arquitectura v0.9 | Sesión 19 | 1 Julio 2026*

---

### DA-67 — Fixes críticos en `app.js`: bug de bienvenida, memoria de capítulo sin resetear

**Contexto:** primera vez que `app.js` se tocó en toda la Sesión 19 —
disparado por un reporte de campo con captura real (mensaje de bienvenida
de ciudad congelado en pantalla, nunca desaparece).

**Bug 1 — `ReferenceError` silencioso en `welcomeCity()`.** La línea de
logging referenciaba `` `narrador=${style}` ``, variable eliminada desde
DA-50 (narrador único). El error se disparaba después de mostrar el texto
pero antes de programar el auto-cierre a 5s y el listener de
tap-to-dismiss — ambos quedaban sin ejecutarse. Efecto visible: el mensaje
de bienvenida quedaba congelado para siempre. Este era el bug real detrás
del reporte de campo — no un problema de posicionamiento CSS como se
sospechó en un principio (aunque ese posicionamiento sigue sin revisarse
a fondo, ver `docs/deuda_tecnica_interfaz.md`).

**Bug 2 — `AppState._walkChapters` nunca se reseteaba.** Ni en
`initExplore()` ni en `Debug.startTestSession()`. Crecía sin límite entre
caminatas mientras la pestaña siguiera abierta — riesgo de que DA-58
(memoria de capítulo) inyectara contexto de una caminata muy anterior.

**Fix aplicado — los 4 cambios en `initExplore()` y `setPhase()`:**
1. `welcomeCity()`: eliminada la referencia a `style`
2. `initExplore()`: `AppState._walkChapters = []` agregado, corre siempre
   (fuera del bloque condicional de `Debug`)
3. `initExplore()`: `Care.resetWalk()` cableado — pendiente desde DA-63,
   ahora `thirst` funciona una vez por caminata como fue diseñado
4. `setPhase()`: `'alert'` eliminado de las fases válidas — código muerto
   desde DA-65

`sw.js` v9 → v10.

**Nota de proceso:** ambos bugs (`style` indefinido y `_walkChapters` sin
resetear) son ejemplos del mismo patrón que se repitió toda la sesión —
código que quedó huérfano tras una refactorización anterior (DA-50, DA-58)
sin que nadie volviera a revisar las funciones que lo consumían. Ninguno
de los dos habría aparecido en una revisión de `care.js`/`narration.js`
solos — solo se encontraron al abrir `app.js` por primera vez en la
sesión, motivados por un pendiente distinto (cablear `resetWalk()`).

---

*Follower — Arquitectura v0.9 | Sesión 19 (cierre) | 1 Julio 2026*
