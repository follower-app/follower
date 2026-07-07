# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM (fuente compuesta) · GitHub Pages · PWA. Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

**Contexto crítico:** el panel es la fuente de verdad, pero cada chat recibe una *fotografía estática* al iniciar. Ante sospecha de desfase, el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). La regresión DA-68 (7 features perdidas) nació de saltarse esta regla.

**Protocolo de cierre:** commit → actualizar panel → actualizar estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro (alma, pregunta rectora) · producto (DTs activas, visión v2.0 accesibilidad) · arquitectura (DA-1 a DA-77) · bitacora (hasta S25) · manifiesto_narrativo (voz v3.0) · manifiesto_care_strip · prompt_maestro_follower (oficial) · dt42_care_miniprompt · dt45_bienvenida_animada (enmendada S24) · dt47_wizard_mockup_final.html (mockup ratificado) · registro_sesion24_interfaz · restauracion_poi_js (histórico)

## Arquitectura de archivos

index.html (shell mínimo) · sw.js v17 (siempre último en commits) · manifest.json · css/ (main, splash, explore, poi, modal, components, wizard) · js/ (app, config, gps, poi, narration, voice, weather, care, routes, debug, debug-sim; music.js stubbed) · assets/ (logo pendiente DT-1) · docs/

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
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited
narration.js: trigger(poi,lang,topic) · getCareMessage · getLocalLang (única fuente de idioma — DT-41) · cleanPOIName · getCityWelcome(city,name,lang)
care.js: checkCareContext · checkSpecialZone
gps.js: distanceMeters · getRadiusConfig
app.js: setPhase · navigateTo · welcomeCity (habla, no muestra) · _unlockAudioOnFirstTap · _startWizard · _showTitleCard
(getFarewell() nunca existió — ver DT-53)

## Estado actual

v0.9 — Sesión 25 completada: **flujo de entrada implementado y en producción**. sw.js v17. POI_CACHE_VERSION v3. Prompt Maestro v3.0 (DA-74).

Flujo actual: splash (sin prompt GPS en 1ª vez) → wizard 4 pasos (GPS priming → idioma autodetect → nombre opcional → corazón/voz `touchend`, solo 1ª vez) → title card (fade puro, tap salta y desbloquea, techo 4s) → explore → saludo de ciudad hablado con nombre e idioma local (pendiente con TTL si la voz sigue bloqueada — DA-77).

**Timing en mano (fijar en caminata):** fade-in ~1.8s · techo 4s · TTL saludo 90s.

## Completado en Sesiones 21-25

- S21: causa raíz POIs Pasto · gsprop · DA-69/70/71 · sw.js v13
- S22: fuente compuesta DT-52 (DA-72/73) · dedup+fusión · contrato _source · sw.js v15
- S23: Prompt Maestro v3.0 (DA-74) · DT-50 cerrada · BUG-047 cerrada · sw.js v16
- S24: diseño interfaz — DT-47 · DT-45 title card · DA-75 · DT-54/55 · visión accesibilidad · cero código
- S25: implementación entrada — DT-45/47 CERRADAS · DA-75 implementada · DA-76/77 · DT-9 CERRADA (key revocada) · DT-56/57 registradas · fix _audioUnlocked · poi.css al precache · sw.js v17

## Pendientes críticos

- **BUG-046 → micro-sesión propia ANTES de la caminata (B ratificada S25).** Fix candidato "marcar al iniciar" + micro-decisión pendiente: destino del POI si la narración falla de inmediato tras marcar (leer trigger() primero)
- **Caminata de campo — 3 observables, diagnósticos separados:** 1) voz v3.0 · 2) Overpass-iPhone (2/2 OK sin confirmar) · 3) flujo de entrada + timing en mano. Observar SPECIAL_ZONE_MIN: 3
- DT-51: grounding con extracts — siguiente sesión de código mayor
- DT-53: getFarewell() — usa nombre DA-75 (ya disponible en Config) · pareja natural: DT-46
- DT-56: entrada a Recorrido desde explore · DT-57: i18n wizard (baja)
- DT-54 wake lock · DT-55 prefetch — después; DT-44 puede volverse irrelevante
- DT-19: MP3s de intro no existen — funciona en silencio

## El Narrador

Una sola voz, sin selector. Prompt Maestro v3.0 define la voz completa — implementado en narration.js (es + en, espejo fiel). Ver docs/prompt_maestro_follower.md.

## Identidad

Logo: Corazón C2 con brújula · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display + itálica en title card) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev
