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



