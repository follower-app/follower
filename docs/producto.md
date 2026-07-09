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
| **Logo** | Corazón C2 con brújula · SVG pendiente (DT-1) |
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

## 19. Deuda Técnica Activa *(actualizada a Sesión 26 — 8 julio 2026)*

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA (candidato a rediseño — feedback S25) | Alta |
| DT-60 | Mover carga real de GPS/ciudad/POIs al wizard (paso 2 idioma) + title card; splash pasa a ser estático (sin latido, sin mensajes, sin nombre — corazón+brújula quietos y anónimos). Personalización (nombre, ciudad, "Soy Follower") concentrada en el gesto del corazón al final del wizard. Refinamiento clave: el mecanismo ya existe (DA-77 pendiente+TTL) — si `fetchCityName()` arranca en paso 2 y resuelve antes del corazón, el saludo suena en ese tap sin código nuevo, vía `_unlockAudioOnFirstTap()` vaciando `_pendingWelcome`. Piedra técnica: Leaflet necesita contenedor visible — separar adquisición de datos de construcción del mapa. Diseño co-creado con Jaime en S25d/g, sesión propia con ratificación punto por punto | Alta |
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
| DT-46 | Diseño de UI: confirmación por tap para cierre de caminata — pareja natural de DT-53 | Media |
| DT-56 | Punto de entrada a Modo Recorrido desde explore — reciclar modal-mode como picker. Consecuencia de DA-76; hasta entonces Recorrido es inalcanzable | Media |
| DT-57 | i18n de la copy del wizard — hoy español estático salvo título del paso 2 | Baja |
| DT-53 | getFarewell() — despedida de caminata, nunca implementada; usa nombre DA-75 | Media |
| DT-54 | Wake lock + modo caminata — resuelve suspensión por bloqueo de pantalla (spec S24) | Alta |
| DT-55 | Prefetch de narraciones cercanas — conexión por ráfagas (spec S24) | Media |
| DT-51 | Grounding de narración con `generator=geosearch&prop=extracts` — cierra alucinación tipo Pasto y basura sin tipo que DA-70 no atrapa. **Nueva evidencia de campo S26:** Jaime reportó una narración que "se inventó todo" sobre un POI — detalle (POI, texto, fuente) pendiente de traer a sesión dedicada | Alta |

### Resueltas recientemente

| ID | Descripción |
|----|-------------|
| ~~BUG-046~~ | *(Sesión 26)* Re-narración en bucle por parpadeo de GPS. Causa raíz real: `activatePOI()` marcaba `visited=true` de inmediato al activar (huérfano de antes de S2-A1), sin guard de re-entrada — el GPS urbano parpadeando cerca del borde del radio cortaba narraciones y las reiniciaba desde cero. Efecto colateral: dejaba `POI.markVisited()` (fix de BUG-044) muerto en la práctica. Fix: histéresis de 3 chequeos (~15s) antes de `deactivatePOI()` + marcado de `visited` devuelto 100% a `narration.js`. Validado en campo (log real, histéresis contando correctamente) |
| ~~BUG-048~~ | *(Sesión 25e)* `updateTopPill()` huérfana desde el refactor de v0.6 (reemplazada por `updateCareStrip()`, pero 5 llamadas en app.js/gps.js nunca se actualizaron) — causaba que el saludo de ciudad real nunca sonara, cayendo siempre al fallback genérico. Diagnosticado por arqueología de git, corregido a `updateCareStrip()` en las 5 ubicaciones |
| ~~BUG-049~~ | *(Sesión 25f)* Herramienta `?reset=1` no reseteaba `Config` en memoria — `config.js` carga antes que `app.js` en index.html, así que `load()` ya leía localStorage stale antes de que el hook limpiara el disco. `introHeard` (nunca reescrita por el wizard) sobrevivía con su valor viejo. Nunca afectó producción, solo la herramienta de prueba. Corregido con `Config.reset()` explícito tras el clear |
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

*Follower — Documento de Producto v0.9 | Sesión 24 | 7 Julio 2026*
