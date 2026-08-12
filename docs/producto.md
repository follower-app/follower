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

## 19. Deuda Técnica Activa *(actualizada a Sesión 40 — 4 agosto 2026)*

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
| DT-64 | Brújula (DA-84, S31, diseño cerrado sin código): permiso de orientación silencioso dentro del gesto ya existente (`_unlockAudioOnFirstTap`/wizard paso 4 o primer tap del title card) — sin ícono ni estados reposo/latido/activo. Cono visual en el mapa condicionado a `AppState.activePOI` (solo con POI activo en diástole), no a un botón manual. Elimina `#btnCompass` y `_activateCompass()`/`_deactivateCompass()` manuales; conserva el cono SVG combinado del marcador de usuario (BUG-027) y el listener de `DeviceOrientationEvent`. Retoma y redefine el alcance de DT-20. **ENMENDADA S40 — el cono ya NO se condiciona a `AppState.activePOI`:** es permanente durante toda la sesión una vez concedido el permiso, y lo que cambia con la fase es el color (`--color-systole` caminando, `--color-diastole` narrando), no la existencia. Razón: en ciudad desconocida se puede caminar 15 min sin POI en rango, que es exactamente cuando el caminante se siente perdido — condicionar el cono al POI activo lo apaga en el escenario que lo justifica. El cono es *heading*, nunca *bearing*: no gira hacia el POI y no dice "es por allá". El punto 1 (permiso dentro del gesto existente) y la eliminación del botón siguen intactos. Ver enmienda a DA-84 en `arquitectura.md`. Absorbe además el bug del fondo de `.map-compass-btn.active`, que desaparece al eliminarse el botón | Alta **APLAZADA S41 — tres rutas documentadas, ninguna ratificada.** (a) *Permiso en el tap del title card*: unico gesto que se repite cada sesion, cero taps extra, cero UI nueva — recomendada. (b) *Boton en el mapa*: cuesta un tap por sesion y exige reubicarlo; si vuelve, con brujula generica, no con el corazon-brujula, que es el logo oficial y se degrada al usarse como control. (c) *Pantalla de configuracion permanente* con nombre, idioma y brujula: resuelve el caso pero es un DA propio. **Descartado en S41: un paso 4 en el wizard** — el wizard solo corre en primera vez (`app.js:1299-1304`) y el permiso de DeviceOrientation no persiste entre recargas en iOS, asi que daria brujula el primer dia y nunca mas |
| DT-65 | Curaduría cinematográfica — rama Wikipedia (Fase 2, S32): la compuerta de DA-73 solo filtra OSM; los POIs wiki entran sin filtro y ganan toda fusión. Evidencia: estaciones MIO narradas como capítulos (muchas estaciones de transporte tienen artículo; también bocas de metro en Lisboa/Barcelona). Alcance: blacklist de Nivel D (`manifiesto_pois.md`: metro, MIO, paradas, cajeros, bancos, farmacias, gasolineras, parqueaderos) en la rama wiki por patrón de título y/o categoría, espejo de la blacklist OSM. Implica `POI_CACHE_VERSION++`. Pregunta abierta anexa: tensión Filosofía de Escasez vs. `COMPOSITE_THRESHOLD=8` de DA-72 — decidir en la sesión de este ticket | Alta |
| DT-66 | Autor/fecha fuera del intro (heredero de DT-51, S32): en artículos CON secciones, `exintro` nunca entrega datos que el editor puso en "Historia" (caso Maceta: Pombo/2015 tras el encabezado — verificado por triple consola, extracto determinista de 1332 chars). Candidatas a evaluar en sesión propia: **(a)** fetch del extracto completo solo para el POI activado al narrar (request extra; en artículos largos 2500 chars podrían tampoco alcanzar); **(b)** Wikidata claims — los POIs ya heredan `wikidata` id en la fusión (DT-49); P170 (creador), P84 (arquitecto), P571 (fecha de creación) son datos estructurados, independientes de dónde vive la prosa. Instinto de sesión: (b) es la definitiva | Media |
| DT-67 | Tarjeta narrativa persistente (DA-85, S33) — **ABSORBIDA (S35):** el rediseño completo del tab de ciudad (3 estados — closed/peek/expanded — con ciudad+tesis+prólogo siempre presente e iconos de POI bajo "Por descubrir · N" solo cuando hay alguno) cumple el propósito de este ticket. No necesitó sesión de diseño propia con mockup por separado — se resolvió como parte natural de implementar DA-85 §1. Ver arquitectura.md, "Estado de implementación (S35)" bajo DA-85 | Media |
| ~~DT-68~~ | **CERRADA (S39, sw v73, `PROMPT_VERSION` v3.8) — IMPLEMENTADA SEGÚN LA REESPECIFICACIÓN DE S38.** El enunciado original de esta fila era incorrecto en dos frentes y fue reemplazado por el bloque de S38 (ver anexo); esta fila queda alineada con él para que la tabla no contradiga al anexo. **Ledger de caminata** con dos vistas del mismo evento: `text` completo para el Epílogo (DA-85 §4, lee el ledger entero) y `faceta` compacta para la rotación (DA-85 §3, ventana FIFO de 8). Implementado: `_extractFaceta()` lee la declaración del scratchpad **antes** de que `sanitizeNarration` descarte el andamiaje; el registro cacheado pasa a `{text, faceta}` en `saveToCache`/`loadFromCache`, de modo que un capítulo servido de caché aporta faceta igual que uno generado; el push del ledger guarda ambas vistas; `getRecentFacetas()` existe pero **queda inerte a propósito** — su consumidor (§3) aún no está implementado. Memoria de sesión, no IndexedDB: cada caminata es única. **Validación de campo n≥4 pendiente** (ver protocolo en `prompt_maestro_follower.md` v3.8) | Alta |
| ~~DT-69~~ | **CERRADA (S37, sw v70).** Guarda por coordenadas implementada en `_fetchCityExtract`: `prop=extracts|coordinates` (mismo fetch, sin llamadas extra) + helper `_coordGuardPasses()` que compara el artículo contra `AppState.gps` vía `GPS.distanceMeters`. Umbral 50 km en constante `THESIS_COORD_MAX_KM` — generoso a propósito (el artículo apunta al centro; el caminante puede estar en la periferia de un área metropolitana). Sin geoetiqueta = aceptar (ausencia no es evidencia). Sin GPS = no opinar. Al fallar hace `continue`, no `return null`, para que la cascada siga buscando. **Validada en campo (Palmira, 30 jul):** descartó `es.wikipedia/Palmira` a 11.991 km (Siria) y aceptó `Palmira (Colombia)` a 2 km, sin falso positivo | Media |
| ~~DT-70~~ | **CERRADA (S37, sw v69).** El diagnóstico de S36c ("no-ops, no rompen nada") era incorrecto: `block.classList.add('hidden')` sobre `#welcomeBlock` **sí rompía** — `.hidden` es global con `!important` (main.css:149), app.js nunca toca `welcomeBlock` (0 referencias) y tras S35 la visibilidad la controla el estado del sheet (`#nearbySelector.state-closed .welcome-block`, explore.css:636). El botón 🏙️ Ciudad ocultaba el bloque de bienvenida permanentemente hasta recargar, mientras `_populatePersistentCityHeader()` seguía poblándolo contra un contenedor invisible. **Consecuencia metodológica: toda validación de BUG-070 hecha con ese botón daba falso negativo garantizado.** Fix: eliminado el bloque de reseteo visual completo (−14 líneas), conservado `AppState._cityWelcomeDone = false`, con comentario explícito de no restaurar | Baja |
| DT-71 | Retiro de `_CITY_NEGATIONS` (narration.js). **Técnicamente desbloqueado tras validar BUG-068 v5 en campo (S37), pero NO ejecutar todavía:** la cascada de adivinanza —donde `_CITY_NEGATIONS` tiene sentido— es exactamente la que corre en periferia, y ese camino sigue roto (ver DT-72). Retirarlo ahora sería quitar la última red del único escenario que aún falla. Recondicionado: el retiro se autoriza cuando DT-72 cierre | Baja |
| DT-69b | **CERRADA (S37, sw v71).** Las páginas de desambiguación pasaban la guarda de DT-69: la regla "ausencia de geoetiqueta = aceptar" no anticipó que el candidato sin coordenadas más probable de todos es precisamente una desambiguación. En campo (Palmira): DT-69 descartó correctamente la Palmira siria, y acto seguido `en.wikipedia/Palmira` —desambiguación sin coordenadas— pasó, llegó a Haiku como lista de acepciones y produjo borrador malformado con fuga de scratchpad (BUG-059 filtró 521 chars). Fix: `prop=extracts\|coordinates\|pageprops` con `ppprop=disambiguation`; al acotar `ppprop`, `page.pageprops` solo existe si la página **es** desambiguación. Descarte antes de la guarda de coordenadas, mismo `continue`. **Limitación declarada:** se apoya en la propiedad oficial de MediaWiki — una página que actúe como desambiguación sin la plantilla pasaría igual. No se agregaron heurísticas de texto (riesgo de falso positivo sobre artículo legítimo) | Media |
| DT-72 | **El hint OSM de DA-87 no llega desde la periferia (S37, evidencia de campo).** Mismo dispositivo, mismo día, misma app: desde Ingenio Manuelita (km 7 vía Palmira-Buga, 5,1 km del centro) no apareció ninguna línea `BUG-068 v5: nombre canónico` y el primer candidato probado fue la cascada de adivinanza; desde el centro de Palmira el hint llegó limpio. Hipótesis: `fetchCityName` con `zoom=10` resuelve desde zona rural una entidad OSM distinta (corregimiento, límite municipal) que no lleva el tag `wikipedia`. No es cosmético: la gente arranca caminatas fuera de los centros constantemente, y ahí la ciudad se queda sin identidad (cae a degradación genérica). **Primer paso es diagnóstico, no código:** loguear los `extratags` crudos que devuelve Nominatim y comparar centro vs. rural antes de decidir el fix. Bloquea DT-71. **S39 — instrumentación desplegada (sw v72), diagnóstico pendiente de campo:** `gps.js` loguea ahora el payload crudo del reverse (`osm_type/osm_id`, `class`, `type`, `addresstype`, claves de `extratags`, valor literal de `extratags.wikipedia`) para separar tres hipótesis que hoy son indistinguibles desde fuera — objeto principal equivocado, objeto correcto sin tag, o `extratags` ausente. Se añadió además una **sonda por nombre** (endpoint `search` estructurado con `city`+`country`+`extratags=1`, 1.2s de espera por la política de 1 req/s), que solo dispara cuando el hint sale null y **nunca alimenta `prefetchCityThesis`**: consulta la relación administrativa independientemente de dónde esté parado el caminante, que es el eje del problema. Si la sonda acierta, ES el fix y no solo una pista. Descartada la sonda por zoom alternativo: elegir el zoom es adivinar, e informa solo si el problema es el objeto y otro zoom acierta | Alta |
| ~~DT-73~~ | **`checkWorker()` en debug.js reporta "ok" con cualquier status (S37).** Pega a `/weather` sin parámetros y recibe 400, pero la línea `_dbgWorkerStatus = res.status ? 'ok' : 'error'` marca cualquier status numérico como truthy — el indicador de salud del Worker reporta "ok" incluso con 400 o 500. El panel no ha estado diciendo nada. **CERRADA (S39, sw v72).** El fix propuesto originalmente (`res.ok`) habría roto el indicador al revés: `checkWorker()` pega a `/weather` SIN lat/lon y un Worker sano responde 400 — su propia validación (worker.js:64-69). `res.ok` habría reportado error permanente sobre un Worker perfectamente vivo. Implementado en su lugar `res.status < 500`, cuya semántica es la correcta: "el Worker respondió con lógica propia". Pendiente aún el comentario fósil de `Care.resetWalk()` en care.js ("PENDIENTE: cablear esta llamada en app.js" — `app.js:539` ya la llama), al que se suma un fósil nuevo detectado en S39: el comentario de `Debug.retestCityWelcome()` promete probar "el camino fresco (tesis hablada + sheet expandido)", imposible en ciudad ya marcada desde DA-86 — induce a leer un pase como fallo | Media |
| DT-74 | **Presupuesto de ritmo (S37, del documento de exploración).** DT-61 y DT-65 están planteados como filtros de *calidad* ("¿este POI merece capítulo?"); falta un filtro de *ritmo*: aunque los 20 POIs detectados fueran todos excelentes, narrarlos todos destruye la experiencia. Techo de narraciones por caminata o por unidad de tiempo, independiente del mérito individual. Es el número que la Filosofía de Escasez nunca tuvo. Rangos de partida desde literatura de museos y tours guiados (no evidencia de campo de Follower): ~1/3 de elementos visitados, declive de atención a 30-45 min, 6-12 paradas en un tour autoguiado a pie, ~8 capítulos como techo real de una caminata. **Transversal: ni DT-61 ni DT-65 ni DT-68 se dimensionan bien sin él.** Ver `docs/exploracion_ritmo_y_curaduria.md` §3. **Nota S42 — el presupuesto tiene unidad natural, y es métrica, no temporal.** Medido sobre dos capítulos reales: 696 chars → 44,1 s → **60 m** de caminata a 1,35 m/s; 784 chars → 49,8 s → **67 m**. Un capítulo *consume* 60-67 metros. Con El Gato del Río y Las novias separados **102 m** en los datos de la app, no cabe un capítulo entre ambos sin que termine después de haber pasado el segundo POI — y eso ocurre aunque las coordenadas sean correctas. Reencuadra el ticket: el techo no es "N capítulos por caminata" sino **metros mínimos entre narraciones**, lo que permite discutir por separado calidad (DT-61/DT-65) y dato (DT-91) | Alta |
| DT-75 | **Clasificador temático de POIs (S37, del documento de exploración).** Etiquetar temáticamente todos los POIs de una ciudad para usar el tema como criterio de selección. Factible y barato: `_attachExtracts()` ya trae el extracto intro de **todos** los POIs wiki al cargar (poi.js:364, lotes de 20), así que clasificar ~40 POIs es **una sola llamada a Haiku** (títulos + primera frase → etiquetas JSON, ~US$0,002, cacheable junto al POI cache, entra al régimen de `POI_CACHE_VERSION`). **Alcance recomendado para v1: prioridad, no exclusión** — cuando el presupuesto de ritmo (DT-74) obligue a elegir 8 de 20, escoger maximizando diversidad temática en vez de por cercanía. Nunca puede producir una caminata muda. La lente completa (la tesis elige el género y filtra POIs) queda como graduación, condicionada a dos riesgos abiertos: quién elige la lente (usuario = selector = audioguía, contradice DA-50) y el piso en ciudades de cobertura escasa. Ver `docs/exploracion_ritmo_y_curaduria.md` §5.2 | Media |
| DT-76 | **Rotación de ángulo narrativo (S37, del documento de exploración) — CONDICIONADA.** Los cuatro registros de DA-50 no se eliminaron como capacidades, solo el selector. Un modo fijo por caminata es *ortogonal* a la fatiga (entrega N capítulos del mismo registro = misma monotonía); lo que la evidencia respalda es variación *dentro* de la caminata decidida por el sistema. La regla 7 del Prompt Maestro ("no repitas el recurso sensorial del capítulo anterior") ya es un mecanismo anti-saciedad en producción — extenderla al ángulo es un delta de una línea. **No se implementa hasta que DT-74 esté en campo:** si se hacen las dos a la vez y la caminata mejora, no se sabrá cuál lo hizo. Costo real cuando toque: bump de `PROMPT_VERSION` (invalida todas las narraciones cacheadas) + revalidación n≥4 de un prompt 16/16 | Baja |
| ~~DT-77~~ | **REABIERTA Y CERRADA S41 — por implementacion (DA-88).** El cierre de S40 se apoyaba en una premisa falsa: *"no hay forma limpia de derivar tipo desde Wikipedia GeoSearch sin requests adicionales por POI"*. Hay dos, ninguna por POI — `pageprops` con `ppprop=wikibase_item` viaja gratis en la llamada batcheada de extractos (`poi.js:373-388`), y DT-75 ya especificaba una sola llamada a Haiku sobre extractos en memoria. Medicion de campo (Palmira, radio 2 km, umbral 85% fijado antes de medir): la ruta Wikidata da 25% de cobertura contra la tabla existente y **los cuatro primeros POIs reales pedian tres entradas nuevas** — el mapa `P31 -> emoji` no converge. Cerrada por la ruta modelo + lista cerrada de 25 emojis: mantener una lista de simbolos es trivial, mantener un mapa de claves es imposible. El color sigue diciendo el estado; el glifo pasa a decir el tipo. Fallback 🎬. Ver anexo S41 y `arquitectura.md` DA-88. *(Enunciados S40 y original conservados arriba para trazabilidad.)* | ~~Media~~ |
| ~~DT-78~~ | **CERRADA S41 — por implementacion, con diagnostico corregido.** No eran dos tablas que fusionar: `gps.js:621` ya leia `poi.icon` del registro, y `app.js:228/237` volvia a resolver por tipo un emoji **ya resuelto en el mismo objeto que recorria**. `OSM_ICONS` (`app.js:193-198`) era una tabla que sobra, no una que mover — por eso divergio (14 entradas contra 12): crecio por el lado del consumidor. Ademas aparecio un **tercer** generico no contado: `let icon = '📍'` en `poi.js:760` para el POI de OSM sin categoria. Los tres colapsan en `CONFIG.FALLBACK_ICON`. Neto: -13 lineas de logica. El icono se decide en un solo punto (`poi.js`); `gps.js` y `app.js` quedan en lectura pura, sin `||` ni tabla propia | ~~Baja~~ |
| ~~DT-79~~ | **CERRADA S41.** `CONFIG.NEARBY_RADIUS` reemplaza al `300` escrito a mano en `addPOIMarker()`. El pin y la deteccion ya no pueden divergir | ~~Baja~~ |
| ~~DT-80~~ | **CERRADA S41 — y era un bug vivo, no higiene.** `OSM_CATEGORIES` mezclaba claves del esquema OSM (`'tourism'`, `'amenity'`) con valores (`'museum'`, `'church'`), y el matcher aceptaba `tags[key]` tomando el primer acierto. Con `'amenity'` en tercera posicion, **una iglesia que entra por `amenity=place_of_worship` recibia ☕**; la entrada `'church'` con su ⛪ estaba mas abajo y no se alcanzaba nunca. Igual `'tourism'` en segunda: museum, gallery y viewpoint caian todos en 📍. Las entradas ⛪ 🖼️ ⛲ 🔭 probablemente **no se ejecutaron jamas**, lo que reinterpreta un hallazgo de S40: los pines de OSM genericos no eran falta de clasificacion, era la tabla interceptandolos. Sustituida por `OSM_ICON_MAP` (clave -> valor -> emoji, alineado con la lista cerrada de DA-88) mas `OSM_GENERIC_VALUES`, para que un valor paraguas (`historic=building`) no tape a uno especifico (`amenity=theatre`). `POI_CACHE_VERSION` 6 -> 7: purga obligatoria. **Correccion al enunciado original:** decia que reapuntar la tabla *"cambia que POIs entran"*. Es falso — la admision la decide la query de Overpass y `type` no filtra en ningun punto | ~~Media~~ |
| ~~DT-89~~ | **CERRADA (S42, sw v77) — inventario de POIs en el export.** El panel ya imprimía coordenadas en la pestaña de búsqueda (`renderPOIList`, debug.js:729) pero `exportLog()` nunca recorría la lista de POIs: diagnosticar la coordenada falsa de "Las novias del gato" costó una sesión de teletransportes e inferencia desde el comportamiento, con el dato a un clic en la pantalla equivocada. Bloque nuevo entre "RESUMEN TÉCNICO DE TIEMPOS" y "DETALLE CRONOLÓGICO": total cargados, centro GPS, radios vigentes leídos de `GPS.getRadiusConfig()`, y por POI nombre, coordenada a **6 decimales** (~11 cm — 4 decimales no alcanzan para discutir bordes de radio), distancia, `_source`, `type`, `_iconSource` y `visited`. Tope de 40 con nota de cuántos quedan fuera. **Decisión de diseño: la distancia se recalcula contra `AppState.gps`, no se lee `poi._distanceMeters`** — ese campo lo escribe `detectPOI` y queda rancio si el chequeo no corrió tras moverse; habría metido un dato viejo justo en el instrumento de diagnóstico. Divergencia deliberada con `renderSearch`, que sí usa el cacheado. Sin GPS lista igual, sin distancias y con nota explícita. `POI_CACHE_VERSION` **no** sube: no cambia query, filtros ni normalización | ~~Media~~ |
| DT-90 | **Captura global de errores en debug.js (S42).** No existe `window.onerror` ni `unhandledrejection` en ningún módulo — verificado contra código vivo en `debug.js`, `app.js`, `narration.js`, `poi.js`, `gps.js`, `weather.js` e `index.html`. El panel solo muestra lo que se instrumentó a mano: un `TypeError` en un handler de GPS, un `await` rechazado en la cadena de narración o un fallo dentro de un `catch` silencioso desaparecen sin dejar rastro, y tampoco entran al export. Es el hueco que más pesa en caminata, porque los bugs que importan son justamente los que no se anticipó instrumentar. Alcance: dos listeners que enrutan a `Debug.log('error', ...)` con mensaje, archivo, línea y stack recortado. **Invariante que condiciona el diseño: "nunca mostrar errores crudos al usuario" — la captura es exclusivamente para panel y export, jamás toca la UI.** Punto a ratificar antes de escribir código: `log()` llama a `persistState()` en cada entrada, y un error dentro del loop de `watchPosition` escribiría en localStorage en cada tick; requiere deduplicación por firma o throttle antes de persistir | Alta |
| DT-91 | **Geoetiqueta falsa de fuente — caso "Las novias del gato" (S42).** Medido con el inventario de DT-89: la app ubica el POI en `3.4511, -76.5439`, dentro del cauce del río Cali; Wikidata lo pone en `3.446667, -76.540556`, a **617 m**. El Gato del Río en cambio coincide con Wikidata dentro de **4 m** — **GeoSearch no falla en general, falla ese artículo**. Consecuencia en campo (caminata Gato de Tejada, 8 ago): parado frente al monumento el POI más cercano eran las gatas mal ubicadas a ~30 m, que narraron; el Gato entró en radio ~100 m después y narró tarde. Dos frentes distintos: **(a) CERRADA (12 ago 2026)** — la coordenada no vivía en el wikitexto del artículo (no hay `{{coord}}` ni parámetros de la ficha): **se heredaba de Wikidata `Q41039140`**, cuya declaración tenía además una precisión declarada de **±0.00899947° (~1 km)**, insuficiente para un monumento urbano y causa de que distintos consumidores resolvieran el punto de forma distinta. Corregida a `3.451, -76.544` con precisión inferida ±0.001° (~100 m), acorde a que el conjunto se reparte por ~600 m de bulevar. Verificado en la API de es.wikipedia el mismo día: `prop=coordinates` devuelve ya el valor nuevo — **confirma la cadena Wikidata → ficha → GeoSearch → Follower**, que hasta entonces era hipótesis. **La separación entre ambos POIs pasó de 102 m a ~92 m: el problema de Follower no se movió.** La edición valió por Wikipedia, no por la app; **(b)** decidir qué hace Follower ante una coordenada de fuente incorrecta, para lo que hoy no hay señal de detección disponible (contrastar contra Wikidata cuesta un request por POI y tampoco es autoridad). **La separación real de 102 m entre ambos POIs sobrevive aunque (a) se ejecute** — ver DT-74 y DT-61 | Alta |
| DT-92 | **Los contadores del export se contradicen entre sí (S42).** Tres inconsistencias en un mismo reporte: "POIs activados: 1" junto a "Narraciones completas: 2 (200%)" — la activación manual desde el panel no incrementa el contador de `trackExp`; "Intervalo entre nar.: 388s avg" dos líneas encima de "Sin datos de ritmo (< 2 narraciones)"; y "Tiempo total de sesión: 1min" sobre un detalle cronológico que abarca de 15:38 a 15:46. Las mediciones directas (voz, Worker, lag texto→voz) no están afectadas: el problema está en las capas agregadas, que calculan sobre una noción de sesión que los teletransportes rompen. **Bloquea usar el score cinemático y el reparto sístole/diástole como evidencia para DT-74** — el instrumento tiene que ser confiable antes de calibrar el presupuesto de ritmo con él | Media |

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
| ~~BUG-054~~ | **CERRADA S40 — por rediseño, no por validación.** El panel que describe este bug dejó de existir: DA-85 §1 (S35) lo reemplazó por el sheet de tres estados, con toggle explícito en la manija (`app.js:1219-1220`, peek↔expanded) y botón de cierre propio (`#peekCloseBtn`). El mecanismo que el bug pedía existe hoy por otra vía, así que la fila quedó apuntando a sw v43 y a una UI retirada. No requiere validación de campo. *(Enunciado original y fix de S31 conservados abajo para trazabilidad.)* El pill de "siguiente POI" abre con un tap pero no se cierra con un segundo tap — hay que tocar el mapa | **CAUSA ENTENDIDA + FIX APLICADO (S31, sw.js v43).** Evidencia de campo (foto 15-jul): el panel cubre ~80% de la pantalla y su único cierre era tocar el mapa — cuya franja visible con el panel abierto es mínima. Fix: tap en cualquier zona del propio panel también cierra (un tap en un ítem primero activa el POI y luego cierra — sin conflicto). Pendiente validación de campo | Media |
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
| ~~BUG-070~~ | *(Sesión 36c, sw.js v68 — **CERRADA S39, validada en campo**)* **CAUSA CONFIRMADA + FIX APLICADO + VERIFICADO.** DA-86 §1 dice explícito: "Mostrar (tesis + prólogo en el tab): siempre... Sesión 1 o sesión 50" — pero `_populatePersistentCityHeader()` (la rama de "ciudad ya narrada", visitas recurrentes) solo poblaba `#welcomeTesis`, nunca `#welcomePrologo`. La tesis persistía correctamente; el prólogo quedaba huérfano/vacío desde la segunda visita a una ciudad. No se notaba porque `.welcome-prologo` está oculto por CSS en `state-peek` — solo se veía el vacío al expandir manualmente el tab en una visita de retorno. Fix: nuevo parámetro `prologo` en la firma, escrito igual que ya hacía `_showCityWelcomeSheet` en la bienvenida fresca; único call site real actualizado para pasar `welcome.prologo`. **Validación de campo (S39, Cali):** en visita recurrente el tab expandido mostró tesis Y prólogo, ambos con texto. La prueba es concluyente porque la rama silenciosa de DA-86 es la ÚNICA que llama `_populatePersistentCityHeader()` — el prólogo visible en estado recurrente es la firma exacta del fix. La tesis sola no habría bastado | Media |



