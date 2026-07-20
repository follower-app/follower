# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

PWA de exploración cinematográfica: narración AI en tiempo real, GPS y cuidado contextual. La ciudad misma es la banda sonora.

Stack: HTML+CSS+JS Vanilla · Leaflet.js · Claude Haiku (Cloudflare Worker `cloudflare/worker.js`, passthrough puro verificado) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks, sin npm, sin build step.

## Regla de Oro

El panel es fotografía estática; el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante cualquier "ya quedó hecho", el árbitro es el código, no el resumen.

**Protocolo de cierre:** commit → panel → estas instrucciones → chat nuevo. En ese orden.

**Deploys:** `index.html` se sirve cache-first y `skipWaiting()` está deshabilitado a propósito (no interrumpir audio activo). Un F5 normal NO trae el HTML más reciente — usar el botón **🔄 Actualizar app** del panel de debug (fuerza `skipWaiting()` bajo demanda) o cerrar todas las pestañas.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto (a S35) · **arquitectura (DA-1 a 85)** · bitacora (a S35) · **manifiesto_narrativo v3.1** · **manifiesto_pois v1.0** · manifiesto_care_strip · prompt_maestro **v3.7** (capítulos) · dt42 · dt45/dt47 (⚠️ dt47 describe wizard de 4 pasos — desactualizado, wizard real ahora tiene 3) · registro_s24 · restauracion_poi_js

## Arquitectura de archivos

index.html · sw.js **v63** (siempre último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stubbed) · assets/ · docs/ · cloudflare/worker.js

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- DA-76: Modo Libre default (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- POIs: cascada DA-72 — wiki local+es → neto<8 → Overpass curado → <3 → en.wiki → IndexedDB. Curar antes de exponer (DA-73). Dedup DT-49: wiki gana, perdedor lega inscription/wikidata
- BUG-060 (cerrado): TextExtracts recorta silencioso >1200 → truncado cliente `EXTRACT_MAX_CHARS=2500`. Misma lección aplicada al extracto de ciudad (`THESIS_EXTRACT_MAX_CHARS`)
- BUG-062/061 (cerrados S34): ver bitácora S34
- **BUG-063 a 067 (cerrados S35):** ver bitácora S35 — interval del title card, carrera de bienvenida resuelta demasiado temprano, `isFirst` contaminado por orden del wizard, mismatch de nombre en debug, botones en pestaña huérfana
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v5**)
- **DT-50:** cambio al Prompt Maestro de capítulos → `PROMPT_VERSION++` MISMO commit (actual: **v3.7**). Clave: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}`
- **v3.7 (VALIDADA 16/16 S32):** scratchpad en grounding wiki — ver docs/prompt_maestro_follower.md
- **DA-75:** userName solo welcome/farewell, nunca a Worker (tampoco al mini-prompt de tesis/prólogo)
- **DA-77 (extendida S35):** una sola puerta de desbloqueo de audio — el tap en la Etapa 2 del title card, igual para primera vez y recurrentes. El Paso 4 del wizard ("corazón") **ya no existe** — wizard de 3 pasos (GPS, idioma, nombre)
- **DA-78:** intro solo primera vez ("Soy Follower") — se antepone al saludo de tesis cuando coinciden (ver DA-85 §1)
- Patrón freeze-while-open (BUG-058): `updateHistCount()` congela rebuild mientras el sheet está `state-expanded`; `force=true` es la única excepción (colapsos/aperturas deliberadas)
- Care y cola narrativa independientes · Narración de capítulos 90-130 palabras (excepcional 150)
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Pregunta rectora: ¿cinematográfico o audioguía?

## DA-85 — Arquitectura Narrativa v1 (§1 completo S35, §3 pendiente)

**§1 — Tesis + Prólogo + Prólogo, EN PRODUCCIÓN (S35):**
- Una sola llamada a Haiku, 3 partes: scratchpad de verificación → tesis (`---`) → prólogo (`===`). `THESIS_PROMPT_VERSION` = v1
- Tesis: epíteto 3-8 palabras, idioma local de la ciudad (`getLocalLang`). Prólogo: 40-60 palabras, idioma del usuario (wizard) — pueden diferir
- Personificación SOLO aquí (única excepción en Follower) · Prohibidos datos literales en ambas piezas
- Cache: store `narrations`, clave `thesis_v1_${cityName}_${tesisLang}_${prologoLang}`, sin fingerprint
- Funciones: `prefetchCityThesis` · `getFreshCityWelcome` (consumo único, voz) · `getCachedCityWelcome` (lectura repetible, tab) · `clearCityThesisCache` (debug)
- **Regla de carrera:** resolución de tesis/prólogo pospuesta hasta el momento REAL de hablar (`_flushPendingWelcome`/`_resolveAndSpeakCityWelcome`), nunca al resolver la ciudad — margen real para que Haiku responda (BUG-064)

**Wizard (3 pasos) → Title card (2 etapas) → Tab de ciudad (3 estados):**
- Wizard: GPS → idioma → nombre. Sin paso de audio — ver DA-77 extendida arriba
- Title card Etapa 1: wordmark+slogan+barra, sin corazón. Etapa 2: corazón latiendo + "toca para escucharme", sin techo. Cross-fade vía `.titlecard-stage`/`.visible`
- Tab (`#nearbySelector`), 3 estados vía clase: `state-closed` (manija) / `state-peek` (ciudad+tesis/genérico+iconos de POI, Variante B sin nombres) / `state-expanded` (+prólogo+lista completa). Sin pill — `bar-pill-right` eliminado
- Primera vez en ciudad: abre expandido narrando (POIs ocultos), colapsa a peek al terminar o con tap. Visitas siguientes: peek directo, sin narrar. Degradación total (sin wiki): peek con texto genérico (`getCityWelcome` reusado), estilo `.welcome-generic`
- Tap en icono de POI → expande + resalta (no narra directo — seguridad caminando)
- Sheet se oculta del todo durante diástole (mini-player), restaura a peek/closed según `AppState._sheetUserClosed`

**Pendiente:** §3 lente narrativa en capítulos (tesis como lente débil, sin scratchpad, en system prompt) · DT-68 (acumular capítulos) · DT-46 (cierre de caminata) → Epílogo

**Derivados:** DT-67 **absorbida** por el rediseño del tab (considerar cerrada) · Pregunta 6 (curaduría) → Fase 2

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · _attachExtracts · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited · activatePOI · activateFromBar · showPOICard/hidePOICard (mini-player diástole, NO narrationText) · renderExpanded/onMarkerTap (screen-poi, SÍ narrationText — pantallas distintas)
narration.js: trigger · getCareMessage · getLocalLang · cleanPOIName · getCityWelcome · getCityIntroFallback · getCityIntroPrefix · sanitizeNarration · buildGroundingBlock · _dt51VerifyAutorFecha · **prefetchCityThesis · getFreshCityWelcome · getCachedCityWelcome · clearCityThesisCache**
care.js: checkCareContext · checkSpecialZone · gps.js: distanceMeters · getRadiusConfig · fetchCityName · updateUserPosition · walkmode.js: start · stop · onMove · isActive
app.js: setPhase · updateExplorePhase · navigateTo · welcomeCity · _resolveAndSpeakCityWelcome · _speakCityWelcome · **_sheetShow · _sheetReopenFromHandle · _sheetExpand · _sheetCollapseToPeek · _sheetUserClose · _showCityWelcomeSheet · _collapseCityWelcomeSheet · _populatePersistentCityHeader · _expandAndHighlightPOI** · updateHistCount · _unlockAudioOnFirstTap · _flushPendingWelcome · _wizComplete (reemplaza a _wizFinish) · _showTitleCard · _showTitleCardTapStage
voice.js: speak · stop · unlockFromGesture · recuperación visibilitychange · SAFETY_MAX_MS=120s
debug.js: **retestCityWelcome · clearAllThesisCache · forceUpdateApp · resetToFirstTime** (nuevas S35)

## Estado actual

v0.9 — **Sesión 35 (20 julio 2026).** DA-85 §1 completo y en producción: tesis+prólogo (una llamada, 3 partes), wizard de 3 pasos, title card de 2 etapas, tab de ciudad rediseñado por completo (3 estados, sin pill, iconos de POI). 5 bugs de campo cerrados (BUG-063 a 067, ver bitácora). 4 herramientas de debug nuevas (Ciudad, Todas las tesis, Actualizar app, Primera vez). sw.js v52→v63. Hallazgo de infraestructura: cache-first de index.html sin skipWaiting explica confusión de pruebas durante toda la sesión — resuelto con botón Actualizar app.

## Pendientes críticos (orden sugerido)

1. **DA-85 §3** — lente narrativa en capítulos (tesis como lente débil, system prompt de POI, sin scratchpad)
2. **DT-68** (acumular capítulos de sesión) → **DT-46** (cierre de caminata) → Epílogo
3. **DT-58** (config post-wizard, sin ratificar) — ítems ya identificados: idioma, nombre, volVoice, casa de DT-56
4. **DT-64** (brújula) · **DT-63** (campo flujo completo) · **DT-61** (+parques, vara Niveles A/B/C)
5. Swipe real para cerrar el peek (hoy: tap, simplificación deliberada de S35) · limpieza CSS huérfano (`.bar-pill-left`, `.bar-heart-wrap`) · logo con ticks más gruesos (sesión de rediseño de interfaz)
6. v3.8 candidatas capítulos (NO abrir sin evidencia): personificación, una-metáfora

## El Narrador

Una sola voz. Prompt Maestro **v3.7** en narration.js (capítulos, es+en espejo). Tesis+prólogo: mini-prompt propio v1 (S35), invariante + idioma por línea en el user prompt, no espejo es/en. Ver docs/prompt_maestro_follower.md.

## Identidad

Corazón C2 con brújula · "your city soundtrack" · DM Serif Display + Inter
App: follower-app.github.io/follower · Worker: followernarration.jaimeand.workers.dev
