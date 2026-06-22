# 📓 Follower — Bitácora v0.5

> Registro cronológico de decisiones, cambios y aprendizajes.

---

## Sesión 1 — Junio 2026

### Exploración y diseño
- Idea nació del viaje a Europa con free guides
- Definido stack: HTML + CSS + JS Vanilla, sin frameworks
- Identidad: logo C2 corazón+brújula, sístole/diástole, DM Serif + Inter
- Mockups completados: splash, exploración, POI expandido
- Documentación base creada: README, REGLAS_IA, producto, arquitectura, bitácora

### Decisiones clave sesión 1
- PWA sobre app nativa — sin app stores, multiplataforma
- OpenStreetMap + Leaflet — gratuito, sin restricciones
- Modo híbrido: Libre (default) + Recorrido (opt-in) — DA-8
- Offline obligatorio — 4 capas de cache — inspirado en Organiza2
- `js/keys.js` local en `.gitignore` para API keys — no `.env` (PWA no puede leerlo)

---

## Sesión 2 — Junio 2026

### Código base completo
Se escribieron todos los archivos del proyecto:

**CSS (6 archivos):**
- `main.css` — variables globales, reset, sistema de fases en body
- `components.css` — botones, pills, cards, waves, badges, vol control, bottom bar
- `splash.css` — latido, rings de pulso, animación de expansión
- `modal.css` — modales, care card, rain variant, route picker
- `explore.css` — mapa Leaflet, pins POI (active/nearby/far), card pequeña
- `poi.css` — héroe, player, narración, acciones fijas al fondo

**JS (11 archivos + keys):**
- `keys.js` — LOCAL ONLY, en .gitignore
- `config.js` — módulo con localStorage, getters/setters validados, getMoodLabel, getMusicTrack
- `app.js` — AppState, navigateTo(), setPhase(), runSplash(), expandHeart(), initExplore()
- `gps.js` — Leaflet init, watchPosition continuo, Haversine, Nominatim, IP fallback
- `poi.js` — Overpass API, IndexedDB, detectPOI(), activatePOI/deactivatePOI, renderExpanded
- `narration.js` — Claude API, 4 moods × 2 langs prompts, timeout 8s, cache IndexedDB
- `voice.js` — Web Speech API, 12 idiomas BCP-47, selección mejor voz, workaround Chrome
- `music.js` — Web Audio API, fadeMusic(), dipForNarration, crossfade entre moods
- `weather.js` — OpenWeatherMap, cache 30min localStorage, alerta lluvia, búsqueda refugio
- `care.js` — checkCareContext(), 4 prioridades (calor/frío/almuerzo/cansancio), cooldown 20min
- `routes.js` — 5 recorridos Roma, Overpass por nombre, Leaflet polyline dorada, picker modal

**Raíz:**
- `index.html` — shell con 4 pantallas + 2 modales, orden scripts correcto
- `manifest.json` — PWA standalone, theme #0d1420, iconos placeholder

### Decisiones tomadas sesión 2
- API keys en `js/keys.js` local — no `.env` (browser no lo lee) — para producción: backend proxy
- Claude API headers: `x-api-key` + `anthropic-version: 2023-06-01`
- Narración: prompt incluye poi.name, cityName, mood, lang, topic (historia/arquitectura/curiosidades/hoy)
- Cache narración: key = `poiId_mood_lang_topic` en IndexedDB
- Música: volumen ambient 35%, dip durante narración a 15%
- Weather: cache 30min en memoria + 2h en localStorage para offline
- Care: primer chequeo a 5 minutos, cooldown 20min, no interrumpir durante diástole
- Routes: POIs buscados en OSM por nombre — no hardcodeados

### Costos definidos
- Claude API: ~$0.0066 USD por narración → ~$30/mes con 10 usuarios activos diarios
- Con cache 60%: ~$12/mes
- OpenWeatherMap: gratis hasta 20 usuarios simultáneos
- Para piloto (1-5 usuarios): $1-5/mes total

---

## Deuda técnica

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final — trazo del corazón pendiente del usuario | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-6 | Backend proxy para API keys en producción | Baja |

---

## Bugs conocidos

