# 📋 Follower — Documento de Producto v0.9

> Junio-Julio 2026 — Narrador único (DA-50) · Prompt Maestro v2.7 · Memoria de capítulo · Idioma local · Care generativo (en curso)

---

## 1. Visión del Producto

> *"your city soundtrack"*

Follower es una experiencia cinematográfica de exploración urbana. Transforma cualquier paseo en una historia: narración AI en tiempo real, una voz que te acompaña mientras caminas, y un sistema de cuidado que sabe cuándo pausar.

**Follower no es un mapa. No es una audioguía. No es Wikipedia hablada.**

Follower compite por emoción, no por información.

> *Pregunta rectora de cada decisión de producto:*
> **¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?**
> Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## 2. Origen

Follower nace de una experiencia real durante un viaje por Europa. Se necesitaban cuatro herramientas distintas simultáneamente: Google Maps para orientarse, ChatGPT para contexto histórico, Free Tours para narrativa y Spotify para ambientación. La experiencia era valiosa pero fragmentada.

La pregunta fundacional: **¿por qué nadie reúne todo esto en una sola experiencia?**

---

## 3. El Problema que Resuelve

| Problema | Por qué importa |
|----------|----------------|
| **Audioguías aburridas** | Pregrabadas, genéricas, sin reacción al contexto real del usuario |
| **Free tours rígidos** | Dependen de un guía, horarios fijos, grupos grandes, sin personalización |
| **Mapas sin alma** | Google Maps da datos fríos, no cuenta historias ni genera emoción |
| **Experiencia fragmentada** | Música, narración y mapa son cuatro apps distintas abiertas en paralelo |
| **Sin cuidado humano** | Ninguna app sabe que estás cansado, que va a llover o que llevas 3 km caminados |
| **Carga cognitiva** | La logística del viaje roba espacio a la experiencia misma |

---

## 4. Propuesta de Valor

Follower no vende información. Vende **inmersión, emoción y compañía**.

- La narración reacciona al lugar exacto donde estás, en tiempo real
- La ciudad misma es la banda sonora — evocada en la narración, no reproducida como audio
- Una voz única te acompaña durante todo el paseo — el amigo más culto que conoces, que nunca presume
- La app sabe cuándo sugerir descanso, refugio del calor o un café
- Funciona sin señal — la experiencia no se rompe nunca

La ciudad siempre es la protagonista. Follower nunca debe sentirse más importante que el lugar que el usuario está explorando.

---

## 5. Usuarios Objetivo

| Perfil | Descripción |
|--------|-------------|
| **Principal** | Viajero independiente 25-45 años, solo o en pareja, que busca experiencias auténticas sobre itinerarios turísticos estándar |
| **Secundario** | Turista cultural que quiere profundidad histórica sin la rigidez de un grupo ni la frialdad de una audioguía |
| **Terciario** | Local que quiere redescubrir su propia ciudad con una mirada nueva |

**Métrica principal de validación:** no usuarios registrados, no POIs detectados, no minutos escuchados.

> ¿La experiencia fue memorable?

**Métrica técnica principal:** ⏱ Tiempo hasta primera historia. Responde: ¿cuándo demuestra Follower su valor? Semáforo: verde ≤90s / amarillo 90-300s / rojo >300s. Más importante que el Cinematic Score.

---

## 6. Principios del Producto

| Principio | Descripción |
|-----------|-------------|
| **Cinematográfico** | Cada paseo debe sentirse como una película, no como una clase |
| **Manos libres** | El usuario no toca la pantalla mientras explora |
| **Humano** | La app cuida, siente y reacciona como un acompañante real |
| **Global** | Cualquier ciudad, cualquier idioma, desde el día 1 |
| **Invisible** | La tecnología desaparece — solo queda la experiencia |
| **Resiliente** | Funciona sin señal, la experiencia no se rompe nunca |
| **La ciudad primero** | Los POIs son actores secundarios. La historia es la protagonista |

---

## 7. El Narrador *(v0.9 — narrador único, DA-50 — activo)*

Desde v0.9, el sistema de **cuatro narradores intercambiables** (Storyteller, Historiador, Explorador, Local) fue **eliminado** (DA-50, deroga DA-17). No hay selector de narrador en la UI ni en `config.js`.

Un solo **system prompt** — el **Prompt Maestro v2.7** — define la voz completa de Follower: *"el amigo más culto que conoces, que nunca presume de lo que sabe."* Los cuatro registros anteriores no desaparecen como capacidades — el narrador único los absorbe implícitamente, eligiendo el ángulo (histórico, curioso, cotidiano, narrativo) según el POI, no según una preferencia de configuración.

**Principio técnico:** `trigger()` ya no recibe ni usa parámetro de estilo. La caché de narraciones en IndexedDB usa clave `poiId_lang_topic` (antes `poiId_style_lang_topic`) — el caché de narradores previos a v0.9 queda huérfano, no se migra.

Un quinto registro (**Familiar**) queda anotado como posible ángulo narrativo futuro, no como narrador seleccionable.

---

## 8. Ciudad Sonora *(v0.9 — activo)*

En v0.9, `music.js` fue eliminado completamente (**DA-50**). No hay audio reproducido por la app — el archivo se conserva vacío en el repo solo para no romper referencias antiguas, sin exponer ningún objeto `Music`.

La presencia sonora de la ciudad es responsabilidad **narrativa**, no técnica: el Prompt Maestro v2.7 instruye al narrador a evocar campanas, mercados, tranvías, viento, conversaciones — los sonidos reales del entorno. La ciudad misma es la banda sonora.

- DT-19 y DT-33 (MP3 de narradores) quedan obsoletos — no hay música ni intro que producir
- `Music.initFromGesture()` eliminado de todos los handlers
- La voz arranca directamente tras cargar el texto, sin prefacio de audio

---

## 9. Bienvenida de Ciudad *(implementada Sesión 25 — title card + saludo 100% voz, DA-77/DA-78)*

**Separación de canales de cine: la pantalla titula, la voz saluda.**

- **Pantalla — title card estático:** FOLLOWER + *your city soundtrack*
  (DM Serif Display Itálica dorada) apareciendo de la nada — fade puro,
  sin movimiento. No depende de red ni de geocoding: nunca espera a nadie.
  Tap salta. Timing se fija en mano (fade-in ~1.8s, techo 4s).
- **Voz — el saludo completo:** `getCityWelcome()` pronuncia el saludo en el
  **idioma local de la ciudad** (detectado desde `country_code` de Nominatim
  vía `COUNTRY_LANG` en `narration.js`), con el nombre del usuario si existe
  (DA-75). Sin nombre: saludo igual que hoy.
- **Presentación una sola vez en la vida (DA-78):** la primerísima vez que
  el saludo efectivamente suena, incluye "Soy Follower" —
  "Hola, [nombre]. Soy Follower. [Ciudad] tiene historias que contarte."
  Todas las llegadas posteriores usan la versión breve, sin reintroducción.
  Bandera `introHeard` (config.js), marcada solo al sonar de verdad
  (`onEnd` de `Voice.speak`) — un intento fallido no gasta la oportunidad.
- Se dispara una vez por sesión — `_cityWelcomeDone` se resetea en cada
  `initExplore()`.

*Diseño anterior (frase en pantalla con letra por letra y fallback de
texto) superado en Sesión 24 — ver enmienda en
`docs/dt45_bienvenida_animada.md`. El flujo v0.9 actual (overlay no
bloqueante) sigue activo en producción hasta implementar.*

---

## 10. Modos de Exploración

### Modo Libre *(default — DA-8)*
Camina sin rumbo. La app detecta POIs en un radio de 120m y reacciona. Descubrimiento orgánico. El usuario nunca recibe instrucciones de ruta.

### Modo Recorrido *(opt-in)*
Ruta temática curada con arco narrativo. La ruta existe para servir a la narrativa, no al contrario. El usuario elige activamente entrar a este modo.

> Un recorrido debe responder *¿qué historia estamos contando?* antes de responder *¿qué lugares vamos a visitar?*

### Transición inteligente
Sugerencia si el usuario está a < 300m del inicio de un recorrido. Nunca automático.

---

## 11. Recorridos Disponibles — Roma *(en routes.js)*

| Recorrido | Km | Duración | POIs |
|-----------|-----|----------|------|
| 🏛️ Roma Imperial | 3.2 | 2h | 8 |
| 🌙 Roma Nocturna | 2.1 | 1.5h | 6 |
| 🌹 Roma Romántica | 2.8 | 2h | 7 |
| 🔮 Roma Secreta | 4.0 | 2.5h | 10 |
| 😄 Roma Curiosa | 3.5 | 2h | 9 |

Ciudades planificadas para versiones futuras: Barcelona (Gaudí), París Romántico, Cali Salsera, Lisboa de los Exploradores.

---

## 12. Sistema de Cuidado Contextual

