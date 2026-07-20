# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

PWA de exploración cinematográfica: narración AI en tiempo real, GPS y cuidado contextual. La ciudad misma es la banda sonora.

Stack: HTML+CSS+JS Vanilla · Leaflet.js · Claude Haiku (Cloudflare Worker `cloudflare/worker.js`) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks, sin npm, sin build step.

## Regla de Oro

El panel es fotografía estática; el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante "ya quedó hecho", el árbitro es el código.

**Protocolo de cierre:** commit → panel → estas instrucciones → chat nuevo.

**Deploys:** `index.html` se sirve cache-first, `skipWaiting()` deshabilitado a propósito. Un F5 normal NO trae el HTML más reciente — usar **🔄 Actualizar app** (panel debug) o cerrar todas las pestañas.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto (a S35) · **arquitectura (DA-1 a 85)** · bitacora (a S35) · manifiesto_narrativo v3.1 · manifiesto_pois v1.0 · manifiesto_care_strip · prompt_maestro **v3.7** (capítulos) · dt45/dt47 (⚠️ dt47 describe wizard de 4 pasos, desactualizado — real: 3 pasos) · registro_s24 · restauracion_poi_js

## Arquitectura de archivos

index.html · sw.js **v63** (último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stub) · assets/ · cloudflare/worker.js

## Reglas críticas

- Sístole `#1a5276` caminando · Diástole `#c0392b` narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- DA-76: Modo Libre default (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- POIs: cascada DA-72 — wiki local+es → neto<8 → Overpass curado → <3 → en.wiki → IndexedDB (DA-73). Dedup DT-49
- BUG-060 (cerrado): TextExtracts trunca silencioso >1200 → cliente `EXTRACT_MAX_CHARS=2500`. Misma lección en `THESIS_EXTRACT_MAX_CHARS`
- **BUG-063 a 067 (cerrados S35, ver bitácora):** interval del title card sin detener · carrera de bienvenida resuelta demasiado temprano · `isFirst` contaminado por orden del wizard · mismatch de nombre en debug · botones en pestaña huérfana
- **DA-71:** query/filtros POIs → `POI_CACHE_VERSION++` mismo commit (v5)
- **DT-50:** Prompt Maestro capítulos → `PROMPT_VERSION++` mismo commit (v3.7). Clave: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}`
- **DA-75:** userName solo welcome/farewell, nunca a Worker (tampoco a tesis/prólogo)
- **DA-77 (extendida S35):** una sola puerta de audio — tap en Etapa 2 del title card, primera vez y recurrente por igual. Paso 4 del wizard ("corazón") **ya no existe** — wizard de 3 pasos
- **DA-78:** intro solo primera vez, se antepone al saludo de tesis cuando coinciden
- BUG-058: `updateHistCount()` congela rebuild mientras `state-expanded`; `force=true` única excepción
- Care y narración independientes · Capítulos 90-130 palabras (excepcional 150)
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Pregunta rectora: ¿cinematográfico o audioguía?

## DA-85 — Arquitectura Narrativa v1 (§1 completo S35, en producción)

**Tesis + Prólogo:** una llamada a Haiku, 3 partes — scratchpad → tesis (`---`, 3-8 palabras, idioma local) → prólogo (`===`, 40-60 palabras, idioma del usuario). `THESIS_PROMPT_VERSION`=v1. Personificación SOLO aquí · sin datos literales. Cache: store `narrations`, clave `thesis_v1_${city}_${tesisLang}_${prologoLang}`.

Funciones: `prefetchCityThesis` · `getFreshCityWelcome` (consumo único, voz) · `getCachedCityWelcome` (repetible, tab) · `clearCityThesisCache` (debug).

**Regla de carrera:** resolución pospuesta hasta hablar de verdad (`_flushPendingWelcome`), nunca al resolver la ciudad (BUG-064).

**Wizard (3 pasos) → Title card (2 etapas) → Tab (3 estados):**
- Wizard: GPS → idioma → nombre, sin paso de audio.
- Title card: Etapa 1 wordmark+barra sin corazón; Etapa 2 corazón latiendo + "toca para escucharme", sin techo.
- Tab `#nearbySelector`: `state-closed` (manija) / `state-peek` (ciudad+tesis o genérico+iconos POI sin nombres) / `state-expanded` (+prólogo+lista). Sin pill — `bar-pill-right` eliminado.
- 1ª vez en ciudad: expandido narrando (POIs ocultos) → colapsa a peek al terminar/tap. Visitas siguientes: peek directo. Sin wiki: peek con texto genérico (`getCityWelcome` reusado, `.welcome-generic`).
- Tap en icono POI → expande+resalta (no narra directo, seguridad caminando).
- Sheet oculto en diástole (evita solape con mini-player), restaura según `_sheetUserClosed`.