*Ninguno detectado aún — fase de código sin pruebas en dispositivo real.*

---

## Próxima sesión

**Objetivo v0.5:** Pruebas locales y debugging

**Orden sugerido:**
1. Copiar todos los archivos al repo local
2. Hacer commit inicial de código
3. Abrir `index.html` en browser local y verificar splash
4. Probar GPS en dispositivo móvil real
5. Verificar carga de POIs desde OSM
6. Probar narración con Claude API
7. Documentar bugs encontrados aquí

**Pendientes antes de pruebas:**
- Conseguir API key de OpenWeatherMap (plan gratuito)
- Conseguir API key de Claude (Anthropic Console)
- Agregar ambas en `js/keys.js` local
- Conseguir o generar 4 archivos de música MP3 por mood

---

*Follower — Bitácora v0.4 | Junio 2026*

---

## Sesión 3 — Junio 2026

### Decisiones
- Migración de Claude API → Gemini 1.5 Flash para piloto (gratuito)
- Keys subidas temporalmente al repo (privado) para pruebas en iPhone
- `contexto_maestro.md` agregado a docs — define el alma del producto
- Descripción actualizada: *"PWA de exploración cinematográfica que combina audioguía contextual, narrativa AI, música y cuidado humano"*

### Bugs encontrados en primera prueba — iPhone

**BUG-001 — Modal de config no aparecía**
- Causa: `Config.isFirstTime()` devolvía `false` en recargas — saltaba directo al mapa
- Fix: `expandHeart()` ahora siempre muestra el modal de config, pre-seleccionando valores guardados
- Archivo: `js/app.js`

**BUG-002 — GPS no pedía permiso en iOS**
- Causa: `GPS.start()` se llamaba después de la config — iOS requiere gesto del usuario primero
- Fix: `requestGPSPermission()` se llama durante el splash, en paralelo con la animación
- La barra de progreso se frena en 95% hasta tener GPS, luego completa
- Archivo: `js/app.js`

**BUG-003 — Mostraba Bogotá en vez de Cali**
- Causa: Consecuencia de BUG-002 — sin GPS caía al fallback de IP (ipapi.co registra Cali como Bogotá)
- Fix: resuelto al resolver BUG-002
- Archivo: `js/gps.js` (sin cambios — el fix fue en app.js)

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final — trazo del corazón pendiente | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-6 | Remover keys del repo antes de producción | Alta |
| DT-7 | Backend proxy para API keys en producción | Baja |

### Próxima sesión — v0.5

1. Probar app.js actualizado en iPhone
2. Verificar que GPS pide permiso correctamente
3. Verificar que modal de config aparece
4. Probar narración con Gemini API
5. Verificar música por mood
6. Documentar nuevos bugs encontrados

---

## Sesión 4 — Junio 2026

### Contexto
Sesión larga de debugging con tres problemas reportados al inicio: narración no carga,
POIs de Cali incompletos, interfaz muy oscura. Se construyó panel de debug (`debug.js`)
para diagnosticar en tiempo real en dispositivo — decisión clave que aceleró todo el resto.

### Bugs encontrados y resueltos

**BUG-004 — Query Overpass demasiado restrictiva**
- Causa: solo 3 categorías de tags (`historic`, `tourism`, `amenity` limitado) — Cali usa
  muchos POIs etiquetados como `leisure`, `man_made`, `building=cathedral/chapel`
- Fix: query ampliada a 7-10 cláusulas según iteración
- Archivo: `js/poi.js`

**BUG-005 — Mapa demasiado oscuro**
- Causa: `filter: brightness(0.5) saturate(0.4) hue-rotate(180deg)` en `.leaflet-tile`
- Fix: `brightness(0.78) saturate(0.6)`, removido hue-rotate (colores irreales)
- Archivo: `css/main.css`

**BUG-006 — typo `btnModeFreee`**
- Causa: triple `e` en el id del botón Modo Libre — nunca respondía al click
- Fix: `btnModeFree`
- Archivo: `index.html`

**BUG-007 — Nominatim devolvía 400**
- Causa: parámetro `lng` en vez de `lon` (Nominatim usa convención distinta a otras APIs)
- Fix: `?lat=${lat}&lon=${lng}`
- Archivo: `js/gps.js`

**BUG-008 — Overpass: timeout 72s + rate limit 429**
- Causa raíz real de "0 POIs cargados": la query usaba `["tag"](around:...)` repetido
  en cada cláusula, forzando a Overpass a recalcular el filtro espacial 10 veces.
  Confirmado con prueba directa en consola: timeout tras 72s, más rate limit 429
  por pruebas repetidas en poco tiempo
- Fix: sintaxis `(around:...)["tag"]` (filtro espacial primero), radio 5km→2km,
  cláusulas reducidas de 10 a 7, timeout interno 30s→25s
- Resultado confirmado: 44 elementos crudos → 31 POIs normalizados y renderizados
- Archivo: `js/poi.js`

**BUG-009 — Mirrors de Overpass caídos**
- `overpass-api.de` y `overpass.kumi.systems` no respondían (probado directo en
  Safari iPhone — "server stopped responding")
- `lz4.overpass-api.de` confirmado funcionando — mirror oficial en uso desde entonces
- Archivos: `js/poi.js`, `js/weather.js` (findNearbyRefuge tenía el mismo dominio caído)

**BUG-010 — Falso positivo de offline en Chrome desktop**
- Causa: Network throttling de DevTools quedó en "Offline", `navigator.onLine` lo
  heredaba y `AppState.offline = true` bloqueaba todo fetch a Overpass
- No es bug de código — diagnóstico documentado para no repetir la confusión

**BUG-011 — Race condition en Web Speech API**
- Causa: `setTimeout` de 100ms en `voice.js` capturaba `_utterance` por referencia
  global; si se activaba un POI nuevo antes de que disparara, `stop()` ya había
  puesto `_utterance = null`, causando `TypeError` y "Voice: interrupted"
- Fix: capturar `_utterance` en variable local antes del `setTimeout`
- Archivo: `js/voice.js`

### Decisión arquitectural — DA-11: Cloudflare Worker

Problema raíz descubierto: motor de narración cambió tres veces por bugs externos
fuera de control del proyecto:

1. **Gemini 1.5 Flash** — Google AI Studio empezó a emitir keys en formato `AQ.`
   en vez del clásico `AIzaSy...`. Bug confirmado masivo en foro oficial de
   desarrolladores de Google, sin fecha de resolución. El endpoint REST clásico
   (`generativelanguage.googleapis.com`) no soporta el nuevo formato → 401 persistente
2. **OpenAI gpt-4o-mini** — requiere método de pago activo desde el primer request,
   sin capa gratuita real para la API (a diferencia de ChatGPT web) → 401 persistente
3. **Claude API (claude-haiku-4-5)** — funcionando, ya se pagaba de todas formas

Problema paralelo: el repo es público (requisito de GitHub Pages gratis), así que
cualquier key en `keys.js`, si se sube para probar en celular, es detectada y
revocada automáticamente por el proveedor (pasó con Gemini).

**Solución:** Cloudflare Worker (`followernarration.jaimeand.workers.dev`) como proxy.
Dos rutas: `POST /narration` (Claude) y `GET /weather` (OpenWeatherMap). Las keys
viven como Secrets en Cloudflare, invisibles en cualquier código del repo. Gratis,
sin tarjeta, 100k requests/día de capa gratuita. Resuelve DT-6 antes de lo planeado.

### Costos actualizados
- Modelo: `claude-haiku-4-5-20251001` (más económico que Sonnet, suficiente para
  narraciones de 3 párrafos)
- Mantiene el presupuesto original de $1-5/mes para el piloto

### `debug.js` — panel de debugging en producción
Herramienta clave de esta sesión. Overlay flotante con 4 tabs:
- **Estado** — GPS, conectividad, estado del Worker, POIs cargados, fase, mood
- **Buscar POI** — lista/búsqueda de POIs cargados, activar narración manual sin
  necesidad de estar físicamente cerca
- **Logs** — captura automática de `console.warn`/`console.error`, más eventos
  internos de GPS/POI/narración
- **Tiempos** — mide duración real de llamadas a la API de narración

Decisión de diseño: el panel hace ping real al Worker en vez de revisar keys
locales (que ya no existen tras la migración a Cloudflare).

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA (404 actual en manifest) | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker | — |
| ~~DT-7~~ | ~~Remover keys del repo~~ — **Resuelto**, `keys.js` ya no contiene secretos reales | — |
| DT-8 | `debug.js` debe quitarse o deshabilitarse antes de v1.0 (solo para desarrollo) | Media |

### Próxima sesión — v0.6

1. Confirmar narración con Claude vía Worker funcionando consistentemente en iPhone
2. Resolver DT-1 (íconos PWA) y DT-2 (música por mood) — bloquean experiencia completa
3. Probar integración completa: GPS → POI → narración → voz → música en un solo flujo
4. Evaluar si la query Overpass de 2km es suficiente para recorridos reales o necesita ajuste
5. Considerar restringir CORS del Worker a dominio exacto en vez de `*` antes de v1.0

---

## Sesión 5 — Junio 2026

### Contexto
Sesión enfocada en logging de producción: se pidió un log de errores/estados
exportable a `.txt`, con foco en los tiempos de carga reales de POIs, música y
narración — la base de la experiencia cinematográfica. Antes de tocar código se
hizo una verificación cruzada completa entre `debug.js` y el resto del repo
(siguiendo la Regla de Oro), que reveló que la tab "Tiempos" del panel solo
medía los botones manuales de debug (`forceLoadPOIs`, `testNarration`), nunca
el flujo real de la app — durante una caminata real no se registraba ningún
tiempo.

### Cambios realizados

**Sistema de métricas con historial (`debug.js`)**
- Reemplazado `timeStart()`/`timeEnd()` (objeto que se sobreescribía, sin
  historial, colisionaba si dos mediciones compartían label) por
  `metricStart(category, label)` / `metricEnd(id, status, meta)` — cada
  llamada devuelve un id único, así que dos narraciones o cargas de POI
  simultáneas no se pisan entre sí
- Tab "Tiempos" ahora muestra promedio/min/max/conteo agrupado por tipo de
  medición, más las últimas 12 mediciones individuales con su status
  (ok/error/cache/fallback/timeout)
- Persistencia en `localStorage` (`follower_debug_log`) — logs y métricas
  sobreviven si Safari mata la pestaña en segundo plano durante prueba en campo
- Nuevo botón "📤 Exportar .txt" en tabs Logs y Tiempos — arma un reporte
  legible (resumen + detalle cronológico + logs) vía `Blob` + descarga
- Simplificados `forceLoadPOIs()` y `testNarration()` — ya no aproximan
  tiempos con `setTimeout`; la medición real ahora vive en los archivos
  instrumentados, sin importar si el trigger fue manual o real

**Instrumentación del flujo real**
- `poi.js` — mide el fetch a Overpass (`fetchPOIsFromOSM`) por separado del
  fallback a cache IndexedDB en `loadPOIs`
- `narration.js` — mide cache lookup (hit/miss), llamada al Worker de Claude
  (ok/error), y el tiempo total desde `trigger()` hasta texto listo para
  `Voice.speak()` — el número que más afecta la experiencia percibida
- `music.js` — mide `loadTrack()` (fetch + `decodeAudioData`) por mood
- Toda la instrumentación queda detrás de `typeof Debug !== 'undefined'` — si
  `debug.js` se quita antes de v1.0 (DT-8), nada se rompe

### Decisión arquitectural — DA-12: Métricas con id único, no por label

Medir con un label fijo como key (`_dbgTimings['narración'] = ms`) revienta en
cuanto hay dos operaciones concurrentes del mismo tipo — exactamente lo que
puede pasar caminando por Cali, si se activa un POI nuevo antes de que termine
de narrar el anterior. Solución: cada `metricStart()` devuelve un id propio
(`category|label|timestamp|random`), y `metricEnd(id, status, meta)` cierra
esa medición específica. El historial completo queda en un arreglo, no en un
objeto que se sobreescribe.

### Hallazgos de seguridad y consistencia

**Hallazgo — `keys.js` con secreto residual pese a DT-7 "resuelto"**
- La Sesión 4 marcó DT-7 (remover keys del repo) como resuelto, pero nunca se
  verificó el contenido real del archivo. `keys.js` seguía con
  `openWeatherMap` y un campo `gemini` con un valor con formato de key de
  OpenAI (`sk-proj-...`), mal etiquetado
- `index.html` ya no carga `keys.js` con `<script>`, así que el archivo estaba
  muerto en código pero seguía siendo un secreto en texto plano en disco
- Fix: `keys.js` vaciado (`openWeatherMap: ''`, `gemini: ''`), estructura
  conservada por si algo lo importa por error
- DT-7 ahora sí resuelto de verdad

**BUG-012 — Mirrors de Overpass inconsistentes entre archivos**
- BUG-009 (Sesión 4) migró `poi.js` y `weather.js` a `lz4.overpass-api.de`,
  pero `care.js` (`findNearbyRestPlace`) y `routes.js` (`loadRoutePOIs`)
  seguían apuntando a `overpass-api.de` sin mirror — el mismo dominio
  confirmado caído en Sesión 4
- `care.js` fallaba en silencio (tiene `.catch()`) así que no se notaba en UI,
  solo dejaba de sugerir lugares de descanso cuando el mirror viejo no
  respondía
- Fix: ambos migrados a `lz4.overpass-api.de` — los 4 archivos del proyecto
  que llaman a Overpass quedan en el mismo mirror

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA (404 actual en manifest) | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` debe quitarse o deshabilitarse antes de v1.0 — incluye limpiar `localStorage['follower_debug_log']` | Media |
| DT-9 | Verificar historial de git por si la key vieja de `keys.js` quedó expuesta antes del `.gitignore`; rotar en el proveedor si aplica | Media |
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker | — |
| ~~DT-7~~ | ~~Remover keys del repo~~ — **Resuelto de verdad esta vez**, `keys.js` vacío y verificado | — |

### Próxima sesión — v0.6 (continuación)

1. Probar el flujo completo en iPhone con el nuevo sistema de métricas activo
2. Exportar el `.txt` desde una caminata real en Cali y revisar tiempos reales
   de POIs/narración/música
3. Confirmar si el total de "narración hasta texto listo" está dentro de un
   rango aceptable para la experiencia cinematográfica, o si el timeout de
   15s necesita ajuste
4. Resolver DT-9 (verificar/rotar key residual)
5. Seguir con DT-1 (íconos PWA) y DT-2 (música por mood)

## Sesión 6 — Junio 2026

### Contexto
Continuación directa de la Sesión 5: análisis del primer log de campo real
(~2h caminando en Cali) que confirmó el bug de concurrencia en `poi.js` (cero
narraciones disparadas) y expuso varios bugs de interfaz nunca antes
probados en dispositivo real. Sesión larga, en orden: bugs bloqueantes →
decisiones de diseño de mapa/modales → prerrequisitos del simulador →
`debug-sim.js` en sí.

### Cambios realizados

**BUG-013 — Modo Libre no respondía al primer clic (reapertura de BUG-006)**
- BUG-006 (sesión anterior) se había marcado resuelto corrigiendo el id en
  `index.html` (`btnModeFreee` → `btnModeFree`), pero nunca se verificó que
  `app.js` tuviera el mismo id actualizado en su `getElementById()` — seguía
  con el typo, así que `initModeModal()` nunca encontraba el botón y el
  listener jamás se adjuntaba
- Fix de una línea en `js/app.js`. Lección de proceso: verificar ambos lados
  de una referencia de id (HTML y JS), no solo uno, antes de cerrar un bug

**BUG-014 — Candado de concurrencia en `poi.js`**
- `detectNearby()` relanzaba `loadPOIs()` en cada chequeo (throttle de 5s)
  mientras `_pois` seguía vacío, sin candado — como cada fetch a Overpass
  tarda 8-58s (más que el throttle), se solapaban fetches simultáneos,
  confirmado con 429s en el log real
- Fix: flag `_isFetchingPOIs` con `try/finally` envolviendo todo el cuerpo de
  `loadPOIs()`, garantiza liberación del candado sin importar el resultado
  (éxito, error, fallback a cache)
- Nota sin resolver: el log también mostró un error de IndexedDB
  (`"connection is closing"`) durante los fetches solapados — probablemente
  ligado a que Safari cierra conexiones idle al backgroundear la app, no
  confirmado si el candado lo resuelve solo (DT-10)

**BUG-015 — Overflow de `#dbg-panel`**
- Sin `overflow-x: hidden`, y `.dbg-log-msg` (hijo de un flex container) sin
  `min-width: 0` — strings largos sin espacios (ej. el XML de error 429 de
  Overpass) empujaban el panel completo más ancho que el viewport
