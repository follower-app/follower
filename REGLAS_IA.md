# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch · GitHub Pages · PWA
Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

## Documentos del proyecto

- README.md → visión, flujo, pantallas, roadmap
- REGLAS_IA.md → reglas completas de trabajo
- docs/contexto_maestro.md → alma del producto, principios fundamentales, pregunta rectora
- docs/producto.md → producto v0.9, usuarios, principios
- docs/arquitectura.md → decisiones DA-1 a DA-61
- docs/bitacora.md → historial, bugs, deuda técnica (hasta Sesión 18)
- docs/manifiesto_narrativo.md → voz narrativa, capítulos, tesis de ciudad
- docs/manifiesto_care_strip.md → hospitalidad urbana, voz del cuidado
- docs/prompt_maestro_follower.md → Prompt Maestro v2.7 oficial
- docs/dt42_care_miniprompt.md → mini-prompt de Care, listo para implementar

## Arquitectura de archivos

```
follower/
├── index.html          → shell mínimo
├── sw.js               → service worker (siempre último en commits)
├── manifest.json       → PWA config
├── css/                → main, splash, explore, poi, modal, components
├── js/                 → app, config, gps, poi, narration, voice,
│                          weather, care, routes, debug, debug-sim
│                          (music.js eliminado en v0.9 — DA-50)
├── assets/             → logo.svg (pendiente DT-1), icons/
└── docs/               → contexto_maestro, producto, arquitectura,
                           bitacora, manifiesto_narrativo,
                           manifiesto_care_strip, prompt_maestro_follower,
                           dt42_care_miniprompt
```

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en archivos de audio — `music.js` no existe
- Modo Libre es default — Modo Recorrido es siempre opt-in
- Offline obligatorio — 4 capas de cache — la experiencia nunca se rompe
- sw.js siempre último en commits
- Nunca mostrar errores al usuario — siempre hay fallback
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?
- PowerShell en Windows: nunca usar `&&` para encadenar comandos — ejecutar por separado
- Mensajes de commit sin caracteres acentuados

## Regla de Cambios

- **Cambios pequeños y localizados** → el usuario los aplica directamente en VS Code con Ctrl+H
- **Cambios grandes o que afectan múltiples funciones** → la IA genera el archivo completo
- **Nunca reescribir un archivo completo si solo cambia una función**
- **Nunca generar un archivo desde cero si ya existe en el proyecto**

## Regla de Arquitectura

Antes de proponer cualquier cambio técnico, verificar alineación con:

- `docs/contexto_maestro.md` — alma del producto, pregunta rectora
- `docs/manifiesto_narrativo.md` — voz narrativa, capítulos, tesis de ciudad
- `docs/manifiesto_care_strip.md` — hospitalidad urbana, voz del cuidado
- `docs/prompt_maestro_follower.md` — Prompt Maestro v2.7 oficial
- `README.md` — visión, pantallas, flujo completo
- `docs/arquitectura.md` — decisiones DA-1 a DA-61
- `docs/bitacora.md` — historial, bugs resueltos, deuda técnica

Preguntarse siempre:

> **¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?**

## Funciones únicas — nunca duplicar

- `detectNearby()` → poi.js
- `trigger(poi, _unused, lang, topic)` → narration.js (style eliminado en DA-50)
- `getFarewell()` → narration.js
- `getCareMessage(type, candidatos, ctx)` → narration.js
- `getCityWelcome(city, _unused, lang)` → narration.js
- `getLocalLang(countryCode)` → narration.js (DT-41)
- `checkCareContext()` → care.js
- `checkSpecialZone(lat, lng)` → care.js (DT-43)
- `setPhase(phase)` → app.js
- `navigateTo(screen)` → app.js
- `welcomeCity(city, countryCode)` → app.js (countryCode agregado DT-41)
- `onWalkInactivity()` → app.js (DT-40)

## Regla de Mockup

**Antes de implementar cualquier pantalla nueva:**
1. Hacer mockup interactivo en HTML
2. Iterar con el usuario hasta aprobación
3. Solo entonces integrar al proyecto real

## Regla de Estados — Sístole / Diástole

La app tiene dos estados de vida. **Nunca mezclarlos:**

| Estado | Color | Cuándo |
|--------|-------|--------|
| Sístole | `#1a5276` azul | Usuario caminando entre POIs |
| Diástole | `#c0392b` rojo | Usuario escuchando narración |
| Descanso | `#f0c87a` dorado | Sugerencia de pausa activa |
| Alerta | `#e74c3c` rojo vivo | Lluvia, urgencia, advertencia |

