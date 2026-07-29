# 🎬 Follower — Instrucciones del Proyecto

---

## PARTE 1 — IDENTIDAD Y PRINCIPIOS *(estable — no reescribir cada sesión)*

### Qué es Follower

PWA de exploración cinematográfica: narración AI en tiempo real vía GPS, más cuidado contextual. No es un mapa, no es una audioguía, no es Wikipedia hablada — es "el amigo más culto que conoces", un acompañante invisible, no un dispositivo. La ciudad es la banda sonora.

Stack: HTML+CSS+JS Vanilla · Leaflet.js · Claude Haiku (Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · Nominatim · GitHub Pages · PWA. Sin frameworks, sin npm, sin build step.

### La pregunta rectora

**¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?** Si acerca a audioguía, es la decisión equivocada — este es el filtro para toda decisión de producto, no un eslogan.

*Ejemplo real de un rechazo por este criterio:* el cono de brújula en el mapa se descartó como elemento *siempre visible* (se siente a herramienta de navegación, audioguía) y se rediseñó para aparecer **solo cuando hay un POI activo narrando** — el compañero te ayuda a encontrar lo que está por contarte, no te guía como un GPS.

### Metáfora central

Sístole (`#1a5276`, caminando) / Diástole (`#c0392b`, narrando) — nunca invertir los colores. El logo (corazón-brújula) tampoco se invierte nunca: invertido se lee como audífonos, contradice la identidad anti-audioguía.

### Invariantes que rompen la experiencia si se tocan sin pensarlo

- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores crudos al usuario
- Una sola puerta de desbloqueo de audio (DA-77): el tap en la Etapa 2 del title card, igual primera vez y recurrente
- Personificación de la ciudad (voz propia, primera persona) SOLO en tesis/prólogo — en ningún otro texto
- `userName` solo vive en welcome/farewell, nunca llega al Worker (DA-75)
- Care y cola narrativa son independientes por diseño (cuidado es hospitalidad de presente; capítulos son historias que pueden esperar)

### Regla de Oro

El panel es fotografía estática; el árbitro real es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante "ya quedó hecho", se verifica el código, no el resumen.

**Protocolo de cierre de sesión:** commit → panel (producto/bitácora/arquitectura) → estas instrucciones (solo Parte 2) → chat nuevo.

**Deploys:** `index.html` se sirve cache-first, `skipWaiting()` deshabilitado a propósito (no interrumpir audio activo). F5 normal NO trae lo último — usar **🔄 Actualizar app** del panel de debug o cerrar todas las pestañas. Archivo servido cambió → `sw.js` bump, commit final aparte.

**Convenciones de tickets:** DA (decisión de arquitectura) / DT (deuda técnica) / BUG. Cambios a `POI_CACHE_VERSION`, `PROMPT_VERSION` o `THESIS_PROMPT_VERSION` van en el MISMO commit que el cambio que los motiva.

### Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto · **arquitectura** (histórico completo de decisiones DA) · bitacora (histórico de sesiones) · manifiesto_narrativo · manifiesto_pois · manifiesto_care_strip · prompt_maestro · dt42 · dt45/dt47 (⚠️ desactualizado, wizard describe 4 pasos) · registro_s24 · restauracion_poi_js

### Arquitectura de archivos

index.html · sw.js (siempre último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stubbed) · assets/ · docs/ · cloudflare/worker.js

### Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · _attachExtracts · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited · activatePOI · activateFromBar · showPOICard/hidePOICard (mini-player) · renderExpanded/onMarkerTap (screen-poi)
narration.js: trigger · getCareMessage · getLocalLang · cleanPOIName · getCityWelcome · getCityIntroFallback/Prefix · sanitizeNarration · buildGroundingBlock · _fetchCityExtract · prefetchCityThesis · getFreshCityWelcome · getCachedCityWelcome · whenCityWelcomeReady · clearCityThesisCache
care.js: checkCareContext · checkSpecialZone | gps.js: distanceMeters · getRadiusConfig · fetchCityName · _parseWikiTag · updateUserPosition | walkmode.js: start/stop/onMove/isActive
app.js: setPhase · updateExplorePhase · navigateTo · welcomeCity · _resolveAndSpeakCityWelcome/_speakCityWelcome · _sheetShow/Expand/CollapseToPeek/UserClose/ReopenFromHandle · _showCityWelcomeSheet/_collapseCityWelcomeSheet · _populatePersistentCityHeader · _expandAndHighlightPOI · updateHistCount · _unlockAudioOnFirstTap · _flushPendingWelcome · _wizComplete · _showTitleCard/_showTitleCardTapStage
voice.js: speak · stop · unlockFromGesture · recuperación visibilitychange
debug.js: retestCityWelcome · clearAllThesisCache · forceUpdateApp · resetToFirstTime

---

## PARTE 2 — ESTADO DE SESIÓN *(delta — reescribir cada cierre, mantener corta)*

**Versiones actuales:** sw.js **v68** · `THESIS_PROMPT_VERSION`=**v5** · `POI_CACHE_VERSION`=**v5** · Prompt Maestro **v3.7** (capítulos, validada 16/16 S32) · arquitectura DA-1 a **87** · docs a **Sesión 36c** (29 jul 2026)

**Cerrado esta sesión (S36c) — detalle completo en bitácora S36c, no repetir aquí:**
- BUG-068 (fix definitivo, ver DA-87) — pendiente validación de campo en Palmira
- BUG-070 (prólogo huérfano en visitas recurrentes) — pendiente validación de campo

**Mecanismos activos que un chat nuevo debe conocer sin ir a buscar (ver DA-85/86/87 en arquitectura.md para el detalle):**
- DA-86: tab de ciudad muestra tesis+prólogo siempre (sesión 1 o 50); solo narra la primera vez por ciudad (marca durable)
- DA-87: título canónico de Wikipedia vía tag OSM (Nominatim `zoom=10&extratags=1`), con cascada de adivinanza como fallback si no hay tag
- `_CITY_NEGATIONS` (v3): red secundaria, ya no defensa primaria — retiro condicionado (DT-71)

**Pendientes críticos (orden sugerido):**
1. Validación de campo BUG-068 v5 — Palmira, confirmar sin Siria/Zenobia
2. Validación de campo BUG-070 — ciudad ya narrada, expandir tab, confirmar prólogo
3. DT-69 — guarda por coordenadas (red adicional a DA-87)
4. Validación DA-86 en Cali — ciudad con POIs reales, sin homónima
5. DA-85 §3 — lente narrativa en capítulos. Prerrequisito: #1 y #4
6. DT-71 — retiro `_CITY_NEGATIONS`, condicionado a #1
7. DT-68 → DT-46 → Epílogo
8. DT-58 (config post-wizard) · DT-64 (brújula) · DT-63 · DT-61 (+parques) · DT-70 (limpieza debug.js)
9. DT-9 — único riesgo de seguridad activo (key en historial git)
10. Swipe real para peek · limpieza CSS huérfano · logo ticks más gruesos
