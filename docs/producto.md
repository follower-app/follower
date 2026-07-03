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

## 9. Bienvenida de Ciudad *(v0.9 — activo)*

Al entrar a una ciudad, aparece una frase única centrada sobre el mapa con fade in/out. La frase se pronuncia en el **idioma local de la ciudad** (no en el idioma del usuario) — detectado desde el `country_code` de Nominatim vía tabla ISO 3166-1 → BCP-47 (35+ países, `COUNTRY_LANG` en `narration.js`). Voz única.

- Texto en DM Serif Display, centrado, sobre el mapa
- Se dispara una vez por sesión
- Desaparece automáticamente a los 5 segundos o al tocar
- Si Nominatim no responde en 10s, aparece un fallback genérico en el idioma del usuario (`Config.get('lang')`)
- `_cityWelcomeDone` se resetea en cada `initExplore()` — nueva sesión, nueva bienvenida

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
| Bienvenida animada (splash → pantalla de carga real) | 🔲 | Pendiente — DT-45 |
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

## 19. Deuda Técnica Activa *(actualizada a Sesión 21 — 3 julio 2026)*

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
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
| Nueva | Cablear `Care.resetWalk()` en `app.js`, donde se resetea `_walkChapters` — bloqueante para que `thirst` funcione una vez por caminata y no una vez por sesión de navegador | Alta |
| DT-44 | Medir en campo si la autoevaluación interna del Prompt Maestro v2.7 afecta latencia | Alta |
| DT-45 | Diseño de UI: pantalla de bienvenida animada (splash mínimo + texto letra por letra) | Alta |
| DT-46 | Diseño de UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración tipo Organiza2 (reemplaza modal único actual) | Media |
| DT-48 | Query Overpass en sintaxis `nwr` — diferida de Sesión 20, reevaluar con datos de campo | Baja |
| DT-49 | Dedup de POIs por cuadrícula ~111m se come vecinos legítimos — diseño listo: título normalizado + distancia real <25m con `distanceMeters()` | Alta |
| DT-50 | Cache de narraciones sin versión de prompt — capítulos pre-DA-66 servidos en campo (Sesión 21); mismo patrón que DA-71 | Alta |
| DT-51 | Grounding de narración con `generator=geosearch&prop=extracts` — cierra alucinación tipo Pasto y basura sin tipo que DA-70 no atrapa | Alta |

### Resueltas recientemente

| ID | Descripción |
|----|-------------|
| ~~DT-3~~ | sw.js — service worker, en v8 |
| ~~DT-19 / DT-33~~ | MP3 de narradores — obsoletas, no hay narrador múltiple ni música (DA-50) |
| ~~DT-22 a DT-27~~ | Cola narrativa, visited-on-complete, cache Overpass, backoff, invalidateCache — resueltas Sesiones 12-18 |
| ~~DT-36~~ | `cleanPOIName()` — limpieza de sufijos Wikipedia antes del prompt |
| ~~DT-38~~ | `_pendingDetect` / `_flushPendingDetect()` — detección inmediata post-carga de POIs |
| ~~DT-39~~ | Memoria de capítulo anterior inyectada en cada narración (DA-58) |
| ~~DT-40~~ | Umbral de inactividad (30m en 10min con ≥500m caminados) |
| ~~DT-41~~ | Tabla país→idioma (`COUNTRY_LANG`, 35+ códigos) + `CITY_WELCOME` en 18 idiomas |
| ~~DT-43~~ | Umbral de zona especial (≥3 POIs en 150m) — `checkSpecialZone()` |
| ~~DA-55~~ | *(Sesión 19)* Pausa de detección en tránsito — `_updateTransitState()` en `gps.js` |
| ~~DT-42~~ | *(Sesión 19)* Care generativo — 7 triggers, `getCareMessage()`, migración de `rain` desde `weather.js` |

---

## Principios aprendidos en campo

**Wikipedia como filtro editorial:** un lugar con artículo en Wikipedia es un lugar que merece ser narrado. Esta alineación entre la curaduría de Wikipedia y la visión cinematográfica de Follower no es coincidencia — es el modelo mental correcto para el descubrimiento de POIs.

**Validar antes de arquitecturizar:** el experimento mínimo (una función, sin nuevos archivos) validó la hipótesis en una sesión. La arquitectura formal de providers vendrá después, respaldada por evidencia de campo en tres ciudades.

**La fuente de datos es parte del producto:** Overpass era un bottleneck técnico que afectaba directamente la promesa de Follower. Cambiar la fuente de datos no fue una decisión técnica — fue una decisión de producto.

**La pregunta cambió (Sprint S2):** antes del laboratorio de campo la pregunta era *¿funciona el pipeline?* Después, con Wikipedia entregando 50 POIs en 237-513ms y Claude narrando en ~5s, la pregunta pasó a ser *¿se siente cinematográfico?* — el trabajo se volvió editorial, no técnico.

---

*Follower — Documento de Producto v0.9 | Sesión 19 | 1 Julio 2026*
