# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM (fuente compuesta) · GitHub Pages · PWA. Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

**Contexto crítico:** el panel es la fuente de verdad, pero cada chat recibe una *fotografía estática* al iniciar. Ante sospecha de desfase, el árbitro es GitHub (`raw.githubusercontent.com/follower-app/follower/main/...`). La regresión DA-68 (7 features perdidas) nació de saltarse esta regla. La reapertura de DT-60 en S31 (la bitácora la daba por cerrada; el código decía otra cosa) la confirmó otra vez: ante cualquier "ya quedó hecho", el árbitro es el código, no el resumen escrito sobre él.

**Protocolo de cierre:** commit → actualizar panel → actualizar estas instrucciones → chat nuevo. En ese orden.

## Documentos del proyecto

README · REGLAS_IA · docs/: contexto_maestro (alma, pregunta rectora) · producto (DTs activas + tabla de bugs S31, visión v2.0 accesibilidad) · arquitectura (DA-1 a DA-84) · bitacora (hasta S31) · manifiesto_narrativo (voz v3.0) · manifiesto_care_strip · prompt_maestro_follower (oficial, v3.6) · dt42_care_miniprompt · dt45_bienvenida_animada (enmendada S24) · dt47_wizard_mockup_final.html (mockup ratificado) · registro_sesion24_interfaz · restauracion_poi_js (histórico)

## Arquitectura de archivos

index.html (shell mínimo) · sw.js **v46** (siempre último en commits) · manifest.json · css/ (main, splash, explore, poi, modal, components, wizard) · js/ (app, config, gps, poi, narration, voice, weather, care, **walkmode** ←nuevo S31, routes, debug, debug-sim; music.js stubbed) · assets/ (logo.svg, icon-master.svg, icons/ — DT-1 cerrada) · docs/

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en audio — music.js stubbed
- **DA-76:** Modo Libre default, sin pantalla de modo. Recorrido opt-in desde explore (DT-56 pendiente; modal-mode sin llamador, NO eliminar)
- Offline obligatorio — la experiencia nunca se rompe
- POIs: **cascada compuesta DA-72** — wiki local+es → si neto < COMPOSITE_THRESHOLD (8) → Overpass nwr curado (Tier 1 siempre; Tier 2 solo si sigue el hambre; fusión wiki-gana) → si neto < EMERGENCY_MIN (3) → en.wikipedia → IndexedDB
- Curaduría OSM: compuerta 0 (sin nombre → fuera) + blacklist. **Curar antes de exponer (DA-73)**
- Dedup DT-49: título normalizado + <25m intra-OSM / 60m inter-fuente; wiki gana; el perdedor lega inscription/wikidata
- Contrato DT-51: `_source: 'wiki'|'osm'` + `_osmType` — wiki narra con hechos (extract real vía `exintro`), osm narra lo observable. Detector programático de autor/fecha activo (DA-80, solo logging) — con BUG-059 corregido, ya mide texto limpio
- Wikipedia: cadena [local → es] ACUMULA; en.wikipedia es emergencia FINAL — DA-69/72. Filtro `gsprop=type` — DA-70
- **DA-71:** cambio en query/filtros/normalización POIs → `POI_CACHE_VERSION++` MISMO commit (actual: **v4**)
- **DT-50:** cambio al Prompt Maestro → `PROMPT_VERSION++` MISMO commit (actual: **v3.6**). Clave: `${PROMPT_VERSION}_${poiId}_${lang}_${topic}_${extractFingerprint}`
- ¿Archivo servido cambió? → sw.js bump, commit final aparte
- Care y cola narrativa independientes: la cola guarda historias, Care es presente — nunca se encola
- Nunca mostrar errores al usuario — siempre hay fallback
- Narración: 90–130 palabras, excepcional 150 (`max_tokens: 380`)
- **DA-75:** userName en Config (localStorage), solo welcome/farewell. NUNCA en capítulos ni Care. NUNCA viaja al Worker. Fallback sin nombre siempre funcional
- **DA-77:** saludo de ciudad 100% voz. Voz bloqueada al llegar → pendiente, suena en primer gesto; TTL ~90s → descarte silencioso. `_audioUnlocked` es POR CARGA DE PÁGINA; `_unlockAudioOnFirstTap()` es la puerta ÚNICA
- **VEREDICTO DE PLATAFORMA (S31, BUG-051 cerrado):** el desbloqueo de audio en iOS exige gesto DIRECTO del usuario — no existe camino automático. Llamar el unlock desde un timer lo acepta sin error y sin efecto, la bandera queda true falsamente y TODA la sesión de audio muere en silencio. NUNCA desbloquear audio fuera de un gesto real. Respuesta de diseño: umbral "toca para comenzar" en el title card (decisión B)
- **DA-78:** "Soy Follower" es presentación, no bienvenida recurrente. Suena fusionado con el saludo de ciudad SOLO la primera vez efectiva (`introHeard` en Config, marcada solo en `onEnd`)
- **DA-84 (S31, diseño ratificado — implementación DT-64 pendiente):** brújula sin ícono ni estados; permiso de orientación dentro del gesto ya existente (patrón DA-77); cono visual SOLO con POI activo en diástole. iOS no persiste el permiso entre recargas — pedirlo cada apertura
- **DT-54 implementado (S31):** wake lock (walkmode.js) — reintento en primer gesto si iOS rechaza (`NotAllowedError` al cargar es normal) + modo caminata: overlay negro OLED con corazón en fase, entrada C = movimiento GPS sostenido (≥25m/4 lecturas) Y ≥15s sin interacción; tap sale. Overlay con `pointer-events:none` salvo `.visible`
- **Patrón freeze-while-open (S31, BUG-058):** NUNCA reescribir con `innerHTML` una lista mientras su panel está abierto y tocable — en iOS, destruir el elemento a mitad del gesto (~200ms touchstart→click) cancela el click sin burbujeo: pantalla "secuestrada". Congelar el rebuild con el panel abierto
- **BUG-059 (S31):** `sanitizeNarration()` corta preámbulos meta de verificación ("Verificación obligatoria... ---") antes de voz/detector/cache. NO quitar ese strip
- **Hook de campo `?reset=1`:** limpia localStorage y simula primera vez. No toca IndexedDB. Destino a decidir junto con DT-8 antes de v1.0
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