## Regla de Modos

| Modo | Default | Activación |
|------|---------|------------|
| Libre | ✅ Sí | Automático al iniciar |
| Recorrido | ❌ No | Solo si el usuario lo elige explícitamente |

**Transición inteligente:** sugerir si el usuario está a <300m del inicio — nunca activar automáticamente.

## Regla de Narración AI

- Motor: **Claude Haiku (claude-haiku-4-5)** vía Cloudflare Worker — key nunca expuesta en el repo
- Endpoint: `https://followernarration.jaimeand.workers.dev/narration`
- System prompt: Prompt Maestro v2.7 — ver `docs/prompt_maestro_follower.md`
- Target longitud: **130-160 palabras. Máximo absoluto: 170 palabras.**
- `max_tokens: 380` — techo seguro para 170 palabras
- El prompt incluye: `poi.name`, `AppState.cityName`, `lang`, contexto de entorno (POIs cercanos en 600m), capítulo anterior completo (_walkChapters[])
- Flujo: cache IndexedDB → Claude API vía Worker (timeout 15s) → fallback genérico
- Nunca mostrar error al usuario — la experiencia no se rompe
- Cache key: `${poiId}_${lang}_${topic}` — sin style desde DA-50

## Regla de Offline — CRÍTICA

| Regla | Descripción |
|-------|-------------|
| Indicador offline | Discreto — nunca modal de error intrusivo |
| Fallback narración | Siempre hay texto de fallback — nunca silencio ni error visible |
| Timeout API | Claude API (vía Worker) máximo 15 segundos — si falla, usar cache |
| IndexedDB | POIs y narraciones en IndexedDB — nunca solo en memoria |
| sw.js | NUNCA commitear antes que los archivos que cachea |

**4 capas de cache:**
```
Capa 1 — sw.js      → shell HTML, CSS, JS
Capa 2 — Leaflet    → tiles del mapa
Capa 3 — IndexedDB  → POIs, narraciones, config
Capa 4 — Cache API  → assets estáticos
```

## Regla de Commits

Un commit por cambio específico. Formato (sin acentos):

```
feat: nueva funcionalidad
fix: bug corregido
docs: documentacion actualizada
refactor: cambio tecnico sin nueva funcionalidad
design: cambio visual o de interfaz
```

## Regla de sw.js — Orden obligatorio

1. `git add [archivos]` → `git commit` → `git push`
2. Esperar 1-2 minutos (GitHub Pages propaga)
3. Recién entonces: `git add sw.js` → `git commit -m "sw.js: bump vX"` → `git push`

**sw.js es siempre el último commit de cualquier deploy.**

## Estado actual

v0.9 — En campo. Primera prueba completada 1 Jul 2026 (Barcelona sim + Cali real).

**Implementado en Sesión 18:**
- DA-50: Narrador único — Prompt Maestro v2.7 — 5 archivos
- DT-26: Weather.invalidateCache() en startTestSession() — removido
- DT-36: cleanPOIName() — sufijos Wikipedia eliminados antes del prompt
- DT-38: _pendingDetect — detectPOI inmediato post-carga (TTF reducido)
- DT-39: _walkChapters[] — memoria de capítulo anterior en buildPrompt
- DT-40: inactividad 30m/10min → onWalkInactivity()
- DT-41: COUNTRY_LANG + getLocalLang() — bienvenida en idioma local
- DT-43: checkSpecialZone() — ≥3 POIs en 150m → Care "zona especial"
- DT-42: mini-prompt de Care redactado (docs/dt42_care_miniprompt.md)

**Fixes post-campo (1 Jul 2026):**
- narration.js: longitud 220-280 → 130-160 palabras, max_tokens 480 → 380
- poi.js: artwork removido de query Overpass (murales de artistas foráneos)
- sw.js: v4

## Pendientes críticos

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-44 | Medir latencia v2.7 en campo real (próxima caminata) | Crítica |
| DT-42 | Implementar Care generativo (prompt ya redactado) | Alta |
| DT-32 | Confirmar cola narrativa en campo | Alta |
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico Cali | Alta |
| DT-45 | UI: pantalla de bienvenida animada | Alta |
| DT-46 | UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración | Media |
| DT-9  | Revocar key OpenAI expuesta (console.openai.com) | Alta |
| DT-1  | Logo SVG final + iconos PWA | Alta |