**Pendiente:** §3 lente en capítulos · DT-68 (acumular capítulos) · DT-46 (cierre) → Epílogo.
**DT-67 absorbida** por el rediseño del tab — considerar cerrada.

## Funciones únicas — nunca duplicar

poi.js: detectNearby · fetchWikipediaPOIs · _attachExtracts · fetchPOIsFromOSM · dedupOSMPOIs · fuseWithWikipedia · markVisited · activatePOI · activateFromBar · showPOICard (mini-player diástole, NO narrationText) · renderExpanded/onMarkerTap (screen-poi, SÍ narrationText — pantallas distintas)
narration.js: trigger · getCityWelcome · getCityIntroPrefix · sanitizeNarration · buildGroundingBlock · **prefetchCityThesis · getFreshCityWelcome · getCachedCityWelcome · clearCityThesisCache**
app.js: setPhase · updateExplorePhase · welcomeCity · _resolveAndSpeakCityWelcome · **_sheetShow · _sheetReopenFromHandle · _sheetExpand · _sheetCollapseToPeek · _sheetUserClose · _showCityWelcomeSheet · _collapseCityWelcomeSheet · _populatePersistentCityHeader · _expandAndHighlightPOI** · updateHistCount · _wizComplete (reemplaza _wizFinish) · _showTitleCard · _showTitleCardTapStage
debug.js: **retestCityWelcome · clearAllThesisCache · forceUpdateApp · resetToFirstTime**

## Estado actual

v0.9 — **Sesión 35 (20 jul 2026).** DA-85 §1 completo en producción: tesis+prólogo (1 llamada, 3 partes), wizard 3 pasos, title card 2 etapas, tab de ciudad rediseñado (3 estados, sin pill, iconos POI). 5 bugs cerrados (BUG-063 a 067). 4 herramientas debug nuevas. sw.js v52→v63. Hallazgo: `index.html` cache-first sin `skipWaiting` explica confusión de pruebas toda la sesión — resuelto con Actualizar app.

## Pendientes críticos (orden sugerido)

1. **DA-85 §3** — lente narrativa en capítulos (system prompt, sin scratchpad)
2. **DT-68** (acumular capítulos) → **DT-46** (cierre) → Epílogo
3. **DT-58** (config post-wizard, sin ratificar) — idioma, nombre, volVoice, casa de DT-56
4. DT-64 (brújula) · DT-63 (campo completo) · DT-61 (+parques, niveles A/B/C)
5. Swipe real para cerrar peek (hoy: tap, simplificación S35) · limpiar CSS huérfano (`.bar-pill-left`, `.bar-heart-wrap`) · logo con ticks más gruesos
6. v3.8 candidatas capítulos (NO abrir sin evidencia)

## El Narrador

Una sola voz. Prompt Maestro **v3.7** (capítulos, es+en espejo). Tesis+prólogo: mini-prompt propio v1, invariante + idioma por línea, no espejo es/en.

## Identidad

Corazón C2 con brújula · "your city soundtrack" · DM Serif Display + Inter
App: follower-app.github.io/follower · Worker: followernarration.jaimeand.workers.dev