`care.js` evalúa condiciones en orden de prioridad. La experiencia humana tiene prioridad sobre la narración.

| Prioridad | Condición | Trigger | Lugar asociado |
|-----------|-----------|---------|-----------------|
| 1 | Lluvia (`weather.isRaining`) | `rain` | Sí — café/bar/biblioteca/museo |
| 2 | Temp ≥ 30°C | `hot` | Sí — café/bar |
| 3 | Temp ≤ 5°C | `cold` | Sí — café/bar |
| 4 | Hora almuerzo + > 1km caminado | `lunch` | Sí — restaurante/café |
| 5 | Temp 22-29°C + ≥ 1.2km, una vez por caminata | `thirst` | No — solo recordatorio de hidratación |
| 6 | ≥ 2km caminados o ≥ 2600 pasos | `tired` | Sí — café/bar |
| — *(evaluado aparte, en cada tick de GPS)* | ≥ 3 POIs en radio de 150m | `special` | POIs de Wikipedia ya cargados |

Cooldown de 20 minutos entre sugerencias (excepto `thirst`, que se limita a una vez por caminata en vez de por tiempo). Primer chequeo a los 5 minutos de sesión.

**Implementado — Care generativo (DT-42).** Las sugerencias ya no usan plantillas de texto fijas: se generan vía una llamada a Claude (`Narration.getCareMessage()`) que selecciona el candidato más propio del lugar y redacta el mensaje con la misma voz del Prompt Maestro. `MESSAGES.*` estático sigue existiendo como fallback si el Worker falla o la sesión está offline.

**Lluvia migrada desde `weather.js` (DA-65).** Antes vivía en un sistema completamente separado — timer propio, texto hardcodeado sin idioma, cooldown propio. Ahora es un trigger de Care más, con la misma voz generativa y el mismo cooldown que el resto.

**Atardecer evaluado y descartado.** Sin datos de elevación o línea de vista, no hay forma confiable de confirmar que el usuario puede ver el atardecer en un centro urbano denso — queda como visión futura, no como deuda de esta versión.

---

## 13. Metáfora Central — Sístole / Diástole

El ritmo de la app replica el latido del corazón. Es la metáfora de diseño fundamental.

| Fase | Color | Representa |
|------|-------|-----------|
| **Sístole** | `#1a5276` (azul) | Movimiento · exploración · caminar |
| **Diástole** | `#c0392b` (rojo) | Narración · inmersión · historia |

`setPhase()` en `app.js` es la única función que cambia de fase. CSS hace el resto. Nunca estilos inline desde JS.

**Regla absoluta:** Sístole es azul, Diástole es rojo. Nunca invertir.

---

## 14. Idiomas Soportados

Web Speech API — 12 idiomas BCP-47:

`es-419` (latam) · `es-MX` · `es-CO` · `es-ES` (último recurso) · `en-US` · `fr-FR` · `it-IT` · `de-DE` · `pt-BR` · `ja-JP` · `zh-CN` · `ko-KR` · `nl-NL` · `ru-RU` · `ar-SA`

Prioridad de selección en español: `es-CO → es-MX → es-US → es-419 → (otras latam) → es-ES`. Voces locales siempre sobre voces online (las online ignoran el parámetro `rate`).

El Prompt Maestro v2.7 (narrador único) tiene versiones en español e inglés. Otros idiomas usan el prompt en inglés como base.

---

## 15. Identidad Visual

| Elemento | Valor |
|----------|-------|
| **Logo** | Corazón C2 con brújula · SVG final v41 (DT-1 cerrada, DA-83) |
| **Slogan** | *your city soundtrack* |
| **Paleta** | Sístole `#1a5276` · Diástole `#c0392b` · Dorado `#f0c87a` · Noche `#0d1b2a` |
| **Tipografía** | DM Serif Display (display / bienvenida ciudad) + Inter (UI) |
| **Tiles de mapa** | CartoDB Voyager — color, información y legibilidad bajo sol en iPhone |

---

## 16. Pantallas

| Pantalla | Estado | Notas |
|----------|--------|-------|
| Splash — latido + carga | ✅ | Flujo returning-user → exploración directa |
| Config inicial — idioma | ✅ | v0.9: selector de narrador eliminado (DA-50) |
| Selección de modo | ✅ | |
| Bienvenida de ciudad — fade sobre mapa | ✅ | v0.9: idioma local de la ciudad, no del usuario |
| Exploración — care strip + mapa + bottom bar | ✅ | Bottom bar sólida, dos pills simétricos |
| Care card — descanso / lluvia / calor / zona especial | ✅ | Reemplaza care strip en top, height 32px |
| POI expandido | ✅ | btnBookmark/btnShare eliminados (DT-17) |
| Selección de recorrido | ✅ | |
| Title card + wizard de entrada (splash → wizard 1ª vez → title card → explore) | ✅ | Implementado S25 — DT-45/47 |
| Cierre de caminata — pregunta hablada + confirmación tap | 🔲 | Pendiente — DT-46 |
| Resumen del paseo | 🔲 | Pendiente — DT-4 |

---

## 17. Costos Estimados

| Servicio | Piloto (1-5 usuarios) | MVP (10-20 usuarios) |
|----------|----------------------|----------------------|
| Claude API (claude-haiku) | $1-5/mes | $10-30/mes |
| OpenWeatherMap | $0 | $0 |
| Leaflet / OSM / Overpass | $0 | $0 |
| GitHub Pages | $0 | $0 |
| Cloudflare Workers | $0 (plan gratuito) | $0 |
| **Total** | **$1-5/mes** | **$10-30/mes** |

---

## 18. Hoja de Ruta

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + mockups | ✅ |
| v0.3 | Documentación completa | ✅ |
| v0.4 | Código base completo | ✅ |
| v0.5 | Panel de debug + métricas de experiencia | ✅ |
| v0.6 | UI rediseñada — bottom bar, pills, care strip, brújula | ✅ |
| v0.7 | Sistema de narradores (4 estilos) · música por intro · bienvenida ciudad | ✅ |
| v0.7s | Estabilización: voz latam · narraciones cortas · sanitización · laboratorio confiable | ✅ |
| v0.8 | Wikipedia GeoSearch primaria · cola narrativa · visited-on-complete · iOS voz fix (BUG-036) | ✅ |
| v0.9 | Narrador único (DA-50) · memoria de capítulo · idioma local · zona especial · inactividad | ✅ |
| v0.9 | Care generativo (DT-42, 7 triggers) · pantalla de bienvenida animada (DT-45) · cierre de caminata (DT-46) · validación en campo | 🔄 En curso — DT-42 listo, resto pendiente |
| v1.0 | Piloto con viajeros reales | 🔲 |
| v2.0 | Recorridos curados · más ciudades · monetización | 🔲 |

---

