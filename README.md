# 🎬 Follower

> **Your city soundtrack.**

Follower es una PWA de exploración cinematográfica que combina audioguía contextual, narrativa AI, música y cuidado humano para convertir cualquier paseo en una experiencia memorable.

**App:** [follower-app.github.io/follower](https://follower-app.github.io/follower)
**Repo:** [github.com/follower-app/follower](https://github.com/follower-app/follower)

---

## El problema que resuelve

Explorar una ciudad genera carga cognitiva. El viajero debe orientarse, buscar información, elegir recorridos, coordinar horarios. La logística termina robándole espacio a la experiencia.

Los audio guides son aburridos y estáticos. Los free tours dependen de un guía. Los mapas dan datos fríos sin emoción.

**Follower existe para que caminar una ciudad extraña se sienta como protagonizar una película.**

---

## Principio fundamental

> Follower no compite por información. Follower compite por emoción.

Los usuarios no recordarán los datos históricos. Recordarán cómo se sintieron mientras caminaban.

---

## La experiencia en 3 palabras

**Escucha. Camina. Vive.**

El usuario guarda el celular en el bolsillo. La app orquesta todo sola:
- Se acerca a un punto de interés → música hace fade in según el mood del lugar
- Narración AI empieza sobre la música, en el idioma del usuario
- Se aleja → música hace fade out suavemente
- Lleva mucho tiempo caminando o va a llover → la app lo cuida y sugiere dónde descansar

---

## Pregunta rectora

> ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## Identidad de marca

**Logo:** Corazón C2 — contorno de corazón con ticks cardinales y aguja de brújula. Norte en rojo. Exploración con alma. *(logo SVG pendiente)*

**Slogan:** *your city soundtrack*

**Paleta — Sístole y Diástole:**

| Nombre | Hex | Uso |
|--------|-----|-----|
| Navy | `#0d1b2a` | Base, fondo claro |
| Noche | `#0d1420` | Fondo oscuro, pantallas |
| Rojo diástole | `#c0392b` | Narración activa, norte, acento |
| Rojo vivo | `#e74c3c` | Alertas, dark mode |
| Azul sístole | `#1a5276` | Caminando, usuario en mapa |
| Humo | `#c8d4e0` | Textos dark mode |
| Crema | `#f5f3ef` | Fondo claro |
| Dorado | `#f0c87a` | Descanso, sugerencias cálidas |
| Hielo | `#e8eef4` | Textos principales dark mode |

> **Sístole (azul)** = el corazón se contrae, avanza, el usuario camina.
> **Diástole (rojo)** = el corazón se expande, recibe, el usuario escucha.
> El usuario nunca lo sabe — solo lo siente.

**Tipografía:**

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | DM Serif Display | Nombre app, títulos POIs |
| Narración | Inter 200 | Texto narración, descripciones |
| UI | Inter 300 | Slogan, labels, botones |
| Datos | Inter 500 | Métricas, distancias, estados |

---

## Modos de exploración

### Modo Libre *(default)*
El usuario camina sin rumbo. La app detecta POIs cercanos y reacciona automáticamente. La ciudad sorprende.

### Modo Recorrido *(opt-in)*
El usuario elige una ruta temática. La app cuenta una historia. La ruta existe para servir a la narrativa — no al contrario.

### Transición inteligente
Si el usuario está a menos de 300m del inicio de un recorrido popular, la app lo sugiere suavemente. Nunca lo activa automáticamente.

---

## Recorridos disponibles — Roma

| Recorrido | Km | Duración | POIs | Mood |
|-----------|-----|----------|------|------|
| 🏛️ Roma Imperial | 3.2 | 2h | 8 | Épico |
| 🌙 Roma Nocturna | 2.1 | 1.5h | 6 | Misterio |
| 🌹 Roma Romántica | 2.8 | 2h | 7 | Romántico |
| 🔮 Roma Secreta | 4.0 | 2.5h | 10 | Misterio |
| 😄 Roma Curiosa | 3.5 | 2h | 9 | Curioso |

---

## Moods

| Mood | Música | Narración |
|------|--------|-----------|
| 🎬 Épico | Orquestal, cinematográfica | Dramática, grandiosa |
| 🌹 Romántico | Acordeón, cuerdas suaves | Poética, íntima |
| 🔮 Misterio | Ambient, tensa | Suspense, secretos |
| 😄 Curioso | Ligera, alegre | Datos curiosos, humor |

---

## Modo Offline

| Función | Offline |
|---------|---------|
| Interfaz completa | ✅ |
| Mapa de la zona | ✅ |
| POIs cercanos | ✅ |
| Narración POIs conocidos | ✅ |
| Música por mood | ✅ |
| Narración POIs nuevos | ❌ |
| Clima en tiempo real | ❌ |

---

## Arquitectura de archivos

```
follower/
├── index.html              → shell mínimo
├── manifest.json           → PWA config
├── sw.js                   → service worker (al final)
├── REGLAS_IA.md
├── README.md
│
├── css/
│   ├── main.css            → variables, reset, tipografía
│   ├── components.css      → botones, pills, cards, waves
│   ├── splash.css          → pantalla de carga y latido
│   ├── modal.css           → modales y care cards
│   ├── explore.css         → mapa, pins, card POI pequeña
│   └── poi.css             → pantalla POI expandida
│
├── js/
│   ├── keys.js             → API keys — LOCAL ONLY, en .gitignore
│   ├── config.js           → idioma, mood, preferencias
│   ├── app.js              → AppState, router, setPhase, init
│   ├── gps.js              → GPS, Leaflet, distancia, ciudad
│   ├── poi.js              → POIs desde OSM, detectPOI, IndexedDB
│   ├── narration.js        → Gemini API, prompts, fallback
│   ├── voice.js            → Web Speech API, 12 idiomas
│   ├── music.js            → música por mood, fadeMusic
│   ├── weather.js          → OpenWeatherMap, alerta lluvia
│   ├── care.js             → cuidado contextual, checkCareContext
│   └── routes.js           → recorridos temáticos, trazado
│
├── assets/
│   ├── logo.svg            → logo C2 (pendiente)
│   ├── sounds/             → epic.mp3, romantic.mp3, mystery.mp3, curious.mp3
│   └── icons/              → icon-192.png, icon-512.png (pendiente logo)
│
└── docs/
    ├── contexto_maestro.md → alma del producto, principios fundamentales
    ├── producto.md
    ├── arquitectura.md
    └── bitacora.md
```

---

## Stack

```
HTML + CSS + JS Vanilla
Leaflet.js          → mapas (OpenStreetMap)
Gemini 1.5 Flash    → narración AI en tiempo real (gratuito)
Web Speech API      → síntesis de voz nativa (12 idiomas)
Web Audio API       → música por mood nativa
OpenWeatherMap API  → clima en tiempo real
IndexedDB           → POIs y narraciones offline
GitHub Pages        → hosting
PWA                 → instalable, offline parcial
```

**Sin frameworks. Sin npm. Sin build step.**

---

## Para IAs y desarrolladores

**Leer antes de tocar cualquier archivo:** `REGLAS_IA.md`
**Leer para entender el alma del producto:** `docs/contexto_maestro.md`

Funciones únicas — nunca duplicar:
- `detectPOI()` → poi.js
- `triggerNarration(poi, mood, lang)` → narration.js
- `fadeMusic(mood, direction)` → music.js
- `checkCareContext()` → care.js
- `setPhase(phase)` → app.js
- `navigateTo(screen)` → app.js

---

## Roadmap

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + mockups | ✅ |
| v0.3 | Documentación completa | ✅ |
| v0.4 | Código base completo | ✅ |
| v0.5 | Pruebas locales + debugging | 🔲 En curso |
| v0.6 | Logo SVG + iconos PWA | 🔲 |
| v0.7 | Archivos de música por mood | 🔲 |
| v0.8 | sw.js + deploy GitHub Pages | 🔲 |
| v1.0 | Piloto viajeros reales | 🔲 |
| v2.0 | Más ciudades + monetización | 🔲 |

---

*Follower | Junio 2026*