Cuatro botones nuevos en la pestaña POIs del panel: **🏙️ Ciudad** (borra la tesis de la ciudad actual y re-dispara la bienvenida sin recargar), **🗑️ Todas las tesis** (borra tesis de todas las ciudades probadas, sin tocar POIs), **🔄 Actualizar app** (fuerza `skipWaiting()` bajo demanda vía `postMessage`, evita cerrar pestañas manualmente en cada deploy), **🆕 Primera vez** (`Config.reset()` + borrado de IndexedDB, para probar el flujo completo — wizard, title card, tesis fresca — como lo vería un usuario nuevo real).

**Hallazgo de infraestructura (preexistente, no introducido en S35):** `index.html` se sirve cache-first y `skipWaiting()` está deshabilitado a propósito ("no interrumpir audio activo" en producción). Un F5 normal NO trae el HTML/CSS más reciente — solo cerrar todas las pestañas del sitio, o el nuevo botón "Actualizar app", fuerzan la versión nueva. Explica buena parte de la confusión al probar cambios que "no aparecían" durante esta sesión.

---

*Follower — Documento de Producto v0.9 | Sesión 35 | 20 Julio 2026*

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

## S39 — DT-68 implementada + validaciones de campo + preguntas abiertas

*Sesión 39, 3 agosto 2026. Sesión de código. Cierra BUG-070, DT-73 y DT-68; despliega la instrumentación de DT-72.*

