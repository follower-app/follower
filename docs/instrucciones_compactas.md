# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

PWA de exploración cinematográfica: narración AI en tiempo real, GPS y cuidado contextual. La ciudad misma es la banda sonora.

Stack: HTML+CSS+JS Vanilla · Leaflet.js · Claude Haiku (Cloudflare Worker `cloudflare/worker.js`) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks, sin npm, sin build step.

## Regla de Oro

El panel es fotografía estática; el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante "ya quedó hecho", el árbitro es el código.

**Protocolo de cierre:** commit → panel → estas instrucciones → chat nuevo.

**Deploys:** `index.html` se sirve cache-first, `skipWaiting()` deshabilitado a propósito. Un F5 normal NO trae el HTML más reciente — usar **🔄 Actualizar app** (panel debug) o cerrar todas las pestañas.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto (a S36) · **arquitectura (DA-1 a 86)** · bitacora (a S36) · manifiesto_narrativo v3.1 · manifiesto_pois v1.0 · manifiesto_care_strip · prompt_maestro **v3.7** (capítulos) · dt45/dt47 (⚠️ dt47 describe wizard de 4 pasos, desactualizado — real: 3 pasos) · registro_s24 · restauracion_poi_js

## Arquitectura de archivos

index.html · sw.js **v64** (último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stub) · assets/ · cloudflare/worker.js

## Reglas críticas