## Funciones únicas — nunca duplicar

poi.js: detectNearby · enqueuePOI · processQueue · fetchWikipediaPOIs · fetchPOIsFromOSM · classifyOSMElement · dedupOSMPOIs · fuseWithWikipedia · markVisited · resetVisited (S31: renderQuickFacts/renderDepthPills/onDepthPill ELIMINADAS — BUG-055)
narration.js: trigger(poi,lang,topic) · getCareMessage · getLocalLang (única fuente de idioma — DT-41) · cleanPOIName · getCityWelcome(city,name,lang,includeIntro) · getCityIntroFallback(name,lang) · sanitizeNarration (con strip BUG-059) · buildGroundingBlock · _dt51VerifyAutorFecha
care.js: checkCareContext · checkSpecialZone
gps.js: distanceMeters · getRadiusConfig · fetchCityName · updateUserPosition (S31: con auto-seguimiento BUG-053)
walkmode.js (nuevo S31): start · stop · onMove · isActive
app.js: setPhase · navigateTo · welcomeCity · _unlockAudioOnFirstTap · _startWizard · _showTitleCard (S31: umbral "toca para comenzar")
voice.js: speak · stop · unlockFromGesture · recuperación por visibilitychange (BUG-057) · SAFETY_MAX_MS=120s
(getFarewell() nunca existió — ver DT-53)

## Estado actual

v0.9 — **Sesión 31 completada (15 julio 2026): la sesión más productiva del proyecto.** Maratón de campo + fixes con validación real en iPhone entre cada ronda. sw.js v41→**v46** en un día. Resumen:

**Implementado y desplegado:**
- **DT-54** (wake lock + modo caminata mínimo, entrada C ratificada) — walkmode.js nuevo. Wake lock validado en campo: rechazo al cargar → adquirido en primer gesto → re-adquisiciones automáticas. Modo caminata debutó limpio
- **BUG-051 CERRADO (decisión B):** title card con umbral "toca para comenzar" cuando el audio sigue bloqueado — veredicto de plataforma documentado arriba
- **BUG-053** (mapa sigue al caminante): panTo suave solo al salir del 70% central; arrastre manual pausa 10s
- **BUG-054/058** (panel historias): tap en el panel cierra + rebuild congelado con panel abierto (causa real: churn de innerHTML matando taps en vuelo)
- **BUG-055** (POI expandido sin relictos v1; `Config.getNarratorLabel()` era bomba latente — no existe desde DA-50)
- **BUG-056** (care strip solo clima — pasos/km eliminados; alineado con manifiesto)
- **BUG-057** (deadlock de diástole): recuperación por visibilitychange + techo 120s al safety timer — validada 2x en campo
- **BUG-059** (preámbulo de verificación hablado): strip determinista en sanitizeNarration

**Hallazgos mayores de S31 (leer bitacora.md S31 completa antes de trabajar en narración):**
1. **DT-62 medio resuelta:** `callClaude()` envía `system` REAL a la API — producción usa el canal correcto. La sobre-longitud (4/4 narraciones en ~170-190 palabras vs 90-130) ya NO tiene excusa metodológica: es falla del prompt v3.6 en producción. Falta solo confirmar que el Worker reenvía sin tocar
2. **Técnica del scratchpad (BUG-059, cara buena):** hacer la verificación EN VOZ ALTA fue la primera vez en 6+ versiones que autor/fecha entraron al capítulo (chain-of-thought accidental). Candidata a técnica deliberada en v3.7: pedir scratchpad + capítulo, entregar solo el capítulo
3. **Narración-regaño (simulador):** contradicción ciudad-extracto por carrera de teletransporte → el modelo rompió el personaje e interrogó al usuario. Regla anti-regaño anotada para v3.7. Cola real de producción: POI activado antes de que fetchCityName resuelva en ciudad nueva → refuerza DT-60
4. **DT-60 REABIERTA:** `dataPromise` del title card solo espera GPS — NO espera fetchCityName ni POIs (la barra es cosmética, Math.random). Causa raíz compartida de BUG-052 y de la carrera de ciudad
5. **DA-84 ratificada** (brújula sin ícono) — implementación es DT-64