### Estado de implementación

| Ticket | Estado | Dónde |
|---|---|---|
| BUG-070 | **CERRADA** — validada en campo (Cali) | sw v68, verificada S39 |
| DA-86 | **VALIDADA EN CAMPO** — n=4 | sin cambios de código |
| DT-73 | **CERRADA** | `debug.js`, sw v72 |
| DT-72 | Instrumentación desplegada, **diagnóstico pendiente de campo** | `gps.js`, sw v72 |
| DT-68 | **CERRADA** — validación n≥4 pendiente | `narration.js`, sw v73, prompt v3.8 |

### Validación de campo de DA-86 (evidencia, no impresión)

Palmira y Cali, mismo día, ~25 km de separación (muy por encima de `CITY_ANCHOR_KM=10`):

1. **Primera vez en Palmira** — narró ciudad + tesis, tesis propia (no degradación genérica)
2. **Llegada a Cali** — el ancla re-detectó ciudad y produjo tesis y prólogo **propios de Cali**
3. **Reaperturas 2ª, 3ª y 4ª en Cali** — ciudad, tesis y prólogo se mantuvieron **en texto, sin voz**

Las tres ramas del gate quedan ejercitadas: primera vez (por duplicado, dos ciudades reales), rama silenciosa (n=3 reaperturas) y marca durable sobreviviendo al cierre de la app. El ancla de 10 km queda validada de paso.

**Nota de interpretación, para que no se relea como bug:** el prólogo **nunca se narra**, solo la ciudad y la tesis. `app.js` compone la voz como `${city}. ${welcome.tesis}` y manda el prólogo únicamente al sheet. Es diseño, no omisión.

**El Deber 2 (rearme con 🆕 Primera vez) quedó cancelado por innecesario:** dos ciudades reales son mejor evidencia que un reset, y así se conservan intactas las marcas de Palmira y Cali.

### Preguntas abiertas (no bloquean nada hoy)

**1. ¿DA-85 §3 y DT-76 son el mismo mecanismo?** DT-76 se llama "rotación de ángulo narrativo" y está **condicionada a que DT-74 esté en campo**, precisamente para no confundir dos cambios simultáneos. DA-85 §3 es rotación de facetas. Desde el papel parecen lo mismo, y **DT-76 no aparece ni una vez en `arquitectura.md`**. Si son el mismo mecanismo, §3 hereda el bloqueo de DT-74 y la premisa que ascendió DT-68 a prioridad Alta ("desbloquea dos features") vale a medias: desbloquea el Epílogo, y §3 espera igual. No bloquea DT-68 — el ledger es idéntico en ambos escenarios.

**2. Faceta nula en POIs sin artículo de Wikipedia.** El scratchpad vive dentro del bloque de grounding wiki; `_source:'osm'` no tiene Parte 1, así que esos capítulos entran al ledger con `faceta: null`. El código lo trata como estado legítimo y el log lo muestra como `(sin declarar)`. Consecuencia cuando §3 se implemente: **la ventana de rotación será ciega justo en los lugares menos documentados** — misma familia de degradación silenciosa que S38 previó para el caché, entrando por otra puerta. La enmienda S38 no lo cubre.

**3. Fila DT-68 de la sección 19 vs. anexo S38.** Resuelto en esta sesión: la fila quedó alineada con el anexo en vez de contradecirlo.

### Deuda de higiene pendiente

- `js/keys.js` está **trackeado, vacío y sin un solo referenciador** en `*.js`/`*.html` — y a la vez listado en `.gitignore`, contradicción que solo sirve para que algún día alguien lo vuelva a llenar
- **`.gitignore` está en UTF-16 LE** (redirección `>` de PowerShell). Git lo lee como UTF-8, así que probablemente ninguna de sus reglas funciona. Segunda razón independiente por la que la protección es decorativa: `.gitignore` no aplica a archivos ya trackeados
- Overpass caído (21 errores / 4 OK, máx. 384 s): decidir si merece ticket propio
- ~~Dos comentarios fósiles (ver DT-73)~~ — **corregidos en sw v74** (`care.js:464-466` y `debug.js:1776-1785`). Verificado en código vivo en S40. El deploy v74 no quedó registrado en la bitácora de S39, que enumera solo v72 y v73

### DT-9 — resuelto en la parte que importaba

Auditoría del historial: la key de OpenAI seguía recuperable en `a249fee` (`js/keys.js`, campo llamado `gemini` — de ahí que buscar "openai" en el repo no devolviera nada y reforzara la creencia de que ya no había exposición). El commit `a303f11` dice *"ya no contiene secretos reales"*: describe con exactitud lo que hizo —sacar el archivo del árbol— e induce a error sobre lo que logró, porque el historial no se toca así.

Apareció además un **segundo secreto que DT-9 nunca cubrió**: una key de OpenWeatherMap, servicio que **sí sigue en el stack activo**.

**Acción tomada:** ambas rotadas en el proveedor. Eso es lo que mata el riesgo — reescribir el historial no puede deshacer una exposición pasada en un repo público, y con las keys muertas lo que queda en `a249fee` es texto inerte. Reescritura con `git filter-repo` evaluada y **descartada**: 330 comits cambian de SHA, los clones existentes quedan inservibles y los forks conservan copia igual.

---

*Follower — Producto v0.9 | Sesión 39 | 3 Agosto 2026*

---

## S40 — Revisión de interfaz: seis hallazgos, una ratificación, cero código

*Sesión 40, 4 agosto 2026. Sesión de revisión y diseño. No se tocó código. Todo lo de abajo se verificó contra `raw.githubusercontent.com` o contra capturas de campo del iPhone.*

### Estado real del despliegue al abrir la sesión

`CACHE_VERSION` = `follower-v74` (`sw.js:11`), no v73 como sugiere la bitácora de S39. `PROMPT_VERSION` v3.8 y `THESIS_PROMPT_VERSION` v5 (`narration.js:24-26`), `POI_CACHE_VERSION` 5 (`poi.js:60`). El comentario de v74 dice *"S39 higiene: comentarios fosiles corregidos en care.js y debug.js"* — ese deploy existe en el repo y no está en ningún documento.

### Bugs — Sesión 40

| ID | Descripción | Causa | Prioridad |
|----|-------------|-------|-----------|
| ~~BUG-071~~ | **CERRADA S41 — etiquetas de POI colisionando y saliendose de pantalla.** Resuelta sin `max-width`: la colision desaparece porque **solo el pin activo lleva etiqueta**, y el recorte desaparece porque esa etiqueta lleva **solo la distancia**. Verificado en `app.js:154-159`: en diastole el sheet se oculta entero y el nombre pasa a `.bar-poi-name` en DM Serif a 17 px, asi que la etiqueta del mapa lo repetia a 9 px. No era que no cupiera: sobraba. Se retira tambien `.poi-pin-label.active`, que prometia una variante ya inexistente | ~~Alta~~ |

### Verificado en código: trabajo que ya no hay que hacer

- **Los dos comentarios fósiles de DT-73 están corregidos** en sw v74. La línea de "deuda de higiene pendiente" de S39 quedó desactualizada.
- **BUG-054 se cierra por rediseño** — ver fila. Llevaba desde S31 esperando validación de campo contra una UI que DA-85 §1 retiró en S35.
- **Los pines lejanos se leen bien.** `--color-border` (#1e2d3d) es azul noche casi negro, y el basemap es **CARTO Voyager, que es claro** (`gps.js:62`), no `dark_all`. Contraste alto, no bajo. Descartada la idea de subir el estado `far` a `--color-smoke-3`.
- **El cono azul sobre Voyager se ve discreto y legible**, sin competir con calles blancas ni parques. Volverlo permanente no ensucia el mapa.
- **`updateMarkersState()` está limpio** (`poi.js:1146-1149`): solo llama a `renderAllMarkers()`, y el umbral del pin azul (300 m, `gps.js:612`) coincide con `NEARBY_RADIUS`. El color no miente.

### Ratificado

**Brújula — enmienda a DA-84 (punto 2).** El cono pasa a ser permanente tras el permiso, con color por fase: `--color-systole` caminando, `--color-diastole` narrando, nunca al revés. El punto 1 y la eliminación de `#btnCompass` siguen intactos. Razonamiento completo en `arquitectura.md`. Ticket de implementación sigue siendo DT-64.

### Decisión de diseño — pines opción A (S40, segunda parte de sesión)

**Pines lisos, sin emoji, cuatro estados de color.** El color carga todo el significado — no hace falta glifo. Los emojis desaparecen de todos los pines. Las tablas de tipo→emoji de `poi.js:76-87` y `app.js:193-198` se retiran al implementar.

| Estado | Color | Cuándo |
|---|---|---|
| Lejos | `--color-smoke-3` (#2d3e50) | Más de 300 m |
| Cercano | `--color-systole` (#1a5276) | Menos de 300 m, sin narrar |
| Narrando | `--color-diastole` (#c0392b) | POI activo en diástole |
| Visto | `--color-smoke-3` con hueco interior | `poi.visited = true` |

El estado "visto" no existe hoy en el código: `poi.visited` existe en `poi.js` pero `updateMarkersState()` no lo consume para cambiar el color del pin. Se añade al implementar A — una condición en `gps.js:612` y una regla en `explore.css`. DT-79 se resuelve en el mismo commit — una línea.

Solo el pin activo en diástole lleva etiqueta con nombre y distancia. Los demás, ninguna. BUG-071 queda resuelto en su parte de colisión. Queda pendiente el recorte del nombre largo en el pin activo (`max-width` + `text-overflow: ellipsis` o anclaje al viewport).

DT-77 y DT-78 cerradas por esta decisión. Razonamiento: no hay forma limpia de derivar tipo de POI desde Wikipedia GeoSearch sin requests adicionales. Una mezcla de emojis con cobertura parcial es peor que todos iguales. El color ya cargaba el significado real.

El marcador del caminante no cambia. El emblema no entra en el mapa.

### Observación pendiente de campo — no abrir bug todavía

En la captura de la 1:16 el mapa muestra **tres pines azules** (POIs a menos de 300 m) mientras el sheet expandido dice **"POR DESCUBRIR · 1"**. Las dos rutas usan la misma fórmula y el mismo umbral, así que hay dos mecanismos posibles y ninguno es un defecto nuevo:

1. **El congelado de BUG-058.** `updateHistCount()` abre con `if (!force && isExpanded) return;` (`app.js:207-208`): con el sheet expandido la función retorna antes de recalcular, y el "· 1" es un valor congelado desde que se abrió. Es el costo que S31 aceptó explícitamente, pero se aceptó cuando el sheet era algo que se abría y se cerraba; DA-85 lo volvió un elemento permanente.
2. **El throttle de detección.** El mapa recalcula distancia en vivo en cada render leyendo `AppState.gps` (`gps.js:609-611`), mientras `nearbyPOIs` solo se recompone cuando corre `detectPOI()`, limitado por `POI_CHECK_INTERVAL`. El mapa va adelantado, el sheet atrás, y ninguno está mal.

**Discriminador (una sola observación):** cerrar el sheet y reabrirlo sin moverse. Corrección inmediata → era el congelado. Corrección unos segundos después sin tocar nada → era el throttle. Sin corrección → hay un tercer mecanismo y ahí sí se abre bug.

### Decisión abierta a propósito

**Etiquetas y contenido del pin: opción A (pin liso, sin glifo) vs. opción C (pin liso + emblema en el marcador del caminante).** Se deja sin cerrar hasta tener la caminata: el mapa real decide mejor que el mockup. Descartada la opción B (marca de Follower dentro de cada pin) por dos razones — seis pines con el mismo emblema reproducen el problema de DT-77 con otro dibujo, y **la marca se gasta**: si cada POI lleva la marca de la app, la marca pasa a significar "punto de interés".

**Prueba de tamaño (S40).** A 16 px —el glifo dentro de un pin— el corazón-brújula pierde el trazo (0,67 px efectivos) y la aguja le come el corazón; las exploraciones de manos se funden en bloque. No es argumento para cambiar de logo: **el corazón-brújula sigue siendo el oficial** (`assets/logo.svg`, `assets/icons/icon-master.svg`, y el mismo path en la Etapa 2 del title card). Es argumento para no meter el emblema dentro de un pin. A ~38 px —tamaño del marcador de usuario— el oficial funciona bien, lo que refuerza la opción C.

**Nota de identidad:** el logo oficial es el corazón-brújula. Las direcciones de manos y de dos círculos están **en estudio, no vigentes**.

### Lo que la caminata pendiente debe resolver

Sigue siendo una sola salida, y ahora rinde seis cosas en vez de dos. Se sale con v74 congelado — desplegar la brújula o los pines antes contamina la ventana de observación, porque ambos cambian el mapa, que es la superficie donde se observa BUG-053.

1. **DT-72** — control positivo en el centro antes de salir, luego periferia, y comportamiento de la sonda por nombre
2. **DT-68** — facetas, n≥4
3. **BUG-053** — el mapa sigue al caminante (fix de S31 vivo en `gps.js:117-140`, nunca validado)
4. **BUG-058** — el secuestro de pantalla no se repite (fix de S31 vivo en `app.js:187-208`)
5. **BUG-071** — cuán frecuente es la colisión de etiquetas con nombres reales
6. **Discriminador del "· 1"** — cerrar y reabrir el sheet sin moverse

### Pendiente de escritura fuera de este documento

- Enmienda a DA-84 en `arquitectura.md` *(S41: verificada como ya anexada — `arquitectura.md:3229`; esta nota quedo obsoleta al cierre de S40)* (redactada, sin anexar al cierre de esta entrada)
- Nota del deploy sw v74 en `bitacora.md`, que S39 no registró
- Corrección del párrafo de identidad visual en `instrucciones_proyecto.md`: describe el logo como "símbolo de manos" cuando el oficial es el corazón-brújula y las manos son exploración

---

*Follower — Producto v0.9 | Sesión 40 | 4 Agosto 2026*
---

# Anexo S41 — Reversión de la decisión A de pines: el emoji vuelve, tipificado

**Fecha:** 5 de agosto de 2026 · **Estado:** ratificado e implementado (bloques 1 y 3)

## Qué se revirtió y por qué

S40 cerró DT-77 y DT-78 mediante la decisión de diseño A: pines lisos, sin
emoji, con el color cargando todo el significado. El razonamiento textual
fue: *"no hay forma limpia de derivar tipo de POI desde Wikipedia GeoSearch
sin requests adicionales por POI"*.

**Esa premisa es falsa.** Verificado en código el 5 de agosto:

- `_attachExtracts()` (`poi.js:373-388`) ya hace una llamada batcheada de 20
  POIs con `prop=extracts`. Añadir `|pageprops` con `ppprop=wikibase_item`
  va en **esa misma llamada** — cero requests nuevos — y devuelve el Q-id de
  Wikidata de cada POI.
- DT-75 ya especificaba una sola llamada a Haiku sobre extractos que ya
  están en memoria, ~US$0,002 por ciudad.

La objeción que abrió el tema fue estética (*"se ven muy planos"*). Por sí
sola no habría bastado para reabrir una decisión ratificada. Lo que la
reabrió fue la premisa falsa.

## La medición, con umbral fijado antes de mirar

Umbral acordado **antes** de correr las consultas: ≥85% de los POIs
cercanos mapeando a un ícono distinto del genérico → el emoji vuelve;
<85% → A queda en pie.

GeoSearch real sobre Palmira, radio 2 km (los parámetros de `poi.js:204-213`):

| POI | `type` GeoSearch | `P31` Wikidata | ¿En la tabla de S40? |
|---|---|---|---|
| Palmira (Colombia) | `city` | municipio | descartado por el filtro editorial |
| Catedral Ntra. Sra. del Rosario del Palmar | `landmark` | iglesia | ⛪ sí |
| Estadio Francisco Rivera Escobar | `landmark` | estadio | no |
| Bulevar la Carbonera | `landmark` | — | no |
| Complejo Deportivo y Cultural de San Pedro | `landmark` | — | no |

**Cobertura contra la tabla existente: 1 de 4. 25%.** Por la regla acordada,
la ruta Wikidata queda descartada — pero no por el `P31`, que clasifica
bien, sino por el mapa `P31 → emoji` que hay detrás: **los cuatro primeros
POIs reales de una ciudad pidieron tres entradas nuevas.** A ese ritmo la
tabla no converge.

La distinción que decidió todo: mantener una **lista cerrada de emojis
permitidos** es trivial —25 símbolos, no crecen—; mantener un **mapa de
claves `P31`** es imposible. Son dos trabajos distintos que se estaban
tratando como uno. Haiku recibe la lista cerrada y resuelve el mapeo.

Hallazgos colaterales de la misma medición:

- **`gsprop=type` no discrimina.** Los cuatro POIs reales vienen como
  `landmark`. El tipo de GeoSearch no es una tercera ruta.
- **El artículo de la ciudad sí se filtra**, por `type: "city"` en la
  blacklist. El cinturón de respaldo (`poi.js:298-301`) parte el título por
  coma y no atraparía `"Palmira (Colombia)"`, que es la forma que usa
  es.wikipedia — pero nunca se alcanza. Anotado, sin ticket.
- **Cuatro POIs en 2 km del centro de Palmira**, el más cercano a 1,4 km.
  Esto es más grande que cualquier decisión de pin y apunta a DT-65, DT-61
  y el presupuesto de ritmo de DT-74. **El problema de ritmo en esta ciudad
  no es de exceso sino de vacío**, que es la cara que ninguno de los tres
  tickets contempla.

## Lo que sobrevive de la decisión A

La reversión es parcial. Sigue vigente:

- Color del pin = estado (lejos / cercano / narrando / visto)
- Etiqueta **solo** en el pin activo
- La marca de Follower no entra en los pines (opción B sigue descartada)

Lo que se deroga es únicamente *"pin liso, sin glifo"*.

**Se reasigna la carga semántica:** el color dice el estado, el glifo dice
el tipo. Antes el emoji no decía nada y el color lo decía todo — por eso el
emoji se sentía prescindible y quitarlo se sentía plano.

## Decisiones ratificadas

**Fallback = 🎬.** El genérico anterior (🏛️) no era genérico: afirma
"edificio neoclásico" y mentía sobre un estadio, un bulevar y un complejo
deportivo. Esa es la razón de fondo de por qué los cuatro 🏛️ de la captura
de S40 se leían como textura. 🎬 no clasifica el lugar: clasifica lo que
Follower tiene ahí, un capítulo sin catalogar.

- 🎬 **no está en la lista cerrada** — el cine se queda con 🎞️. Lo escribe
  el código, nunca el modelo.
- 🏛️ deja de ser comodín y pasa a ser un tipo real (edificio histórico o
  civil, palacio, ayuntamiento, casona, hacienda).
- La procedencia no se infiere del emoji: `_iconSource` es un campo aparte,
  para que el contador de degradación no dependa de comparar contra 🎬.

**Estado "visto" = pin sin relleno, contorno de 1,5 px en
`--color-smoke-3`.** La tabla de S40 lo definía como "hueco interior", y el
hueco vive justo donde ahora va el emoji. Además resuelve la contradicción
interna del anexo S40 (que descartaba subir `far` a `--color-smoke-3` en un
párrafo y se lo asignaba en la tabla treinta líneas después): `far` conserva
`--color-border` relleno; `--color-smoke-3` pasa a ser el color del contorno
de `visited`. Un pin lleno y uno vacío se distinguen de reojo; dos grises
que difieren en catorce puntos por canal, no.

**Etiqueta del pin activo = solo la distancia, sin nombre.** Verificado en
`app.js:154-159`: en diástole el sheet se oculta entero y el nombre pasa a
`.bar-poi-name`, en DM Serif a 17 px. Durante la narración el nombre está
siempre visible, sin importar cómo el usuario hubiera dejado el sheet. La
etiqueta del mapa estaría repitiendo palabra por palabra lo que ya dice la
barra. No es que no quepa: es que sobra. Sin nombre no hay recorte posible,
y BUG-071 queda cerrado sin necesidad de `max-width`.

**Chips del sheet:** el color de estado pasa al anillo del chip, para que el
emoji conserve su color propio.

## La lista cerrada — 25 símbolos

⛪ iglesia · 🕌 mezquita · 🕍 sinagoga · 🏛️ edificio histórico o civil,
palacio, ayuntamiento, casona, hacienda · 🏰 castillo, fortaleza, muralla ·
🏚️ ruinas · ⚱️ sitio arqueológico · 🗿 monumento, estatua, memorial ·
🖼️ museo, galería · 🎭 teatro, auditorio, ópera · 🎞️ cine ·
📚 biblioteca, archivo · 🎨 arte público, mural, escultura urbana ·
🌳 parque, jardín, plaza, bulevar, alameda · ⛲ fuente · 🔭 mirador ·
🌉 puente, viaducto · 🗼 torre, faro · 🏭 patrimonio industrial, fábrica,
ingenio, molino, mina · 🏟️ estadio, complejo deportivo, plaza de toros ·
🚉 estación de tren, metro o tranvía · 🎓 universidad, colegio histórico ·
🏪 mercado · 🪦 cementerio · ☕ café o bar histórico

Sale 📍, que en la tabla vieja estaba mapeado a la clave `tourism` — era un
genérico escondido dentro de la tabla de tipos.

🏭 se añadió por región: en Palmira el ingenio azucarero *es* la ciudad, y
que la identidad del lugar cayera entera a 🎬 no sería el fallback
funcionando sino la lista ciega a una región. Aplica igual a Lisboa
(LX Factory), Manchester y Bilbao.

Hacienda y casona entran en 🏛️; tranvía entra en 🚉 — ampliando la columna
de descripción, sin símbolos nuevos. Lo demás sin emoji en Unicode (mirador
de cañaduzal, puente de guadua) cae a 🎬 por diseño.

## Implementado en esta sesión

**Bloque 1 — unificación del icono (DT-78).** `OSM_ICONS` de `app.js:193-198`
no era una tabla que fusionar: era una tabla que sobra. `gps.js:621` ya leía
`poi.icon`; `app.js` volvía a resolver por tipo un emoji ya resuelto en el
mismo objeto que estaba recorriendo. Por eso divergieron —14 entradas
contra 12—: la de `app.js` creció por el lado del consumidor. Neto: −13
líneas de lógica.

**Tres genéricos, no dos.** Además de 🏛️ (wiki) y del `|| '📍'` del render,
apareció `let icon = '📍'` en `poi.js:760` para el POI de OSM que no matchea
categoría. Ese sí es un no-clasificado real y pasa a 🎬 desde ya.

**Bloque 3 — clasificador.** Ver `arquitectura.md` DA-88 y el anexo del
Prompt Maestro.

## Pendiente

**Bloque 2 (pines)** y **bloque 4 (brújula)** esperan la caminata. El bloque
2 cierra BUG-071 y DT-79; el 4 es DT-64.

Consecuencia a tener presente al desplegar: con los bloques 1 y 3 en
producción y el 2 sin hacer, los pines conservan su forma actual y solo
cambia el emoji que llevan dentro.

---

*Follower — Producto v0.9 | Sesión 41 | 5 Agosto 2026*

---

# Anexo S41 (cont.) — Bloque 2 de pines, DT-80 y aplazamiento de la brújula

**Fecha:** 5 de agosto de 2026 · **Estado:** implementado

## Bloque 2 — pines

Cierra **BUG-071** y **DT-79**. `gps.js` + `explore.css`.

- **Precedencia de estado: `activo > visto > cercano > lejos`.** "Visto" gana
  sobre "cercano" a propósito: con DA-86 un POI ya narrado no vuelve a
  activarse, así que pintarlo en sístole invitaría a algo que no va a
  ocurrir.
- **`visited` = pin sin relleno**, contorno de 1,5 px en `--color-smoke-3`,
  emoji al 45%. El "hueco interior" de la tabla de S40 vivía justo donde
  ahora va el emoji; y separarlo de `far` por matiz no funcionaba —
  `--color-border` y `--color-smoke-3` difieren en catorce puntos por canal
  y sobre Voyager claro los dos leen como "pin oscuro".
- **Etiqueta solo en el pin activo, solo con la distancia.**

### Latencia conocida del estado `visited`

`poi.visited` se marca en `narration.js:1560` al completar la narración, pero
el repintado llega vía `updateMarkersState()` desde el tick de detección
(`poi.js:1016`). El pin no cambia en el instante en que calla la voz, sino
en el siguiente tick — un par de segundos.

Se dejó así deliberadamente: llamar a `updateMarkersState()` desde
`markVisited()` sería cambiar dos cosas en la misma ventana. **Si en campo
se siente como un retraso raro, ese es el fix.**

## DT-80 — la rama OSM mapeaba claves, no valores

Ver la fila del ticket. Lo relevante para producto: **las iglesias de OSM
salían con ☕ y los museos con 📍**, y las entradas ⛪ 🖼️ ⛲ 🔭 de la tabla
probablemente nunca se ejecutaron. Eso reinterpreta un hallazgo de S40 —
los pines de OSM que se veían genéricos no era falta de clasificación, era
la tabla interceptándolos.

**Dos cambios de comportamiento visibles:**

- `poi.type` pasa a ser el valor OSM real (`'church'`, `'museum'`,
  `'theatre'`) en vez de la clave (`'amenity'`, `'tourism'`). Se ve en el
  sheet expandido (`app.js:239`, `poi.type || 'historia'`). Es más
  informativo, pero **está en inglés y sin traducir** — ticket aparte si
  molesta.
- `tourism=attraction` cae a 🎬 a propósito: es un cajón de sastre que puede
  ser cualquier cosa. Una claqueta honesta antes que un símbolo que afirme
  algo falso. El contador de degradación dirá cuántas aparecen.

## Brújula — aplazada, no descartada

Ver DT-64 para las tres rutas y sus costos. Lo que cerró esta sesión es lo
que **no** se va a hacer y por qué: un paso 4 en el wizard no funciona,
porque el wizard solo corre en primera vez y el permiso de
`DeviceOrientation` no persiste entre recargas en iOS.

La asimetría que lo decide, y que conviene no volver a discutir:
`getCurrentPosition()` **se puede llamar sin gesto** —por eso el GPS
funciona en sesión recurrente aunque el wizard no se muestre— mientras que
`DeviceOrientationEvent.requestPermission()` **exige gesto**. Es la única
API de permisos con esa restricción, y es la razón de que la brújula lleve
siendo un problema desde S31.

**Nota de método:** este bloque se aplazó también porque es el único de la
sesión que no cierra ningún ticket bloqueante, y porque la observación de
z-index pendiente de captura (¿está el botón tapado por el sheet desde S35?)
cambia el análisis de la ruta (b).

## Estado al cierre

| | |
|---|---|
| `CACHE_VERSION` | `follower-v76` |
| `POI_CACHE_VERSION` | 7 |
| `CLASSIFIER_PROMPT_VERSION` | v1 |
| `PROMPT_VERSION` | v3.8 |
| `THESIS_PROMPT_VERSION` | v5 |

**Pendiente de código:** DT-64 (brújula, tres rutas sin ratificar).

**Pendiente de campo:** la caminata. Cierra BUG-053, BUG-058, DT-72, DT-68 y
el discriminador del "· 1", y aporta la captura del `peek` que decide la
observación de z-index.

---

*Follower — Producto v0.9 | Sesión 41 (cont.) | 5 Agosto 2026*

---

## Anexo Sesión 42 — 11 Agosto 2026

**Sesión de diagnóstico e implementación.** Un hallazgo de campo que se creía
de diseño de radios resultó ser un dato falso de la fuente. Un archivo JS
modificado, cuatro tickets nuevos, y una medición que le da unidad al
presupuesto de ritmo.

Versiones verificadas al abrir: `CACHE_VERSION` v76 (no v74, como habría
sugerido la lectura de S41 sin verificar), `POI_CACHE_VERSION` 7.

### La premisa del hallazgo de campo era falsa

La caminata de Gato de Tejada había dejado anotado que "el radio de
descubrimiento y el de activación se están tratando como uno". Al traer el
código vivo, **ya estaban separados**, y no en dos sino en cuatro:

| Radio | Valor | Dónde | Qué hace |
|---|---|---|---|
| `FETCH_RADIUS_KM` | 2 km | poi.js:58 | Descarga desde Wikipedia/OSM |
| `REFETCH_KM` | 2 km | poi.js:59 | Cuándo volver a descargar |
| `NEARBY_RADIUS` | 300 m | gps.js:28 | Pin "cercano" + `AppState.nearbyPOIs` |
| `POI_RADIUS_METERS` | 120 m | gps.js:27 | Activa narración |

`detectPOI(lat, lng, activeRadius, nearbyRadius)` los recibe como parámetros
distintos y los aplica en dos filtros independientes. El diseño que se iba a
hacer ya existía. **Se evitó una sesión entera de rediseño sobre una premisa
falsa por aplicar la Regla de Oro antes de aceptar el enunciado del ticket.**

### El mecanismo real, confirmado con datos

| POI | Coordenada en la app | vs. Wikidata |
|---|---|---|
| El Gato del Río | `3.4513, -76.5448` | **4 m** |
| Las novias del gato | `3.4511, -76.5439` | **617 m** |

La coordenada de las Novias cae dentro del cauce del río — un conjunto de
esculturas de fibra de vidrio no está en el agua. El Gato coincide con
Wikidata dentro del error de redondeo de cuatro decimales.

Cadena completa: se viene por el sendero desde el oriente; las Novias, mal
ubicadas ~100 m antes del monumento, entran en radio primero y narran 44 s;
esos 44 s son 60 m, así que al terminar el capítulo ya se está frente al
gato; 100 m más adelante el Gato entra en su propio radio y narra, cuando
ya se pasó. **Un solo dato malo produjo los dos síntomas reportados:** el
capítulo equivocado en el lugar correcto, y el correcto en el lugar
equivocado.

### El número que reencuadra DT-74

| Capítulo | Chars | Voz | Metros a 1,35 m/s |
|---|---|---|---|
| Las novias del gato | 696 | 44,1 s | **60 m** |
| El Gato del Río | 784 | 49,8 s | **67 m** |

"Los capítulos se sienten largos" era percepción. **"Un capítulo consume
60-67 metros de caminata" es una medida**, y le da al presupuesto de ritmo
una unidad natural que no tenía: métrica, no temporal. Con dos POIs a 102 m,
no cabe un capítulo entre ellos. Esto es independiente de DT-91: sobrevive
aunque la geoetiqueta se corrija.

### Nota de método

El diagnóstico costó varias horas de teletransportes, exports y aritmética
manual, teniendo el dato a un clic en la pestaña de búsqueda del propio
panel. La lección no es sobre este bug: **el instrumento sabía más de lo que
el export contaba.** De ahí DT-89, y de ahí que DT-90 y DT-92 sean de la
misma familia — el panel pierde información en el camino hacia donde se
puede leer.

Corolario para DT-90: con el inventario de POIs en el export, buena parte de
lo que justificaba un wrapper de `fetch` queda cubierta. La instrumentación
de red baja de prioridad.

### Observado y no atendido

- **BUG-059 sigue logueando dos veces** el mismo filtrado de preámbulo (404
  chars y 185 chars, cada uno duplicado). Ya observado en la caminata de
  agosto. O el sanitizador corre dos veces, o el log está en dos rutas.
- **Worker Cloudflare status=400 al arranque**, consistente (DT-21).
- **Overpass 504 en los tres mirrors** en la sesión de la mañana; la cascada
  DT-52 degradó correctamente a Wikipedia.
- **`Voice: recuperación por visibilitychange — síntesis muerta tras volver
  del background`**, esta vez en escritorio. Dato para la pregunta abierta de
  ciclo de vida, pendiente de reproducir en iPhone.

## Estado al cierre

| | |
|---|---|
| `CACHE_VERSION` | `follower-v77` |
| `POI_CACHE_VERSION` | 7 *(sin cambio — DT-89 no toca query, filtros ni normalización)* |
| `CLASSIFIER_PROMPT_VERSION` | v1 |
| `PROMPT_VERSION` | v3.8 |
| `THESIS_PROMPT_VERSION` | v5 |

**Pendiente de código:** DT-90 (captura global de errores), DT-92
(contadores del export), DT-64 (brújula, tres rutas sin ratificar).

**Pendiente de decisión de producto:** DT-91 (b) — qué hace Follower ante
una coordenada de fuente incorrecta. Y la sesión de curaduría/ritmo que
DT-74, DT-61 y DT-65 llevan pidiendo, ahora con la unidad métrica medida.

**Pendiente de campo:** la caminata sigue debiendo BUG-053, BUG-058, DT-72,
DT-68 y el discriminador del "· 1". Se suma el primer export con inventario
de POIs, que valida DT-89 en dispositivo real.

**Tarea suelta, fuera de código:** ~~corregir la geoetiqueta de "Las novias del
gato"~~ — hecha el 12 ago 2026 en Wikidata `Q41039140`. Pendiente menor:
confirmar que quedó una sola declaración de *coordinate location* en el ítem.

---

*Follower — Producto v0.9 | Sesión 42 | 11 Agosto 2026*
