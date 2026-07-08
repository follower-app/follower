# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM (fuente compuesta) · GitHub Pages · PWA. Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

**Contexto crítico:** el panel es la fuente de verdad, pero cada chat recibe una *fotografía estática* al iniciar. Ante sospecha de desfase, el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). La regresión DA-68 (7 features perdidas) nació de saltarse esta regla.

**Protocolo de cierre:** commit → actualizar panel → actualizar estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro (alma, pregunta rectora) · producto (DTs activas, visión v2.0 accesibilidad) · arquitectura (DA-1 a DA-78) · bitacora (hasta S25d) · manifiesto_narrativo (voz v3.0) · manifiesto_care_strip · prompt_maestro_follower (oficial) · dt42_care_miniprompt · dt45_bienvenida_animada (enmendada S24) · dt47_wizard_mockup_final.html (mockup ratificado) · registro_sesion24_interfaz · restauracion_poi_js (histórico)

## Arquitectura de archivos

index.html (shell mínimo) · sw.js v22 (siempre último en commits) · manifest.json · css/ (main, splash, explore, poi, modal, components, wizard) · js/ (app, config, gps, poi, narration, voice, weather, care, routes, debug, debug-sim; music.js stubbed) · assets/ (logo pendiente DT-1) · docs/

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en audio — music.js stubbed
- **DA-76:** Modo Libre default, sin pantalla de modo. Recorrido opt-in desde explore (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- Offline obligatorio — la experiencia nunca se rompe
- POIs: **cascada compuesta DA-72** — wiki local+es → si neto < COMPOSITE_THRESHOLD (8) → Overpass nwr curado (Tier 1 siempre; Tier 2 solo si sigue el hambre; fusión wiki-gana) → si neto < EMERGENCY_MIN (3) → en.wikipedia → IndexedDB
- Curaduría OSM: compuerta 0 (sin nombre → fuera) + blacklist. **Curar antes de exponer (DA-73)**
- Dedup DT-49: título normalizado + <25m intra-OSM / 60m inter-fuente; wiki gana; el perdedor lega inscription/wikidata
- Contrato DT-51: `_source: 'wiki'|'osm'` + `_osmType` — wiki narra con hechos, osm narrará lo observable (pendiente DT-51)
- Wikipedia: cadena [local → es] ACUMULA; en.wikipedia es emergencia FINAL — DA-69/72. Filtro `gsprop=type` — DA-70
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v3**)
- **DT-50:** cambio al Prompt Maestro → `PROMPT_VERSION++` MISMO commit (actual: **v3.0**). Clave: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}`
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Care y cola narrativa independientes: la cola guarda historias, Care es presente — nunca se encola
- Nunca mostrar errores al usuario — siempre hay fallback
- Narración: 90–130 palabras, excepcional 150 (`max_tokens: 380`)
- **DA-75:** userName en Config (localStorage), solo welcome/farewell. NUNCA en capítulos ni Care. NUNCA viaja al Worker. Fallback sin nombre siempre funcional
- **DA-77:** saludo de ciudad 100% voz. Voz bloqueada al llegar → pendiente, suena en primer gesto; TTL ~90s → descarte silencioso. `_audioUnlocked` es POR CARGA DE PÁGINA — initExplore no la resetea; `_unlockAudioOnFirstTap()` es la puerta ÚNICA (wizard, title card y explore convergen ahí)
- **DA-78:** "Soy Follower" es presentación, no bienvenida recurrente. Suena fusionado con el saludo de ciudad SOLO la primera vez que efectivamente se pronuncia (`introHeard` en Config, marcada solo en `onEnd` de `Voice.speak` — un intento fallido no gasta la oportunidad). Wizard paso 4 ya no habla frase de muestra; el desbloqueo de `Voice.unlockFromGesture()` siempre fue silencioso internamente
- **Hook de campo `?reset=1`:** limpia localStorage y simula primera vez — vía práctica para iPhone sin Web Inspector/consola. No toca IndexedDB. Destino a decidir junto con DT-8 antes de v1.0
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited
narration.js: trigger(poi,lang,topic) · getCareMessage · getLocalLang (única fuente de idioma — DT-41) · cleanPOIName · getCityWelcome(city,name,lang,includeIntro) · getCityIntroFallback(name,lang)
care.js: checkCareContext · checkSpecialZone
gps.js: distanceMeters · getRadiusConfig · fetchCityName (instrumentada S25d — puente a DT-60)
app.js: setPhase · navigateTo · welcomeCity (habla, no muestra) · _unlockAudioOnFirstTap · _startWizard · _showTitleCard
(getFarewell() nunca existió — ver DT-53)

## Estado actual

v0.9 — Sesión 25 completada (con extensiones S25b/c/d/e/f): **flujo de entrada implementado y en producción**, saludo fusionado (DA-78), BUG-048 y BUG-049 CERRADOS (el saludo real de ciudad ya suena, y `?reset=1` ahora resetea Config en memoria de verdad), próximo rediseño (DT-60) definido y listo para sesión propia. sw.js v22. POI_CACHE_VERSION v3. Prompt Maestro v3.0 (DA-74).

Flujo actual (vigente hasta que DT-60 se implemente): splash decorativo (sin prompt GPS en 1ª vez) → wizard 4 pasos (GPS priming → idioma autodetect → nombre opcional → corazón desbloquea en silencio) → title card (fade puro, tap salta y desbloquea, techo 4s) → explore → saludo de ciudad hablado; primerísima vez incluye "Soy Follower" (DA-78).

**Diagnóstico de campo (S25d, log real de iPhone):** GPS y POIs funcionan bien (9 POIs en 665ms); `fetchCityName()` (Nominatim) falló silenciosamente sin dejar rastro — instrumentada esta sesión, próximo log dirá la causa real. Worker 400 al arranque es un healthcheck, no un error.

**Timing en mano (fijar en caminata):** fade-in ~1.8s · techo 4s · TTL saludo 90s.

## Completado en Sesiones 21-25

- S21: causa raíz POIs Pasto · gsprop · DA-69/70/71 · sw.js v13
- S22: fuente compuesta DT-52 (DA-72/73) · dedup+fusión · contrato _source · sw.js v15
- S23: Prompt Maestro v3.0 (DA-74) · DT-50 cerrada · BUG-047 cerrada · sw.js v16
- S24: diseño interfaz — DT-47 · DT-45 title card · DA-75 · DT-54/55 · visión accesibilidad · cero código
- S25: implementación entrada — DT-45/47 CERRADAS · DA-75 implementada · DA-76/77 · DT-9 CERRADA (key revocada) · DT-56/57 registradas · fix _audioUnlocked · poi.css al precache · sw.js v17
- S25b: hook de campo `?reset=1` (iPhone sin Web Inspector) · sw.js v18
- S25c: fusión de saludos — DA-78, bandera `introHeard`, wizard sin frase de muestra, fix de bug propio (WIZ_PHRASE) · sw.js v19
- S25d: diagnóstico de campo con log real (Worker 400 descartado, causa de fetchCityName aislada) · instrumentación puente en gps.js · **DT-60 registrada** (mover carga real al wizard, splash estático) · sw.js v20
- S25e: **BUG-048 CERRADO** — `updateTopPill()` huérfana desde refactor de v0.6 (arqueología de git confirmó causa raíz), 5 llamadas corregidas a `updateCareStrip()` en app.js/gps.js. El saludo de ciudad real ya suena · sw.js v21
- S25f: **BUG-049 CERRADO** — `?reset=1` no reseteaba `Config` en memoria (orden de carga de scripts: config.js antes que app.js); `introHeard` sobrevivía stale. Fix: `Config.reset()` explícito en el hook. Nunca afectó producción, solo la herramienta de prueba · sw.js v22

## Pendientes críticos

- **DT-60 (registrada, próxima sesión de código mayor):** mover GPS/ciudad/POIs al wizard paso 2 + title card; splash pasa a estático (sin latido, sin mensajes falsos). Piedra técnica: Leaflet necesita contenedor visible — separar adquisición de datos de construcción del mapa (`onPosition()` en gps.js). Flujo objetivo completo en bitácora S25d. Requiere ratificación punto por punto, mismo rigor que DT-45/47
- **BUG-046 → micro-sesión propia ANTES de la caminata (B ratificada S25).** Fix candidato "marcar al iniciar" + micro-decisión pendiente: destino del POI si la narración falla de inmediato tras marcar (leer trigger() primero)
- **DT-60 diseño refinado (S25g, sin código):** splash queda 100% anónimo (corazón+brújula quietos, sin nombre); personalización se concentra en el corazón final del wizard. El saludo ahí es gratis vía DA-77 (pendiente+TTL ya existente) si fetchCityName() arranca en paso 2 — no requiere código nuevo, solo mover CUÁNDO se llama
- **Caminata de campo — próximo log confirma que el saludo real ya suena** (BUG-048/049 cerrados) y dirá cuánto tarda Nominatim en la práctica (dato clave para DT-60) · observar también voz v3.0, Overpass-iPhone, SPECIAL_ZONE_MIN: 3
- **DT-58 (propuesta, SIN ratificar):** acceso a configuración post-wizard desde explore — idioma, nombre, volVoice, posible casa de DT-56. Pendiente de tu sí/no explícito
- **DT-59 (propuesta, SIN ratificar):** calidad de voz en iOS — asimetría local/online en voice.js. Pendiente de evidencia real antes de tocar código. Trade-off con "offline obligatorio"
- DT-51: grounding con extracts — sesión de código mayor
- DT-53: getFarewell() — usa nombre DA-75 · pareja natural: DT-46
- DT-56: entrada a Recorrido desde explore · DT-57: i18n wizard (baja)
- DT-54 wake lock · DT-55 prefetch — después; DT-44 puede volverse irrelevante
- DT-19: MP3s de intro no existen — funciona en silencio

## El Narrador

Una sola voz, sin selector. Prompt Maestro v3.0 define la voz completa — implementado en narration.js (es + en, espejo fiel). Ver docs/prompt_maestro_follower.md.

## Identidad

Logo: Corazón C2 con brújula (candidato a rediseño — feedback S25, DT-1) · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display + itálica en title card) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev
