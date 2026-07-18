# 🎬 Follower

> **Your city soundtrack.**

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable.

**App:** [follower-app.github.io/follower](https://follower-app.github.io/follower)
**Repo:** [github.com/follower-app/follower](https://github.com/follower-app/follower)
**Worker:** followernarration.jaimeand.workers.dev

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
- Se acerca a un punto de interés → el narrador empieza a contar una historia
- La historia usa el presente como punto de entrada — primero se vive, después se comprende
- La ciudad misma es la banda sonora: sus campanas, sus mercados, sus conversaciones
- Lleva mucho tiempo caminando, hace calor o va a llover → Follower sugiere con voz de anfitrión, no de sistema
- Movimiento sostenido sin interacción → Modo Caminata (DT-54): la app confía en que el teléfono va en el bolsillo

---

## Pregunta rectora

> ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## El Narrador

Follower tiene una sola voz. No es un sistema con personalidades intercambiables (narrador único, DA-50).

Es el amigo más culto que conoces, que nunca presume de lo que sabe. Puede haber nacido en la ciudad o haberse enamorado de ella. Conoce su historia, sus barrios, sus personajes y sus costumbres.

Cada historia es un **capítulo** (90-130 palabras, excepcional 150). Cada caminata construye una **tesis de ciudad** (DA-85) que actúa como lente débil sobre los capítulos — nunca un itinerario. Al terminar, un **epílogo** cierra la caminata citando la tesis. El usuario debe sentir: *"Ahora entiendo mejor esta ciudad."*

La banda sonora no la pone Follower. La pone la ciudad.

---

## Identidad de marca

**Logo:** Corazón C2 con brújula — contorno de corazón con ticks cardinales y aguja de brújula. Exploración con alma.

**Slogan:** *your city soundtrack*

**Paleta:**

| Nombre | Hex | Uso |
|--------|-----|-----|
| Noche | `#0d1420` | Fondo oscuro, pantallas |
| Sístole | `#1a5276` | Caminando, usuario en mapa |
| Dorado | `#f0c87a` | Descanso, sugerencias cálidas |
| Humo | `#c8d4e0` | Textos dark mode |
| Alerta | `#e74c3c` | Alertas |

> **Sístole (azul)** = el corazón se contrae, avanza, el usuario camina.
> **Diástole** = el corazón se expande, recibe, el usuario escucha.
> El usuario nunca lo sabe — solo lo siente.

**Tipografía:** DM Serif Display Italic (display, bienvenida, títulos) · Inter (UI, narración, datos).

---

## Modos de exploración

### Modo Libre *(default, DA-76)*
El usuario camina sin rumbo. La app detecta POIs cercanos y reacciona automáticamente. La ciudad sorprende.

### Modo Curado *(nota estratégica v2.0, sin ticket)*
Evolución premium por selección narrativa, no por interfaz distinta. Aparcado.

---

## Modo Offline

| Función | Offline |
|---------|---------|
| Interfaz completa | ✅ |
| Mapa de la zona | ✅ |
| POIs cercanos (cache IndexedDB) | ✅ |
| Narración POIs conocidos | ✅ |
| Narración POIs nuevos | ❌ |
| Clima en tiempo real | ❌ |

---

## Arquitectura de archivos

```
follower/
├── index.html              → shell + wizard de entrada (DT-47)
├── manifest.json           → PWA config
├── sw.js                   → service worker (siempre último en commits)
├── REGLAS_IA.md
├── README.md
│
├── css/
│   ├── main.css            → variables, reset, tipografía, fases
│   ├── components.css      → botones, pills, cards, waves, badges
│   ├── splash.css          → latido, rings, expand animation
│   ├── modal.css           → modales, care card, route picker
│   ├── wizard.css          → wizard de entrada (GPS → idioma → nombre → voz)
│   ├── explore.css         → mapa, care strip, bottom bar, pills, brújula
│   └── poi.css             → héroe, player, narración, acciones
│
├── js/
│   ├── keys.js             → API keys LOCAL ONLY (.gitignore)
│   ├── config.js           → idioma, mode, volúmenes, localStorage
│   ├── app.js               → AppState, navigateTo(), setPhase(), welcomeCity(),
│   │                          wizard (_startWizard, _unlockAudioOnFirstTap)
│   ├── gps.js               → Leaflet, watchPosition, Haversine, Nominatim, fetchCityName
│   ├── poi.js                → Wikipedia GeoSearch (primaria, DA-72) + Overpass (complemento),
│   │                           IndexedDB, cascada de curaduría, cola narrativa, dedup
│   ├── narration.js          → Claude Haiku vía Worker, Prompt Maestro v3.7, scratchpad de
│   │                           grounding, tesis de ciudad (DA-85), _walkChapters
│   ├── voice.js              → Web Speech API, recuperación por visibilitychange, safety timer
│   ├── weather.js            → OpenWeatherMap vía Worker, cache 30min
│   ├── care.js                → checkCareContext(), checkSpecialZone(), Care Strip independiente
│   ├── walkmode.js            → Modo Caminata (DT-54): overlay automático por inactividad + movimiento
│   ├── routes.js               → recorridos temáticos, Leaflet polyline
│   ├── debug.js                 → dashboard de experiencia, métricas 3 capas
│   ├── debug-sim.js             → simulador GPS, tab Simular
│   └── music.js                  → stub vacío (eliminado DA-50), no recrear
│
├── cloudflare/
│   └── worker.js            → proxy Claude API + OpenWeatherMap, passthrough puro
│
├── assets/
│   └── icons/               → icon-192.png, icon-512.png
│
└── docs/
    ├── contexto_maestro.md        → alma del producto, principios fundamentales
    ├── producto.md                → producto, usuarios, bugs, deuda técnica
    ├── arquitectura.md            → decisiones DA-1 a DA-85
    ├── bitacora.md                → historial de sesiones
    ├── instrucciones_proyecto.md  → estado y pendientes, para pegar al abrir chat nuevo
    ├── manifiesto_narrativo.md    → voz, capítulos, tesis de ciudad (Fase 3 cerrada)
    ├── manifiesto_pois.md         → Detectado ≠ Visible ≠ Narrable, Niveles A-D
    ├── manifiesto_care_strip.md   → hospitalidad urbana, voz del cuidado
    ├── prompt_maestro_follower.md → Prompt Maestro v3.7 oficial
    ├── dt42_care_miniprompt.md    → mini-prompt de Care
    ├── dt45_bienvenida_animada.md
    ├── dt47_wizard_mockup_final.html
    ├── registro_sesion24_interfaz.md
    ├── restauracion_poi_js.md
    └── deuda_tecnica_interfaz.md
```

---

## Stack

```
HTML + CSS + JS Vanilla
Leaflet.js              → mapas (OpenStreetMap · CartoDB Voyager)
Claude Haiku            → narración AI + Care generativo (vía Cloudflare Worker)
Web Speech API          → síntesis de voz nativa
Wikipedia GeoSearch     → fuente primaria de POIs (DA-72)
Overpass OSM            → fuente complementaria de POIs
OpenWeatherMap API      → clima en tiempo real (vía Cloudflare Worker)
IndexedDB               → POIs y narraciones offline
GitHub Pages            → hosting
PWA                     → instalable, offline parcial
Cloudflare Workers      → proxy de API keys (sin billing, sin exposición)
```

**Sin frameworks. Sin npm. Sin build step.**

---

## Para IAs y desarrolladores

**Leer antes de tocar cualquier archivo:** `REGLAS_IA.md`
**Regla de Oro:** el panel es fotografía estática; el árbitro es el código en `raw.githubusercontent.com`. Fetch en vivo antes de editar, siempre.
**Alma del producto:** `docs/contexto_maestro.md`
**Voz narrativa:** `docs/manifiesto_narrativo.md` + `docs/prompt_maestro_follower.md`
**POIs:** `docs/manifiesto_pois.md`
**Hospitalidad:** `docs/manifiesto_care_strip.md`

Funciones únicas — nunca duplicar (lista completa y viva en `docs/instrucciones_proyecto.md`):

| Función | Archivo |
|---------|---------|
| `detectNearby()`, `markVisited()`, `fetchWikipediaPOIs()` | poi.js |
| `trigger()`, `buildGroundingBlock()`, `getCityWelcome()`, `sanitizeNarration()` | narration.js |
| `checkCareContext()`, `checkSpecialZone()` | care.js |
| `start()`, `stop()`, `onMove()`, `isActive()` | walkmode.js |
| `speak()`, `unlockFromGesture()` | voice.js |
| `setPhase()`, `navigateTo()`, `welcomeCity()` | app.js |

`getFarewell()` aún no existe — nace con el Epílogo (DA-85, implementación pendiente).

**Reglas absolutas:**
- Sístole `#1a5276` = caminando · Diástole = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- `sw.js` siempre último en commits, commit aparte
- Nunca mostrar errores al usuario — siempre hay fallback
- La ciudad sonora vive en el prompt, no en archivos de audio — `music.js` no existe (eliminado DA-50)
- Narración: objetivo 90-130 palabras, excepcional 150 (`MAX_TOKENS=550`, andamiaje no longitud)
- Cambio en query/filtros/normalización de POIs → `POI_CACHE_VERSION++` mismo commit
- Cambio en el Prompt Maestro → `PROMPT_VERSION++` mismo commit

---

## Roadmap

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1–v0.7 | Base, identidad, debug, UI, narrador multi-estilo | ✅ |
| v0.8 | Wikipedia GeoSearch · cola narrativa · visited-on-complete | ✅ |
| v0.9 | Narrador único (DA-50) · memoria de capítulo · idioma local · Care generativo · Prompt Maestro v3.7 validado en campo (16/16) · Modo Caminata (DT-54) · wizard de entrada (DT-45/47) | ✅ |
| v0.9 | DA-85 — Arquitectura Narrativa v1 (tesis + epílogo): diseño ratificado, implementación pendiente (próximo: DT-60) | 🔄 En curso |
| v1.0 | Piloto con viajeros reales | 🔲 |
| v2.0 | Capacitor (Android/iOS nativo) · Modo Curado · más ciudades | 🔲 |

---

*Follower | Julio 2026*