- Fix en `js/debug.js`: `overflow-x: hidden` en `#dbg-panel`, más
  `flex: 1; min-width: 0; overflow-wrap: break-word` en `.dbg-log-msg`

**BUG-016 — Overflow de `.top-pill`**
- `white-space: nowrap` sin `max-width`, creciendo sin freno con contenido
  dinámico (ciudad + mood + temperatura que `weather.js` actualiza cada 10min)
- Fix en `css/components.css`: `max-width: calc(100vw - 32px)` en el
  contenedor; `min-width: 0` + ellipsis en `.top-pill-mood` (el span que
  crece); `flex-shrink: 0` en `.top-pill-city` y `.top-pill-divider`

**BUG-017 — Gradientes de contraste pensados para mapa oscuro**
- Tras DA-13 (cambio a mapa claro), los gradientes oscuros que daban
  contraste a texto claro sobre el mapa (`#screen-explore::before` arriba,
  `.bottom-bar` abajo) se veían como manchas oscuras sobre un fondo claro
- Fix: gradiente superior eliminado por completo en `css/explore.css` —
  confirmado que nada dependía de él (`.top-pill` y `#dbg-toggle` ya tienen
  fondo propio opaco). Gradiente inferior en `css/components.css` reducido
  de opacidad `0.98` a `0.55` + `backdrop-filter: blur(6px)` (sí hacía falta,
  protege `.stat-value`/`.stat-label` que son texto claro sin fondo propio)

**DA-13 — Mapa: filtro simulado → CartoDB Voyager (ver arquitectura.md)**
- Iterado en vivo contra capturas reales: Dark Matter (ilegible con sol
  directo) → Positron (sin info suficiente, por diseño del basemap "soft" de
  CARTO) → Voyager (balance final). Detalle completo en `arquitectura.md`
- Efectos secundarios resueltos en el camino: `.leaflet-container` pasó de
  fondo oscuro a `--color-cream` (parpadeo feo si no, mientras cargan tiles);
  filtro `brightness/saturate` eliminado de `css/main.css`

**Tono de modales — slate suave**
- `--color-night-3` (única variable que usa `.modal` en `modal.css`) pasó de
  `#111d2b` a `#16212f`. Nota de proceso: la comparación visual se había
  hecho contra `#0d1420` ("tono actual"), que en realidad es
  `--color-night` — una variable distinta, usada en splash/explore/mapa, no
  en modales. Confirmado que `--color-night-3` es exclusiva de `.modal`
  antes de tocarla, así que no hubo efecto secundario

**Prerrequisitos del simulador (DA-14, DA-15 — ver arquitectura.md)**
- `js/gps.js`: `simulatePosition()`, `setPOICheckInterval()`,
  `getRadiusConfig()` agregados a la API pública. `getMap()`/`start()`/
  `stop()` ya estaban públicos, no hizo falta tocarlos
- `js/debug.js`: `registerTab()` (hook genérico de tabs externas),
  `getInFlightCount()` (usa `_metricStarts`, que ya existía para esto). Fix
  necesario no planeado: `switchTab()` matcheaba tabs por posición en un
  array hardcodeado, se hubiera roto con cualquier tab agregada
  dinámicamente — corregido a matching por `data-tab`

**`js/debug-sim.js` — simulador de GPS (archivo nuevo)**
- Se registra como 5ª tab vía `Debug.registerTab()`, sin que `debug.js`
  lo conozca por nombre
- Todo movimiento entra por `GPS.simulatePosition()` — nunca duplica lógica
  de `onPosition()` (DA-14)