## 19. Deuda Técnica Activa *(actualizada a Sesión 37 — 30 julio 2026)*

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | **CERRADA** (S29) — assets/logo.svg, assets/icon-master.svg, assets/icons/*.png |
| ~~DT-60~~ | **CERRADA (S34, sw.js v50-v51) — validada en campo ambos caminos.** Alcance implementado = Opción A ratificada: `dataPromise` en dos etapas (GPS → `GPS.fetchCityName`, ahora exportada; ambos caminos, el wizard ya deja `AppState.gps`), barra de compuertas reales (techos 45/90/95% por estado: GPS pendiente / ciudad pendiente / race; mensajes por estado, `TITLECARD_MSGS` eliminado), doble hit a Nominatim evitado (`onPosition` solo llama si `!AppState.cityName` — de paso, reintento natural si el title card falló). POIs quedaron deliberadamente fuera (se evaluará con evidencia DT-63 si hace falta; guardas `!_map` + auto-heal de marcadores confirmadas viables). Mata BUG-052 y cumple el prerequisito del Prólogo DA-85 (commit 1). Incluye matiz DA-77 ×2 (fallback genérico silenciado + saludo siempre en explore vía `_flushPendingWelcome()` — ver arquitectura.md) | ~~Alta~~ |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 en arranque — endpoint /weather sin key configurada | Baja |
| DT-28 | Verificar cap 80 POIs con nwr en ciudades muy densas | Baja |
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico de Cali — validar con arquitectura v0.9 | Alta |
| DT-30 | Confirmar TTF con Wikipedia desde sesión nueva — validar con arquitectura v0.9 | Alta |
| DT-31 | Mejorar type/icon de POIs Wikipedia con categorías Wikidata | Baja |
| DT-32 | Validar en campo real la arquitectura consolidada de narrador único | Alta |
| DT-44 | Medir latencia del checklist mínimo v3.0 — DT-55 puede volverla irrelevante | Baja |
| DT-46 | Diseño de UI: confirmación por tap para cierre de caminata — pareja natural de DT-53. **Nota S33: prerequisito de implementación del Epílogo de DA-85** — el epílogo se dispara únicamente desde este flujo de cierre confirmado, nunca por inferencia | Media |
| DT-56 | Punto de entrada a Modo Recorrido desde explore — reciclar modal-mode como picker. Consecuencia de DA-76; hasta entonces Recorrido es inalcanzable | Media |
| DT-57 | i18n de la copy del wizard — hoy español estático salvo título del paso 2 | Baja |
| DT-53 | getFarewell() — **ABSORBIDA por DA-85 (S33):** el epílogo queda diseñado por completo (disparador = cierre confirmado DT-46; Haiku + scratchpad; insumo = capítulos de la caminata vía DT-68; bookend con la tesis — único lugar donde citarla literal es legítimo; `userName` permitido por DA-75; sin cache; degradación fija; 0 capítulos → despedida simple). Se cierra cuando el epílogo se implemente. Prerequisitos: DT-46 + DT-68 | Media |
| DT-54 | Wake lock + modo caminata — resuelve suspensión por bloqueo de pantalla (spec S24) | Alta |
| DT-55 | Prefetch de narraciones cercanas — conexión por ráfagas (spec S24) | Media |
| DT-51 | Grounding de narración — **CIERRE PARCIAL (S32): la misión original está cumplida.** El scratchpad deliberado de v3.7 (cara buena de BUG-059 convertida en técnica: verificación escrita + `---` + capítulo, cortada por `sanitizeNarration()`) llevó autor/fecha al capítulo **4/4 en Sagrada Família** (Safari/Edge/Chrome/Firefox, primer "cumple" del detector en la historia del proyecto, tras 0/n en cinco sesiones y cuatro enfoques de redacción). Detector + strip + scratchpad quedan como arquitectura permanente. Lo que hereda DT-66: el caso "autor/fecha fuera del intro" (Maceta: Pombo/2015 viven tras un encabezado de sección que `exintro` no cruza por definición — imposible por esta vía). Cierre total cuando DT-66 se resuelva o se acepte el límite documentado | Media |
| DT-61 | Criterio de narrabilidad de POI — evaluar si TODO POI detectado merece capítulo completo, o si los que no tienen sustancia real (sin extracto útil, sin nada observable distintivo) deberían anunciarse simple ("Aquí está la Iglesia San Felipe") en vez de forzar 90-130 palabras y arriesgar inventar contenido para llenar el hueco. Propuesto por Jaime al cierre de Sesión 27, pendiente de definición punto por punto. **Observación de campo (S31, Barcelona sim): el problema tiene cara inversa también — un parque urbano grande y evidente NO existe para Follower (sin artículo Wikipedia geolocalizado; `leisure=park` no está en los tiers curados de Overpass), mientras POIs menores sí narran. Decidir si agregar parques con nombre a la curaduría OSM es parte de esta definición — implicaría `POI_CACHE_VERSION++`.** **Nota S32:** los Niveles A/B/C del `manifiesto_pois.md` v1.0 son ahora la vara editorial para esta definición — un parque urbano grande es Nivel B mínimo → candidato claro a los tiers | Alta |
| DT-63 | Validar en campo el flujo sin splash (DA-81) — primera vez y usuario recurrente. Ver detalle en sección propia más abajo | Alta |
| DT-64 | Brújula (DA-84, S31, diseño cerrado sin código): permiso de orientación silencioso dentro del gesto ya existente (`_unlockAudioOnFirstTap`/wizard paso 4 o primer tap del title card) — sin ícono ni estados reposo/latido/activo. Cono visual en el mapa condicionado a `AppState.activePOI` (solo con POI activo en diástole), no a un botón manual. Elimina `#btnCompass` y `_activateCompass()`/`_deactivateCompass()` manuales; conserva el cono SVG combinado del marcador de usuario (BUG-027) y el listener de `DeviceOrientationEvent`. Retoma y redefine el alcance de DT-20 | Alta |
| DT-65 | Curaduría cinematográfica — rama Wikipedia (Fase 2, S32): la compuerta de DA-73 solo filtra OSM; los POIs wiki entran sin filtro y ganan toda fusión. Evidencia: estaciones MIO narradas como capítulos (muchas estaciones de transporte tienen artículo; también bocas de metro en Lisboa/Barcelona). Alcance: blacklist de Nivel D (`manifiesto_pois.md`: metro, MIO, paradas, cajeros, bancos, farmacias, gasolineras, parqueaderos) en la rama wiki por patrón de título y/o categoría, espejo de la blacklist OSM. Implica `POI_CACHE_VERSION++`. Pregunta abierta anexa: tensión Filosofía de Escasez vs. `COMPOSITE_THRESHOLD=8` de DA-72 — decidir en la sesión de este ticket | Alta |
| DT-66 | Autor/fecha fuera del intro (heredero de DT-51, S32): en artículos CON secciones, `exintro` nunca entrega datos que el editor puso en "Historia" (caso Maceta: Pombo/2015 tras el encabezado — verificado por triple consola, extracto determinista de 1332 chars). Candidatas a evaluar en sesión propia: **(a)** fetch del extracto completo solo para el POI activado al narrar (request extra; en artículos largos 2500 chars podrían tampoco alcanzar); **(b)** Wikidata claims — los POIs ya heredan `wikidata` id en la fusión (DT-49); P170 (creador), P84 (arquitecto), P571 (fecha de creación) son datos estructurados, independientes de dónde vive la prosa. Instinto de sesión: (b) es la definitiva | Media |
| DT-67 | Tarjeta narrativa persistente (DA-85, S33) — **ABSORBIDA (S35):** el rediseño completo del tab de ciudad (3 estados — closed/peek/expanded — con ciudad+tesis+prólogo siempre presente e iconos de POI bajo "Por descubrir · N" solo cuando hay alguno) cumple el propósito de este ticket. No necesitó sesión de diseño propia con mockup por separado — se resolvió como parte natural de implementar DA-85 §1. Ver arquitectura.md, "Estado de implementación (S35)" bajo DA-85 | Media |
| DT-68 | Acumulación de capítulos narrados en memoria de sesión (DA-85, S33): guardar título + idea central de cada capítulo de la caminata actual — hoy solo se conserva el último (DT-39/DA-52). Habilitador del insumo del Epílogo. Memoria de sesión, no IndexedDB: cada caminata es única | Media |
| ~~DT-69~~ | **CERRADA (S37, sw v70).** Guarda por coordenadas implementada en `_fetchCityExtract`: `prop=extracts|coordinates` (mismo fetch, sin llamadas extra) + helper `_coordGuardPasses()` que compara el artículo contra `AppState.gps` vía `GPS.distanceMeters`. Umbral 50 km en constante `THESIS_COORD_MAX_KM` — generoso a propósito (el artículo apunta al centro; el caminante puede estar en la periferia de un área metropolitana). Sin geoetiqueta = aceptar (ausencia no es evidencia). Sin GPS = no opinar. Al fallar hace `continue`, no `return null`, para que la cascada siga buscando. **Validada en campo (Palmira, 30 jul):** descartó `es.wikipedia/Palmira` a 11.991 km (Siria) y aceptó `Palmira (Colombia)` a 2 km, sin falso positivo | Media |
| ~~DT-70~~ | **CERRADA (S37, sw v69).** El diagnóstico de S36c ("no-ops, no rompen nada") era incorrecto: `block.classList.add('hidden')` sobre `#welcomeBlock` **sí rompía** — `.hidden` es global con `!important` (main.css:149), app.js nunca toca `welcomeBlock` (0 referencias) y tras S35 la visibilidad la controla el estado del sheet (`#nearbySelector.state-closed .welcome-block`, explore.css:636). El botón 🏙️ Ciudad ocultaba el bloque de bienvenida permanentemente hasta recargar, mientras `_populatePersistentCityHeader()` seguía poblándolo contra un contenedor invisible. **Consecuencia metodológica: toda validación de BUG-070 hecha con ese botón daba falso negativo garantizado.** Fix: eliminado el bloque de reseteo visual completo (−14 líneas), conservado `AppState._cityWelcomeDone = false`, con comentario explícito de no restaurar | Baja |
| DT-71 | Retiro de `_CITY_NEGATIONS` (narration.js). **Técnicamente desbloqueado tras validar BUG-068 v5 en campo (S37), pero NO ejecutar todavía:** la cascada de adivinanza —donde `_CITY_NEGATIONS` tiene sentido— es exactamente la que corre en periferia, y ese camino sigue roto (ver DT-72). Retirarlo ahora sería quitar la última red del único escenario que aún falla. Recondicionado: el retiro se autoriza cuando DT-72 cierre | Baja |
| DT-69b | **CERRADA (S37, sw v71).** Las páginas de desambiguación pasaban la guarda de DT-69: la regla "ausencia de geoetiqueta = aceptar" no anticipó que el candidato sin coordenadas más probable de todos es precisamente una desambiguación. En campo (Palmira): DT-69 descartó correctamente la Palmira siria, y acto seguido `en.wikipedia/Palmira` —desambiguación sin coordenadas— pasó, llegó a Haiku como lista de acepciones y produjo borrador malformado con fuga de scratchpad (BUG-059 filtró 521 chars). Fix: `prop=extracts\|coordinates\|pageprops` con `ppprop=disambiguation`; al acotar `ppprop`, `page.pageprops` solo existe si la página **es** desambiguación. Descarte antes de la guarda de coordenadas, mismo `continue`. **Limitación declarada:** se apoya en la propiedad oficial de MediaWiki — una página que actúe como desambiguación sin la plantilla pasaría igual. No se agregaron heurísticas de texto (riesgo de falso positivo sobre artículo legítimo) | Media |
| DT-72 | **El hint OSM de DA-87 no llega desde la periferia (S37, evidencia de campo).** Mismo dispositivo, mismo día, misma app: desde Ingenio Manuelita (km 7 vía Palmira-Buga, 5,1 km del centro) no apareció ninguna línea `BUG-068 v5: nombre canónico` y el primer candidato probado fue la cascada de adivinanza; desde el centro de Palmira el hint llegó limpio. Hipótesis: `fetchCityName` con `zoom=10` resuelve desde zona rural una entidad OSM distinta (corregimiento, límite municipal) que no lleva el tag `wikipedia`. No es cosmético: la gente arranca caminatas fuera de los centros constantemente, y ahí la ciudad se queda sin identidad (cae a degradación genérica). **Primer paso es diagnóstico, no código:** loguear los `extratags` crudos que devuelve Nominatim y comparar centro vs. rural antes de decidir el fix. Bloquea DT-71 | Alta |
| DT-73 | **`checkWorker()` en debug.js reporta "ok" con cualquier status (S37).** Pega a `/weather` sin parámetros y recibe 400, pero la línea `_dbgWorkerStatus = res.status ? 'ok' : 'error'` marca cualquier status numérico como truthy — el indicador de salud del Worker reporta "ok" incluso con 400 o 500. El panel no ha estado diciendo nada. Fix: comprobar `res.ok` (o el rango 2xx) y mandar los parámetros que el endpoint espera. Colgar aquí también el comentario fósil de `Care.resetWalk()` en care.js ("PENDIENTE: cablear esta llamada en app.js" — `app.js:539` ya la llama) | Media |
| DT-74 | **Presupuesto de ritmo (S37, del documento de exploración).** DT-61 y DT-65 están planteados como filtros de *calidad* ("¿este POI merece capítulo?"); falta un filtro de *ritmo*: aunque los 20 POIs detectados fueran todos excelentes, narrarlos todos destruye la experiencia. Techo de narraciones por caminata o por unidad de tiempo, independiente del mérito individual. Es el número que la Filosofía de Escasez nunca tuvo. Rangos de partida desde literatura de museos y tours guiados (no evidencia de campo de Follower): ~1/3 de elementos visitados, declive de atención a 30-45 min, 6-12 paradas en un tour autoguiado a pie, ~8 capítulos como techo real de una caminata. **Transversal: ni DT-61 ni DT-65 ni DT-68 se dimensionan bien sin él.** Ver `docs/exploracion_ritmo_y_curaduria.md` §3 | Alta |
| DT-75 | **Clasificador temático de POIs (S37, del documento de exploración).** Etiquetar temáticamente todos los POIs de una ciudad para usar el tema como criterio de selección. Factible y barato: `_attachExtracts()` ya trae el extracto intro de **todos** los POIs wiki al cargar (poi.js:364, lotes de 20), así que clasificar ~40 POIs es **una sola llamada a Haiku** (títulos + primera frase → etiquetas JSON, ~US$0,002, cacheable junto al POI cache, entra al régimen de `POI_CACHE_VERSION`). **Alcance recomendado para v1: prioridad, no exclusión** — cuando el presupuesto de ritmo (DT-74) obligue a elegir 8 de 20, escoger maximizando diversidad temática en vez de por cercanía. Nunca puede producir una caminata muda. La lente completa (la tesis elige el género y filtra POIs) queda como graduación, condicionada a dos riesgos abiertos: quién elige la lente (usuario = selector = audioguía, contradice DA-50) y el piso en ciudades de cobertura escasa. Ver `docs/exploracion_ritmo_y_curaduria.md` §5.2 | Media |
| DT-76 | **Rotación de ángulo narrativo (S37, del documento de exploración) — CONDICIONADA.** Los cuatro registros de DA-50 no se eliminaron como capacidades, solo el selector. Un modo fijo por caminata es *ortogonal* a la fatiga (entrega N capítulos del mismo registro = misma monotonía); lo que la evidencia respalda es variación *dentro* de la caminata decidida por el sistema. La regla 7 del Prompt Maestro ("no repitas el recurso sensorial del capítulo anterior") ya es un mecanismo anti-saciedad en producción — extenderla al ángulo es un delta de una línea. **No se implementa hasta que DT-74 esté en campo:** si se hacen las dos a la vez y la caminata mejora, no se sabrá cuál lo hizo. Costo real cuando toque: bump de `PROMPT_VERSION` (invalida todas las narraciones cacheadas) + revalidación n≥4 de un prompt 16/16 | Baja |

### Bugs de interfaz — reportados Sesión 31

Los seis reportados por Jaime, revisados contra el código en vivo (no
contra memoria) antes de registrarlos. **BUG-051 y BUG-052 quedaron
confirmados en código** en la misma sesión (leyendo `_showTitleCard()` y
`_scheduleWelcomeFallback()` línea por línea) y se fusionan con DT-60
reabierta. Los otros cuatro siguen como hipótesis sin fix aplicado — a la
espera de confirmación en campo antes de tocar código.

| ID | Descripción | Causa | Prioridad |
|----|-------------|-------|-----------|
| BUG-051 | Tras configurar por primera vez, reabrir la app requiere un tap extra para que suene el saludo | **CONFIRMADO en código Y en campo (S31).** El tap sobre el title card llama `_unlockAudioOnFirstTap()` antes de `finish()` — pero si el usuario no toca y el title card termina solo (timer de piso/techo), `finish()` corre sin desbloquear audio. Reproducido en iPhone real: "Cali. Un capítulo te espera en cada esquina, Jaime." solo sonó al tocar la pantalla, no al abrir la app. **CERRADO (S31, sw.js v46) — veredicto de plataforma + decisión B.** El fix v45 (unlock automático en `finish()`) resultó PEOR que el síntoma: iOS acepta la llamada sin gesto sin error pero sin efecto, la bandera queda en `true` falsamente, `_pendingWelcome` no retiene nada y TODA la sesión de audio muere en silencio (log 15-jul 18:23: cero `onstart` en bienvenida + 2 narraciones). Veredicto: el desbloqueo de audio en iOS exige gesto directo; no existe camino automático. Decisión B ratificada: si al completar la carga el audio sigue bloqueado, el title card no avanza solo — muestra "toca para comenzar" y ese tap (gesto real) desbloquea y entra con el saludo sonando. Si el audio ya está desbloqueado (wizard, tap temprano), avanza solo como siempre | Alta |
| ~~BUG-052~~ | El saludo dice "tu ciudad tiene historias que contarte" en vez del nombre real de la ciudad | **CONFIRMADO en código (S31) → CERRADO (S34, con DT-60).** La causa era la carrera: `_scheduleWelcomeFallback()` corría sus 10s desde `initExplore()` mientras `fetchCityName()` ni había empezado. Con DT-60, la ciudad resuelve durante el title card (dataPromise la espera con el techo de 8s) y el fallback solo se agenda si `!AppState.cityName`. Además, por matiz DA-77 (decisión B), el saludo genérico ya NO se habla en ningún caso — el fallback quedó como log de campo. Validado: recurrente y `?reset=1` con saludo real de ciudad, cero genérico | ~~Alta~~ |
| BUG-053 | El mapa no sigue al caminante — el marcador se mueve, el mapa queda fijo | **FIX APLICADO (S31, sw.js v44).** Auto-seguimiento con margen en `updateUserPosition()`: `panTo` suave (0.8s) solo cuando el caminante sale del 70% central del viewport (`getBounds().pad(-0.3)`), nunca en cada lectura. Arrastre manual del mapa pausa el seguimiento por 10s (`dragstart` → gracia temporal, sin botón ni estado extra). Pendiente validación de campo | Alta |
| BUG-054 | El pill de "siguiente POI" abre con un tap pero no se cierra con un segundo tap — hay que tocar el mapa | **CAUSA ENTENDIDA + FIX APLICADO (S31, sw.js v43).** Evidencia de campo (foto 15-jul): el panel cubre ~80% de la pantalla y su único cierre era tocar el mapa — cuya franja visible con el panel abierto es mínima. Fix: tap en cualquier zona del propio panel también cierra (un tap en un ítem primero activa el POI y luego cierra — sin conflicto). Pendiente validación de campo | Media |
| BUG-055 | Pantalla de POI expandido muestra información sobrante de v1 bajo la narración | Confirmado en código: `renderExpanded()` en `poi.js` sigue llamando `renderQuickFacts()` (capacidad/año/altura/fuente) y `renderDepthPills()`, relictos del sistema de narradores múltiples pre-DA-50; también referencia `Config.getNarratorLabel()`, probablemente ya inexistente. **FIX APLICADO (S31, sw.js v45):** eliminadas las llamadas y definiciones de `renderQuickFacts()`/`renderDepthPills()`/`onDepthPill()` en `poi.js`, sus contenedores en `index.html`, y las dos referencias a `Config.getNarratorLabel()` — función que NO existe desde DA-50 (bomba latente que sobrevivía por guards). El rediseño completo de la pantalla sigue siendo DT-16 | Media |
| BUG-056 | El care strip superior sigue mostrando pasos y km caminados | Confirmado en `index.html`: `#careStrip` conserva `csSteps`/`csKm` de DA-19 (S9, v0.6), anterior al manifiesto de Care actual. Viola directamente `manifiesto_care_strip.md` ("no es una app fitness"). DT-42 corrigió el contenido generativo de las care *cards*, pero nunca tocó la barra persistente de arriba. **FIX APLICADO (S31, sw.js v45):** `csSteps`/`csKm` eliminados de `index.html` y de `updateCareStrip()` — el strip queda solo con clima (contexto de cuidado legítimo). `AppState.steps`/`kmWalked` se siguen calculando para las métricas del debug, solo dejaron de mostrarse. Alineado con el manifiesto | Alta |
| BUG-057 | Deadlock de diástole al volver del background — tab de narración clavado, taps ignorados, narraciones futuras bloqueadas, sensación de app muerta | **CAUSA CONFIRMADA + FIX APLICADO (S31, sw.js v43).** Evidencia de campo (log 15-jul): iOS suspende JS y mata `speechSynthesis` al minimizar; `onend` nunca llega; el safety timer (proporcional al texto, sin techo) quedó en 262s para una narración de 1118 chars → 4+ min de diástole clavada, voz zombie (lag 43.7s, dos `error=canceled` en cadena). Fix triple en `voice.js`: (1) recuperación por `visibilitychange` — al volver, `resume()` suave y si la síntesis no habla de verdad en 1.5s, cierre forzado por el camino único `_finish` → fase vuelve a sístole; (2) techo absoluto `SAFETY_MAX_MS=120s` al safety timer; (3) limpieza de `_forceFinish` en `stop()`. **Validación parcial de campo (2ª prueba, 15-jul tarde): la voz siguió muriendo en silencio 2 veces, pero el safety con techo rescató en 87-94s y la app siguió narrando después — sin deadlock, cero errores de síntesis, lag normal (131ms)** | Alta |
| BUG-058 | Pantalla "secuestrada" con el panel de historias abierto — ningún tap responde: ni el propio panel, ni el mapa, ni la barra de debug; obliga a matar la app | **CAUSA REAL ENCONTRADA + FIX APLICADO (S31, sw.js v46).** La hipótesis del overlay (v44) quedó descartada: el secuestro se repitió con el blindaje pointer-events activo. Causa real: `updateHistCount()` reescribía `listEl.innerHTML` en CADA tick de stats — en iOS un tap tarda ~200ms entre `touchstart` y `click`, y si el elemento tocado es destruido/recreado a mitad del gesto (simulador en movimiento → distancias cambian → rebuild constante), Safari cancela el click por completo, sin burbujeo. Todos los taps del panel morían contra DOM inexistente. Los taps al mapa en modo "Dibujar ruta" los consume además el handler de waypoints del simulador. Fix: con el panel abierto, el rebuild se congela (contenido levemente desactualizado mientras abierto — aceptable); se reconstruye al cerrarse. El blindaje pointer-events del overlay se conserva como defensa válida. Pendiente validación de campo con v46 | Alta |
| BUG-059 | La voz lee en voz alta un preámbulo técnico antes del capítulo: "Verificación obligatoria: El extracto menciona autor (...)..." | **CAUSA CONFIRMADA + FIX APLICADO (S31, sw.js v45).** El modelo ejecuta EN VOZ ALTA la "VERIFICACIÓN OBLIGATORIA PRIMERO" del bloque de grounding (que nunca le pidió silencio — el "no muestres esta verificación" del system prompt aplica solo a la VERIFICACIÓN FINAL) y `sanitizeNarration()` solo limpiaba markdown. Evidencia: São Lourenço (Lisboa), 1207 chars hablados incluyendo el preámbulo. Contaminaba además el detector DT-51 (posible "cumple" por el autor citado en el preámbulo) y los conteos de longitud (~15-20% inflados — matiz para DT-62). Fix determinista en `sanitizeNarration()`: patrón inicio-"Verificación/Verification/Mandatory first check"+separador → corte y log; sin separador no toca nada; cubre voz, detector, cache y mediciones en un solo punto. **Hallazgo colateral mayor: el capítulo tras el preámbulo incluyó autor+fecha+motivo tejidos con naturalidad — primera vez tras 6 versiones de prompt en 0/n. La verificación en voz alta (chain-of-thought accidental) es candidata a técnica deliberada en v3.7** | Alta |

### Bugs — Sesión 32

| ID | Descripción | Causa | Prioridad |
|----|-------------|-------|-----------|
| BUG-060 | Extractos de Wikipedia truncados en silencio — autor/fecha nunca llegaban al modelo en artículos donde viven al final del intro | **CERRADO (S32, sw.js v48).** `poi.js` pedía `exchars=2500`, pero la API TextExtracts acepta 1–1200 y recorta valores mayores SIN error ni warning visible. La subida 1000→2500 de la sesión DT-51 nunca funcionó: el extracto real siempre fue ≤1200 (evidencia n=4 Maceta: "tángara multicolor" en pos. 1166 entraba; Pombo en 1849 jamás — frontera limpia en los 4 capítulos). Fix: `exchars` eliminado del request; truncado en cliente a `EXTRACT_MAX_CHARS` (2500) con retroceso al último punto para no entregar frases cortadas. `POI_CACHE_VERSION v4→v5` mismo commit (DA-71). Validado en campo: extracto de Maceta pasó a 1332 chars (triple confirmación por consola, idéntico en Edge/Chrome/Firefox — determinista) y los capítulos nuevos usan el contenido recuperado (la "alegoría al 7", ausente en toda la tanda pre-fix). El caso Maceta reveló además que sus datos de autoría viven tras un encabezado de SECCIÓN — fuera del alcance de `exintro` por definición → DT-66 | Alta |

**Observaciones sin ticket (S32, a vigilar):** (1) voz tardía en ESCRITORIO — Chrome 43.7s y Firefox 48.8s entre `speak()` y `onstart` (el fantasma del pendiente "voz muere en silencio" no es solo iOS; el safety la rescata); (2) bienvenida en idioma cruzado — Safari iPhone con wizard `lang=en` recibió bienvenida en español con voz es-MX (posible fuga de la fuente única de idioma DT-41 en la ruta de bienvenida); (3) rendimiento iOS notable: lag texto→voz 114-141ms constante vs. 500-900ms escritorio.

### Resueltas recientemente

| ID | Descripción |
|----|-------------|
| ~~BUG-062~~ | *(Sesión 34, sw.js v49)* **CAUSA CONFIRMADA + FIX APLICADO.** `voice.js._finish(source)` cerraba toda narración por el mismo callback `onEnd()` sin pasar el motivo — `narration.js` no podía distinguir un cierre normal (`onend`) de un cierre por `visibility-recovery` (síntesis muerta al volver del background), y marcaba `visited=true` en ambos casos por igual. Fix: `_finish` ahora pasa `source` a `onEnd(source)`; en `narration.js`, el guard de `visited` excluye explícitamente `source === 'visibility-recovery'`. Con cache, el capítulo interrumpido se re-dispara gratis en vez de perderse para siempre. Dos archivos: `voice.js`, `narration.js` |
| ~~BUG-061~~ | *(Sesión 34, sw.js v49)* **CAUSA CONFIRMADA + FIX APLICADO.** No tenía relación causal con el tap de salida de walkmode — coincidencia de ventana temporal. La causa real: la rama principal de `detectPOI()` en `poi.js` (`closestPOI.id !== AppState.activePOI?.id` → `activatePOI()`) nunca chequeaba `poi.visited`, a diferencia de `enqueuePOI()` que sí lo hace. Cualquier vez que `AppState.activePOI` volviera a `null` (histéresis de BUG-046, botón de detener narración, o `resetPOIs()`) mientras el POI ya narrado seguía siendo el más cercano, se reactivaba y re-narraba sin guard. Fix: `!closestPOI.visited` agregado a esa condición. Decisión de producto: `activateFromBar()` (tap manual en la lista de historias cercanas) queda sin tocar a propósito — permite re-escuchar un POI visitado cuando el caminante lo pida | Alta |
| ~~BUG-046~~ | *(Sesión 26)* Re-narración en bucle por parpadeo de GPS. Causa raíz real: `activatePOI()` marcaba `visited=true` de inmediato al activar (huérfano de antes de S2-A1), sin guard de re-entrada — el GPS urbano parpadeando cerca del borde del radio cortaba narraciones y las reiniciaba desde cero. Efecto colateral: dejaba `POI.markVisited()` (fix de BUG-044) muerto en la práctica. Fix: histéresis de 3 chequeos (~15s) antes de `deactivatePOI()` + marcado de `visited` devuelto 100% a `narration.js`. Validado en campo (log real, histéresis contando correctamente) |
| ~~BUG-048~~ | *(Sesión 25e)* `updateTopPill()` huérfana desde el refactor de v0.6 (reemplazada por `updateCareStrip()`, pero 5 llamadas en app.js/gps.js nunca se actualizaron) — causaba que el saludo de ciudad real nunca sonara, cayendo siempre al fallback genérico. Diagnosticado por arqueología de git, corregido a `updateCareStrip()` en las 5 ubicaciones |
| ~~BUG-049~~ | *(Sesión 25f)* Herramienta `?reset=1` no reseteaba `Config` en memoria — `config.js` carga antes que `app.js` en index.html, así que `load()` ya leía localStorage stale antes de que el hook limpiara el disco. `introHeard` (nunca reescrita por el wizard) sobrevivía con su valor viejo. Nunca afectó producción, solo la herramienta de prueba. Corregido con `Config.reset()` explícito tras el clear |
| ~~BUG-050~~ | *(Sesión 27b)* Nominatim devolvió `"Cali ciudad"` como nombre de ciudad (sufijo administrativo genérico dentro del propio dato, no una concatenación del código) — probable frontera OSM de "área urbana" separada del municipio completo, reproducido 3 veces en Chrome y Firefox con la misma coordenada. Fix: `_sanitizeCityName()` en `gps.js`, elimina sufijos genéricos (`ciudad, municipio, distrito, corregimiento, comuna`) solo cuando aparecen al FINAL del string, para no romper nombres propios legítimos ("Ciudad de México", "Ciudad Juárez") |
| ~~DT-62~~ | *(Sesión 32)* Metodología de prompt revalidada y CERRADA con prueba directa: `callClaude()` envía `system` como campo real de la API (leído en código, S31) y el Worker desplegado es passthrough puro (curl con `system` de control respondió literal "PASSTHROUGH"). Canal correcto punta a punta → las violaciones de longitud eran falla del prompt, sin excusa metodológica — atacadas y resueltas por el presupuesto en scratchpad de v3.7 (0/8 violaciones en las dos tandas n=4 de S32, vs. 4/4 en S31). La personificación pendiente quedó medida de paso: 2/3 en tanda-2 Maceta, 0/4 en Sagrada Família — sigue siendo la regla menos fiable, candidata a línea de scratchpad en v3.8 |
| ~~DT-9~~ | *(Sesión 25)* Key OpenAI revocada en console.openai.com — verificado 0 keys activas; historial git inerte, sin cambios de código |
| ~~DT-45~~ | *(Sesión 25)* Title card implementado — fade puro, tap salta y desbloquea voz, techo 4s |
| ~~DT-47~~ | *(Sesión 25)* Wizard de entrada implementado — GPS priming, idioma, nombre (DA-75), desbloqueo de voz por gesto. modal-config eliminado |
| ~~DT-3~~ | sw.js — service worker, en v8 |
| ~~DT-19 / DT-33~~ | MP3 de narradores — obsoletas, no hay narrador múltiple ni música (DA-50) |
| ~~DT-22 a DT-27~~ | Cola narrativa, visited-on-complete, cache Overpass, backoff, invalidateCache — resueltas Sesiones 12-18 |
| ~~DT-48~~ | Query Overpass `nwr` — absorbida por DA-72 (Sesión 22): las catedrales eran ways invisibles |
| ~~DT-49~~ | Dedup fina — absorbida por DA-72 (Sesión 22): título normalizado sin prefijos de tipología + <25m intra-OSM / 60m inter-fuente |
| ~~DT-52~~ | Fuente compuesta Wikipedia + Overpass curado por tiers — implementada y validada en campo (Sesión 22, DA-72/73) |
| ~~DT-36~~ | `cleanPOIName()` — limpieza de sufijos Wikipedia antes del prompt |
| ~~DT-38~~ | `_pendingDetect` / `_flushPendingDetect()` — detección inmediata post-carga de POIs |
| ~~DT-39~~ | Memoria de capítulo anterior inyectada en cada narración (DA-58) |
| ~~DT-40~~ | Umbral de inactividad (30m en 10min con ≥500m caminados) |
| ~~DT-41~~ | Tabla país→idioma (`COUNTRY_LANG`, 35+ códigos) + `CITY_WELCOME` en 18 idiomas |
| ~~DT-43~~ | Umbral de zona especial (≥3 POIs en 150m) — `checkSpecialZone()` |
| ~~DA-55~~ | *(Sesión 19)* Pausa de detección en tránsito — `_updateTransitState()` en `gps.js` |
| ~~DT-42~~ | *(Sesión 19)* Care generativo — 7 triggers, `getCareMessage()`, migración de `rain` desde `weather.js` |

## 20. Visión v2.0 — Follower accesible *(registrada Sesión 24 — sin ticket de código)*

**Modo de narración no-visual para personas ciegas o con baja visión.**

Linaje validado: Microsoft Soundscape (open source tras descontinuarse) y
sus sucesores (VoiceVista, Soundscape Community, Soundscape STA) probaron
la demanda de exploración urbana por audio — todos sobre OSM, la misma
fuente compuesta de Follower. El vacío que señala esa comunidad no es
evitar obstáculos (bastón, perro, habilidades propias) — es **saber qué
hay alrededor y qué es interesante**. Ese vacío es el territorio exacto
de Follower: Soundscape anuncia "iglesia a tu derecha"; Follower cuenta
por qué esa iglesia importa.

**Condiciones:**
1. Follower **nunca** es ayuda de movilidad — compañía cultural. Cero
   ambigüedad, declarado explícitamente.
2. Variante de prompt "narrar lo perceptible" (sonido, textura, historia)
   en vez de "lo observable" visual. Depende de DT-51.
3. Condicionada a conversar con usuarios reales antes de asumir
   necesidades. Sin ticket de código hasta entonces.

**Criterio de diseño vigente desde ya:** cada feature que tiente a
depender de la pantalla tiene dos razones para resistir — la visión
cinematográfica y este usuario. La arquitectura audio-first de Follower
ya cubre ~80% del camino; el wizard paso 4 ("Toca para escucharme") es
puerta de entrada accesible: la app se presenta hablando, no mostrando.

---

## Principios aprendidos en campo

**Wikipedia como filtro editorial:** un lugar con artículo en Wikipedia es un lugar que merece ser narrado. Esta alineación entre la curaduría de Wikipedia y la visión cinematográfica de Follower no es coincidencia — es el modelo mental correcto para el descubrimiento de POIs.

**Validar antes de arquitecturizar:** el experimento mínimo (una función, sin nuevos archivos) validó la hipótesis en una sesión. La arquitectura formal de providers vendrá después, respaldada por evidencia de campo en tres ciudades.

**La fuente de datos es parte del producto:** Overpass era un bottleneck técnico que afectaba directamente la promesa de Follower. Cambiar la fuente de datos no fue una decisión técnica — fue una decisión de producto.

**La pregunta cambió (Sprint S2):** antes del laboratorio de campo la pregunta era *¿funciona el pipeline?* Después, con Wikipedia entregando 50 POIs en 237-513ms y Claude narrando en ~5s, la pregunta pasó a ser *¿se siente cinematográfico?* — el trabajo se volvió editorial, no técnico.

---

## DT-60 — CERRADA (S34): la carga real del title card, completa y validada

Ver `arquitectura.md` DA-81 para el diseño original y su corrección en
Sesión 31. Lo que SÍ está confirmado en código en vivo: el splash se
**eliminó del todo** — `#screen-splash` no existe en `index.html`,
`runSplash()`/`expandHeart()` no existen en `app.js`. `_showTitleCard()`
es real y funciona como única pantalla de entrada.

**Lo que la bitácora daba por cerrado en S29 y que Sesión 31 encontró
incompleto al leer `_showTitleCard()` línea por línea:** la promesa de
datos que controla la barra (`dataPromise`) solo espera el **permiso/
posición GPS** (`requestGPSPermission()`). No espera `fetchCityName()`
(nombre de ciudad) ni la carga de POIs — ambas arrancan recién dentro de
`initExplore()`, es decir, **después** de que el title card ya cerró y
navegó a explore. La barra de progreso misma es cosmética
(`Math.random()` por tick), no refleja el estado real de ninguna carga.

Consecuencia directa, confirmada en código (ver BUG-051 y BUG-052 más
abajo): el saludo de ciudad puede no estar listo cuando el title card
termina, y si el usuario no tocó el title card (dejó que terminara solo
por el timer), el audio queda bloqueado hasta un tap adicional en
explore — la "red de seguridad" que el propio código ya anticipa en un
comentario (`initExplore()`, línea ~441).

DT-60 vuelve a quedar activa con alcance corregido: extender
`dataPromise` para que también espere (con el mismo timeout de 8s)
`fetchCityName()` y al menos el primer batch de POIs, antes de decidir
si eso amerita nuevo diseño o solo ajuste de código. Prioridad: Alta.

### CIERRE (Sesión 34, 18 julio 2026 — sw.js v50 y v51)

**Estado de implementación (lo que el código HACE, verificado en campo):**

- `dataPromise` en dos etapas: GPS (sin cambios) → `GPS.fetchCityName(AppState.gps)`,
  para ambos caminos — primera vez incluida (el wizard paso 1 ya dejó la
  posición). `fetchCityName` se exportó en la API pública de gps.js.
- Barra de compuertas reales: la animación conserva su suavidad pero no
  puede adelantar a la realidad — techo 45% hasta GPS, 90% hasta ciudad,
  95% a la espera del race (techo 8s intacto). Mensajes por estado
  (`obteniendo ubicación...` → `preparando tu soundtrack...` →
  `casi listo...`); `TITLECARD_MSGS` indexado por porcentaje eliminado.
  Log enriquecido: `Title card: datos listos · ciudad=X · Nms`, ahora
  también en primera vez.
- `onPosition()` solo llama `fetchCityName` si `!AppState.cityName` —
  evita el doble hit a Nominatim (política 1 req/s) y actúa como
  reintento natural si el title card cerró sin ciudad.
- **Alcance POIs deliberadamente excluido** (Opción A ratificada): la
  tesis DA-85 consume `cityName`, no POIs. Quedó auditado que la vía es
  viable si la evidencia de DT-63 la pide (guarda `!_map` en
  `addPOIMarker` + auto-heal por `updateMarkersState()` en cada ciclo);
  pendiente de auditar `_pendingDetect`/DT-38 antes de activarla.
- **Matiz DA-77 ×2 en el mismo paquete** (detalle en arquitectura.md):
  el saludo genérico no se habla (fallback → log de campo) y el saludo
  real suena SIEMPRE con el mapa visible, vía `_flushPendingWelcome()`
  (función nueva en app.js). El hallazgo de campo de Jaime — "Cali..."
  sonando en el tap del title card — refinó el alcance: el flush salió
  de `_unlockAudioOnFirstTap()` hacia `initExplore()`.

**Validación de campo (S34):** ambos caminos. `?reset=1`: wizard → title
card (barra directo en fase ciudad) → avance solo → saludo con intro
sobre el mapa. Recurrente: barra en dos fases → "toca para comenzar" →
tap en silencio → saludo con el mapa en pantalla. Genérico: nunca sonó.

**BUG-052 muere con este cierre. BUG-051 ya estaba cerrado (S31,
decisión B del umbral).** Regresión atrapada en diseño (no en campo): el
reset de `_cityWelcomeDone` en `initExplore()` habría hecho sonar el
genérico 10s después del saludo real — por eso el fallback se agenda
solo si `!AppState.cityName`.

## DT-63 (S29) — Validar en campo el flujo sin splash

Confirmar en iPhone real ambos caminos del nuevo flujo (post DA-81):

1. **Primera vez** (`?reset=1`): wizard 4 pasos → title card (datos ya en
   camino desde el paso 1, barra debería completar casi de inmediato) →
   explore.
2. **Usuario recurrente** (sin reset): title card directo desde el
   arranque de la app, pidiendo GPS fresco y esperando hasta 8s — validar
   que no se sienta como una espera injustificada, y que si cambia de
   ciudad de un día a otro (p.ej. Barcelona → Lisboa) la detección
   efectivamente se refresca y no queda pegada a la ciudad anterior.

**Nota S31:** este ticket y DT-60 reabierta comparten la misma raíz —
validar DT-63 en campo antes de tocar `dataPromise` probablemente
mostrará el mismo síntoma que ya se encontró leyendo el código. BUG-051
y BUG-052 se fusionan aquí en vez de mantenerse como bugs sueltos.

**Nota S34:** con DT-60 cerrada y validada, ambos caminos (reset y
recurrente) quedaron confirmados en campo en la misma ciudad. Lo que
resta de este ticket: el caso multi-ciudad (Barcelona → Lisboa de un día
a otro — la detección debe refrescarse) y la sensación de espera del
recurrente con red lenta real (barra retenida en 45%/90%).

**Nota S35 — desactualización de este ticket:** el wizard ya NO tiene 4
pasos (Paso 4 "corazón" eliminado — ver DA-77 extendida en arquitectura.md
y bitácora S35); son 3 (GPS, idioma, nombre). El title card tampoco es
una sola pantalla — son 2 etapas (carga sin corazón → corazón latiendo +
"toca para escucharme"). El texto de arriba describe el flujo pre-S35;
sigue sirviendo como referencia histórica, no como estado actual.

Prioridad: Alta — es el único camino de entrada a la app para ambos tipos
de usuario; cualquier regresión aquí bloquea el uso completo.

### Bugs — Sesión 35

| ID | Descripción | Causa | Prioridad |
|----|-------------|-------|-----------|
| ~~BUG-063~~ | *(Sesión 35, sw.js v57)* **CAUSA CONFIRMADA + FIX APLICADO.** El `setInterval` de `_showTitleCard()` nunca se detenía al llegar al estado de espera de tap ("toca para escucharme") — seguía corriendo cada 480ms y sobrescribía el label de vuelta a "casi listo..." una y otra vez, así que el texto de instrucción nunca se alcanzaba a leer. Expuesto por la eliminación del Paso 4 del wizard (S35): antes solo lo pisaba el usuario recurrente, ahora le pasa a todo el mundo. Fix: `clearInterval(iv)` al llegar al punto de decisión, antes de bifurcar entre auto-avance y espera de tap | Alta |
| ~~BUG-064~~ | *(Sesión 35, sw.js v58)* **CAUSA CONFIRMADA + FIX APLICADO.** `welcomeCity()` consultaba `getFreshCityWelcome()` en el mismo instante en que la ciudad se resuelve — pero `prefetchCityThesis()` recién arranca en ese instante (Wikipedia + Haiku, toma segundos). La consulta siempre llegaba antes de tiempo: no era "a veces pierde la carrera", era pérdida garantizada. Fix: la resolución de tesis/prólogo se pospone hasta `_flushPendingWelcome()`/`_resolveAndSpeakCityWelcome()` — el momento REAL en que la voz va a sonar, normalmente varios segundos después de que la ciudad se resolvió, margen real para que Haiku responda | Alta |
| ~~BUG-065~~ | *(Sesión 35, sw.js v56)* **CAUSA CONFIRMADA + FIX APLICADO.** `Config.isFirstTime()` en `_showTitleCard()` siempre contestaba `false`, incluso para un usuario que acababa de completar el wizard por primera vez en su vida — porque la persistencia del wizard (`Config.setLang()` etc.) ya había escrito `localStorage` momentos antes de que el title card preguntara. Bug preexistente a S35 (no introducido esta sesión), pero recién visible al eliminar el Paso 4: hacía que el title card siempre re-pidiera GPS aunque el wizard ya lo hubiera conseguido, y contaminaba la métrica de debug ("returning-user" incluso en primera vez real). Fix: flag explícito `AppState._justCompletedWizard`, no depende del timing de `Config` | Media |
| ~~BUG-066~~ | *(Sesión 35, sw.js v61)* **CAUSA CONFIRMADA + FIX APLICADO.** `Debug.retestCityWelcome()` pasaba `AppState.cityName` ("Cali, CO", con país) a `welcomeCity()` en vez del nombre crudo ("Cali") que usa `prefetchCityThesis()` — mismatch de clave de cache entre lo que se generaba y lo que se consultaba, así que el botón de debug nunca podía mostrar lo que Haiku acababa de generar. Además no esperaba a que la generación terminara antes de consultar. Fix: nombre crudo consistente + `await` real sobre `prefetchCityThesis()` antes de llamar `welcomeCity()` | Media |
| ~~BUG-067~~ | *(Sesión 35, sw.js v60)* **CAUSA CONFIRMADA + FIX APLICADO.** Los botones de acción del panel de debug (Cache, Test, Worker, y los nuevos de esta sesión) vivían en `renderStatus()` — una pestaña sin botón visible en la barra de tabs desde hacía tiempo (huérfana, código legado de una versión anterior del panel). Nunca fueron alcanzables por tap, ni siquiera el viejo "🗑️ Cache". Fix: movidos a `renderSearch()` (la pestaña "POIs", la que sí tiene botón) | Media |

| ~~BUG-068~~ | *(Sesión 36, reabierto S36b, FIX DEFINITIVO S36c)* **CAUSA RAÍZ REAL CORREGIDA — no era sesgo de Haiku.** Diagnóstico revisado en S36c: el extracto se pedía a Wikipedia con `titles: cityName` (nombre corto de Nominatim, "Palmira") — y en es.wikipedia ese título resuelve al artículo de la Palmira siria (provincia de Homs), no a la colombiana ("Palmira (Colombia)"). Haiku no alucinaba: obedecía con precisión un extracto de origen incorrecto. Por eso v1→v4 (todo enfoque sobre el prompt) fallaban siempre — el prompt nunca fue la causa. Fix v5: `gps.js` pide el reverse de Nominatim con `zoom=10&extratags=1` (verificado en campo: objeto principal pasa a ser la relación admin de la ciudad, no una calle/way de detalle máximo) y extrae el tag `wikipedia` ("es:Palmira (Colombia)") como título canónico exacto — sin adivinanza. `narration.js` usa ese hint como primer intento en `_fetchCityExtract`, con la cascada de adivinanza anterior conservada como fallback si el tag no existe. `THESIS_PROMPT_VERSION` v4→v5 (invalida cache de tesis mal-generadas). `_CITY_NEGATIONS` (v3) queda como red secundaria — retiro condicionado, ver DT-71. **VALIDADO EN CAMPO (S37, Palmira centro, 30 jul):** log muestra `BUG-068 v5: nombre canónico Wikipedia "Palmira (Colombia)" (Nominatim: "Palmira") · hint OSM usado` y tesis generada correcta — *"la ciudad que cultiva respuestas"*, doble sentido con fundamento real (capital agrícola + sede del CIAT y el ICA). Sin Siria, sin Zenobia. **BUG-068 CERRADO.** Limitación descubierta en la misma validación: el hint no llega desde la periferia (5,1 km del centro) — ver DT-72 | Alta |
| ~~BUG-069~~ | *(Sesión 36)* **ABSORBIDA POR DA-86.** Bogotá: returning-user veía texto genérico aunque la tesis se generara correctamente 2 s después. Causa: camino returning-user tenía ~3 s de pista contra ~4-6 s de Haiku — perdía siempre. Absorbida por DA-86 (title card espera `whenCityWelcomeReady()` antes de habilitar el tap). | Alta |

### Bugs — Sesión 36c

| ID | Descripción | Causa | Prioridad |
|----|-------------|-------|-----------|
| ~~BUG-070~~ | *(Sesión 36c, sw.js v68)* **CAUSA CONFIRMADA + FIX APLICADO.** DA-86 §1 dice explícito: "Mostrar (tesis + prólogo en el tab): siempre... Sesión 1 o sesión 50" — pero `_populatePersistentCityHeader()` (la rama de "ciudad ya narrada", visitas recurrentes) solo poblaba `#welcomeTesis`, nunca `#welcomePrologo`. La tesis persistía correctamente; el prólogo quedaba huérfano/vacío desde la segunda visita a una ciudad. No se notaba porque `.welcome-prologo` está oculto por CSS en `state-peek` — solo se veía el vacío al expandir manualmente el tab en una visita de retorno. Fix: nuevo parámetro `prologo` en la firma, escrito igual que ya hacía `_showCityWelcomeSheet` en la bienvenida fresca; único call site real actualizado para pasar `welcome.prologo` | Media |



Cuatro botones nuevos en la pestaña POIs del panel: **🏙️ Ciudad** (borra la tesis de la ciudad actual y re-dispara la bienvenida sin recargar), **🗑️ Todas las tesis** (borra tesis de todas las ciudades probadas, sin tocar POIs), **🔄 Actualizar app** (fuerza `skipWaiting()` bajo demanda vía `postMessage`, evita cerrar pestañas manualmente en cada deploy), **🆕 Primera vez** (`Config.reset()` + borrado de IndexedDB, para probar el flujo completo — wizard, title card, tesis fresca — como lo vería un usuario nuevo real).

**Hallazgo de infraestructura (preexistente, no introducido en S35):** `index.html` se sirve cache-first y `skipWaiting()` está deshabilitado a propósito ("no interrumpir audio activo" en producción). Un F5 normal NO trae el HTML/CSS más reciente — solo cerrar todas las pestañas del sitio, o el nuevo botón "Actualizar app", fuerzan la versión nueva. Explica buena parte de la confusión al probar cambios que "no aparecían" durante esta sesión.

---

## DT-68 — Reespecificación y ascenso a prerrequisito doble (S38)

*Sesión 38, 31 julio 2026. Sesión de diseño, sin código. Este bloque **reemplaza el enunciado** de la fila DT-68 de la tabla de la sección 19, que quedó incorrecto por dos motivos distintos. Cierra el pendiente #6 de la lista de S37 ("DT-68 — reescribir enunciado").*

### Qué decía la fila original

> *"Acumulación de capítulos narrados en memoria de sesión (DA-85, S33): guardar título + idea central de cada capítulo de la caminata actual — hoy solo se conserva el último (DT-39/DA-52). Habilitador del insumo del Epílogo."*

Dos errores:

**1. "Hoy solo se conserva el último" es falso.** `_walkChapters` ya acumula todos los capítulos de la caminata. Lo que usa el último es el *consumo* (la continuidad de la regla 7), no el almacenamiento. El ticket describía como faltante algo que ya existe a medias.

**2. "Título + idea central" es insuficiente.** El insumo del Epílogo son los textos completos (ya ratificado en S37), y desde S38 hay un segundo consumidor con necesidades distintas.

### Enunciado corregido

**DT-68 — Ledger de caminata.** Formalizar `_walkChapters` como ledger de sesión con dos vistas del mismo evento, porque tiene dos consumidores incompatibles entre sí:

| Consumidor | Qué necesita | Cuándo lee | Presión |
|---|---|---|---|
| Epílogo (DA-85 §4) | Capítulos completos — sustancia para cerrar la película | Una vez, al final | Ninguna |
| Rotación de facetas (DA-85 §3) | Etiquetas compactas — qué ángulos ya se gastaron | En cada prompt de capítulo | Tokens y latencia |

Si el ledger guarda solo capítulos completos, la rotación tendría que inyectar veinte textos de 130 palabras en cada llamada: inviable. Si guarda solo etiquetas, el Epílogo se queda sin material. Guarda ambas.

Cada entrada: `{ texto, faceta }`. La faceta la declara el propio capítulo en su scratchpad (ver DA-85 §3 enmienda S38). **La faceta viaja también dentro del registro cacheado**, porque en una ciudad ya caminada buena parte de los capítulos se sirven de caché y nunca pasan por el scratchpad — un ledger ciego a los cacheados se degradaría peor en la ciudad donde más caminas, y en silencio.

Ventana de inyección para la rotación: **últimas 8 facetas, FIFO**. El Epílogo lee el ledger completo.

Sigue siendo memoria de sesión, no IndexedDB: cada caminata es única.

### Ascenso a prerrequisito doble

DT-68 dejó de ser habilitador solo del Epílogo. **También es prerrequisito duro de DA-85 §3**, porque la rotación de facetas necesita memoria de sesión: la regla 7 solo ve el capítulo inmediatamente anterior, así que sin ledger el capítulo 5 puede repetir la faceta del 2 sin violar ninguna regla. Sobre veinte POIs la rotación sería aleatoria con reemplazo.

```
Validación campo (Palmira ✔ S37, Cali pendiente)
            ↓
          DT-68
         ↙      ↘
   DA-85 §3    DT-46 → Epílogo (DA-85 §4)
```

**Consecuencia en la hoja de ruta:** DT-68 sube del puesto 6 al 5 y DA-85 §3 baja detrás. Reordenamiento con causa, no por conveniencia: un mismo mecanismo alimentando dos features es buena señal arquitectónica, pero obliga a construirlo antes que ambas.

**Prioridad:** Media → **Alta** (dos features bloqueadas).

**Relacionado:** DA-85 §3 (enmienda S38), DA-85 §4, DT-53, DT-46, DT-39/DA-52, DT-74 (el presupuesto de ritmo dimensiona cuántas entradas tendrá un ledger real).

---

*Follower — Producto v0.9 | Sesión 38 | 31 Julio 2026*
