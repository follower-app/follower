# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch · GitHub Pages · PWA
Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

**Contexto crítico:** los archivos del panel del proyecto son la fuente de verdad, pero cada chat recibe una *fotografía estática* tomada al iniciar. Si hay sospecha de desfase, el árbitro es el repo en GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). La regresión DA-68 (7 features perdidas) nació de saltarse esta regla.

**Protocolo de cierre de sesión:** commit → actualizar panel de archivos → actualizar estas instrucciones → abrir chat nuevo. En ese orden.

## Documentos del proyecto

- README.md → visión, flujo, pantallas, roadmap
- REGLAS_IA.md → reglas completas de trabajo
- docs/contexto_maestro.md → alma del producto, principios fundamentales, pregunta rectora
- docs/producto.md → producto, usuarios, principios, DTs activas
- docs/arquitectura.md → decisiones DA-1 a DA-73
- docs/bitacora.md → historial, bugs, deuda técnica (hasta Sesión 22)
- docs/manifiesto_narrativo.md → voz narrativa, capítulos, tesis de ciudad
- docs/manifiesto_care_strip.md → hospitalidad urbana, voz del cuidado
- docs/prompt_maestro_follower.md → Prompt Maestro v2.7 oficial
- docs/dt42_care_miniprompt.md → spec de Care generativo (system + prompts por trigger)
- docs/restauracion_poi_js.md → plan de restauración DA-68 (ejecutado — histórico)

## Arquitectura de archivos

```
follower/
├── index.html          → shell mínimo, sin selector de narrador
├── sw.js               → service worker v15 (siempre último en commits)
├── manifest.json       → PWA config
├── css/                → main, splash, explore, poi, modal, components
├── js/                 → app, config, gps, poi, narration, voice,
│                          weather, care, routes, debug, debug-sim
│                          (music.js stubbed — ciudad sonora vive en el prompt)
├── assets/             → logo.svg (pendiente DT-1), icons/
└── docs/               → contexto_maestro, producto, arquitectura,
                           bitacora, manifiesto_narrativo,
                           manifiesto_care_strip, prompt_maestro_follower,
                           dt42_care_miniprompt, restauracion_poi_js
```

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en archivos de audio — `music.js` stubbed
- Modo Libre es default — Modo Recorrido es siempre opt-in
- Offline obligatorio — la experiencia nunca se rompe
- POIs: **cascada compuesta DA-72** — `wiki local+es → si neto < COMPOSITE_THRESHOLD (8) → Overpass nwr curado (Tier 1 siempre; Tier 2 = parks/gardens/fountains solo si sigue el hambre; fusión wiki-gana) → si neto < EMERGENCY_MIN (3) → en.wikipedia → IndexedDB`
- Curaduría OSM: compuerta 0 (sin nombre → fuera) + blacklist (brand, worship por denominación/keywords). **Curar antes de exponer (DA-73):** todo corre antes del store — una sola compuerta protege narrador y Care
- Dedup DT-49: título normalizado sin prefijos de tipología + <25m intra-OSM / 60m inter-fuente; wiki gana siempre; el perdedor lega `inscription`/`wikidata`
- Contrato DT-51: `_source: 'wiki'|'osm'` + `_osmType` — wiki narra con hechos, osm narrará lo observable (pendiente DT-51)
- Wikipedia: cadena de idiomas [local → es] ACUMULA resultados; en.wikipedia es emergencia al FINAL de la cascada (modo `emergencyOnly`) — DA-69 + DA-72. Filtro editorial `gsprop=type` descarta artículos no-lugar — DA-70
- **Versionado del cache de POIs (DA-71):** cualquier cambio en query, filtros o normalización de POIs incrementa `POI_CACHE_VERSION` en el MISMO commit. Criterio nuevo con cache viejo es regresión de datos silenciosa — misma familia que DA-68, en datos en vez de código
- Checklist al tocar poi.js: ¿cambió qué se pide, filtra o normaliza? → `POI_CACHE_VERSION++` · ¿cambió cualquier archivo servido? → sw.js bump, commit final aparte
- Care y cola narrativa son sistemas independientes a propósito: la cola guarda historias (POIs), el Care es momento presente — nunca se encola
- sw.js siempre último en commits
- Nunca mostrar errores al usuario — siempre hay fallback
- Narración: objetivo 130-160 palabras, máximo duro 170 (`max_tokens: 380`)
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

## Funciones únicas — nunca duplicar

- `detectNearby()` / `enqueuePOI()` / `processQueue()` → poi.js
- `fetchWikipediaPOIs()` / `fetchPOIsFromOSM()` → poi.js
- `classifyOSMElement()` / `dedupOSMPOIs()` / `fuseWithWikipedia()` → poi.js (DA-72)
- `markVisited()` / `resetVisited()` → poi.js (API pública)
- `trigger(poi, lang, topic)` → narration.js
- `getFarewell()` → narration.js
- `getCareMessage(type, candidatos, ctx)` → narration.js
- `getLocalLang(countryCode)` → narration.js (única fuente de idioma — DT-41; nunca duplicar con rangos lat/lng)
- `checkCareContext()` / `checkSpecialZone()` → care.js
- `cleanPOIName()` → narration.js
- `distanceMeters()` / `getRadiusConfig()` → gps.js
- `setPhase(phase)` → app.js
- `navigateTo(screen)` → app.js
- `welcomeCity(city)` → app.js

## Estado actual

v0.9 — Sesión 21 completada. **Pipeline Wikipedia corregido tras evidencia
de campo Cali/Pasto:** fusión acumulativa de idiomas (el loop sobrescribía —
causa de los 3 POIs en inglés de Pasto), filtro editorial `gsprop=type`
contra artículos no-lugar (la ciudad misma llegaba como POI y el narrador
alucinaba sobre ella), y purga versionada del cache (`POI_CACHE_VERSION`,
359 POIs heredados purgados). en.wikipedia degradada a emergencia (<3 POIs
acumulados). Commits `71462d9` + `1fef001`. sw.js v13.

Care generativo (DT-42) activo. Pausa por tránsito (DA-55) activa. Narrador
único (Prompt Maestro v2.7) en producción.

Próximo: **validación de campo** — Pasto en simulador (>5 POIs en español,
log de purga v0→v1, log de filtro editorial) + hipótesis TTF pendiente de
Sesión 20.

## Completado en Sesiones 19-21

- Sesión 19: fix query Overpass rota (BUG-045, 100% fallos por 20h de
  campo) · arqueología git de la regresión DA-68 · plan de restauración
- Sesión 20: restauración completa de las 6 features (ver bitácora) ·
  protocolo de cierre de sesión formalizado · DT-48 registrada · sw.js v12
- Sesión 21: causa raíz POIs Pasto (loop sobrescribiente) · filtro
  editorial gsprop · purga versionada del cache · DA-69/70/71 ·
  DT-49/50/51 · BUG-046/047 registrados · sw.js v13

## Pendientes críticos

- **Validación de campo** del pipeline Wikipedia corregido (Pasto en
  simulador) + hipótesis TTF de Sesión 20
- **Triaje Overpass**: 16/16 fallos en campo Sesión 21 (¿recaída BUG-045?)
  — sesión dedicada
- BUG-046: markVisited en narraciones canceladas (re-disparo en bucle —
  fix candidato: marcar visited al iniciar)
- BUG-047: `max_tokens: 380` vs objetivo de palabras del prompt —
  truncamiento a media palabra (decisión de producto)
- DT-9: revocar key OpenAI de commits históricos
- DT-44: medir si la autoevaluación interna del v2.7 afecta latencia
  (antes de tocar más `narration.js`)
- DT-45: UI de bienvenida animada
- DT-47: wizard de configuración (pendiente de diseño)
- DT-48: query Overpass `nwr` (reevaluar con datos de campo)
- DT-49: dedup fina de POIs (diseño listo — título normalizado + <25m)
- DT-50: versionar cache de narraciones (mismo patrón que DA-71)
- DT-51: grounding con extracts (cierra alucinación tipo Pasto)
- DT-19: MP3s de intro no existen — el sistema funciona en silencio sin ellos

## El Narrador

Una sola voz. No hay selector de narradores. El Prompt Maestro v2.7 define
la voz completa — ya implementado en `narration.js`. Ver
`docs/prompt_maestro_follower.md`.

## Identidad

Logo: Corazón C2 con brújula · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev

---

*Follower — REGLAS_IA.md | v0.9 | Sesión 21 | 3 Julio 2026*