- Modo teletransportar (clic = salto instantáneo) y modo dibujar ruta +
  caminar (`requestAnimationFrame`, interpolación lineal entre waypoints
  según velocidad elegida — suficiente para tramos urbanos, no es geodesia
  exacta)
- Búsqueda de ciudad vía Nominatim `/search` (mismo proveedor que `gps.js`
  ya usa para `/reverse`, sin key nueva)
- Sliders de velocidad (3/5/8 km/h) e intervalo de chequeo POI
  (1500-5000ms, vía `GPS.setPOICheckInterval()`) para estresar el candado
  de BUG-014 a demanda
- Stats en vivo: acumulado sístole/diástole (trackeado localmente, no
  existía en otro lado — `AppState` solo guarda la fase actual, no
  historial), POIs cargados/visitados, narraciones disparadas (aproximado
  por transición systole→diastole), fetches Overpass en vuelo (vía
  `Debug.getInFlightCount('poi')`)
- Botones "Volver a GPS real" (`GPS.start()`) y "Saltar a Modo Libre"
  (bypassea modales de onboarding — `app.js` no está envuelto en IIFE, así
  que `navigateTo`/`AppState`/`Config` ya eran accesibles sin exposición
  nueva)
- `js/debug.js` ganó clases CSS genéricas reusables (`.dbg-input`,
  `.dbg-btn`, `.dbg-result-item`, `.dbg-slider`) calcadas del estilo visual
  de `#dbg-search-*` pero por clase en vez de id, sin tocar el código
  existente de esa tab
- `index.html`: `debug-sim.js` cargado justo después de `debug.js` (único
  orden que importa — necesita `Debug.registerTab` ya definido)

### Hallazgos de proceso

**`gps.js` no tiene timer propio de "GPS tick"** — la documentación previa
describía un tick cada 3s, impreciso. En realidad `watchPosition()` dispara
`onPosition()` cuando el dispositivo reporta movimiento (sin cadencia fija),
y *dentro* de esa función hay un throttle (`CONFIG.POI_CHECK_INTERVAL`,
5000ms) que decide si vale la pena chequear POIs. Corregido en
`arquitectura.md` — afecta directamente cómo se diseñó el simulador (DA-14).

**Los basemaps "soft" de CARTO no son comparables a Google Maps** — Positron
y Voyager están pensados como fondo neutro para que la app superponga sus
propios datos (marcadores de POI), no como mapa de referencia completo con
cada negocio etiquetado. Explica por qué Voyager se ve con menos densidad de
información que Google Maps — no es una limitación de configuración nuestra.

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA (404 actual en manifest) | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker (siempre último) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` debe quitarse o deshabilitarse antes de v1.0 — ahora incluye también `debug-sim.js` | Media |
| DT-9 | Revocar key OpenAI residual expuesta en `keys.js` (commits `a249fee8`–`a303f110`) — sigue pendiente | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` en fetches solapados — posible causa: Safari cerrando conexiones idle en background, no confirmado si BUG-014 lo resuelve | Media |
| DT-11 | Worker Cloudflare responde 400 en cada arranque de sesión (5/5 en log de campo) — sin diagnosticar | Baja |
| DT-12 | Atribución CARTO/OSM no se muestra (`attribution: ''`) — requerida en tier gratuito, no bloqueante a corto plazo | Baja |
| ~~DT-6~~ | ~~Backend proxy para API keys~~ — **Resuelto** vía Cloudflare Worker | — |
| ~~DT-7~~ | ~~Remover keys del repo~~ — **Resuelto**, `keys.js` vacío y verificado | — |

### Próxima sesión

1. Probar `debug-sim.js` en iPhone: búsqueda de ciudad, teletransportar, y
   sobre todo dibujar ruta + caminar (la parte menos probada)
2. Confirmar en campo si BUG-014 (candado) eliminó los 429 y si el error de
   IndexedDB (DT-10) desapareció solo o necesita fix aparte
3. Resolver DT-9 (revocar key OpenAI) — pendiente hace varias sesiones
4. Seguir con DT-1 (íconos PWA) y DT-2 (música por mood)
5. Diagnosticar DT-11 (Worker 400 en arranque) cuando haya tiempo

---

*Follower — Bitácora v0.5 | Junio 2026*