**Contexto de urgencia:** familia de Jaime viaja a Europa la próxima semana — prueba de campo multi-ciudad (Barcelona/Sintra/Lisboa ya simuladas). Los fixes de impresión de S31 son para ese viaje.

## Pendientes críticos (orden sugerido)

1. ~~Validar v46 en campo~~ **HECHO (cierre S31): umbral, panel, narraciones y mapa OK — todo validado por Jaime**
1b. **Fix pequeño a ratificar (propuesto al cierre de S31):** cuando la recuperación por `visibility-recovery` cierra una narración interrumpida, NO marcar el POI como `visited` — hoy el capítulo se pierde para siempre si el usuario saca el teléfono a mitad de narración (foto, WhatsApp). Sin marcar, si sigue cerca al volver, el capítulo se re-dispara (con cache: instantáneo y gratis). Escenario exacto del viaje: familia turisteando
1c. **Limitación de plataforma aceptada (documentar como DA en próxima sesión):** en PWA iOS, `speechSynthesis` y `watchPosition` mueren en background — sin remedio JS. El caso diseñado (bolsillo + pantalla encendida vía wake lock + modo caminata) NO es background y funciona. Soluciones reales del background = v2.0: (a) TTS de servidor + `<audio>` + Media Session (audio sí continúa en background; pelea con offline-obligatorio), o (b) envoltorio nativo Capacitor (solución completa). Registrar como decisión consciente, no sorpresa.
   **Análisis Capacitor (cierre S31, insumo para la DA):** NO es migración — envoltorio WebView; el código vanilla entra tal cual (npm solo para empaquetar). React Native descartado (reescritura total, Leaflet muere). Trabajo real: cascarón 1-2 días; luego cambiar tripas de voice.js (plugin TTS nativo con background audio) y gps.js (background geolocation) ~1-2 semanas — la arquitectura de módulos únicos lo permite sin tocar el resto. Por fases, cada una usable. Costos: Apple Developer 99 USD/año + revisión de tiendas. **Builds:** el Mac 10.13 de Jaime NO sirve (Xcode moderno exige macOS 14+; la App Store rechaza builds de Xcode viejo). Plan viable sin comprar Mac: Android local en Windows (Android Studio) para desarrollar el envoltorio + **GitHub Actions con runners macOS (gratis en repo público) para el build de iOS** — encaja con el flujo git actual. Alternativas: Codemagic/Appflow, o Mac mini M1 usado (~300-400 USD) si se quiere simulador local. El iPhone de pruebas sirve tal cual — el problema es dónde se compila, no dónde se prueba. Todo POST-viaje
2. **Paquete narrativo v3.7 (sesión de escritorio, sábado):** DT-62 cierre (vistazo al Worker) + longitud + sección continuidad de Jaime CORREGIDA (sin promesas hacia adelante — el narrador no conoce el siguiente POI; ejemplos anclados a la ciudad) + técnica scratchpad + regla anti-regaño. UN solo PROMPT_VERSION++ (purga de paso el regaño cacheado de Sagrada Familia) + prueba probabilística n≥4
3. **DT-60 reabierta:** extender dataPromise a fetchCityName (POIs opcional) — mata BUG-052 y la carrera de ciudad. Encaja con el umbral B ya implementado
4. **DT-64** (brújula DA-84) · **DT-63** (validación de campo flujo completo)
5. **DT-61** + parques (observación S31: parque grande invisible; `leisure=park` no está en tiers curados — implica POI_CACHE_VERSION++)
6. Panel historias: rediseño altura máx + ✕ (con DT-16) · DT-53 getFarewell · DT-58/59 sin ratificar · DT-56/57 baja
7. Vigilar: voz muere en silencio con app en primer plano (2-3x por sesión; el safety-timer la rescata) — si persiste en caminata real, ticket propio para el keep-alive iOS

## El Narrador

Una sola voz, sin selector. Prompt Maestro v3.6 define la voz completa — implementado en narration.js (es + en, espejo fiel). Bloque de grounding dinámico (DT-51) inyectado por POI según `_source`. Ver docs/prompt_maestro_follower.md. **v3.7 en diseño — ver Pendientes punto 2.**

## Identidad

Logo: Corazón C2 con brújula — DT-1 CERRADA: assets/logo.svg + assets/icon-master.svg + assets/icons/*.png · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display + itálica en title card) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev
