# 🎬 Follower

> **Your city soundtrack.**

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable.

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
- Se acerca a un punto de interés → el narrador empieza a contar una historia
- La historia usa el presente como punto de entrada — primero se vive, después se comprende
- La ciudad misma es la banda sonora: sus campanas, sus mercados, sus conversaciones
- Lleva mucho tiempo caminando, hace calor o va a llover → Follower sugiere con voz de anfitrión, no de sistema

---

## Pregunta rectora

> ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## El Narrador

Follower tiene una sola voz. No es un sistema con personalidades intercambiables.

Es el amigo más culto que conoces, que nunca presume de lo que sabe. Puede haber nacido en la ciudad o haberse enamorado de ella. Conoce su historia, sus barrios, sus personajes y sus costumbres.

Cada historia es un **capítulo**. Cada caminata construye una **tesis** sobre la ciudad. Al terminar, el usuario debe sentir: *"Ahora entiendo mejor esta ciudad."*

La banda sonora no la pone Follower. La pone la ciudad.

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
| Display | DM Serif Display | Nombre app, bienvenida ciudad, títulos POIs |
| Narración | Inter 200 | Texto narración, descripciones |
| UI | Inter 300 | Slogan, labels, botones |
| Datos | Inter 500 | Métricas, distancias, estados |

---

## Modos de exploración

### Modo Libre *(default)*
El usuario camina sin rumbo. La app detecta POIs cercanos y reacciona automáticamente. La ciudad sorprende.

### Recorridos Curados *(opt-in — versiones futuras)*
Follower cuenta una historia con arco narrativo predefinido. La ruta existe para servir al relato — no al contrario.

Ciudades planificadas: Barcelona (Gaudí), París Romántico, Cali Salsera, Lisboa de los Exploradores, Roma Imperial.

---

## Modo Offline

| Función | Offline |
|---------|---------|
| Interfaz completa | ✅ |
| Mapa de la zona | ✅ |
| POIs cercanos | ✅ |
| Narración POIs conocidos | ✅ |
| Narración POIs nuevos | ❌ |
| Clima en tiempo real | ❌ |

---

## Arquitectura de archivos

```
follower/
├── index.html              → shell mínimo, sin selector de narrador (DA-50)
├── manifest.json           → PWA config
├── sw.js                   → service worker v4 (siempre último en commits)
├── REGLAS_IA.md
├── README.md
│
├── css/
│   ├── main.css            → variables, reset, tipografía, fases
│   ├── components.css      → botones, pills, cards, waves, badges
│   ├── splash.css          → latido, rings, expand animation
│   ├── modal.css           → modales, care card, route picker
│   ├── explore.css         → mapa, care strip, bottom bar, pills, brújula
│   └── poi.css             → héroe, player, narración, acciones
│
├── js/
│   ├── keys.js             → API keys LOCAL ONLY (.gitignore)
│   ├── config.js           → idioma, mode, volúmenes, localStorage (narrator eliminado en DA-50)
│   ├── app.js              → AppState, navigateTo(), setPhase(),
│   │                         welcomeCity(), onWalkInactivity(), _walkChapters
│   ├── gps.js              → Leaflet, watchPosition, Haversine, Nominatim,
│   │                         countryCode, simulatePosition(), detección inactividad (DT-40)
│   ├── poi.js              → Wikipedia GeoSearch (primaria) + Overpass (fallback),
│   │                         IndexedDB, detectPOI, cola narrativa, _pendingDetect (DT-38)
│   ├── narration.js        → Claude Haiku vía Worker, Prompt Maestro v2.7,
│   │                         _walkChapters, COUNTRY_LANG, cleanPOIName(), getFarewell(), getCareMessage()
│   ├── voice.js            → Web Speech API, 12 idiomas BCP-47, prioridad latam
│   ├── weather.js          → OpenWeatherMap vía Worker, cache 30min
│   ├── care.js             → checkCareContext(), checkSpecialZone() (DT-43),
│   │                         triggers + momentos memorables, generación de mensajes vía Claude
│   ├── routes.js           → recorridos temáticos, Leaflet polyline
│   ├── debug.js            → dashboard de experiencia, métricas 3 capas
│   ├── debug-sim.js        → simulador GPS, tab Simular
│   └── music.js            → eliminado en v0.9 (DA-50) — stub vacío, no recrear
│
├── cloudflare/
│   └── worker.js           → proxy Claude API + OpenWeatherMap
│
├── assets/
│   ├── logo.svg            → pendiente (DT-1)
│   └── icons/              → icon-192.png, icon-512.png (pendiente logo)
│
└── docs/
    ├── contexto_maestro.md       → alma del producto, principios fundamentales
    ├── producto.md               → producto v0.9, usuarios, principios
    ├── arquitectura.md           → decisiones DA-1 a DA-65
    ├── bitacora.md               → historial, bugs, deuda técnica (hasta Sesión 18)
    ├── manifiesto_narrativo.md   → voz, capítulos, tesis de ciudad
    ├── manifiesto_care_strip.md  → hospitalidad urbana, voz del cuidado
    ├── prompt_maestro_follower.md → Prompt Maestro v2.7 oficial
    └── dt42_care_miniprompt.md   → mini-prompt de Care, listo para implementar
```

---

## Stack

```
HTML + CSS + JS Vanilla
Leaflet.js              → mapas (OpenStreetMap · CartoDB Voyager)
Claude Haiku            → narración AI + Care generativo (vía Cloudflare Worker)
Web Speech API          → síntesis de voz nativa (12 idiomas)
Wikipedia GeoSearch     → fuente primaria de POIs
Overpass OSM            → fuente secundaria de POIs (fallback)
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
**Alma del producto:** `docs/contexto_maestro.md`
**Voz narrativa:** `docs/manifiesto_narrativo.md` + `docs/prompt_maestro_follower.md`
**Hospitalidad:** `docs/manifiesto_care_strip.md`

Funciones únicas — nunca duplicar:

| Función | Archivo |
|---------|---------|
| `detectNearby()` | poi.js |
| `cleanPOIName()` | narration.js |
| `trigger(poi, lang, topic)` | narration.js |
| `getFarewell()` | narration.js |
| `getCareMessage(type, candidatos, ctx)` | narration.js |
| `checkCareContext()` | care.js |
| `checkSpecialZone()` | care.js |
| `setPhase(phase)` | app.js |
| `navigateTo(screen)` | app.js |
| `welcomeCity(city)` | app.js |
| `onWalkInactivity()` | app.js |

**Reglas absolutas:**
- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- `sw.js` siempre último en commits
- Nunca mostrar errores al usuario — siempre hay fallback
- La ciudad sonora vive en el prompt, no en archivos de audio — `music.js` no existe (eliminado DA-50)
- Narración: objetivo 130-160 palabras, máximo duro 170 (`max_tokens: 380`)

---

## Roadmap

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1–v0.4 | README · arquitectura · identidad · código base | ✅ |
| v0.5 | Panel de debug + métricas de experiencia | ✅ |
| v0.6 | UI rediseñada — bottom bar, pills, care strip, brújula | ✅ |
| v0.7 | Sistema de narradores · música por intro · bienvenida ciudad | ✅ |
| v0.7s | Estabilización: voz latam · narraciones cortas · laboratorio | ✅ |
| v0.8 | Wikipedia GeoSearch · cola narrativa · visited-on-complete | ✅ |
| v0.9 | Narrador único (DA-50) · memoria de capítulo · idioma local · zona especial · inactividad · DA-55 tránsito · Care generativo (DT-42, 7 triggers) | ✅ |
| v0.9 | Bienvenida animada (DT-45) · cierre de caminata (DT-46) · validación en campo | 🔄 En curso |
| v1.0 | Piloto con viajeros reales | 🔲 |
| v2.0 | Recorridos curados · interacción por voz · más ciudades | 🔲 |

---

*Follower | Julio 2026*
