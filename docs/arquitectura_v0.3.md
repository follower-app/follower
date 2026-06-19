# 🏗️ Follower — Arquitectura v0.3

> Junio 2026 — Decisiones arquitecturales base

---

## Principio General

**Sin frameworks. Sin npm. Sin build step.**

HTML + CSS + JS Vanilla. Mismo stack que Organiza2. Liviano, mantenible, sin dependencias que se rompan.

---

## Estructura de Archivos

```
follower/
│
├── index.html              → shell mínimo, solo estructura HTML
├── sw.js                   → service worker PWA
├── manifest.json           → config PWA (icono, nombre, colores)
│
├── css/
│   ├── main.css            → variables globales, reset, tipografía
│   ├── splash.css          → pantalla de carga y latido
│   ├── explore.css         → modo exploración y mapa
│   ├── poi.css             → tarjeta POI expandida
│   ├── modal.css           → modales (config, recorridos, cuidado)
│   └── components.css      → botones, pills, cards, waves
│
├── js/
│   ├── app.js              → init, router de pantallas, estado global
│   ├── config.js           → idioma, mood, preferencias del usuario
│   ├── gps.js              → ubicación en tiempo real
│   ├── poi.js              → detección POIs, carga desde OSM
│   ├── narration.js        → Claude API, prompts, fallback
│   ├── voice.js            → Web Speech API, síntesis de voz
│   ├── music.js            → música por mood, fade in/out
│   ├── weather.js          → OpenWeatherMap, alertas
│   ├── care.js             → pasos, cansancio, sugerencias
│   └── routes.js           → recorridos temáticos, trazado
│
└── assets/
    ├── logo.svg            → logo C2
    ├── sounds/             → música por mood (4 archivos)
    └── icons/              → iconos PWA (192px, 512px)
```

---

## Decisiones Arquitecturales

### DA-1 — index.html es solo shell
`index.html` contiene únicamente estructura HTML — divs de pantallas, links a CSS, scripts al final. Sin lógica, sin estilos inline, sin nada que no sea estructura pura.

### DA-2 — Estado global en app.js
Un objeto `AppState` centralizado en `app.js` contiene todo el estado de la app:
```js
const AppState = {
  screen: 'splash',       // pantalla activa
  mode: 'free',           // 'free' | 'route'
  mood: 'epic',           // 'epic' | 'romantic' | 'mystery' | 'curious'
  lang: 'es',             // idioma del usuario
  gps: null,              // posición actual
  nearbyPOIs: [],         // POIs en radio activo
  activePOI: null,        // POI en narración
  phase: 'systole',       // 'systole' | 'diastole' | 'rest' | 'alert'
  offline: false,         // estado de conectividad
  steps: 0,               // pasos acumulados
  weather: null           // clima actual
}
```

### DA-3 — Funciones únicas por responsabilidad
Cada acción crítica tiene UNA sola función. Nunca duplicar lógica:

| Función | Archivo | Responsabilidad |
|---------|---------|-----------------|
| `detectPOI()` | `poi.js` | Detectar POIs cercanos |
| `triggerNarration(poi, mood, lang)` | `narration.js` | Iniciar narración AI |
| `fadeMusic(mood, direction)` | `music.js` | Transiciones de música |
| `checkCareContext()` | `care.js` | Evaluar sugerencias de cuidado |
| `setPhase(phase)` | `app.js` | Cambiar estado sístole/diástole |
| `navigateTo(screen)` | `app.js` | Cambiar pantalla activa |

### DA-4 — Sístole / Diástole como sistema
El color del botón central y el estado visual de la app reflejan SIEMPRE la fase actual. `setPhase()` es la única función que cambia colores de estado — nunca CSS directo desde otros archivos.

```js
// CORRECTO
setPhase('diastole') // narración activa — rojo

// INCORRECTO
document.body.style.color = '#c0392b' // nunca directo
```

### DA-5 — Offline por capas
```
Capa 1 — sw.js        → shell HTML, CSS, JS
Capa 2 — Leaflet      → tiles del mapa
Capa 3 — IndexedDB    → POIs, narraciones, config
Capa 4 — Cache API    → música, assets estáticos
```
Cada capa es independiente. Si falla una, las otras siguen.

### DA-6 — Narración con fallback obligatorio
`triggerNarration()` siempre sigue este orden:
1. Intentar Claude API (timeout: 8 segundos)
2. Si falla → usar narración pre-generada de IndexedDB
3. Si no hay cache → generar narración básica con datos OSM locales
4. Nunca mostrar error al usuario — la experiencia no se rompe

### DA-7 — GPS no se interrumpe
El ciclo de GPS en `gps.js` nunca se pausa, nunca se bloquea. Ni siquiera durante la narración. Es el latido de la app.

### DA-8 — Modo Libre es default
`AppState.mode` siempre inicia en `'free'`. El modo recorrido (`'route'`) solo se activa por acción explícita del usuario. Nunca automático.

### DA-9 — sw.js siempre último en commits
El service worker se actualiza SIEMPRE después de todos los demás archivos. Ver Regla de sw.js en REGLAS_IA.md.

### DA-10 — CSS variables en main.css
Todos los colores, tipografías y espaciados como variables CSS en `main.css`. Nunca hardcoded en otros archivos.

```css
:root {
  --color-navy:      #0d1b2a;
  --color-night:     #0d1420;
  --color-diastole:  #c0392b;
  --color-alert:     #e74c3c;
  --color-systole:   #1a5276;
  --color-smoke:     #c8d4e0;
  --color-cream:     #f5f3ef;
  --color-gold:      #f0c87a;
  --color-ice:       #e8eef4;
  --font-display:    'DM Serif Display', serif;
  --font-ui:         'Inter', sans-serif;
}
```

---

## APIs Externas

| API | Uso | Costo | Fallback |
|-----|-----|-------|---------|
| Claude API | Narración AI | Por token | Cache + OSM básico |
| OpenStreetMap / Leaflet | Mapas y POIs | Gratis | Tiles cacheados |
| OpenWeatherMap | Clima | Gratis (1000 calls/día) | Último clima guardado |
| Web Speech API | Síntesis de voz | Gratis (nativa) | Texto en pantalla |
| Web Audio API | Música | Gratis (nativa) | Sin música |

---

## Stack Completo

```
Frontend        HTML + CSS + JS Vanilla
Mapas           Leaflet.js + OpenStreetMap
AI              Claude API (claude-sonnet-4-6)
Voz             Web Speech API (nativa)
Música          Web Audio API (nativa)
Clima           OpenWeatherMap API
Storage         IndexedDB (POIs, narraciones) + Cache API (assets)
PWA             Service Worker + manifest.json
Hosting         GitHub Pages
```

---

## Restricciones

- **No usar** React, Vue, Angular, npm, webpack ni ningún build tool
- **No usar** localStorage para datos grandes — usar IndexedDB
- **No usar** alert() ni confirm() — siempre UI nativa de la app
- **No hardcodear** POIs — siempre desde OSM
- **No hardcodear** colores fuera de main.css

---

*Follower — Arquitectura v0.3 | Junio 2026*