- Sístole `#1a5276` caminando · Diástole `#c0392b` narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- DA-76: Modo Libre default (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- POIs: cascada DA-72 — wiki local+es → neto<8 → Overpass curado → <3 → en.wiki → IndexedDB (DA-73). Dedup DT-49
- BUG-060 (cerrado): TextExtracts trunca silencioso >1200 → cliente `EXTRACT_MAX_CHARS=2500`. Misma lección en `THESIS_EXTRACT_MAX_CHARS`
- **BUG-063 a 067 (cerrados S35):** interval del title card · carrera de bienvenida · `isFirst` contaminado · mismatch nombre debug · botones en pestaña huérfana
- **BUG-068 (cerrado S36):** tesis alucinaba ciudad homónima (Palmira CO → Palmira Siria) — `THESIS_PROMPT_VERSION` v2, prohibición explícita + línea Pertenencia en scratchpad
- **BUG-069 (absorbida S36 → DA-86):** tesis hablada saltada en returning-user — carrera eliminada, `whenCityWelcomeReady()`
- **DA-71:** query/filtros POIs → `POI_CACHE_VERSION++` mismo commit (v5)
- **DT-50:** Prompt Maestro capítulos → `PROMPT_VERSION++` mismo commit (v3.7)
- **DA-75:** userName solo welcome/farewell, nunca a Worker (tampoco a tesis/prólogo)
- **DA-77 (extendida S35):** una sola puerta de audio — tap en Etapa 2 del title card. Wizard de 3 pasos (GPS, idioma, nombre) — el paso 4 ("corazón") ya no existe
- **DA-78:** intro "Soy Follower" solo primera vez, se antepone al saludo de tesis cuando coinciden
- BUG-058: `updateHistCount()` congela rebuild mientras `state-expanded`; `force=true` única excepción
- Care y narración independientes · Capítulos 90-130 palabras (excepcional 150)
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Pregunta rectora: ¿cinematográfico o audioguía?

## DA-85 — Arquitectura Narrativa v1 (§1 S35, en producción)

**Tesis + Prólogo:** una llamada a Haiku, 3 partes — scratchpad → tesis (`---`, 3-8 palabras, idioma local) → prólogo (`===`, 40-60 palabras, idioma del usuario). `THESIS_PROMPT_VERSION`=v2 (S36: anti-homónimo). Personificación SOLO aquí · sin datos literales. Cache: store `narrations`, clave `thesis_v2_${city}_${tesisLang}_${prologoLang}`.

**DA-86 (S36) — enmienda a DA-85 §1:**
- **Mostrar siempre** (tesis es identidad de ciudad, no anuncio): fuente `whenCityWelcomeReady()` — resolvedor esperable, no consumible.
- **Narrar una vez** por ciudad: gate `Config.isCityNarrated(city)` / `Config.markCityNarrated(city)` — marca durable en localStorage, independiente de idioma/userName, sobrevive desalojo de IndexedDB de iOS.
- **Genérico solo en degradación real** (sin artículo Wikipedia, Haiku caído, offline) — se narra igual, nunca silencioso.
- **El tap es la pista:** el title card espera `whenCityWelcomeReady()` antes de habilitar la Etapa 2 — la carrera de DA-85 queda eliminada. Techo de seguridad 8s→15s.
- **Ancla de ciudad `CITY_ANCHOR_KM=10`** reemplaza `CITY_UPDATE_KM=0.5` (que nunca se disparaba caminando). Gate de ciudad: comparación real `AppState.cityName !== resolved`, no `isFirst`. Guard de reentrada `_cityFetchInFlight` en `fetchCityName`.
- `AppState.cityShort` — nombre sin país, clave canónica.

**Wizard (3 pasos) → Title card (2 etapas) → Tab (3 estados):**
- Wizard: GPS → idioma → nombre.
- Title card: Etapa 1 wordmark+barra ("componiendo la bienvenida..." como 3ª compuerta real); Etapa 2 corazón+tap.
- Tab: `state-closed` / `state-peek` (ciudad+tesis+iconos POI) / `state-expanded` (+prólogo+lista).
- Ciudad no narrada: expandido narrando → colapsa a peek. Ciudad ya narrada: peek directo con tesis visible. Degradación: peek con genérico.

**Pendiente:** §3 lente en capítulos · DT-68 (acumular capítulos) · DT-46 (cierre) → Epílogo.

## Funciones únicas — nunca duplicar

poi.js: detectNearby · fetchWikipediaPOIs · _attachExtracts · fetchPOIsFromOSM · dedupOSMPOIs · fuseWithWikipedia · markVisited · activatePOI · activateFromBar · showPOICard (mini-player diástole, NO narrationText) · renderExpanded/onMarkerTap (screen-poi, SÍ narrationText)
narration.js: trigger · getCityWelcome · getCityIntroPrefix · sanitizeNarration · buildGroundingBlock · **prefetchCityThesis · getFreshCityWelcome · getCachedCityWelcome · whenCityWelcomeReady · clearCityThesisCache**
config.js: **isCityNarrated · markCityNarrated** (DA-86)
app.js: setPhase · updateExplorePhase · welcomeCity · _resolveAndSpeakCityWelcome · **_sheetShow · _sheetReopenFromHandle · _sheetExpand · _sheetCollapseToPeek · _sheetUserClose · _showCityWelcomeSheet · _collapseCityWelcomeSheet · _populatePersistentCityHeader · _expandAndHighlightPOI** · updateHistCount · _wizComplete · _showTitleCard · _showTitleCardTapStage
debug.js: **retestCityWelcome · clearAllThesisCache · forceUpdateApp · resetToFirstTime**

## Estado actual

v0.9 — **Sesión 36 (27 jul 2026).** DA-86 implementada: tesis persistente por ciudad (mostrar siempre/narrar una vez), marca durable `narratedCities`, `whenCityWelcomeReady()`, ancla `CITY_ANCHOR_KM=10`. BUG-068 cerrado: `THESIS_PROMPT_VERSION` v2 anti-homónimo. BUG-069 absorbida por DA-86. sw.js v63→v64.

## Pendientes críticos (orden sugerido)

1. **Validación de campo DA-86** — primera apertura real en cada ciudad (n≥4) antes de cerrar
2. **DA-85 §3** — lente narrativa en capítulos (system prompt, sin scratchpad). Prerrequisito: DA-86 validada
3. **DT-68** (acumular capítulos) → **DT-46** (cierre) → Epílogo
4. **DT-58** (config post-wizard, sin ratificar) — idioma, nombre, volVoice, casa de DT-56
5. DT-64 (brújula) · DT-63 (campo completo) · DT-61 (+parques, niveles A/B/C)
6. **DT-9** — único ítem con riesgo de seguridad activo (key en historial de git)
7. Swipe real para cerrar peek · limpiar CSS huérfano (`.bar-pill-left`, `.bar-heart-wrap`) · logo con ticks más gruesos

## El Narrador

Una sola voz. Prompt Maestro **v3.7** (capítulos, es+en espejo). Tesis+prólogo: mini-prompt propio v2 (S36), invariante + idioma por línea, no espejo es/en.

## Identidad

Corazón C2 con brújula · "your city soundtrack" · DM Serif Display + Inter
App: follower-app.github.io/follower · Worker: followernarration.jaimeand.workers.dev
