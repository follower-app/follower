# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM (fuente compuesta) · GitHub Pages · PWA. Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

**Contexto crítico:** el panel es la fuente de verdad, pero cada chat recibe una *fotografía estática* al iniciar. Ante sospecha de desfase, el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). La regresión DA-68 (7 features perdidas) nació de saltarse esta regla.

**Protocolo de cierre:** commit → actualizar panel → actualizar estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro (alma, pregunta rectora) · producto (DTs activas, visión v2.0 accesibilidad) · arquitectura (DA-1 a DA-80) · bitacora (hasta S28) · manifiesto_narrativo (voz v3.0) · manifiesto_care_strip · prompt_maestro_follower (oficial, v3.6) · dt42_care_miniprompt · dt45_bienvenida_animada (enmendada S24) · dt47_wizard_mockup_final.html (mockup ratificado) · registro_sesion24_interfaz · restauracion_poi_js (histórico)

## Arquitectura de archivos

index.html (shell mínimo) · sw.js v34 (siempre último en commits) · manifest.json · css/ (main, splash, explore, poi, modal, components, wizard) · js/ (app, config, gps, poi, narration, voice, weather, care, routes, debug, debug-sim; music.js stubbed) · assets/ (logo pendiente DT-1) · docs/

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en audio — music.js stubbed
- **DA-76:** Modo Libre default, sin pantalla de modo. Recorrido opt-in desde explore (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- Offline obligatorio — la experiencia nunca se rompe
- POIs: **cascada compuesta DA-72** — wiki local+es → si neto < COMPOSITE_THRESHOLD (8) → Overpass nwr curado (Tier 1 siempre; Tier 2 solo si sigue el hambre; fusión wiki-gana) → si neto < EMERGENCY_MIN (3) → en.wikipedia → IndexedDB
- Curaduría OSM: compuerta 0 (sin nombre → fuera) + blacklist. **Curar antes de exponer (DA-73)**
- Dedup DT-49: título normalizado + <25m intra-OSM / 60m inter-fuente; wiki gana; el perdedor lega inscription/wikidata
- Contrato DT-51: `_source: 'wiki'|'osm'` + `_osmType` — wiki narra con hechos (extract real vía `exintro`), osm narra lo observable. Implementado + instrumentado con verificación programática de autor/fecha (S28, DA-80, solo logging vía `Debug.log`, no altera ni bloquea la narración) — ver Pendientes críticos
- Wikipedia: cadena [local → es] ACUMULA; en.wikipedia es emergencia FINAL — DA-69/72. Filtro `gsprop=type` — DA-70
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v4**)
- **DT-50:** cambio al Prompt Maestro → `PROMPT_VERSION++` MISMO commit (actual: **v3.6**). Clave: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}` — el componente de huella (DT-51, Sesión 27) autoinvalida el cache cuando cambia el extract, sin depender de subir versión
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

v0.9 — Sesión 28 completada: **DT-51 (grounding) implementado + instrumentado, NO cerrada.** S27b había confirmado autor/fecha 0/4 tras cuatro enfoques de redacción — se descartó seguir ajustando texto del prompt. S28 ejecutó el enfoque estructural recomendado: detector determinista (regex, patrón de atribución verbo+conector+nombre + ventana ±1 oración + veredicto OR entre candidatos) diseñado y validado en 5 iteraciones, con 3 bugs de implementación encontrados y corregidos en el camino (ver DA-80). Validado 3/3 contra narraciones REALES de Claude Haiku 4.5 (Maceta, Catedral de Pasto, Sagrada Familia) — metodología exploratoria, sin confirmar si se usó el campo `system` real de la API o concatenado (ver DT-62). Implementado en producción como **solo instrumentación/logging** (`Debug.log`, no altera ni bloquea la narración entregada) — decisión explícita de no regenerar ni insertar todavía. `PROMPT_VERSION` se mantiene v3.6 (sin cambios de prompt esta sesión). sw.js v34. POI_CACHE_VERSION v4.

Flujo actual (vigente hasta que DT-60 se implemente): splash decorativo (sin prompt GPS en 1ª vez) → wizard 4 pasos (GPS priming → idioma autodetect → nombre opcional → corazón desbloquea en silencio) → title card (fade puro, tap salta y desbloquea, techo 4s) → explore → saludo de ciudad hablado; primerísima vez incluye "Soy Follower" (DA-78).

**DT-51 — resumen de la calibración (detalle completo en bitacora.md S27/S27b/S28):** caso base Monumento a la Maceta (autoría/fecha/significado inventados) → extract real vía `exintro` + bloque de grounding en el prompt → v3.1: no inventa, pero omite autor/fecha por corte de `EXTRACT_MAX_CHARS` (1000→2500) → fix de cache por huella del extract (`_fingerprint`, no solo `PROMPT_VERSION`) → v3.2: autor/fecha obligatorios + no generalizar conjunto→individuo + idea central anclada a identidad local → v3.3: refuerzo de posición + verificación final → v3.4: ejemplo de integración natural + resuelve conflicto con regla "no lista de datos" → v3.5: nueva categoría — prohibido inventar biografía de figuras homónimas (caso Parroquia San Alfonso María de Ligorio, "jesuita italiano" falso) → **prueba probabilística n=4: autor/fecha 0/4 (confirma problema estructural), duración inventada 2/4 → v3.6 corrige duración** → **hipótesis 3 (presupuesto de palabras, v3.7-test) probada y descartada — autor/fecha sigue en 0/n tras CUATRO enfoques de prompt distintos** → **S28: enfoque estructural — detector programático validado 3/3 contra Haiku real, instrumentado como solo-logging en producción (DA-80). Hallazgo colateral sin resolver: longitud y personificación excedidas 3/3 y 2/3 en las mismas narraciones reales — ver DT-62.**

**Timing en mano (fijar en caminata):** fade-in ~1.8s · techo 4s · TTL saludo 90s.

## Completado en Sesiones 21-28

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
- S25g: refinamiento de diseño DT-60 (sin código) — splash 100% anónimo, personalización concentrada en el corazón del wizard, mecanismo DA-77 reutilizado sin código nuevo
- S26: **BUG-046 CERRADO** — causa raíz real distinta a la asumida (`activatePOI()` marcaba visited de inmediato, sin guard de re-entrada; dejaba BUG-044 muerto en la práctica). Fix: histéresis `DEACTIVATE_CONFIRM_COUNT=3` (~15s) + visited devuelto a narration.js. Validado con log real de campo. Hallazgo de método: modo teletransportar no sirve para probar histéresis de GPS (resetea POIs en cada clic) — usar modo ruta. Falso positivo descartado en saludo de ciudad (DA-78 funcionando bien). Nuevo hallazgo registrado para DT-51: narración con hechos inventados · sw.js v23
- S27: **DT-51 (grounding) implementado, NO cerrada** — extract real vía `exintro` en `poi.js` (DA-79), bloque de grounding wiki/osm en `narration.js`, fix de cache por huella del extract. Cinco versiones de prompt (v3.1→v3.5) sobre el mismo síntoma en cinco rondas de campo — ver bitacora.md para el detalle completo. **DT-61 registrada** (criterio de narrabilidad de POI — no todo POI merece capítulo completo). sw.js v24→v29
- S27b: **DT-51, prueba probabilística n=4** — mismo POI (Maceta), mismo prompt v3.5, 4 navegadores para forzar cache miss real. Autor/fecha 0/4 (confirma problema estructural, no de redacción — tres rondas previas de refuerzo de texto no lo movieron). Duración temporal inventada ("durante siglos") 2/4 → corregida en v3.6. Hallazgo metodológico: ninguna regla es 100% fiable con muestra n=1, ni siquiera reglas preexistentes y probadas (personificación falló 1/4). **Hipótesis 3 (presupuesto de palabras) probada y descartada** — subir MAX_TOKENS/rango de palabras (v3.7-test) tampoco trajo autor/fecha, revertido a v3.6. **BUG-050 CERRADO** — sanitización de nombre de ciudad (Nominatim devolvía "Cali ciudad"). Lección de proceso: desfase entre archivos entregados y commits reales causó mensajes de commit duplicados/desalineados (contenido final verificado correcto). sw.js v30→v33
- S28: **DT-51, enfoque estructural (DA-80)** — detector programático de autor/fecha diseñado en 5 iteraciones (A-E) sobre 3 POIs reales (Maceta, Catedral de Pasto, Sagrada Familia), 3 bugs de implementación encontrados y corregidos (IGNORECASE sobre grupo de nombre, verificación por substring, conector no anclado al verbo). Validado 3/3 contra narraciones REALES de Claude Haiku 4.5 (metodología exploratoria, sin confirmar `system` real — ver DT-62). Implementado en producción como solo instrumentación/logging (`Debug.log`), sin alterar ni bloquear la narración — decisión explícita de posponer regenerar/insertar hasta tener evidencia de campo real. Prompt Maestro sin cambios (`PROMPT_VERSION` v3.6). **DT-62 registrada** (revalidar longitud/personificación con metodología correcta — hallazgo colateral 3/3 y 2/3 respectivamente en las mismas narraciones de prueba). sw.js v33→v34

## Pendientes críticos

- **DT-51 (grounding, Sesión 27+27b+28) — implementado + instrumentado, NO cerrada:** cuatro enfoques de prompt consecutivos fallaron en el mismo punto (autor/fecha 0/n) → S28 implementó verificación programática (solo logging, no altera narración) para juntar evidencia real de campo. Punto 2 (¿regenerar? ¿insertar?) deliberadamente sin decidir hasta tener esos datos. Detalle completo en bitacora.md S27/S27b/S28, diseño en arquitectura.md DA-80
- **DT-62 (nueva, sin ratificar):** revalidar si longitud excedida (3/3, 153-198 palabras vs. objetivo 90-130/150) y personificación de la ciudad (2/3) son fallas reales del Prompt Maestro v3.6 o un artefacto de la metodología exploratoria de S28 (no se confirmó si el prompt se envió en el campo `system` real de la API o concatenado en un mensaje). Repetir el experimento con `system` confirmado antes de decidir si ameritan trabajo de prompt
- **DT-61 (nueva, sin ratificar):** criterio de narrabilidad de POI — ¿todo POI detectado merece capítulo completo, o los que no tienen sustancia real deberían anunciarse simple ("Aquí está la Iglesia San Felipe") en vez de forzar narración y arriesgar invención? Propuesto por Jaime al cierre de S27, pendiente de definición punto por punto
- **DT-60 (registrada, próxima sesión de código mayor):** mover GPS/ciudad/POIs al wizard paso 2 + title card; splash pasa a estático (sin latido, sin mensajes falsos). Piedra técnica: Leaflet necesita contenedor visible — separar adquisición de datos de construcción del mapa (`onPosition()` en gps.js). Diseño refinado en S25g (splash 100% anónimo, DA-77 reutilizado sin código nuevo). Requiere ratificación punto por punto, mismo rigor que DT-45/47
- **Validación pendiente en modo ruta del simulador:** BUG-046 se cerró con evidencia parcial de campo (histéresis contando bien, sin llegar a desactivar en esa sesión); la prueba dedicada de parpadeo cerca del borde del radio, en modo "🛤️ Dibujar ruta" (no teletransportar — resetea POIs en cada clic), sigue pendiente como confirmación adicional no bloqueante
- **Caminata de campo** — observar voz v3.5, Overpass-iPhone, SPECIAL_ZONE_MIN: 3, histéresis BUG-046 en movimiento real, y ahora también grounding DT-51 con lote de POIs variados
- **DT-58 (propuesta, SIN ratificar):** acceso a configuración post-wizard desde explore — idioma, nombre, volVoice, posible casa de DT-56. Pendiente de tu sí/no explícito
- **DT-59 (propuesta, SIN ratificar):** calidad de voz en iOS — asimetría local/online en voice.js. Pendiente de evidencia real antes de tocar código. Trade-off con "offline obligatorio"
- DT-53: getFarewell() — usa nombre DA-75 · pareja natural: DT-46
- DT-56: entrada a Recorrido desde explore · DT-57: i18n wizard (baja)
- DT-54 wake lock · DT-55 prefetch — después; DT-44 puede volverse irrelevante
- DT-19: MP3s de intro no existen — funciona en silencio

## El Narrador

Una sola voz, sin selector. Prompt Maestro v3.6 define la voz completa — implementado en narration.js (es + en, espejo fiel). Bloque de grounding dinámico (DT-51) inyectado por POI según `_source`. Ver docs/prompt_maestro_follower.md.

## Identidad

Logo: Corazón C2 con brújula (candidato a rediseño — feedback S25, DT-1) · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display + itálica en title card) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev
