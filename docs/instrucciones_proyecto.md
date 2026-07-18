# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

PWA de exploración cinematográfica: narración AI en tiempo real, GPS y cuidado contextual. La ciudad misma es la banda sonora.

Stack: HTML+CSS+JS Vanilla · Leaflet.js · Claude Haiku (Cloudflare Worker `cloudflare/worker.js`, passthrough puro verificado) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks, sin npm, sin build step.

## Regla de Oro

El panel es fotografía estática; el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante cualquier "ya quedó hecho", el árbitro es el código, no el resumen (DA-68; DT-60 S31; BUG-060 S32).

**Protocolo de cierre:** commit → panel → estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto (a S33) · **arquitectura (DA-1 a 85)** · bitacora (a S33) · **manifiesto_narrativo v3.1** (Estado actualizado S33: Fase 3 = diseño cerrado) · **manifiesto_pois v1.0** (Detectado ≠ Visible ≠ Narrable, Niveles A-D) · manifiesto_care_strip · prompt_maestro **v3.7** · dt42 · dt45/dt47 · registro_s24 · restauracion_poi_js

## Arquitectura de archivos

index.html · sw.js **v49** (siempre último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stubbed) · assets/ · docs/ · cloudflare/worker.js

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- DA-76: Modo Libre default (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- POIs: cascada DA-72 — wiki local+es → neto<8 → Overpass curado → <3 → en.wiki → IndexedDB. Curar antes de exponer (DA-73). Dedup DT-49: wiki gana, perdedor lega inscription/wikidata
- BUG-060 (cerrado): TextExtracts recorta `exchars`>1200 EN SILENCIO → sin `exchars`, truncado cliente `EXTRACT_MAX_CHARS=2500` al último punto. `exintro` nunca cruza encabezados de sección → DT-66
- BUG-062 (cerrado S34): `voice._finish` no distinguía el motivo de cierre → `narration.js` marcaba `visited=true` también en `visibility-recovery`. Fix: `_finish(source)` pasa el motivo a `onEnd(source)`; `visited` se excluye si `source==='visibility-recovery'`
- BUG-061 (cerrado S34): rama principal de `detectPOI()` en poi.js no chequeaba `poi.visited` antes de `activatePOI()` (a diferencia de `enqueuePOI`) → reactivaba POIs ya narrados cuando `activePOI` volvía a `null`. Fix: `!closestPOI.visited` agregado a la condición. `activateFromBar()` queda SIN chequeo a propósito — re-escuchar manual es feature, no bug
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v5**)
- **DT-50:** cambio al Prompt Maestro → `PROMPT_VERSION++` MISMO commit (actual: **v3.7**). Clave narración: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}`
- **v3.7 (VALIDADA 16/16 S32):** scratchpad en grounding wiki — "Verificación obligatoria:"/"Mandatory first check:" + autor/fecha/motivo + presupuesto 90-130 + `---` + capítulo. `sanitizeNarration()` corta el borrador (strip BUG-059 — NO quitar). `MAX_TOKENS=550` (andamiaje, NO longitud). Regla 8 = CIERRE (sin promesa adelante ni pregunta genérica). Anti-regaño en LÍMITES ESTRICTOS. Espejo es/en
- **El scratchpad es LA herramienta probada de cumplimiento.** Reglas que aún fallan (personificación en capítulos, una-metáfora) = candidatas v3.8 con evidencia nueva, NO más redacción
- **DA-85 (S33, diseño cerrado, SIN código):** Arquitectura Narrativa v1 — ver sección propia abajo
- DA-75: userName solo welcome/farewell, nunca a Worker · DA-77: saludo 100% voz, `_unlockAudioOnFirstTap()` puerta única · unlock audio iOS exige gesto DIRECTO · DA-78: intro solo primera vez · DA-84: brújula sin ícono (impl. = DT-64)
- Patrón freeze-while-open (BUG-058): nunca `innerHTML` sobre lista con panel abierto en iOS
- Care y cola narrativa independientes · Narración 90-130 palabras (excepcional 150)
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Pregunta rectora: ¿cinematográfico o audioguía?

## DA-85 — Arquitectura Narrativa v1 (diseño ratificado S33, implementación pendiente)

- **Tesis de ciudad:** frase insignia, 100% Haiku + scratchpad sobre extracto wiki de la ciudad (canal BUG-060-safe). Tráiler no índice. Personificación SOLO en prólogo/tesis (prohibida en capítulos). Cache `${THESIS_PROMPT_VERSION}_${cityName}_${lang}` (nace v1). Degradación en cascada sin cachear, nunca error. **El saludo nunca espera a Haiku**
- **Actos:** NO se modelan en v1 — la tesis es el único arco. Continuidad sigue capítulo-a-capítulo (DT-39/DA-52)
- **Capítulos:** tesis como lente débil en system prompt (nunca literal, nunca forzada), SIN línea de scratchpad. Fingerprint de tesis en clave de cache de narración
- **Epílogo (absorbe DT-53):** disparador ÚNICO = cierre confirmado DT-46, jamás inferencia. Haiku + scratchpad, insumo = capítulos de la caminata (DT-68), bookend con tesis (único lugar donde citarla literal), userName ok (DA-75), sin cache, degradación fija, 0 capítulos → despedida simple
- **Prerequisitos:** DT-60 → Prólogo (commit 1) · DT-46 + DT-68 → Epílogo
- Derivados: DT-67 (tarjeta "Por descubrir", diseño propio con mockup) · DT-68 (acumular capítulos en sesión)
- Aparcado: pregunta 6 (curaduría) → Fase 2 · Modo Curado = nota v2.0

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · _attachExtracts (truncado BUG-060) · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited
narration.js: trigger · getCareMessage · getLocalLang (única fuente idioma, DT-41) · cleanPOIName · getCityWelcome · getCityIntroFallback · sanitizeNarration (strip BUG-059) · buildGroundingBlock (scratchpad wiki) · _dt51VerifyAutorFecha
care.js: checkCareContext · checkSpecialZone · gps.js: distanceMeters · getRadiusConfig · fetchCityName · updateUserPosition · walkmode.js: start · stop · onMove · isActive · app.js: setPhase · navigateTo · welcomeCity · _unlockAudioOnFirstTap · _startWizard · _showTitleCard · voice.js: speak · stop · unlockFromGesture · recuperación visibilitychange · SAFETY_MAX_MS=120s
(getFarewell() aún no existe — nace con el Epílogo DA-85/DT-53)

## Estado actual

v0.9 — **Sesión 34 (18 julio 2026): sesión de bugs.** BUG-062 y BUG-061 cerrados con causa confirmada en código y fix aplicado (voice.js, narration.js, poi.js). sw.js v48→v49. README.md actualizado (estaba desactualizado: sw v4, prompt v2.7, narración 130-160 palabras — reflejaba v0.6-v0.7). Próximo paso: **DT-60** (commit 1 de la implementación de DA-85, sesión anterior — Sesión 33, 17 julio: sesión 100% de diseño, nace DA-85 / Arquitectura Narrativa v1, ver sección propia abajo).

## Pendientes críticos (orden sugerido)

1. **DT-60 reabierta:** dataPromise → fetchCityName (mata BUG-052 y carrera de ciudad) — **commit 1 de la implementación de DA-85**
2. **Implementación DA-85** (tras DT-60): tesis + prólogo → lente en capítulos → DT-68 → epílogo (requiere DT-46)
3. **DT-67** (tarjeta persistente, sesión de diseño con mockup) · **DT-46** (cierre de caminata)
4. **DT-65** (curaduría wiki Nivel D — Fase 2; `POI_CACHE_VERSION++`; pregunta Escasez vs DA-72) · **DT-66** (autor/fecha fuera del intro — instinto: Wikidata P170/P84/P571)
5. **DT-64** (brújula) · **DT-63** (campo flujo completo) · **DT-61 [ticket de interfaz, no confundir con el BUG-061 ya cerrado]** (+parques, vara Niveles A/B/C)
6. v3.8 candidatas (NO abrir sin evidencia): personificación en capítulos y una-metáfora como líneas de scratchpad; extensión scratchpad a OSM
7. Vigilar: voz tardía en escritorio (43-48s, safety rescata) · bienvenida idioma cruzado Safari (¿fuga DT-41?) · background iOS (doc pendiente: análisis Capacitor)

## El Narrador

Una sola voz. Prompt Maestro **v3.7** en narration.js (es+en espejo). Grounding dinámico por `_source` + scratchpad en rama wiki. Ver docs/prompt_maestro_follower.md. La tesis (DA-85) se sumará como lente débil al implementarse.

## Identidad

Corazón C2 con brújula · "your city soundtrack" · DM Serif Display + Inter
App: follower-app.github.io/follower · Worker: followernarration.jaimeand.workers.dev