## El Narrador

Una sola voz. No hay selector de narradores. El Prompt Maestro v2.7 define la voz completa.
Target de longitud: **130-160 palabras. Máximo absoluto: 170.**
Ver `docs/prompt_maestro_follower.md`.

## Stack — No cambiar sin consultar

```
HTML + CSS + JS Vanilla     — sin frameworks
Leaflet.js                  — mapas OpenStreetMap (CartoDB Voyager)
Claude Haiku                — narración AI + Care generativo, vía Cloudflare Worker proxy
Web Speech API              — síntesis de voz nativa (12 idiomas, prioridad latinoamericana)
Wikipedia GeoSearch         — fuente primaria de POIs
Overpass OSM                — fuente secundaria de POIs (fallback)
OpenWeatherMap API          — clima en tiempo real, vía Cloudflare Worker proxy
IndexedDB                   — cache offline
GitHub Pages                — hosting (repo público)
Cloudflare Workers          — proxy de API keys (gratis, sin tarjeta)
PWA                         — instalable
```

**No usar:** React, Vue, Angular, npm, webpack, ni ningún build tool.
**Eliminado en v0.9:** Web Audio API / music.js — la ciudad sonora vive en el prompt narrativo.

## Cache IndexedDB

Clave de narración: `${poiId}_${lang}_${topic}` — sin style desde DA-50.
Limpiar cache en campo cuando se actualice el prompt.

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Shell mínimo — pantallas + modales |
| `manifest.json` | PWA config |
| `sw.js` | Service worker — siempre último en commits |
| `css/main.css` | Variables globales, reset, sistema de fases |
| `css/components.css` | Botones, pills, cards, waves |
| `css/splash.css` | Latido, rings, animación expansión |
| `css/modal.css` | Modales, care card, route picker |
| `css/explore.css` | Mapa, care strip, bottom bar, pills, brújula |
| `css/poi.css` | Pantalla POI expandida |
| `js/keys.js` | Vacío — LOCAL ONLY, .gitignore. Claude y clima vía Worker |
| `js/config.js` | Idioma, mode, volúmenes, localStorage (narrator eliminado en DA-50) |
| `js/app.js` | AppState, setPhase(), navigateTo(), welcomeCity(city, countryCode), onWalkInactivity() |
| `js/gps.js` | Leaflet, watchPosition, Haversine, Nominatim, countryCode, inactividad DT-40 |
| `js/poi.js` | Wikipedia GeoSearch (primaria) + Overpass (fallback), IndexedDB, cola narrativa, DT-38 |
| `js/narration.js` | Claude Haiku vía Worker, Prompt Maestro v2.7, _walkChapters, COUNTRY_LANG, getFarewell() |
| `js/voice.js` | Web Speech API, 12 idiomas BCP-47, prioridad latinoamericana |
| `js/weather.js` | OpenWeatherMap vía Worker, lluvia, cache 30min |
| `js/care.js` | checkCareContext, checkSpecialZone (DT-43), triggers, generación vía Claude |
| `js/routes.js` | Recorridos temáticos, Leaflet polyline, picker |
| `js/debug.js` | Dashboard 3 capas de experiencia, métricas, exportador |
| `js/debug-sim.js` | Simulador GPS, tab Simular, botón Test Care |
| `docs/contexto_maestro.md` | Alma del producto, principios, pregunta rectora |
| `docs/producto.md` | Producto v0.9, usuarios, principios |
| `docs/arquitectura.md` | Decisiones DA-1 a DA-61 |
| `docs/bitacora.md` | Historial, bugs, deuda técnica (hasta Sesión 18) |
| `docs/manifiesto_narrativo.md` | Voz narrativa, capítulos, tesis de ciudad |
| `docs/manifiesto_care_strip.md` | Hospitalidad urbana, voz del cuidado |
| `docs/prompt_maestro_follower.md` | Prompt Maestro v2.7 oficial |
| `docs/dt42_care_miniprompt.md` | Mini-prompt de Care — listo para implementar |

**Nota:** `music.js` fue eliminado en v0.9 (DA-50). No recrear.

## Identidad

Logo: Corazón C2 con brújula · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev

---

*Follower — REGLAS_IA.md | v0.9 post-campo | Julio 2026*
