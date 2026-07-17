# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

PWA de exploración cinematográfica: narración AI en tiempo real, GPS y cuidado contextual convierten cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker, `cloudflare/worker.js` en el repo — passthrough puro verificado) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Nunca trabajar sobre versiones desactualizadas: el panel es fotografía estática; el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). Ante cualquier "ya quedó hecho", el árbitro es el código, no el resumen (DA-68; DT-60 reabierta S31; BUG-060 S32: un fix que "funcionó" nunca funcionó — la API recortaba en silencio).

**Protocolo de cierre:** commit → actualizar panel → actualizar estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro · producto (DTs + bugs a S32) · arquitectura (DA-1 a 84) · bitacora (a S32) · **manifiesto_narrativo v3.1** (con "Estado de implementación") · **manifiesto_pois v1.0** (Detectado ≠ Visible ≠ Narrable, Niveles A-D) · manifiesto_care_strip · prompt_maestro **v3.7** · dt42 · dt45/dt47 · registro_s24 · restauracion_poi_js

## Arquitectura de archivos

index.html · sw.js **v48** (siempre último en commits) · manifest.json · css/ · js/ (app, config, gps, poi, narration, voice, weather, care, walkmode, routes, debug, debug-sim; music.js stubbed) · assets/ · docs/ · cloudflare/worker.js

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- DA-76: Modo Libre default (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- POIs: cascada DA-72 — wiki local+es → si neto < 8 → Overpass curado → si < 3 → en.wiki → IndexedDB. Curar antes de exponer (DA-73). Dedup DT-49: wiki gana, perdedor lega inscription/wikidata
- **BUG-060 (S32, cerrado):** la API TextExtracts acepta `exchars` 1-1200 y recorta valores mayores EN SILENCIO. Fix: sin `exchars`, truncado en cliente a `EXTRACT_MAX_CHARS=2500` con retroceso al último punto. Límite estructural restante: `exintro` NUNCA entrega datos tras un encabezado de sección → DT-66
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v5**)
- **DT-50:** cambio al Prompt Maestro → `PROMPT_VERSION++` MISMO commit (actual: **v3.7**). Clave narración: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}` — el fingerprint auto-invalida al cambiar el extracto (pagó en S32)
- **v3.7 (S32, VALIDADA 4/4 Sagrada Família + 4/4 Maceta):** scratchpad deliberado en grounding wiki — respuesta en 2 partes: "Verificación obligatoria:"/"Mandatory first check:" + enumeración autor/fecha/motivo + presupuesto 90-130 + `---` + capítulo. `sanitizeNarration()` corta el borrador (strip BUG-059 — NO quitar). `MAX_TOKENS=550` (capacidad de andamiaje, NO reabre hipótesis 3 de S27b). Regla 8 = CIERRE (sin promesa hacia adelante, sin pregunta genérica). Regla anti-regaño en LÍMITES ESTRICTOS (ante contradicción ciudad-extracto: confiar en extracto, jamás romper personaje). Nota anti-conflicto en VERIFICACIÓN FINAL. Espejo fiel es/en
- **El scratchpad es LA herramienta probada de cumplimiento:** autor/fecha 0/n en 5 sesiones → 4/4 con scratchpad. Longitud 4/4 violada → 0/11. Reglas que aún fallan (personificación 2/3 Maceta-t2; una-metáfora) = candidatas a líneas de scratchpad en v3.8, NO a más redacción
- DA-75: userName solo welcome/farewell, nunca a Worker · DA-77: saludo 100% voz, `_unlockAudioOnFirstTap()` puerta única · Veredicto plataforma (S31): unlock de audio iOS exige gesto DIRECTO — jamás desde timer · DA-78: intro solo primera vez (`introHeard` en onEnd) · DA-84: brújula sin ícono (implementación = DT-64)
- Patrón freeze-while-open (BUG-058): nunca `innerHTML` sobre lista con panel abierto en iOS
- Care y cola narrativa independientes · Narración 90-130 palabras (excepcional 150)
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Pregunta rectora: ¿cinematográfico o audioguía?

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · _attachExtracts (truncado cliente BUG-060) · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited
narration.js: trigger · getCareMessage · getLocalLang (única fuente idioma — DT-41) · cleanPOIName · getCityWelcome · getCityIntroFallback · sanitizeNarration (strip BUG-059) · buildGroundingBlock (S32: scratchpad wiki) · _dt51VerifyAutorFecha (loguea solo si veredicto ≠ sin_candidatos)
care.js: checkCareContext · checkSpecialZone · gps.js: distanceMeters · getRadiusConfig · fetchCityName · updateUserPosition · walkmode.js: start · stop · onMove · isActive · app.js: setPhase · navigateTo · welcomeCity · _unlockAudioOnFirstTap · _startWizard · _showTitleCard · voice.js: speak · stop · unlockFromGesture · recuperación visibilitychange · SAFETY_MAX_MS=120s
(getFarewell() nunca existió — DT-53)

## Estado actual

v0.9 — **Sesión 32 completada (17 julio 2026): la más productiva del proyecto.** DT-62 CERRADA (canal `system` verificado: código + curl al Worker). v3.7 validada con 11 corridas en 3 tandas n=4: **primer "cumple" del detector DT-51 en la historia — 4/4 Gaudí+1882 tejidos en Sagrada Família**, 0/11 violaciones de longitud (vs 4/4 en S31), 0/11 promesas hacia adelante, 11/11 scratchpads limpios. BUG-060 encontrado, arreglado y verificado en campo (extracto Maceta 1332 chars, triple confirmación consola). **DT-51 → CIERRE PARCIAL** (misión cumplida; DT-66 hereda el caso fuera-de-intro). Manifiestos narrativo v3.1 y POIs v1.0 adoptados. Ruta de tres fases ratificada: F1 v3.7 (✔ hoy) → F2 curaduría (DT-65) → F3 Arquitectura Narrativa.

## Pendientes críticos (orden sugerido)

1. **PRÓXIMO CHAT DEDICADO — Sesión de diseño de Arquitectura Narrativa (Fase 3):** tesis de ciudad, tema/actos, epílogo (absorbe DT-53); base: los dos manifiestos + 6 preguntas (bitácora S32). Prerequisito: DT-60. El scratchpad validado es el vehículo de cumplimiento
2. **BUG-062 (fix 1b, TRES ocurrencias documentadas):** visibility-recovery marca `visited=true` sobre narración interrumpida — capítulo perdido. Fix propuesto sin ratificar: no marcar visited en ese camino (cache hace el re-disparo gratis). Ratificar y aplicar — es pequeño
3. **BUG-061:** re-narración de POI visitado al salir de modo caminata por tap (2/2 Edge+Chrome). Confirmar en código walkmode.js/app.js antes de tocar
4. **DT-60 reabierta:** dataPromise → fetchCityName (mata BUG-052 y carrera de ciudad; prerequisito F3)
5. **DT-65** (curaduría wiki Nivel D — estaciones MIO/metro; `POI_CACHE_VERSION++`; pregunta Escasez vs DA-72) · **DT-66** (autor/fecha fuera del intro: Wikidata P170/P84/P571 vs fetch completo — instinto: Wikidata)
6. **DT-64** (brújula) · **DT-63** (campo flujo completo) · **DT-61** (+parques, con Niveles A/B/C del manifiesto como vara)
7. v3.8 candidatas (NO abrir sin evidencia nueva): personificación y una-metáfora como líneas de scratchpad; extensión scratchpad a OSM
8. Vigilar: voz tardía TAMBIÉN en escritorio (43-48s, safety rescata) · bienvenida idioma cruzado Safari (wizard en, saludo es — ¿fuga DT-41?) · limitación background iOS (doc pendiente como DA: análisis Capacitor al cierre de S31)

## El Narrador

Una sola voz. Prompt Maestro **v3.7** — implementado en narration.js (es+en espejo). Grounding dinámico por `_source` + scratchpad en rama wiki. Ver docs/prompt_maestro_follower.md.

## Identidad

Corazón C2 con brújula · "your city soundtrack" · DM Serif Display + Inter
App: https://follower-app.github.io/follower/ · Worker: https://followernarration.jaimeand.workers.dev
