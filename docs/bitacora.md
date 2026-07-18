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

## Sesión 6 — continuación (misma fecha)

### Bugs adicionales encontrados y cerrados

**BUG-018 — Music.dipForNarration() nunca se llamaba**
- `dipForNarration()` y `restoreAfterNarration()` existían en `music.js`
  y estaban exportadas, pero ningún módulo las invocaba — música y voz
  competían en volumen durante toda la narración, arruinando la
  experiencia cinematográfica
- Descubierto al trazar el orden real del pipeline completo:
  GPS → POI → narración → voz → música
- Fix en `js/narration.js`: `Music.dipForNarration()` antes de
  `Voice.speak()` (texto listo = música baja), `Music.restoreAfterNarration()`
  en el callback de fin de voz (habló = música sube)
- Impacto: bug de experiencia, no técnico — el pipeline funcionaba pero
  la experiencia no se sentía cinematográfica

**BUG-019 — GPS.flyTo() no existe, "Ver en el mapa" no hacía nada**
- `flyToPOI()` en `debug.js` llamaba a `GPS.flyTo(poi.lat, poi.lng)` —
  función que nunca fue implementada en `gps.js`
- Fix en `js/debug.js`: reemplazado por `GPS.getMap().setView()` directo,
  el mismo patrón que ya usa `jumpToCityResult()` en el simulador

**Bugs del simulador (debug-sim.js) — encontrados en prueba en iPhone**
- Input de ciudad no permitía escribir en iOS: el timer de auto-refresh
  (500ms) regeneraba el `innerHTML` completo del panel mientras el usuario
  escribía, cerrando el teclado virtual. Fix: `_cityQuery` preserva el
  valor entre re-renders; `refreshTabIfActive()` detecta si el input
  tiene foco y solo actualiza las stats numéricas sin tocar el input;
  listeners adjuntados con `addEventListener` post-render en vez de
  `onkeydown` inline
- Resultados de búsqueda desaparecían en milisegundos: el timer de 500ms
  borraba los resultados incluso cuando el input no tenía foco (ej. al
  hacer clic en "Buscar", el foco pasa al botón, no al input). Fix:
  `_renderCityResultsInDOM()` restaura los resultados después de cada
  re-render del panel
- Teletransporte y mapa no funcionaban al iniciar: `GPS.getMap()` devuelve
  `null` hasta que `onPosition()` corre por primera vez —
  `ensureMapClickListener()` y `GPS.stop()` se llamaban antes de que el
  mapa existiera. Fix: `teleportTo()` solo llama `GPS.stop()` si el mapa
  ya existe; `ensureMapClickListener()` se mueve a después de
  `simulatePosition()`; `setView()` después de `teleportTo()` en
  `jumpToCityResult()`

### Estado de pendientes al cierre de sesión

**Bugs de código — todos cerrados:**
BUG-001 al BUG-019 resueltos (ver entradas anteriores de bitácora)

**Pendiente de verificación en campo (no confirmado en iPhone):**
- Simulador end-to-end: búsqueda de ciudad → teletransporte → dibujar
  ruta → caminar. Los bugs de UI están corregidos pero no probados en
  dispositivo real post-fix
- BUG-014 (candado de concurrencia): no confirmado que eliminó los 429
  en uso real. Requiere nueva prueba de campo con el log exportado

**Deuda técnica abierta:**

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` + `debug-sim.js` deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` — no confirmado si BUG-014 lo resolvió | Media |
| DT-11 | Worker 400 en arranque de sesión — sin diagnosticar | Baja |
| DT-12 | Atribución CARTO/OSM no visible | Baja |

**Pendiente de implementar (próximas sesiones):**
- Instrumentación completa del pipeline de experiencia (ver análisis
  de capas en esta sesión): voz (`voice.js` sin ninguna métrica),
  dip de música, tiempo hasta primera narración, ritmo sístole/diástole
  en el sistema real (no solo en debug-sim.js local), intervalo entre
  narraciones, % de chequeos de POI que terminan en narración
- Botones `btnBookmark` y `btnShare` en splash — huérfanos, sin lógica
  implementada ni listeners. Decisión pendiente: quitar, ocultar o
  implementar (Share via Web Share API sería sencillo)
- Panel de debug unificado: hoy `debug.js` y `debug-sim.js` comparten
  estado de forma implícita. El simulador trackea sístole/diástole y
  narraciones localmente, no en el sistema de métricas real. Pendiente
  consolidar en un sistema donde el simulador alimenta las mismas
  métricas que una sesión de campo real

### Próxima sesión

1. Probar simulador completo en iPhone (post-fixes de UI)
2. Nueva prueba de campo (o simulada) con log exportado — confirmar
   que BUG-014 eliminó los 429 y que las narraciones se disparan
3. Confirmar si BUG-018 (dip de música) se siente en la experiencia
   real — requiere que DT-2 (MP3 reales) esté resuelto primero, o
   probar con un archivo de audio válido
4. DT-9 — revocar key OpenAI (acción en el proveedor)
5. Decidir qué instrumentar primero en `voice.js` para cubrir la
   Capa 2 del análisis de experiencia

---

## Sesión 7 — Junio 2026

### Contexto
Sesión enfocada en dos objetivos: (1) terminar de cerrar bugs del
simulador encontrados en iPhone, y (2) construir el sistema unificado
de métricas de experiencia — el rediseño del panel de debug para que
sirva como herramienta real de toma de decisiones de producto, no solo
como inspector técnico.

### Análisis previo al código

Se trazó el orden real del pipeline completo de experiencia:
```
watchPosition → onPosition → throttle 5000ms → detectNearby
  → activatePOI → setPhase('diastole') → Narration.trigger()
    → cache / Claude Worker → Voice.speak()
      → Music.dipForNarration() → callback onEnd
        → Music.restoreAfterNarration() → setPhase('systole')
```

Se identificaron 3 capas de métricas necesarias para responder si
Follower funciona como experiencia cinematográfica:
- **Capa 1:** ¿El pipeline llega a dispararse? (POIs, embudo, primera narración)
- **Capa 2:** ¿La narración llega a tiempo? (lag texto→voz, duración hablada)
- **Capa 3:** ¿El ritmo es cinematográfico? (sístole/diástole, intervalos, silencios)

Se encontró que el sistema existente cubría bien la **salud técnica**
(¿llega la respuesta de Overpass?, ¿responde el Worker?) pero casi nada
de la **experiencia real** — `voice.js` sin ninguna instrumentación, ritmo
sístole/diástole solo en variables locales del simulador, sin embudo
POI→narración, sin tiempo hasta primera narración.

### Cambios realizados

**Instrumentación de `js/voice.js` — Capa 2**
- `lag texto→voz`: `metricStart` antes del `setTimeout` de 100ms,
  `metricEnd` en `onstart` — mide el tiempo real entre texto listo y
  arranque de voz (incluye el workaround de Chrome + delays de iOS)
- `duración narración hablada`: `metricStart` en `onstart`,
  `metricEnd` en `onend` — con `chars: text.length` en meta para
  correlacionar longitud de texto con duración
- Errores de síntesis: `onerror` ahora registra en el log exportable
  (antes solo `console.warn`, invisible en reportes de campo)
- "Web Speech API no disponible" también registrado en log

**Instrumentación de `js/app.js` — Capa 3**
- `AppState` gana 7 campos nuevos: `_phaseStart`, `_msTotalSystole`,
  `_msTotalDiastole`, `_lastNarrationTs`, `_narrationCount`,
  `_sessionStart`, `_firstNarrationTs`
- `setPhase()` acumula ms en cada transición de fase y detecta silencios
  de más de 5 minutos con log automático
- `initExplore()` marca `_sessionStart` — base para "tiempo hasta primera
  narración"

**Instrumentación de `js/narration.js` — Capa 1 + 3**
- Tiempo hasta primera narración (desde `_sessionStart`) logueado en
  el primer `trigger()`
- Intervalo entre narraciones consecutivas logueado en cada `trigger()`
- `_narrationCount++` y `_lastNarrationTs` actualizados en cada narración

**Instrumentación de `js/poi.js` — Capa 1**
- `detectNearby()` registra en cada chequeo: POIs cargados, POIs en
  radio cercano, km caminados — base del embudo POI check → narración

**Dashboard de Experiencia en `js/debug.js`**
- Tab "Estado" completamente rediseñado en 3 secciones visuales:
  Capa 1 Pipeline, Capa 2 Narración en tiempo, Capa 3 Ritmo
- Capa 3 incluye sístole/diástole en tiempo real (acumula la fase
  actual que aún no cerró en AppState, no solo el histórico)
- Botón "Exportar" movido al tab Estado — accesible en cualquier momento
- Colores de log: agregados `music`, `narration`, `warn`
- Eliminado `patchGPS()` — código muerto desde fix de `flyToPOI()`

**Exportador unificado en `js/debug.js`**
- Nueva sección "Análisis de Experiencia Cinematográfica" al inicio del
  reporte, antes del resumen técnico de tiempos:
  - Capa 1: narraciones, km por narración, tasa narración/chequeo de POI,
    tiempo hasta primera narración
  - Capa 2: cache hits/misses, Worker avg, lag texto→voz avg, duración
    voz avg, errores de síntesis
  - Capa 3: tiempo total de sesión, % sístole/diástole, intervalo entre
    narraciones avg, silencios >5min
  - **Veredicto automático**: diagnóstico de la sesión basado en los datos
    (crítico / densidad baja / poco diástole / activo)

**Conexión real de `js/debug-sim.js` con el sistema de métricas**
- Eliminados: `_phaseAccum`, `_lastPhase`, `_lastPhaseTs`,
  `_narrationsTriggered`, `startBackgroundTracking()` — duplicaban
  estado que ahora vive correctamente en `AppState`
- Todo leído directamente de `AppState._msTotalSystole`,
  `_msTotalDiastole`, `_narrationCount`, `_phaseStart` — misma fuente
  que el dashboard de `debug.js`
- Resultado: simulador y sesión de campo real muestran los mismos
  números porque comparten una sola fuente de verdad

### Hallazgo de producto

Los botones `btnBookmark` y `btnShare` del splash (`index.html` líneas
298-299) están en el HTML como emojis (`🔖` y `📤`) sin ningún listener
ni lógica implementada. Son botones huérfanos de una versión anterior del
diseño. Decisión pendiente: quitar, ocultar o implementar.

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por mood (4 MP3) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` + `debug-sim.js` deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` — no confirmado si BUG-014 lo resolvió | Media |
| DT-11 | Worker 400 en arranque de sesión — sin diagnosticar | Baja |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-13 | Botones `btnBookmark`/`btnShare` huérfanos en splash | Baja |

### Próxima sesión

1. Probar simulador + dashboard de experiencia en iPhone con el
   sistema unificado — confirmar que los números de sístole/diástole
   y narraciones son consistentes entre tab Simular y tab Estado
2. Exportar un reporte completo post-simulación y revisar el veredicto
   automático — validar que las 3 capas de análisis tienen sentido
3. Confirmar BUG-014 (candado) en campo — los 429 deben haber desaparecido
4. DT-9 — revocar key OpenAI (pendiente hace varias sesiones)
5. DT-2 — música por mood (necesaria para validar BUG-018 en campo)

---

*Follower — Bitácora v0.5 | Junio 2026*


---

## Sesión 8 — Junio 2026

### Contexto
Sprint de UI y experiencia. Tres objetivos paralelos: (1) rediseño
completo de la pantalla de exploración, (2) sistema de estilos de
narrador reemplazando los moods, (3) observabilidad de experiencia en
el panel de debug. La pregunta rectora de cada decisión: ¿esto nos
acerca a una experiencia cinematográfica o a una audioguía tradicional?

---

### Sprint 1 — Observabilidad de experiencia (debug.js, poi.js, narration.js, music.js)

#### Problema
El debugger medía infraestructura técnica (tiempos de Worker, fetches
Overpass) pero no podía responder: ¿la caminata tuvo ritmo cinematográfico
o se sintió vacía/saturada?

#### Solución: capa de Experience Metrics

**`debug.js`** — nuevo estado `_exp` con:
- `funnel`: embudo poi_checks → pois_detected → pois_eligible →
  pois_narrated → narrations_completed → narrations_interrupted
- `narrations[]`: log de cada narración con timestamp, lat/lng, poiId,
  estado (completada/interrumpida)
- `music{}`: tiempo activo, dips/restores, acumuladores en ms

**Nueva función `Debug.trackExp(step, data)`** — entrada única para
todos los módulos. Steps: `poi_check`, `poi_detected`, `poi_eligible`,
`poi_narrated`, `narration_completed`, `narration_interrupted`,
`music_active`, `music_stopped`, `music_dip_start`, `music_dip_end`.
Detrás de guards `typeof Debug !== 'undefined'` en todos los módulos.

**Nueva tab `🎬 Exp`** en debug panel con:
- **Cinematic Score 0–100**: métrica compuesta (completitud de narraciones
  +20, ritmo en sweet spot 2-7min +15, música activa +10, penalización
  por interrupciones y silencios largos)
- Embudo narrativo con % de conversión entre etapas
- Ritmo: intervalo avg/min/max, alertas de silencio >5min y saturación <2min
- Calidad de caminata: narraciones/hora, metros/narración
- Música: % de sesión activa, dips, restores

**`exportLog()`** gana sección "MÉTRICAS DE EXPERIENCIA" con embudo
completo + ritmo + Cinematic Score al final del reporte.

**`debug-sim.js`** gana:
- Tarjeta "🎬 Ritmo del paseo" al pie del tab Simular con resumen en vivo
- Capa de marcadores narrativos en mapa (`_narrationLayer`) — punto verde
  por narración completada, naranja por interrumpida
- `focusNarrationMap()` hace fitBounds sobre los marcadores narrativos

**Instrumentación nueva en módulos:**
- `poi.js`: `poi_check` en `detectNearby`, `poi_detected`/`poi_eligible`
  en `detectPOI`, `poi_narrated` (con lat/lng/poiId) en `activatePOI`
- `narration.js`: `narration_completed` en callback de `Voice.speak`,
  `narration_interrupted` en `stop()`
- `music.js`: `music_active` en `playBuffer`, `music_stopped` en `stop()`,
  `music_dip_start`/`music_dip_end` en dip y restore

---

### Sprint 2 — Rediseño pantalla exploración

#### Cambios estructurales en index.html
Pantalla de exploración completamente reemplazada:

**Eliminados:**
- `top-pill` (ciudad + mood) — informativo sin función real
- `vol-control` (slider vertical) — el volumen lo maneja el sistema
- `poi-card` flotante con `backdrop-filter: blur()` — reemplazada por mini-player
- `bottom-bar` con gradiente y blur — anti-patrón en campo con sol

**Agregados:**
- `care-strip`: banda de 32px siempre visible con clima/pasos/km (DA-19)
- `bottom-bar` sólida con `border-top` limpio (DA-18)
- `#barSystole`: dos pills simétricos + corazón-brújula al centro
- `#barDiastole`: mini-player con nombre POI, progreso, pausa ⏸ y stop ⏹
- `style-selector`: bottom sheet con 4 estilos de narrador
- `nearbySelector`: bottom sheet con lista de historias cercanas
- Ghost `#poiCard` invisible preserva IDs para backward compat

#### Bottom bar estado-aware

`setPhase()` → `updateExplorePhase()` → muestra `#barSystole` o
`#barDiastole`. El mapa nunca se desplaza — el panel overlay el mapa.

Layout sístole final — dos pills simétricos:
```
[🎭 Cuentero ↓]    💗    [🏛️ La Merced ↑]
```
- Pill izquierdo (azul): selector de estilo — tap abre style-selector
- Corazón-brújula SVG: placeholder de la brújula final (DT-14)
- Pill derecho (rojo sutil): historia más cercana — tap abre nearbySelector

`updateHistCount()` en `app.js` actualiza el pill derecho con el POI
más cercano y rellena el nearbySelector con los top-5 ordenados por
distancia. `POI.activateFromBar(poiId)` permite activar desde la lista.

#### Care strip (DA-19)
Care strip: `☀️ 28° | 👣 3,240 pasos | 📍 1.4 km`
- Km movidos desde bottom bar al care strip
- Temperatura en alerta (≥30° o ≤5°) con clase `.alert` (color dorado)
- `weather.js` llama `updateCareStrip()` al recibir datos en vez de
  actualizar `#topMood` (elemento eliminado)

#### Corazón-brújula SVG
SVG inline en `index.html` con corazón C2, círculo exterior, marcas
cardinales N S E O y aguja bicolor. Placeholder funcional hasta DT-14.

#### Debug panel rediseñado (DA-20)
```
Antes: botón flotante rojo + panel desde bottom
Ahora: barra fija top:32px + overlay top:64px max 52vh
```
- Tap en tab cerrada → abre overlay
- Tap en tab activa → colapsa overlay
- Auto-refresh solo cuando panel está abierto
- Botón Exportar .txt → **solo en tab Logs**
- `isSimTabActive()` en debug-sim.js verifica tab activa Y panel visible

#### Fix: modal config solo en primera visita
`expandHeart()` mostraba el modal de configuración en cada carga
(comentario en código decía "SIEMPRE mostrar config"). Corregido:
```js
if (Config.isFirstTime()) showModal('config');
else navigateTo('explore');  // sesiones siguientes: directo al mapa
```

---

### Sprint 3 — Estilos de narrador (narration.js)

#### Reemplazo de MOOD_PROMPTS por STYLE_PROMPTS (DA-17)

4 estilos con personalidades distintas, cada uno con system prompt
(quién es el narrador) y user prompt (qué se le pide) separados:

| Estilo | Clave | Personalidad | Música |
|--------|-------|--------------|--------|
| Cuentero | `storyteller` | Narrador local, personajes reales, drama humano | epic |
| Historiador | `historian` | Riguroso y apasionado, fechas, contexto | epic* |
| Poeta | `poet` | Sensorial, presente y pasado coexisten | romantic |
| Detective | `detective` | Periodista de historia oculta, secretos | mystery |

*DT-18: Historiador debería tener track clásico propio.

Decisión clave de diseño de prompt: cada sistema prompt incluye
**REGLAS ABSOLUTAS** explícitas (exactamente 3 párrafos, cómo empezar,
cómo terminar, solo datos verificables). Sin estas reglas, Claude tiende
a generar texto genérico sin estructura real.

`max_tokens` subido de 350 a 450 para narraciones más completas.

`trigger(poi, _unused, lang, topic)` ignora el segundo parámetro
(antes `mood`) y lee `AppState.narrationStyle` internamente.
Cache key cambiada de `poiId_mood_lang_topic` a `poiId_style_lang_topic` —
cada estilo tiene su propia narración para el mismo POI.

`initStyleSelector()` en `app.js` conecta el pill izquierdo con los 4
style-cards. Al cambiar estilo: actualiza `AppState.narrationStyle`,
`AppState.mood` (para música), llama `Music.changeMood()`, cierra el sheet.

---

### Sprint 4 — Care conectado al simulador (DA-21)

**Problema:** El timer de care usa reloj real (primer check a 5 minutos
reales). Una caminata simulada de 3km en 30 segundos nunca dispara care.
El km del care strip no se actualizaba durante la simulación.

**Fix:**
1. Cada tick del simulador llama `updateCareStrip()` → km se refresca
   en tiempo real
2. Botón "🧡 Test Care" en tab Simular llama `Care.check()` inmediatamente
   → permite testear la experiencia de cuidado en cualquier momento

**Fuentes de datos:** care.js lee `AppState.kmWalked`, `AppState.steps`,
`AppState.gps` que se actualizan correctamente vía DA-14
(`GPS.simulatePosition()` → `onPosition()`).

---

### Bugs resueltos esta sesión

**BUG-019 — Modal config aparecía en cada carga**
- Causa: `expandHeart()` tenía comentario "SIEMPRE mostrar config"
- Fix: `Config.isFirstTime()` controla si se muestra o se va directo al mapa
- Archivo: `js/app.js`

**BUG-020 — Care strip no actualizaba km durante simulación**
- Causa: `updateCareStrip()` solo se llamaba al activar POIs o al init
- Fix: llamada en cada tick del simulador
- Archivos: `js/debug-sim.js`, `js/app.js`

**BUG-021 — `#topMood` referenciado en weather.js pero elemento eliminado**
- Causa: weather.js intentaba actualizar `#topMood` (eliminado en v0.6)
- Fix: reemplazado por llamada a `updateCareStrip()`
- Archivo: `js/weather.js`

---

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-2 | Archivos de música por estilo (4 MP3) | Alta |
| DT-3 | sw.js — service worker | Alta (último) |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | `debug.js` + `debug-sim.js` deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta (commits `a249fee8`–`a303f110`) | Alta |
| DT-10 | Error IndexedDB `"connection is closing"` — Safari backgrounding | Media |
| DT-11 | Worker 400 en arranque — sin diagnosticar | Baja |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-13 | Botones `btnBookmark`/`btnShare` huérfanos en splash | Baja |
| DT-14 | Corazón-brújula: diseño final sólido con N S E O, aguja bicolor que rota con bearing real (DeviceOrientationEvent) | Media |
| DT-15 | Refinar prompts de estilos de narrador con pruebas de campo | Alta |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Config modal: reemplazar "Mood" por selector de estilo de narrador | Media |
| DT-18 | Track de música para estilo Historiador | Baja |

---

### Próxima sesión

1. Probar en iPhone: care strip, bottom bar, pills, estilo selector,
   nearby stories list — verificar que la UI funciona en campo real
2. Testear 4 estilos de narrador en un mismo POI — verificar diferencias
   reales en la narración (Cinematic Score en tab 🎬 Exp)
3. Usar botón "🧡 Test Care" durante simulación — validar que care card
   aparece correctamente y que la experiencia de cuidado está completa
4. DT-14 — corazón-brújula con rotación real según bearing al POI más cercano
5. DT-16 — rediseño pantalla POI expandida
6. DT-9 — revocar key OpenAI (pendiente hace varias sesiones)

---

*Follower — Bitácora v0.6 | Junio 2026*

---

## Sesión 9 — Junio 2026

### Contexto
Sprint de brújula, bugs del reporte de campo y documentación. El reporte de
debug de la caminata en Madrid reveló bugs críticos que bloqueaban métricas
reales. Paralelamente, rediseño completo de la brújula basado en iteración
visual con mockups.

---

### Brújula — 3 estados (DA-22)

Después de varias iteraciones de mockup se definió el diseño final:

**Diseño:** Brújula militar clásica (círculo + 8 ticks + corazón sutil de
fondo) como botón en la columna derecha del mapa, mismo tamaño que +/−.

**3 estados:**
1. **Reposo** — brújula estática, aguja apuntando al norte, corazón sutil
2. **Latido** (~450ms) — al tocar, el corazón pulsa (animation CSS) + ring
   exterior que se expande y desvanece. Transición cinematográfica.
3. **Activo** — aguja rota con `DeviceOrientationEvent.webkitCompassHeading`
   (iOS) o `360 - alpha` (Android). Borde rojo activo en el botón. Cono azul
   semitransparente en el punto GPS indica dirección del usuario.

**Permisos iOS 13+:** `DeviceOrientationEvent.requestPermission()` se llama
antes de activar el listener. Si el usuario deniega, la brújula no se activa
y se loggea en debug.

**Tap de nuevo en estado activo:** vuelve al estado 1 (reposo), aguja al
norte, cono GPS desaparece.

**Eliminado:** el corazón-brújula del centro de `barSystole`. La `barSystole`
ahora tiene solo los dos pills simétricos (Cuentero | La Merced · 48m).

**Archivos:**
- `index.html` — nuevo `#btnCompass` en `.map-zoom-controls`, `barSystole`
  simplificado a dos pills
- `explore.css` — `.map-compass-btn`, `.compass-pulse-ring`, animaciones
  `heart-pulse`, `pulse-ring-anim`, transición de `#compassNeedle`
- `app.js` — `initCompass()`, `_compassBeat()`, `_requestCompassPermission()`,
  `_activateCompass()`, `_deactivateCompass()`, `_updateCompassNeedle()`
- `gps.js` — `showHeadingCone(visible)`, `updateHeadingCone(heading)`,
  `_createConeIcon(heading)`, `_coneMarker` (Leaflet divIcon con SVG)

---

### Bugs resueltos

**BUG-022 — iOS Safari onend no confiable (voice.js)**
- Safety timer: si `onend` no llega, callback se ejecuta igualmente.
  Duración estimada: `ceil(chars/12)*1000 + 5000ms`, mínimo 8s.
  Arranca en `onstart`, no antes.
- iOS keep-alive: `pause()/resume()` cada 10s en iPhone/iPad para evitar
  congelamiento silencioso de la síntesis.
- Flag `_speakDone`: garantiza ejecución única desde cualquier camino
  (onend, onerror, safety-timer, stop).
- `stop()` limpia timer e interval — sin fugas de memoria.

**BUG-024 — POIs detectados > POI checks (poi.js)**
- Causa: `trackExp('poi_detected')` se llamaba una vez por CADA POI dentro
  del radio, no una vez por chequeo. Con 6 POIs en radio → 6 eventos por
  tick → embudo imposible (175% de conversión).
- Fix: contador `detectedCount` por loop, una sola llamada si > 0.
  Semántica correcta: "este chequeo GPS encontró al menos un POI en rango".

**BUG-025 — 874 POIs en ciudades densas (poi.js)**
- Causa: Madrid dentro de 2km tiene ~1040 elementos OSM con nombre.
  El mapa era inutilizable y Overpass daba 429 por queries pesadas.
- Fix: `MAX_POIS = 80`. Si `normalized.length > 80`, ordenar por prioridad
  de tipo (`historic:4 > museum:3 > place_of_worship:2 > park:1`) y tomar
  los 80 más relevantes.
- Log en debug cuando se aplica el límite.

---

### Iteración de diseño — proceso de la brújula

Se hicieron 6 mockups interactivos animados antes de decidir el diseño final:
1. Referencias clásicas: militar, minimalista, rosa de vientos
2. Versiones con corazón: A (aguja sobre outline), B (relleno + aguja),
   C (corazón entero = aguja, bicolor)
3. Híbrido militar + corazón: 3 variantes de opacidad
4. Posición: centrada flotante vs esquina inferior derecha
5. Idea Apple Maps: brújula pequeña en columna con zoom
6. Sistema de 3 estados con latido

**Decisión final:** Variante 1 del híbrido (corazón sutil 12% opacidad,
aguja rombo ancha) + sin letra N (tick rojo largo como indicador de norte)
+ sistema Apple Maps (botón en columna derecha).

---

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-14 | Brújula → IMPLEMENTADA (DA-22) | ~~Media~~ ✅ |
| DT-19 | Música — 4 tracks por estilo (en creación) | Alta |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 al inicio (DT-11) — pendiente diagnóstico | Baja |

---

### Próxima sesión

1. Commits de música cuando estén listos los MP3
2. Test de brújula en iPhone — verificar latido + cono GPS
3. Verificar BUG-022 resuelto (narrations_completed debe llegar a > 0)
4. Rediseño pantalla POI expandida (DT-16)

---

*Follower — Bitácora v0.6 | Sesión 9 | Junio 2026*

---

## Sesión 9 — continuación (misma fecha)

### Bugs resueltos en campo post-deploy

**BUG-026 — Care strip y debug bar visibles en splash/config**

Dos causas simultáneas:

Causa A: `explore.css` tenía `position: relative` en `#screen-explore`
que anulaba el `position: fixed` heredado de `.screen`. Esto rompía
el stacking context haciendo que el care strip "escapara" visualmente
por encima de la pantalla de splash.
Fix: eliminado `position: relative` de `#screen-explore`.

Causa B: `debug.js` crea `#dbg-bar` en el `body` como `position: fixed`
al inicializarse — antes de que `navigateTo()` sea llamado.
Fix 1: `#dbg-bar` se crea con `display: none` por defecto.
Fix 2: `navigateTo()` en `app.js` muestra `#dbg-bar` solo cuando
`screenId === 'explore'` y lo oculta en cualquier otra pantalla.

Archivos: `explore.css`, `debug.js`, `app.js`

---

**BUG-027 — Cono de dirección GPS desalineado del punto de usuario**

Causa: el cono era un `L.marker` Leaflet SEPARADO del marcador del usuario.
Aunque compartían el mismo lat/lng, el cálculo de `iconAnchor` nunca
coincidía perfectamente, causando que el cono apareciera desplazado.

Fix: el cono ahora va DENTRO del mismo `divIcon` del usuario.
`_buildUserIcon(showCone, heading)` genera HTML combinado:
- Cono SVG con `<g transform="rotate(${heading})">` → rotación en SVG
- `user-pulse` + `user-dot` en el mismo contenedor
- Mismo `iconAnchor: [40, 40]` → alineación perfecta garantizada

`showHeadingCone(visible)` y `updateHeadingCone(heading)` ahora llaman
`_updateUserIcon()` que hace `_userMarker.setIcon(_buildUserIcon(...))`.
Eliminado el `_coneMarker` separado.

Archivo: `gps.js`

---

**Métricas de arranque agregadas a runSplash()**

Ahora se mide el arranque completo en `debug.js`:
- `metricStart('app', 'arranque → exploración lista')` al inicio del splash
- Log GPS: `concedido/denegado · Xms` — tiempo exacto del permiso
- `metricEnd` con status `first-time` o `returning-user` en `expandHeart()`

Visible en el reporte de debug bajo `[app] arranque → exploración lista`.

Archivo: `app.js`

---

**BUG-028 — Narración sin audio (Music bloquea Voice)**

Causa: `Music.dipForNarration()` lanzaba excepción cuando los archivos
MP3 están ausentes y el `AudioContext` queda en estado inválido.
Como la excepción no estaba capturada, el `Voice.speak()` inmediatamente
posterior nunca se ejecutaba → silencio total.

Fix narration.js: `Music.dipForNarration()` y `Music.restoreAfterNarration()`
en bloques `try/catch`. Un error de música nunca vuelve a bloquear la narración.

Fix adicional voice.js: `speechSynthesis.resume()` antes de `speak()`
si `paused === true`. iOS Safari puede dejar la síntesis en estado paused
tras `cancel()`, causando que el siguiente `speak()` no produzca audio.
También se agrega log de estado (`speaking/paused/pending`) antes de cada
`speak()` para diagnóstico en campo.

Archivos: `narration.js`, `voice.js`

---

### Estado al cierre de sesión

**Funcional:**
- Pipeline narración completo operativo (sin música por ahora)
- Brújula 3 estados implementada y posicionada
- Debug bar oculto hasta pantalla de exploración
- Care strip visible solo en exploración
- Cono GPS perfectamente alineado con punto de usuario
- Métricas de arranque activas

**Pendiente para próxima sesión:**
1. Commits de música cuando estén listos los 4 MP3
2. Test de campo con música activa — verificar dip/restore
3. Verificar BUG-022 resuelto en iOS (narrations_completed > 0)
4. Rediseño pantalla POI expandida (DT-16)
5. Revocar key OpenAI expuesta (DT-9 — pendiente hace varias sesiones)

---

*Follower — Bitácora | Sesión 9 cierre | Junio 2026*

---

## Sesión 10 — Junio 2026

### Redefinición de experiencia — v0.7

Sesión de diseño y producto antes de código. El análisis del producto reveló una
desconexión fundamental: la música continua no encaja con Follower.

**Descubrimiento clave:**
La música permanente se vuelve repetitiva, compite con la narración, y convierte
a Follower en una mezcla extraña entre Spotify y audioguía. Su verdadera función
no es acompañar toda la caminata — es preparar emocionalmente al usuario para
una historia.

**Decisión de diseño:**
La música continua se elimina. Se reemplaza por intros narrativas de 10-15s,
una por narrador, que se reproducen antes de cada narración.

### Nuevo sistema de narradores

El concepto de **mood** (épico/romántico/misterio/curioso) fue reemplazado por
**narradores** — personajes con voz propia que el usuario elige como compañero.

La pregunta en la config cambió de *"¿Qué mood prefieres?"* a *"¿Quién te acompaña hoy?"*

Los 4 narradores implementados:
- 🎭 **Storyteller** — personajes reales, emoción, suspenso
- 🏛️ **Historiador** — fechas, arquitectura, contexto histórico
- 🔎 **Explorador** — periodístico, revelador, secretos y detalles ocultos
- ❤️ **Local** — nacido aquí, costumbres reales, sin tono oficial

`poet` y `detective` eliminados. `Familiar` (lenguaje simple, niños) reservado para v1.x.

Decisión de reemplazo (Opción A de 3 alternativas):
- Opción A — Reemplazar poet/detective por explorer/local ✅ elegida
- Opción B — Renombrar/fusionar detective→explorer
- Opción C — Expandir a 5 narradores

### Features nuevas implementadas

**1. Bienvenida de ciudad (DA-25)**
Cuando el GPS detecta la ciudad por primera vez en la sesión, el narrador activo
presenta la ciudad con una frase corta sobre el mapa. Texto solo, sin voz, sin música.
Fade in/out, DM Serif Display, 5 segundos o tap para cerrar.

Decisión UX: texto sobre el mapa (no toast, no tarjeta, no care strip) — más
cinematográfico. El mapa sigue vivo debajo. La ciudad se presenta sola.

**2. Care card desde arriba (DA-26)**
La care card dejó de flotar desde abajo (`bottom: 120px`). Ahora reemplaza al
care strip en su mismo espacio (`top: 0`, `height: 32px`). El strip hace fade out,
la card aparece, al hacer dismiss el strip vuelve. El mapa nunca se mueve.

Decisión UX: el care strip es el territorio de "cuidado" — la card es una extensión
de ese mismo espacio, no una interrupción desde abajo.

**3. Intros musicales por narrador (DA-24)**
`playNarratorIntro(narrator)` reemplaza toda la lógica de música continua.
Devuelve una Promise con await en `trigger()`. Safety timer de 16s para iOS.
Fallback silencioso si el MP3 no existe.

### Archivos modificados — 5 commits

| Commit | Archivos | Cambio |
|--------|----------|--------|
| 1 | `narration.js` | 4 narradores nuevos + CITY_WELCOME + getCityWelcome() |
| 2 | `config.js` | mood → narrator, setMood → setNarrator, MOOD_MUSIC eliminado |
| 3 | `music.js` | loops eliminados, playNarratorIntro() como función única |
| 4 | `index.html`, `app.js`, `modal.css`, `explore.css`, `components.css`, `care.js` | UI narradores, #cityWelcome, care card reposicionada |
| 5 | `narration.js`, `gps.js` | flujo conectado: await intro + hook welcomeCity |

### Deuda técnica nueva

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-19 | 4 MP3 de intro (storyteller/historian/explorer/local) — en creación | Alta |

### Deuda técnica resuelta

| ID | Descripción |
|----|-------------|
| DT-15 | Prompts de narradores — 4 estilos definitivos con REGLAS explícitas |
| DT-17 | Config modal: selector de narrador implementado |
| DT-18 | Track historiador — irrelevante, sistema de música continua eliminado |
| DT-2 | Música por mood — reemplazado por intros por narrador (DT-19) |

### Próxima sesión

1. Pruebas en iPhone del deploy v0.7
2. Verificar bienvenida de ciudad — timing y visibilidad
3. Verificar care card desde arriba — fade strip, dismiss correcto
4. Verificar modal de narradores — selección y persistencia
5. Verificar flujo narración con await intro (silencioso mientras no hay MP3)
6. MP3 de intros — integrar cuando estén listos

---

## Sesión 11 — Junio 2026

### Contexto
Sesión de corrección post-deploy. Cinco bugs encontrados en pruebas
después del rediseño de narradores/música/UI de la sesión anterior.
Todos resueltos en un solo commit (BUG-029..033).

### Bugs resueltos

**BUG-029 — Narración sin audio (Music bloquea Voice, segunda ocurrencia)**

Causa raíz: `await Music.playNarratorIntro()` en `narration.js` podía
bloquear hasta 16s (safety timer) cuando los MP3 no existen. Además,
en iOS Safari el `AudioContext` solo se puede activar desde un gesto
directo del usuario — y `playNarratorIntro()` se llama de forma
programática desde el pipeline de narración, no desde un tap.
`_context.resume()` falla silenciosamente y devuelve `resolve()`, pero
`Voice.speak()` nunca llega porque el await de música no resuelve hasta
que expira el safety timer.

Tres fixes coordinados:
- `narration.js`: `await Music.playNarratorIntro()` reemplazado por
  `Promise.race([playNarratorIntro(), timeout(3000)])` — si la música
  no resuelve en 3s, la voz arranca igual
- `music.js`: nueva función `initFromGesture()` que llama
  `_context.resume()` desde el contexto de un gesto del usuario
- `app.js`: `Music.initFromGesture()` llamado en el listener de
  `btnStartExplore` — único punto del flujo con gesto directo del usuario

Lección: `AudioContext` en iOS Safari solo se puede activar desde un
`addEventListener` de tap/click disparado directamente por el usuario.
Cualquier llamada programática posterior (setTimeout, callback async,
Promise) cae fuera del "trusted event" y el resume falla.

**BUG-030 — Bienvenida de ciudad no aparecía**

Causa: `welcomeCity()` en `app.js` hacía `classList.remove('hidden')` +
`classList.add('visible')` en el mismo frame de ejecución. El CSS usa
`display: none !important` en `.city-welcome.hidden` — al quitar `hidden`
y añadir `visible` en el mismo frame, el browser no genera transición de
opacity porque el repaint ocurre después de ambos cambios juntos.
Fix: doble `requestAnimationFrame` entre quitar `hidden` y añadir
`visible`, forzando que el display cambie un frame antes de la transición.

**BUG-031 — "Cuentero" en lugar del narrador activo**

Dos causas simultáneas:
- `index.html`: texto "Cuentero" hardcodeado en `#barStyleName` y
  `#barStyleLbl` (vestigio de un nombre anterior del narrador)
- `app.js`: `initStyleSelector()` solo actualizaba el label al cambiar
  el narrador, no al cargar — el narrador guardado en Config nunca se
  reflejaba en el pill al abrir la app

Fix en `index.html`: texto cambiado a "Narrador" como placeholder.
Fix en `app.js`: `init()` sincroniza label e icono del pill con
`AppState.narrationStyle` (ya cargado desde Config) antes de `runSplash()`.

**BUG-032 — Íconos 🔖 y 📤 sin función en pantalla POI**

`btnBookmark` y `btnShare` presentes en `index.html` sin listeners ni
lógica implementada. Eliminados del markup. Registrado como DT-17 (renombrado).

**BUG-033 — Debug: POIs fijos entre teletransportes, mapa no inicializaba**

Causa: `teleportTo()` en `debug-sim.js` no limpiaba los marcadores
Leaflet ni el estado de POIs al cambiar de posición — los marcadores de
la ciudad anterior quedaban fijos en el mapa.

Fix: nueva función `POI.resetPOIs()` en `poi.js` que limpia marcadores
Leaflet, `_pois`, `_lastFetchPos`, `AppState.nearbyPOIs`, `activePOI`
y `poisVisited`. `teleportTo()` la llama automáticamente. Botón manual
"🗑️ Limpiar POIs" agregado al panel del simulador.

### Archivos modificados — 1 commit

| Archivo | Cambio |
|---------|--------|
| `narration.js` | Promise.race 3s en await de música |
| `music.js` | initFromGesture() + expuesta en API pública |
| `app.js` | initFromGesture en tap, doble rAF en welcomeCity, sync pill en init() |
| `index.html` | "Cuentero" → "Narrador", btnBookmark/btnShare eliminados |
| `poi.js` | resetPOIs() nueva función, expuesta en API pública |
| `debug-sim.js` | teleportTo() llama resetPOIs(), botón Limpiar POIs |

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |

### Próxima sesión

1. Verificar en iPhone que la voz arranca (BUG-029 el más crítico)
2. Verificar bienvenida de ciudad con la transición de fade
3. Verificar que el pill muestra el narrador correcto al abrir
4. Test de teletransporte en simulador — buscar ciudad, teletransportar, verificar POIs nuevos

---

*Follower — Bitácora v0.7 | Sesión 11 | Junio 2026*
---

## Sesión 12 — 25 Junio 2026

### Contexto
Sesión de estabilización técnica post-v0.7. Se realizó una auditoría completa del pipeline de narración y del laboratorio de pruebas, seguida de implementación en sprints. Primer día de pruebas reales en campo (iPhone + Chrome).

---

### Sprint S1 — Calidad percibida inmediata

Objetivo: corregir lo que el usuario nota primero — voz, longitud de narración, símbolos en el texto.

**S1-1 · S1-2 — Voz latinoamericana + log de diagnóstico (`voice.js`)**

Problema: `LANG_MAP.es = 'es-ES'` forzaba voz española en todos los dispositivos. En iPhone colombiano, seleccionaba Mónica [es-ES] en lugar de Paulina [es-MX].

Fix:
- `LANG_MAP.es` → `'es-419'`
- `ES_PRIORITY`: `es-CO → es-MX → es-US → es-419 → es-AR → es-CL → es-PE → es-VE → es-ES`
- Dos pasadas en `getBestVoice()`: primero voces **locales** en orden de prioridad, luego online
- `_logAvailableVoices()`: log de todas las voces ES del dispositivo al arrancar
- Log por cada narración: voz seleccionada, lang, motor (local/online)
- `getVoiceList()` expuesto en API pública para diagnóstico desde consola

Resultado en campo: iPhone selecciona Paulina [es-MX] local. Chrome Windows selecciona Microsoft Helena [es-ES] local (no hay voces latam instaladas — comportamiento correcto).

**S1-3 — Sanitización de markdown (`narration.js`)**

Problema: Claude Haiku respondía con `**negrita**`, `# títulos`, `- listas` a pesar del prompt. La voz leía los caracteres literalmente.

Fix: `sanitizeNarration(text)` — función pura aplicada antes de `updateNarrationUI()` y `Voice.speak()`. Elimina: `#`, `**`, `*`, `` ` ``, listas `- `, listas numeradas `1.`, saltos múltiples.

**S1-4 — Narraciones cortas (`narration.js`)**

Problema: narraciones de 60-90s bloqueaban el sistema. Durante esa ventana, todos los POIs detectados se marcaban como `visited` y se perdían.

Fix:
- `max_tokens`: 450 → 350
- Los 8 system prompts (4 estilos × 2 idiomas) reciben instrucción explícita: `LONGITUD: máximo 70 palabras por párrafo. Total: 180-220 palabras. Objetivo: 30-40 segundos hablado.`

Resultado observado: 1048 chars en campo (vs ~1800 anterior). Duración real: 70s en Chrome con voz online (rate ignorado), estimado 35-40s con Paulina local en iPhone.

**S1-5 — Métricas limpias al iniciar simulación (`debug-sim.js`)**

`startWalking()` llamaba `clearExpMetrics()` — fix previo. Sesión 12 lo reemplaza con `startTestSession()` (ver LAB-01).

**S1-6 — Tiempo hasta primera historia (`debug.js`)**

Métrica nueva visible en tab `🎬 Exp`, encima del Cinematic Score. Semáforo: verde ≤90s / amarillo 90-300s / rojo >300s. También aparece en el reporte exportado antes del Cinematic Score.

Resultado en campo: 82s (excelente) en primera simulación funcional, 358s (crítico) en sesión de teletransporte — causado por Overpass tardando 84-122s.

---

### Auditoría de pipeline — causas raíz identificadas

Antes de Sprint S2, se realizó una auditoría de por qué la primera narración tardaba hasta 10 minutos y por qué se perdían POIs durante narraciones.

**Causa 1 — Tiempo hasta primera historia**

Cuatro factores apilados:
1. Radio de activación 120m — usuario debe acercarse físicamente
2. `loadPOIs()` no llama `detectPOI()` al completarse — espera el próximo tick de 5s
3. Overpass tarda 8-192s en responder
4. El simulador puede haber recorrido la zona de alta densidad antes de que Overpass respondiera

Conclusión: el radio 120m no es el problema. El problema es la combinación de Overpass lento + narración larga + visited prematuro.

**Causa 2 — POIs perdidos durante narraciones**

`activatePOI()` marca `poi.visited = true` al **activar**, no al completar la narración. Durante 75s de narración, el usuario puede cruzar 2-3 POIs más — todos quedan marcados visited y nunca se narran. Estimado: hasta 40-60% de POIs elegibles se pierden en zona turística densa.

Resolución planificada: `visited = true` solo en callback de `Voice.speak()` + cola narrativa (Sprint S2).

**Simulación teórica: radio 120m vs 150m vs 200m**

Zonas simuladas: Sagrada Família, Coliseo, Torre Eiffel, Centro Histórico Cali.

Conclusión: 120m es correcto en todas las zonas excepto landmarks muy grandes (Torre Eiffel — coordenada OSM a >120m del borde). Con fixes de narración corta + visited-on-complete + cola, 120m funciona bien. Evaluar 150m solo en Sprint S4 post-fixes.

---

### BUG-034 — Candado Overpass ausente (BUG-014 reaparece) (`poi.js`)

Causa: `_isFetchingPOIs` nunca existió — era una deuda pendiente. Múltiples fetches paralelos a Overpass durante simulación → 429s en cadena → sin POIs.

Fix:
- `_isFetchingPOIs = false` en estado interno de `poi.js`
- Guard al inicio de `fetchPOIsFromOSM()`: si `_isFetchingPOIs`, retornar `_pois` actuales
- `finally { _isFetchingPOIs = false }` — liberación garantizada en éxito y error
- Resultado en campo: `POI: fetch en curso — ignorando llamada paralela (BUG-014)` confirmado en logs

---

### BUG-035 — Reset en cadena al dibujar ruta (`debug-sim.js`)

Causa: `teleportTo()` llamaba `POI.resetPOIs()` incondicionalmente. Al dibujar una ruta en modo `route`, cada click en el mapa disparaba un reset → 15 resets en 8 segundos → 15 fetches paralelos → 429s en cadena.

Fix: `resetPOIs()` en `teleportTo()` solo cuando `_mode === 'teleport'`. En modo `route`, los clicks agregan waypoints sin resetear.

---

### BUG-036 — speechSynthesis silencioso en iOS Safari (`music.js`)

Causa raíz: `initFromGesture()` llamaba `_context.resume()` pero no reproducía ningún audio. iOS Safari suspende el AudioContext cuando no hay audio activo. Al llamar `Voice.speak()` 40s después (tras el async de Claude), el contexto ya estaba suspendido y `speechSynthesis` era bloqueado silenciosamente.

Evidencia en log: `Voice: speak · speaking=false paused=false pending=false · 944 chars · lang=es` — speak() se llamó pero no hubo onstart.

Fix: `initFromGesture()` reproduce un buffer de 1 segundo de silencio real desde el gesto del usuario. Mantiene el AudioContext en state=running. Con contexto activo, speechSynthesis funciona después del async de Claude.

Resultado en campo (Firefox/Windows): `lag texto→voz: 199ms` — la voz arrancó. iPhone pendiente de confirmación.

---

### BUG-037 — Métricas contaminadas entre sesiones — cuatro fuentes (`debug.js`, `app.js`)

Causa: cuatro campos de AppState nunca se reseteaban entre sesiones:
- `kmWalked` — acumulaba entre sesiones → "metros por narración" siempre incorrecto
- `poisVisited` — acumulaba → contador sin significado
- `_msTotalSystole` — acumulaba → % sístole/diástole siempre incorrecto
- `_msTotalDiastole` — ídem

Adicionalmente, `_metrics[]` se restauraba de localStorage en cada arranque → promedios de Worker, voz y Overpass mezclaban sesiones de días anteriores.

Fix en app.js: `initExplore()` delega reset a `Debug.startTestSession()`.
Fix en debug.js: `startTestSession()` nueva función centralizada (ver LAB-01).

---

### BUG-038 — Query Overpass insuficiente para OSM Colombia (`poi.js`)

Causa: la query solo pedía `historic`, `tourism` limitado, `amenity` básico. En Colombia, muchos lugares reales tienen tags `building=cathedral`, `amenity=university`, `leisure=stadium`, `shop=mall` — categorías no incluidas.

Fix: query ampliada con 6 cláusulas adicionales:
- `node/way["building"~"cathedral|church|mosque|temple|synagogue|chapel"]`
- `node["amenity"~"...arts_centre|library|university|college"]`
- `node["leisure"~"park|garden|stadium"]`
- `node["man_made"~"monument|memorial|statue|tower"]`
- `node["shop"~"mall"]`
- `way["amenity"~"university|college|theatre|cinema"]`

`OSM_CATEGORIES` ampliado con 15 tipos nuevos y sus íconos.

---

### Sprint LAB-01 — Laboratorio confiable

**Contexto:** auditoría completa de `debug.js` y `debug-sim.js` reveló confiabilidad 4/10. Antes de implementar visited-on-complete, cola narrativa y backoff Overpass, se necesitaba un laboratorio confiable.

Informe completo: `INFORME_AUDITORIA_LABORATORIO.md`

**REQ-1 · REQ-2 — `startTestSession()` centralizada (`debug.js`, `app.js`, `debug-sim.js`)**

Nueva función `Debug.startTestSession()` que resetea en un solo lugar:
- AppState: `kmWalked`, `poisVisited`, `_msTotalSystole`, `_msTotalDiastole`, `_narrationCount`, `_firstNarrationTs`, `_lastNarrationTs`, `_sessionStart`, `_phaseStart`, `_cityWelcomeDone`, `activePOI`
- `_exp` completo (funnel, narraciones, música)
- `_sessionMetrics[]` — nuevo array de métricas de sesión actual
- `_sessionStartedAt` — timestamp de inicio de sesión

`startWalking()` en debug-sim → usa `startTestSession()`.
`initExplore()` en app.js → usa `startTestSession()`.

**REQ-3 — Separar sesión actual vs histórico (`debug.js`)**

`_sessionMetrics[]` — array paralelo a `_metrics[]`. Recibe las mismas mediciones pero se limpia con cada `startTestSession()`.

Tab Tiempos: badge verde "✅ Sesión activa desde HH:MM · N mediciones" cuando hay sesión. Badge rojo "⚠️ Sin sesión activa — promedios son históricos" cuando no. Los promedios se calculan desde `_sessionMetrics` cuando está disponible.

**REQ-4 — Métricas renombradas (`debug.js`)**

- `POIs detectados` → `Chequeos con POI cercano` (era conteo de chequeos exitosos, no de POIs individuales)
- `POIs narrados` → `POIs activados (narración disparada)` (se incrementaba al activar, antes de que la voz hablara)

**REQ-5 — Clima sincronizado con teletransporte (`weather.js`, `debug-sim.js`)**

`Weather.invalidateCache()` — nueva función pública que limpia `_weather`, `_lastFetch`, `_alertShown` y el localStorage. `Weather.refresh()` — invalida y dispara `check()` inmediato.

`teleportTo()` en debug-sim llama `Weather.invalidateCache()` en modo teleport y `Weather.check()` con 1500ms de delay (para que AppState.gps se actualice primero).

Resultado en campo: `Weather: cache invalidado — próximo fetch será forzado` confirmado en cada teletransporte.

Problema detectado: `invalidateCache` también se llama al dibujar waypoints en modo ruta (mismo path de código). Fix pendiente: verificar `_mode === 'teleport'` también para el invalidate.

**REQ-6 — Dashboard de experiencia (`debug.js`)**

Tab Exp: sección "▶ Datos avanzados" plegable (`<details>`). Contiene Calidad de caminata y Música — métricas técnicas que no responden la pregunta rectora.

Dashboard principal visible: TTF, Cinematic Score, Embudo narrativo, Ritmo narrativo.

Botón "Reset exp." → renombrado "🔄 Nueva sesión" → llama `startTestSession()`.

---

### Hallazgos de campo — log 2026-06-26

Prueba en Firefox/Windows con simulación de ruta sobre el Centro Histórico de Cali.

**Pipeline completo confirmado:**
- Overpass devolvió POIs del cache (601 en IndexedDB)
- Iglesia de San Francisco detectada y activada correctamente
- Claude Worker respondió en 5327ms
- Voz habló: Microsoft Helena [es-ES] local, lag 199ms
- 1048 chars (objetivo: <1200)
- Narración duró 70s (objetivo: 35-40s — Chrome con voz online ignora rate)
- Narraciones completas: 1/1

**Problemas observados:**
- TTF 358s — crítico. Overpass tardó 84-122s (timeout/carga extrema). Cache de 601 POIs solo se activó después del timeout completo del fetch
- `Narration: narrando en curso — ignorando trigger [POI diferente: Monumento a Joaquín de Cayzedo y Cuero]` — visited prematuro confirma Sprint S2 prioritario
- `Weather: cache invalidado` disparado 12 veces seguidas en modo ruta — bug de condición (ver REQ-5 arriba)
- Overpass en modo `raw=0` dos veces seguidas — API pública bajo carga extrema. Necesita backoff y uso agresivo del cache IndexedDB

---

### Deuda técnica nueva

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-22 | `visited = true` debe ocurrir al completar narración, no al activar POI | Alta |
| DT-23 | Cola narrativa — POIs detectados durante narración deben encolarse, no perderse | Alta |
| DT-24 | Cache agresivo de Overpass — usar IndexedDB sin intentar refetch durante la misma sesión | Alta |
| DT-25 | Backoff Overpass — esperar 30-60s después de 429 antes de reintentar | Alta |
| DT-26 | Weather.invalidateCache() disparado en modo ruta (solo debería en modo teleport) | Media |
| DT-27 | `clearCache()` en debug.js no recarga la página — deja app en estado inconsistente | Media |

### Deuda técnica resuelta

| ID | Descripción |
|----|-------------|
| BUG-014 | Candado `_isFetchingPOIs` — implementado finalmente en `poi.js` |

---

### Confiabilidad del laboratorio post-LAB-01

| Componente | Antes | Después |
|-----------|-------|---------|
| Debugger | 5/10 | 7/10 |
| Simulador | 6/10 | 8/10 |
| Métricas | 3/10 | 7/10 |
| Dashboard experiencia | 5/10 | 8/10 |
| Laboratorio completo | 4/10 | 7-8/10 |

---

### Próxima sesión — Sprint S2

1. `visited = true` al completar narración — no al activar (DT-22)
2. Cola narrativa — POIs encontrados durante narración no se pierden (DT-23)
3. Cache agresivo Overpass — priorizar IndexedDB en sesión activa (DT-24)
4. Backoff exponencial en 429 (DT-25)
5. Prueba en iPhone del fix de AudioContext (BUG-036) — confirmar voz

---

*Follower — Bitácora v0.7s | Sesión 12 | 25 Junio 2026*

---

## Sesión 13 — 26 Junio 2026

### Contexto
Auditoría quirúrgica de `poi.js` motivada por evidencia de campo: simulación en la Calle de Alcalá (Madrid) devolvió 0 POIs a pesar de que Overpass respondía HTTP 200. Primer POI cargado desde cache era "Bestial" en Barcelona (lat=41.38, lng=2.19) — confirma contaminación geográfica del cache.

Alcance estricto: solo `poi.js`. Sin tocar narración, UX, debug ni arquitectura general.

---

### BUG-039 — `raw=0` en Madrid, Cali y cualquier zona bajo carga

**Síntoma:** Overpass responde HTTP 200 con `elements: []`. El log muestra `raw=0 normalizados=0`. El pipeline cae al cache de IndexedDB, que devuelve POIs de otra ciudad.

**Causa raíz — tres factores apilados:**

**Factor 1 (principal): `Content-Type` ausente en el POST**

```javascript
// Antes — body enviado como text/plain (default del browser)
const res = await fetch(url, {
  method: 'POST',
  body:   `data=${encodeURIComponent(query)}`
});

// Después — Content-Type correcto
const res = await fetch(mirrorUrl, {
  method:  'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body:    `data=${encodeURIComponent(query)}`,
  signal:  controller.signal
});
```

Overpass espera `application/x-www-form-urlencoded`. Sin ese header, bajo carga el servidor ignora el body silenciosamente, procesa una query vacía y devuelve `elements: []` con HTTP 200. Esto explica exactamente `raw=0` con status 200 (no con 400).

**Factor 2: query con 13 cláusulas `node`/`way` separadas**

13 pasadas independientes sobre el dataset de OSM. Bajo carga, el timeout del servidor (`[timeout:25]`) se alcanza antes de completar todos los scans. Reemplazado por 6 cláusulas `nwr` (node + way + relation en una sola pasada). Reducción estimada: 3x en tiempo de servidor.

```
// Antes: 13 cláusulas
node(around:...)["historic"];
node(around:...)["tourism"~"..."];
way(around:...)["historic"];
way(around:...)["tourism"~"..."];
...

// Después: 6 cláusulas nwr
nwr(around:...)["historic"];
nwr(around:...)["tourism"~"..."];
...
```

**Factor 3: un solo mirror sin timeout**

`lz4.overpass-api.de` bloqueaba hasta 131 segundos antes de responder vacío. Sin fallback ni timeout, toda la sesión quedaba bloqueada. Sistema reemplazado por 3 mirrors con AbortController de 20s cada uno.

**Fix completo implementado:**
- `Content-Type: application/x-www-form-urlencoded` en todos los fetches
- Query `nwr` de 6 cláusulas
- 3 mirrors: `overpass.kumi.systems` → `overpass-api.de` → `lz4.overpass-api.de`
- `raw=0` con HTTP 200 tratado como fallo del servidor (no como zona sin POIs) → activa fallback al cache
- Archivo: `js/poi.js`

---

### BUG-040 — Cache IndexedDB carga POIs de otra ciudad

**Síntoma:** usuario en Madrid (lat=40.41, lng=-3.68), cache devuelve "Bestial" de Barcelona (lat=41.38, lng=2.19) como primer POI. `detectPOI()` no activa nada porque todos los POIs están a ~1000km.

**Causa raíz:** `loadPOIsFromDB()` hace `store.getAll()` — devuelve todos los POIs del store sin filtro geográfico. El store acumula POIs de todas las ciudades visitadas en la misma IndexedDB.

**Fix:** filtro por `GPS.distanceMeters()` antes de asignar a `_pois`:

```javascript
const CACHE_RADIUS_M = CONFIG.FETCH_RADIUS_KM * 1500; // 3km
const nearby = typeof GPS !== 'undefined'
  ? cached.filter(p => GPS.distanceMeters(lat, lng, p.lat, p.lng) <= CACHE_RADIUS_M)
  : cached; // fallback si GPS no está listo
```

No requiere cambios en el schema de IndexedDB. Los POIs de otras ciudades permanecen en la DB (útiles si el usuario vuelve) pero no se cargan en la sesión actual.

Log diagnóstico: `POI: cache IndexedDB tiene 601 POIs · 0 en radio 3km` → zona sin datos locales confirmada limpiamente.

- Archivo: `js/poi.js`

---

### Deuda técnica resuelta

| ID | Descripción |
|----|-------------|
| BUG-014 | Candado `_isFetchingPOIs` — confirmado funcionando en campo |
| DT-24 | Cache Overpass — resuelto vía filtro geográfico + `raw=0` como fallo |

### Deuda técnica actualizada

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-28 | Verificar que `nwr` no supera el cap de 80 POIs en ciudades muy densas (Roma, Madrid centro) | Baja |

---

### Próxima sesión — Sprint S2 (sin bloqueos)

Con BUG-039 y BUG-040 resueltos, el pipeline de POIs es ahora confiable. Se puede proceder:

1. `visited = true` al completar narración — no al activar (DT-22)
2. Cola narrativa (DT-23)
3. Prueba en iPhone del fix de AudioContext (BUG-036)

---

*Follower — Bitácora v0.7s | Sesión 13 | 26 Junio 2026*

---

## Sesión 14 — 26 Junio 2026

### Contexto
Sesión de investigación y validación de hipótesis. Dos hallazgos críticos de campo llevaron a una decisión de producto significativa: reemplazar Overpass por Wikipedia GeoSearch como fuente primaria de POIs.

---

### Hallazgo de campo — 0 POIs en Madrid

Prueba en simulador sobre la Calle de Alcalá (Madrid, lat=40.41, lng=-3.68). Resultado: 0 POIs en toda la sesión a pesar de que Overpass devolvía HTTP 200.

Evidencia clave del log:
```
Fetch is aborted  ← los tres mirrors simultáneamente
count=6 nearby=0  ← cache tenía 6 POIs de Cali, 0 útiles en Madrid
```

Diagnóstico confirmado: Overpass público es indefendible como fuente primaria para producción. Los tres mirrors comparten infraestructura y colapsan juntos. El filtro geográfico del cache funcionó correctamente — evitó cargar POIs de Cali en Madrid — pero sin datos frescos de Overpass y sin cache local de Madrid, el resultado fue 0 POIs.

---

### Decisión de producto — Wikipedia GeoSearch como fuente primaria

Proceso de decisión documentado:

1. Comparativo de fuentes (Overpass, Wikipedia, Foursquare, Google Places)
2. Análisis arquitectural: Opción 1 a 4 evaluadas
3. Decisión: Opción 3 — Wikipedia primaria + Overpass fallback
4. Principio rector aplicado: un lugar con artículo en Wikipedia es un lugar que alguien consideró suficientemente notable para documentar — alineación natural con la visión cinematográfica de Follower

Decisión de implementación: experimento mínimo antes de refactorizar arquitectura. Sin nuevos archivos, sin Provider Layer, sin OverpassProvider.js.

---

### EXPERIMENTO-001 — Wikipedia GeoSearch (poi.js)

**Hipótesis:** Wikipedia GeoSearch puede reducir el TTF de >300s a <90s sin romper la experiencia de Follower.

**Implementación:** una función privada `fetchWikipediaPOIs(lat, lng, radiusKm)` insertada en `poi.js`. `loadPOIs()` modificado para intentar Wikipedia primero.

Orden nuevo:
```
Wikipedia GeoSearch (~300ms, 99.9% uptime)
    ↓ si falla o 0 resultados
Overpass / OSM (8-60s, ~30% fallo)
    ↓ si falla
IndexedDB cache geográfico (<10ms)
```

Schema de normalización idéntico al existente:
```javascript
{ id: `wiki_${pageid}`, name, lat, lng,
  icon: '🏛️', type: 'historic',
  description: '', tags: {}, visited: false,
  cachedAt, _source: 'wikipedia' }
```

`_source` es metadato de diagnóstico — ningún consumidor lo usa. Todo el pipeline downstream (`detectPOI`, `activatePOI`, `renderAllMarkers`, narración) funcionó sin ningún cambio.

**Resultado del experimento:**

```
Wikipedia: 50 POIs en 513ms
POI: 50 POIs de Wikipedia cargados y renderizados
```

POIs narrados en Madrid: Calle de Barcelona, Café Universal, Lhardy, Antigua Pastelería del Pozo, Café Colonial, Real Gabinete de Historia Natural, Real Casa de la Aduana.

**Métricas:**
- TTF: 0s (desde cache de sesión anterior — próxima sesión confirmar desde cero)
- Cinematic Score: 70/100 — Buen ritmo cinematográfico
- Narraciones completas: 1/1 en primera sesión
- 0 interrupciones
- lag texto→voz: 189-211ms (excelente)
- chars narración: 856-960 (dentro del objetivo post-S1)

**Hipótesis validada.** Wikipedia resuelve el problema de descubrimiento de POIs en ciudades turísticas con confiabilidad y velocidad que Overpass nunca pudo dar.

---

### Observaciones de calidad — POIs de Wikipedia

Los lugares narrados en Madrid reflejan exactamente la visión cinematográfica de Follower:

- **Lhardy** — restaurante fundado en 1839, uno de los más antiguos de Madrid
- **Café Universal** — lugar histórico del Madrid literario
- **Calle de Barcelona** — calle con historia en el barrio de Las Letras
- **Real Casa de la Aduana** — edificio neoclásico del siglo XVIII

Ninguno de estos lugares habría aparecido con la query de Overpass anterior. Wikipedia no devuelve buzones ni bancos — devuelve lugares que merecen ser narrados.

---

### Problemas confirmados pendientes de resolución

**POIs ignorados durante narración — DT-22/23 (confirmado en campo)**
```
Narration: narrando en curso (Calle de Barcelona) — ignorando trigger [Calle de Cádiz]
Narration: narrando en curso (Calle de Barcelona) — ignorando trigger [Pasaje de Matheu]
```
Durante cada narración de ~67s se pierden 2-3 POIs. Con Wikipedia funcionando y el pipeline activo, este bug es ahora el más impactante en la experiencia real. Sprint S2 prioritario.

**Duración de narración 67s en Chrome — DT-22 adyacente**
```
duración narración hablada: 66992ms · chars=862
```
Microsoft Helena ignora el parámetro `rate`. Solo afecta Chrome con voces online. En iPhone con Paulina (es-MX local) la duración debería ser 35-40s. Confirmar en próxima prueba en iPhone.

**Cali con Wikipedia — cobertura a confirmar**
```
Wikipedia: 0 POIs en 272ms — usando siguiente fuente
```
La prueba de Cali ocurrió antes del teletransporte a Madrid, con GPS en coordenadas incorrectas. Falta prueba directa en Centro Histórico de Cali (lat=3.4489, lng=-76.5319) para confirmar cobertura real de Wikipedia en español.

**Weather.invalidateCache en modo ruta — DT-26**
```
DebugSim: teletransporte a 40.4168,-3.7035 — clima invalidado
DebugSim: teletransporte a 40.4170,-3.7032 — clima invalidado  (waypoint de ruta)
```
Al dibujar waypoints en modo ruta, `teleportTo()` también invalida el clima. Solo debería hacerlo en modo teleport real.

---

### Deuda técnica resuelta esta sesión

| ID | Descripción |
|----|-------------|
| BUG-039 | Content-Type en POST a Overpass + mirrors con fallback |
| BUG-040 | Cache IndexedDB filtrado por proximidad geográfica |
| DT-24 | Cache agresivo — resuelto vía Wikipedia como fuente primaria |

### Deuda técnica nueva

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico de Cali (es.wikipedia.org) | Alta |
| DT-30 | Confirmar TTF con Wikipedia desde sesión completamente nueva (sin cache previo) | Alta |
| DT-31 | Mejorar `type` e `icon` de POIs de Wikipedia según categorías de Wikidata (post-validación) | Baja |

---

### Sprint S2 — desbloqueado y priorizado

Con Wikipedia funcionando, el pipeline es confiable. Las prioridades de Sprint S2 en orden:

1. **DT-22 — `visited = true` al completar narración** — bug más impactante hoy
2. **DT-23 — Cola narrativa** — POIs encontrados durante narración no se pierden
3. **DT-29 — Confirmar cobertura Cali** — prueba de campo
4. **DT-26 — Weather en modo ruta** — fix quirúrgico, una línea

---

*Follower — Bitácora v0.8 | Sesión 14 | 26 Junio 2026*

---

## Sesión 15 — 26 Junio 2026

### Contexto
Sprint S2 arranca. Con el pipeline validado (Wikipedia + Claude + Voice), el foco pasa de "¿funciona?" a "¿se siente cinematográfico?". Sesión dedicada a resolver los dos problemas más impactantes en la experiencia real: POIs perdidos durante narraciones, y ausencia de música.

---

### Decisiones de producto — Sprint S2

**Aprobado:**
- S2-A1 — `visited = true` al completar narración
- S2-A2 — Cola narrativa básica
- DT-19 — Placeholder musical para desbloquear pruebas

**No aprobado todavía:**
- Cooldown fijo de 4 minutos (sin evidencia de campo suficiente)
- Scoring de POIs
- Provider Layer formal
- Foursquare / Google Places
- Cambios de UI

**Principio aplicado:** cambios mínimos y medibles. No abrir nuevos frentes.

---

### S2-A1 — visited = true al completar narración

**Problema resuelto:** `activatePOI()` marcaba `poi.visited = true` inmediatamente al activar el POI — antes de que la voz hablara. Un POI con narración interrumpida (por error de voz, salida del radio, error de red) quedaba quemado para siempre en la sesión.

**Evidencia de campo:**
```
Narration: narrando en curso (Calle de Barcelona) — ignorando trigger [Calle de Cádiz]
Narration: narrando en curso (Calle de Barcelona) — ignorando trigger [Pasaje de Matheu]
```
Dos POIs perdidos en una sola narración. Con narraciones de 67s y el usuario caminando, esto ocurría sistemáticamente.

**Fix implementado:**

*Antes:*
```javascript
// activatePOI() — se ejecuta antes de que la voz hable
if (!poi.visited) {
  poi.visited = true;
  AppState.poisVisited++;
}
```

*Después:*
```javascript
// Voice.speak() callback — se ejecuta cuando la voz termina correctamente
if (poi && !poi.visited) {
  poi.visited = true;
  AppState.poisVisited++;
  updateStats();
}
```

- Archivo: `js/poi.js` y `js/narration.js`
- Un POI interrumpido vuelve a estar disponible en la próxima detección
- `AppState.poisVisited` solo sube cuando la narración llegó al usuario

---

### S2-A2 — Cola narrativa básica

**Problema resuelto:** POIs detectados durante una narración activa eran ignorados con `return` inmediato en `Narration.trigger()`. El log mostraba `ignorando trigger [POI diferente: X]` — sin ninguna posibilidad de recuperación.

**Diseño de la cola:**

```
Comportamiento anterior:
POI A narrando → POI B detectado → ignorado para siempre (visited=true)

Comportamiento nuevo:
POI A narrando → POI B detectado → entra a cola
POI A termina → processQueue() → ¿B sigue cerca? → sí → narrar B
                                                  → no → descartar B
```

**Parámetros:**
- `QUEUE_MAX_SIZE = 3` — máximo POIs simultáneos en cola
- `QUEUE_TTL_MS = 4min` — TTL por entrada
- Radio de validación: `120m × 1.5 = 180m` — margen sobre el radio de activación

**Implementación:**

`poi.js`:
- Estado: `_narrationQueue[]`, `QUEUE_MAX_SIZE`, `QUEUE_TTL_MS`
- `enqueuePOI(poi)` — valida duplicados, visited, cap de tamaño
- `processQueue()` — limpia expirados, verifica distancia actual, activa o descarta
- `detectPOI()` modificado: si `Narration.isNarrating()` → `enqueuePOI()` en lugar de ignorar
- `processQueue` expuesto en API pública

`narration.js`:
- Callback de `Voice.speak()`: al completar → `visited = true` + `POI.processQueue()`

**Logs de diagnóstico:**
```
Cola: encolado Café Universal · cola=[Café Universal]
Cola: narrando Café Universal (85m del usuario)
Cola: descartando Pasaje de Matheu — usuario se alejó (245m > 180m)
Cola: expirado Real Casa de la Aduana (>4min en cola)
```

---

### DT-19 — Tono sintético placeholder (música desbloqueada)

**Problema resuelto:** Los cuatro MP3 de intro daban 404. El sistema continuaba en silencio (fallback silencioso existente). La regla fundacional "narración siempre sobre música" no se cumplía en ninguna prueba de campo.

**Análisis de opciones:**
- Opción A: un único MP3 placeholder reutilizado — requiere archivo externo
- Opción B: fallback silencioso controlado — ya existía, no resuelve el problema
- **Opción C elegida:** tono sintético generado por Web Audio API — sin archivos externos

**Implementación en `music.js`:**

```javascript
// Oscilador de 2.5s con frecuencia diferenciada por narrador
osc.frequency.value = narrator === 'historian'   ? 220   // La2 — sobrio
                    : narrator === 'explorer'    ? 330   // Mi3 — curioso
                    : narrator === 'local'       ? 294   // Re3 — cálido
                    : 261;                                // Do3 — storyteller

// Fade in/out suave, volumen 0.15
gain.gain.linearRampToValueAtTime(0.15, _context.currentTime + 0.3);
gain.gain.linearRampToValueAtTime(0, _context.currentTime + oscDuration);
```

**Ventaja clave:** los MP3 definitivos pueden llegar en cualquier momento sin cambiar una línea de código. El sistema intentará el MP3 primero, y solo usará el oscilador si el archivo no existe.

---

### Diseño conceptual aprobado — Sprint S2 completo

**Checklist técnico de validación (para siguiente prueba de campo):**
```
□ "Cola: encolado [X]" → POI detectado durante narración entró a cola
□ "POI: visited=true al completar narración · [X]" → visited en momento correcto
□ "Cola: narrando [X] (Ym del usuario)" → segunda narración desde cola
□ "Cola: descartando [X] — usuario se alejó" → descarte limpio
□ Tono suave audible antes de cada narración (o log "usando tono sintético")
□ Sin líneas "ignorando trigger [POI diferente: X]" en logs normales
```

---

### Deuda técnica resuelta

| ID | Descripción |
|----|-------------|
| DT-22 | `visited = true` al completar narración — implementado |
| DT-23 | Cola narrativa básica — implementada |
| DT-19 | Música de intro — desbloqueada con tono sintético |

### Deuda técnica nueva

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-32 | Confirmar cola narrativa en prueba de campo — Madrid o Cali con ruta real | Alta |
| DT-33 | MP3 definitivos para los 4 narradores (reemplazar tono sintético) | Media |
| DT-34 | Cooldown mínimo entre narraciones — evaluar después de prueba de campo con cola | Media |

### Pendientes de Sprint S2 (no implementados todavía)

| ID | Descripción | Razón de espera |
|----|-------------|-----------------|
| DT-25 | Backoff Overpass 30-60s | Baja prioridad con Wikipedia como fuente primaria |
| DT-26 | Weather.invalidateCache en modo ruta | Fix de una línea — próxima sesión |
| DT-27 | clearCache() sin reload | Fix menor — próxima sesión |
| DT-30 | TTF desde sesión nueva sin cache | Pendiente de prueba en campo |
| BUG-036 | AudioContext iOS — confirmar en iPhone | Pendiente de prueba física |

---

### Próxima sesión — S2-C: Validación real

Con S2-A1, S2-A2 y DT-19 implementados:

1. Prueba de campo en Madrid o Cali con ruta de 25-30 minutos
2. Confirmar cola narrativa funcionando en logs
3. Confirmar música audible (tono sintético)
4. Confirmar TTF desde sesión completamente nueva
5. Prueba en iPhone — confirmar BUG-036 resuelto

---

*Follower — Bitácora v0.8 | Sesión 15 | 26 Junio 2026*

---

## Sesión 16 — 27-28 Junio 2026

### Contexto
Sesión extensa de implementación y debugging. Se implementaron S2-A1, S2-A2, DT-19, contexto del entorno en prompts, y se descubrieron múltiples bugs en iOS Safari con speechSynthesis. Primera prueba real de Follower en iPhone con narraciones activas.

---

### Implementaciones completadas

**S2-A1 — visited on complete**
`poi.visited = true` movido de `activatePOI()` al callback de `Voice.speak()`. Un POI interrumpido vuelve a estar disponible.

**S2-A2 — Cola narrativa básica**
`_narrationQueue[]`, `QUEUE_MAX_SIZE=3`, `QUEUE_TTL_MS=4min`. `detectPOI()` encola en lugar de ignorar durante narración activa. `processQueue()` verifica expiración y proximidad al completar.

**DT-19 — Tono sintético placeholder**
Oscilador Web Audio API de 2.5s con frecuencia diferenciada por narrador. Sin archivos externos. El tono sonó correctamente en iPhone.

**DA-47 — Contexto del entorno en prompts**
`buildContext()` calcula `GPS.distanceMeters()` en tiempo real y pasa hasta 8 POIs cercanos en 600m a cada narrador. Los 8 user prompts actualizados para usar el contexto del entorno completo, no solo el POI activado. Fix posterior: try/catch defensivo en `buildContext()` para evitar que un error rompa `trigger()`.

**DA-48 — Wikipedia en idioma local**
`fetchWikipediaPOIs()` detecta idioma local por coordenadas: Francia→fr, Italia→it, Portugal→pt, Brasil→pt, España→es, UK→en, Alemania→de. Loop continúa si <10 POIs. Deduplicación por coordenadas entre idiomas.

**BUG-041 — Overpass bloqueaba detección tras Wikipedia**
Wikipedia cargaba POIs en 300ms pero Overpass seguía corriendo en paralelo durante 60s manteniendo `_isFetchingPOIs=true`. Guard al inicio de `fetchPOIsFromOSM()`: si `_pois.length > 0 && _lastFetchPos`, retornar sin fetch.

**BUG-042 — Doble startTestSession destruía unlock de audio**
`startWalking()` y `initExplore()` ambos llamaban `startTestSession()`. El segundo reset ocurría después del unlock de audio. Removido de `startWalking()` — `initExplore()` lo hace en el momento correcto.

**BUG-043 — loadFromCache() bloqueaba indefinidamente**
`savePOIsToDB()` del teletransporte tenía transacción de escritura abierta. `loadFromCache()` esperaba indefinidamente. `_isNarrating=true` bloqueaba todas las narraciones siguientes. Fix: timeout de 2s en `loadFromCache()`.

**BUG-044 — POI visitado se repetía tras resetPOIs()**
`visited=true` vivía solo en el objeto POI en memoria. `resetPOIs()` creaba objetos frescos con `visited=false`. Fix: `_visitedInSession = new Set()` que persiste entre recargas. `markVisited(id)` y `resetVisited()` expuestos en API pública. Llamado desde narration.js, debug.js y app.js.

**BUG-045 — clearCache() destruía AudioContext en iOS**
Tres pulsaciones del botón 🗑️ Cache → tres `indexedDB.deleteDatabase()` → AudioContext destruido. Fix: `location.reload()` después de `deleteDatabase()`.

---

### Pruebas de campo — resultados

**Lisboa — Baixa histórico (pt.wikipedia.org)**
- Casa dos Bicos, Museu da Cerveja, Igreja da Madalena, Igreja de Santo António, Igreja da Conceição Velha
- 4 narraciones completas en 7 minutos
- TTF: 90s — excelente
- 🎬 70/100

**Barcelona — zona Sagrada Família (fr.wikipedia.org)**
- Estación de Gaudí, Estación de Sagrada Família, Colegio Lacordaire narrados
- La Sagrada Família no apareció como POI principal — aparece como contexto
- 41 POIs únicos cargados

**París — zona Museo Rodin (fr.wikipedia.org)**
- Estación de Varenne, Museo Rodin, Hôtel de Biron
- Cola funcionando: Museo Rodin encolado, narrando a 64m del usuario
- 🎬 70/100

**Cali — Centro Histórico (es.wikipedia.org)**
- Torre Mudéjar de Cali narrada
- 37 POIs únicos cargados
- Wikipedia cubre Cali en 431ms

---

### BUG-036 — Voz silenciosa en iOS — estado actual (sin resolver)

**Síntoma persistente:**
```
Voice: speak · speaking=false paused=false pending=false · 1044 chars
```
`speak()` se llama. Estado limpio. Pero `lag texto→voz` nunca aparece. `onstart` no dispara. Paulina seleccionada correctamente pero no habla.

**Causa raíz identificada:**
Dos `speak()` en 2 segundos (Bug A — cola disparó el mismo POI dos veces) → el segundo `cancel()` antes de `onstart` del primero → iOS queda en estado corrupto donde el siguiente `speak()` nunca dispara `onstart`.

**Fixes intentados:**
1. AudioContext keep-alive (music.js) — resuelve que el tono suene ✅
2. speechSynthesis keep-alive cada 20s (voice.js) — no resolvió
3. cancel() + 200ms delay antes de speak() en iOS — no resolvió
4. Guard en trigger() si speechSynthesis.speaking — no resolvió
5. Logs de diagnóstico detallados agregados — pendiente de test ⬅ aquí quedamos

**Próximo paso:** desplegar voice.js con logs detallados y traer el log de iPhone. Los logs mostrarán `pre-speak estado`, `speak() ejecutado` y `onerror` con `error=interrupted` o `error=not-allowed` — eso identificará la causa exacta.

---

### Hallazgos de calidad narrativa

**Nombres de POIs con sufijos Wikipedia**
`Madalena (Lisboa)`, `Sagrada Família (métro de Barcelone)`, `Quartier de la Sagrada Família` — Claude recibe nombres técnicos. Pendiente: limpiar nombres antes del prompt.

**Contexto del entorno — no confirmado llegando a Claude**
`buildContext()` implementado pero en ningún log se observó que Claude mencionara lugares del contexto en la narración. Pendiente de confirmación en próxima sesión.

**Silencios en caminata**
73% sístole en Lisboa. Radio 120m + velocidad simulación = muchos POIs no se activan. En caminata real a pie el ritmo mejora. Confirmar en campo.

---

### Deuda técnica nueva

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-35 | BUG-036 iOS voz silenciosa — logs de diagnóstico pendientes de análisis | Crítica |
| DT-36 | Limpiar nombres de POIs Wikipedia antes del prompt (sufijos, paréntesis) | Alta |
| DT-37 | Confirmar buildContext llega a Claude — verificar en narraciones | Alta |
| DT-38 | Chequeo inmediato al cargar POIs — reducir TTF de 90s a <30s | Media |

### Deuda técnica resuelta

| ID | Descripción |
|----|-------------|
| DT-22 | visited on complete — implementado S2-A1 |
| DT-23 | Cola narrativa — implementada S2-A2 |
| DT-19 | Música placeholder — tono sintético funcionando |

---

### Para iniciar en la próxima sesión

1. Analizar log de iPhone con voice.js de diagnóstico (DT-35)
2. Limpiar nombres de POIs Wikipedia (DT-36)
3. Confirmar que buildContext llega a Claude (DT-37)
4. Documentar DA-47 a DA-49 en arquitectura.md

---

*Follower — Bitácora v0.8 | Sesión 16 | 27-28 Junio 2026*





## Sesión 17 — 30 Junio 2026

### Contexto

Sesión completa de definición de producto y arquitectura — sin código
implementado todavía. Punto de partida: tres documentos fundacionales nuevos
subidos por Jaimeand: `manifiesto_narrativo.md`, `prompt_maestro_follower.md`
(versiones 2.3 → 2.7 oficial) y `manifiesto_care_strip.md`.

La pregunta que guió la sesión: con estos manifiestos como ancla, ¿qué hay
que cambiar en arquitectura e interfaz para que el código deje de
contradecir la visión narrativa del producto?

---

### Decisión fundacional: narrador único

Se confirma la consolidación de los 4 narradores (storyteller, historian,
explorer, local) en una sola voz, definida íntegramente por el Prompt
Maestro v2.7. Decisión de producto, no solo técnica — coherente con el
manifiesto narrativo: "Follower habla como el amigo más culto que conoces,
pero que nunca presume de lo que sabe."

Detalle completo en `arquitectura.md` — DA-50 a DA-57.

---

### Laboratorio de narración — tokens vs. latencia

Se trabajaron dos versiones intermedias del prompt maestro (v2.4 y v2.7)
antes de confirmar la oficial. Hallazgos clave de la discusión:

- **Longitud sin techo es el riesgo real, no la longitud en sí.** Sesión 12
  (S1-4) ya había bajado `max_tokens` de 450 a 350 por el mismo motivo:
  narraciones largas bloqueaban el pipeline. El v2.7 reabre parcialmente ese
  riesgo con su regla flexible ("puede superar ligeramente el rango"). Se
  decide compensar con un techo duro de `max_tokens: 480`, sin depender de
  que el prompt se autorregule.

- **Memoria de sesión completa vs. memoria de un solo capítulo.** Pasar el
  historial completo de capítulos anteriores en cada prompt crece de forma
  lineal con la caminata. Se decide limitar la memoria de continuidad al
  capítulo inmediatamente anterior — el historial completo solo se usa una
  vez, en la despedida final.

- **Autoevaluación interna (checklist de 7 puntos en v2.7) — costo no
  cuantificado todavía.** Se identificó como el punto de mayor incertidumbre
  de toda la sesión: no está claro si el "verifica internamente, no muestres
  el proceso" cuesta tiempo real de generación en Haiku o no. Queda como
  DT-44 — medir en campo antes de asumir cualquier cosa.

---

### Música — cambio de fondo, no solo de archivo

Decisión: ya no hay música reproducida por la app. La "banda sonora de la
ciudad" deja de ser un concepto de audio y se vuelve completamente narrativo
— vive en la sección "Ciudad Sonora" del prompt, no en `music.js`.

Esto deroga una regla crítica del proyecto ("la narración siempre va sobre
la música") tal como estaba escrita. Se retira como regla de audio; la
responsabilidad de presencia sonora pasa al texto.

`music.js` queda marcado para eliminación completa. DT-19 y DT-33 (los 4 MP3
de narrador, pendientes desde Sesión 15) quedan obsoletos — ya no aplican.

---

### Cierre de caminata — sin botón, con pregunta hablada

Se descartó deliberadamente un botón visible de "Terminar paseo" por romper
la filosofía de manos libres. La solución acordada combina tres señales:

1. Inactividad de movimiento prolongada
2. Cruzada con el estado de Care — para no confundir una pausa sugerida
   (lluvia, calor, cansancio) con el fin real de la caminata
3. Pregunta hablada por el propio narrador, con confirmación simple por tap

Se evaluó y descartó interacción por voz bidireccional (que el usuario
responda hablando, o incluso interrumpa una narración con una pregunta) por
ser una categoría de producto distinta — incompatible con "teléfono en el
bolsillo", soporte fragmentado de `SpeechRecognition` en iOS, alta tasa de
error por ruido de calle. Queda registrada como visión a futuro, no como
deuda técnica de esta versión.

---

### Tránsito rápido (taxi, bus, metro)

Se evaluaron dos caminos: pausar la detección de POIs durante desplazamiento
rápido, o narrar el salto como parte de la historia. Se eligió pausar —
más simple, no añade complejidad al prompt, coherente con DA-7 ("el GPS
nunca se interrumpe — es el latido de la app": el latido sigue, solo se
suspende la narración). Umbral propuesto: 15-18 km/h sostenido por 30-60s,
para evitar falsos positivos por caminata enérgica.

---

### Bienvenida de ciudad — de overlay opcional a pantalla de entrada real

Cambio de flujo de arranque completo. Se identificó que `getCityWelcome()`
no estaba funcionando como se esperaba — hoy es un overlay sobre el mapa que
aparece y se auto-cierra, usando el idioma del usuario.

Lo acordado: splash mínimo (logo, mientras carga GPS) → pantalla de
bienvenida animada, letra por letra, **en el idioma local de la ciudad**
detectada (no el del usuario) → exploración. Esta pantalla pasa a ser la
carga real de POIs, no decorativa.

Decisión de idioma: tabla simple país→idioma a partir del `country_code` ya
disponible en el reverse geocoding (`gps.js`). Se acepta como simplificación
consciente que ciudades multilingües (Bruselas, Barcelona, Montreal) no se
resuelvan con precisión en esta versión.

---

### Care Strip — la brecha más grande encontrada en la sesión

Al revisar `manifiesto_care_strip.md` contra el `care.js` actual, se
encontró la contradicción más fuerte de toda la sesión: el manifiesto exige
explícitamente "no existe un segundo narrador, no existe un sistema
separado — Follower simplemente cambia de intención", y el código actual es
exactamente eso que el manifiesto prohíbe — mensajes estáticos
(`MESSAGES.tired`, `.hot`, etc.) con tono de aplicación, no de anfitrión, y
selección de lugar sin criterio editorial (`places[0]`, el primero que
devuelve Overpass, sin distinguir un café tradicional de una cadena).

**Decisiones tomadas, punto por punto:**

- Care pasa a generar su mensaje vía una única llamada a Claude que también
  elige, entre 3-5 candidatos de Overpass, cuál lugar se siente más propio
  del sitio. Se descartó sumar un proveedor con rating (Foursquare) — la
  popularidad mide lo opuesto al criterio editorial que pide el manifiesto.
- Nuevo trigger, categoría que no existía: "momentos memorables", detectado
  por densidad de POIs Wikipedia en un radio pequeño (~150m) como proxy de
  "zona especial" — sin llamadas de red adicionales, extensión directa del
  aprendizaje ya validado de "Wikipedia como filtro editorial".
- Regla de "momento correcto" sin timers fijos: en vez de un margen de
  gracia arbitrario tras cada narración, Care espera a que el usuario
  retome el movimiento real antes de evaluar sugerencias de
  bienestar/contemplación. Los triggers de protección real (lluvia, calor o
  frío extremo) son la excepción — pueden anunciarse aunque el usuario siga
  detenido.

Pendiente: redacción del mini-prompt de Care (mismo "yo" narrativo, tono de
hospitalidad) — se deja para la sesión donde se trabajen prompts en detalle.

---

### Configuración — wizard tipo Organiza2 (pendiente de diseño)

Se anota la preferencia de manejar la configuración inicial como una
secuencia de pantallas (wizard), en vez del modal único actual. Sin resolver
en esta sesión — queda como DT-47.

---

### Resumen de decisiones — tabla rápida

| Tema | Decisión |
|------|----------|
| Narrador | Único, definido por Prompt Maestro v2.7 |
| Tokens | `max_tokens: 480`, techo duro |
| Memoria de sesión | Solo el capítulo anterior; historial completo solo en despedida |
| Autoevaluación del prompt | Mantenida tal cual viene en v2.7 — costo en latencia pendiente de medir (DT-44) |
| Música | Eliminada — la ciudad sonora es narrativa, no audio |
| Cierre de caminata | Sin botón — señal de inactividad + cruce con Care + pregunta hablada + tap |
| Interacción por voz del usuario | Descartada para esta versión — anotada como visión futura |
| Tránsito rápido | Pausar detección por umbral de velocidad — GPS nunca se detiene |
| Bienvenida de ciudad | Pantalla de carga real, saludo en idioma local de la ciudad |
| Care Strip | Generativo vía Claude, selección editorial de lugar, nuevo trigger de densidad, sin timers fijos |
| Configuración | Wizard tipo Organiza2 — pendiente de diseño |

---

### Próxima sesión

1. Definir formato de extracción de metadatos por capítulo (DT-39) —
   bloqueante para implementar DA-52 (memoria de un solo capítulo)
2. Redactar mini-prompt de Care (DT-42)
3. Definir umbrales pendientes: inactividad para cierre (DT-40), densidad de
   POIs para "zona especial" (DT-43)
4. Tabla país→idioma — cobertura inicial (DT-41)
5. Diseño de UI: pantalla de bienvenida animada y confirmación por tap de
   cierre (DT-45, DT-46)
6. Medir en campo costo real de la autoevaluación del v2.7 antes de
   comprometerse a mantenerla sin cambios (DT-44)

---

*Follower — Bitácora v0.9 | Sesión 17 | 30 Junio 2026*




## Sesión 18 — 30 Junio 2026

### Contexto

Sesión de implementación pura. Sin definiciones nuevas — ejecutar el backlog
priorizado de la Sesión 17. Punto de partida: revisión completa de la bitácora
para mapear todos los pendientes técnicos abiertos.

---

### Sprint 1 — Fixes inmediatos y narrador único

#### DT-27 cerrado sin cambios
Al revisar `debug.js`, `clearCache()` ya tenía `setTimeout(() =>
location.reload(), 300)` desde una sesión anterior. Se cierra como resuelto
sin modificaciones.

#### DT-26 — `debug.js`
`Weather.invalidateCache()` en `startTestSession()` se llamaba
incondicionalmente aunque no se cambiara de ciudad. Removido. La llamada
correcta ya existía en `debug-sim.js` guardada por `if (_mode === 'teleport')`.

#### DT-36 — `narration.js`
Helper `cleanPOIName()` agregado. Elimina sufijos de desambiguación Wikipedia
antes de pasarlos al prompt: `"Catedral de Sal (Colombia)"` → `"Catedral de
Sal"`, `"Plaza Mayor (Madrid)"` → `"Plaza Mayor"`. Aplicado en `buildContext()`
y `buildPrompt()` con `{ ...poi, name: cleanPOIName(poi.name) }`.

#### DT-38 — `poi.js`
`detectNearby()` cuando `_pois.length === 0` llamaba `loadPOIs()` async y
salía con `return` sin esperar resultado. El siguiente `detectPOI()` ocurría
hasta el próximo tick GPS (hasta 5s + tiempo de carga). Fix: `_pendingDetect`
guarda la posición antes del `return`; `_flushPendingDetect()` llama
`detectPOI()` inmediatamente cuando `loadPOIs()` termina, tanto en path OSM
como en fallback IndexedDB.

---

### Sprint 2 — DA-50: Consolidación de narrador único

La implementación más grande de la sesión. Cinco archivos afectados:

**`narration.js`** — reescrito completo.
- `STYLE_PROMPTS` (4 narradores × 2 idiomas) → `SYSTEM_PROMPT` bilingüe con
  el Prompt Maestro v2.7 íntegro
- `CITY_WELCOME` de 4 estilos → voz única (`"Un capítulo te espera en cada
  esquina"`)
- `buildPrompt(poi, style, lang, topic)` → `buildPrompt(poi, lang)`
- `max_tokens` 350 → 480 (techo duro — S17)
- Cache key `${poiId}_${style}_${lang}_${topic}` → `${poiId}_${lang}_${topic}`
- `Music.playNarratorIntro()` eliminado
- `getCityWelcome(city, style, lang)` → `getCityWelcome(city, _unused, lang)`

**`config.js`**
- `narrator` eliminado de `DEFAULTS`
- `setNarrator()`, `NARRATOR_LABELS`, `getNarratorLabel()` eliminados

**`app.js`**
- `narrationStyle` / `narrationStyleLabel` eliminados de `AppState`
- `STYLE_LABELS`, `STYLE_ICONS`, `initStyleSelector()` eliminados
- `Config.setNarrator()` y `Music.initFromGesture()` eliminados de todos
  los handlers

**`index.html`**
- Bloque "¿Quién te acompaña hoy?" eliminado del config modal
- `styleSelector` bottom sheet eliminado
- `btnStyleSelector` pill eliminado del bottom bar
- `barStyleLbl` fijo como "Follower"

**`music.js`** — stub vacío con comentario DA-50.

**`poi.js`** — DT-38 (ver arriba).

**`debug.js`** — DT-26 (ver arriba).

`sw.js` bumpeado a `follower-v2`.

---

### Sprint 3 — DT-39/40/41/43

#### DT-39 — Memoria de capítulo (DA-52)

**Decisión de formato:** se pasa el texto completo del capítulo anterior, no
un resumen extraído. Razones:
- El v2.7 ya sabe qué buscar en él (idea central + recurso sensorial)
- Una extracción separada costaría una llamada adicional con latencia
- Costo: ~350 tokens extras × precio Haiku = irrelevante (~$0.000088/narración)

**Implementación:**
- `AppState._walkChapters = []` — array de `{ poiId, poiName, text, ts }`
- `buildPrompt()` inyecta el último capítulo como prefijo del user message
- Solo se almacenan capítulos reales (source !== 'fallback')
- Log en debug: `Narration: capítulo #N guardado — {poi_name}`

#### DT-41 — Tabla país→idioma local

**Decisión:** saludo de bienvenida en el idioma local de la ciudad detectada,
no en el idioma del usuario. Simplificación consciente: ciudades multilingües
(Bruselas, Montreal, Barcelona) usan el idioma principal del país.

**Implementación:**
- `COUNTRY_LANG` en `narration.js` — 35+ códigos ISO 3166-1 → idioma local
- `getLocalLang(countryCode)` expuesto en API pública de `Narration`
- `CITY_WELCOME` expandido de 2 a 18 idiomas
- `AppState.countryCode` en `app.js` para almacenar el código del país actual
- `gps.js` almacena `AppState.countryCode = country` cuando Nominatim responde
  y pasa `countryCode` a `welcomeCity(city, country)`
- `welcomeCity()` en `app.js` usa `Narration.getLocalLang()` en vez de
  `AppState.lang`

#### DT-40 — Detección de inactividad para cierre de caminata

**Umbrales definidos:**
- Movimiento < 30m en 10 minutos → inactividad detectada
- Solo aplica con ≥ 500m caminados (evita falso positivo en arranque)
- No dispara si `AppState.phase === 'rest'` (pausa de Care intencional)
- No dispara si `AppState.phase === 'diastole'` (narración en curso)

**Implementación:**
- `_lastSigMoveTs` y `_lastSigMovePos` en `gps.js`
- `onWalkInactivity()` en `app.js` — solo loguea por ahora
- DT-45/46 (pregunta hablada + tap) bloquean la implementación completa

#### DT-43 — Zona especial por densidad de POIs

**Umbrales definidos:** ≥ 3 POIs en 150m → zona especial.
Reset al moverse > 200m desde el punto de disparo.

**Implementación:**
- `checkSpecialZone(lat, lng)` en `care.js`, llamada en cada tick GPS
- Respeta cooldown de Care y fase `diastole`
- Mensaje estático placeholder `'special'` en `MESSAGES` — DT-42 lo
  reemplazará por Care generativo cuando el mini-prompt esté validado
- `_specialZoneTriggerPos` para evitar re-disparo dentro de la misma zona

#### DT-42 — Mini-prompt de Care (definido, no implementado)

El prompt está redactado en `docs/dt42_care_miniprompt.md`. Incluye:
- System prompt: voz de hospitalidad, máx 55 palabras, sin exclamaciones
- 5 user prompts por trigger (hot, cold, tired, lunch, special)
- Formato de `places_list` para los candidatos de Overpass
- Ejemplo de respuesta esperada
- Notas de implementación en care.js

No se implementa hasta validar latencia en campo (DT-44 pendiente).

`sw.js` bumpeado a `follower-v3`.

---

### DT-9 — Key OpenAI en git history

Confirmado: ningún archivo activo contiene la key. Solo existe en commits
`a249fee8`–`a303f110` en el historial público del repo. Acción requerida:
revocar la key directamente en console.openai.com (API Keys → revocar
`sk-proj-...`). Con la key revocada el historial queda inerte.

---

### Deuda técnica resuelta esta sesión

| ID | Descripción |
|----|-------------|
| DT-26 | Weather.invalidateCache() en startTestSession() — removido |
| DT-27 | clearCache() sin reload — ya estaba resuelto desde sesión anterior |
| DT-36 | Limpiar nombres POIs Wikipedia — cleanPOIName() implementado |
| DT-38 | TTF inmediato post-carga — _pendingDetect + _flushPendingDetect() |
| DT-39 | Formato metadatos por capítulo — texto completo, _walkChapters[] |
| DT-40 | Umbral inactividad — 30m/10min, onWalkInactivity() en app.js |
| DT-41 | Tabla país→idioma — 35+ países, COUNTRY_LANG, getLocalLang() |
| DT-43 | Zona especial — ≥3 POIs en 150m, checkSpecialZone() en care.js |
| DA-50 | Narrador único — 5 archivos implementados, sw.js v2 |

### Deuda técnica pendiente tras esta sesión

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-44 | Medir latencia autoevaluación v2.7 en campo — antes de tocar narration.js | Crítica |
| DT-42 | Implementar Care generativo con mini-prompt redactado | Alta |
| DT-45 | UI: pantalla de bienvenida animada letra por letra | Alta |
| DT-46 | UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración | Media |
| DT-32 | Confirmar cola narrativa en campo | Alta |
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico de Cali | Alta |
| DT-30 | Confirmar TTF desde sesión nueva sin cache | Alta |
| DT-9  | Revocar key OpenAI expuesta en commits a249fee8–a303f110 | Alta |
| DT-1  | Logo SVG final + iconos PWA | Alta |
| DT-4  | Pantalla resumen del paseo | Media |
| DT-8  | debug.js deshabilitado antes de v1.0 | Media |
| DT-16 | Rediseño pantalla POI expandida | Media |
| DT-34 | Cooldown mínimo entre narraciones — post campo | Media |

---

## Sesión 19 — 1 Julio 2026

### Contexto

Sesión de tooling, no de producto. Punto de partida: preparar el terreno
para implementar DT-42 (Care generativo) con un banco de pruebas real en el
simulador, antes de tocar `narration.js`. En el camino se encontraron y
cerraron dos deudas que no estaban en el plan original de la sesión.

---

### Debug panel — de 5 tabs a 3 (DA-62)

Al revisar `debug.js` para conectar Care al simulador, se encontró el botón
`📤 Exportar` duplicado en 6 lugares (Estado, Logs ×2, Tiempos ×2, 🎬),
todos llamando a la misma `exportLog()`. No era un problema funcional —
`exportLog()` ya arma un solo reporte con todo (score, tiempos, logs)
independientemente de cuántos botones lo disparen — pero sí de mantenimiento
y de ruido visual.

Se decidió sacar Estado, Tiempos y 🎬 de la barra visible sin borrar su
código — siguen accesibles por link directo si hace falta un detalle puntual
(`Debug.switchTab('timing')` desde la rhythm card de Simular). El dato de
esas tres vistas se sigue grabando igual en segundo plano; lo único que
cambia es que no hay un dashboard en vivo mirándolo todo el tiempo.

`renderSearch()` (tab "Buscar") se renombró a "POIs" y pasó de mostrar los
primeros 8 sin orden a mostrar los 20 más cercanos, ordenados por
`_distanceMeters` — el dato ya existía en cada POI, solo no se usaba para
ordenar. Se agregó auto-refresco cada 1.5s, con guardia para no pisar el
filtro si el usuario está escribiendo.

Las 4 utilidades que vivían en Estado (recargar POIs, test de narración,
verificar Worker, limpiar cache) se movieron al tab Simular — son
herramientas de uso mientras se simula, no información de estado pasiva.

---

### DA-55 — de decisión documentada a código real

Al revisar qué faltaba para el modo "Auto/carro" del simulador, se encontró
que **DA-55 (pausa de detección en tránsito rápido) estaba en
`arquitectura.md` desde Sesión 17 pero nunca se implementó** — `gps.js` no
tenía ningún cálculo de velocidad. Se cerró en la misma sesión.

Implementación: `_updateTransitState()` en `gps.js`, corre en cada tick de
`onPosition()` (no throttleada), calcula velocidad instantánea entre
lecturas consecutivas usando la posición anterior antes de que se
sobreescriba. Si se sostiene ≥15km/h por 45s seguidos, pausa
`POI.detectNearby()` — `Care.check()` sigue evaluando igual (lluvia/calor
tienen sentido avisados aunque el usuario vaya en taxi). El GPS
(`watchPosition`) nunca se detiene, coherente con DA-7.

Botón "🚗 Auto 20km/h" agregado al simulador con indicador en vivo
(`GPS.isInTransit()`) — naranja mientras espera los 45s, verde cuando la
pausa está confirmadamente activa.

---

### Care testeable desde el simulador (DA-63)

`Care._testTrigger(type)` nuevo — bypasea `checkCareContext()` completo
(cooldown, clima real, hora real) y dispara `triggerSuggestion()` directo
con valores de prueba. 5 botones en `debug-sim.js`, uno por trigger
(calor/frío/cansancio/almuerzo/zona especial).

Detalle encontrado al implementar: el primer intento puso los botones dentro
de `_renderRhythmCard()`, que solo se renderiza completa después de la
primera narración — hubiera hecho imposible probar Care recién llegado a una
ciudad, antes de cualquier narración. Se movieron al cuerpo fijo del tab.

**Importante — no confundir con DT-42:** estos botones hoy siguen mostrando
los mensajes estáticos de `MESSAGES`. Care generativo (`getCareMessage()` en
`narration.js`) todavía no está implementado — este es el banco de pruebas
para cuando sí lo esté, construido primero a propósito para no debuggear a
ciegas con clima real y cooldown de 20 minutos.

---

### `sw.js` v4 → v5

Bump por cambios en `gps.js`, `care.js`, `debug.js`, `debug-sim.js`.

---

## Continuación Sesión 19 — Revisión de triggers y DT-42 real

Segunda mitad de la sesión: antes de programar `getCareMessage()`, se hizo
una revisión completa de qué triggers de Care existían en código vs. qué
pedía el manifiesto (`manifiesto_care_strip.md`, `contexto_maestro.md`).
Encontrar los gaps ahí, en vez de después de programar, evitó tener que
tocar `narration.js` dos veces.

### Hallazgo — lluvia era un sistema separado, no un trigger de Care

Al revisar el guard `AppState.phase === 'alert'` en `checkCareContext()`,
se encontró que la lluvia **no pasaba por Care en absoluto**. Vivía
completa en `weather.js`: timer propio de 10 min, texto 100% hardcodeado
en español sin usar `lang` (única alerta de Care sin bilingüe), y su propia
búsqueda de refugio (`findNearbyRefuge()`) casi idéntica pero separada de
`findNearbyRestPlace()` de `care.js`. Era, literalmente, el "segundo
sistema separado" que el manifiesto prohíbe explícitamente ("No existe un
segundo narrador. No existe un sistema separado").

Decisión: migrar por completo. Ver DA-65.

### Decisiones sobre triggers nuevos — atardecer descartado, sed sumada

Revisando la lista completa del manifiesto (lluvia, calor/frío, cansancio,
almuerzo, sed, zona especial, atardecer), se evaluaron los dos que faltaban:

- **Atardecer — descartado.** Sin datos de elevación o línea de vista,
  un trigger basado solo en hora sugeriría un atardecer con la vista
  tapada por edificios la mayoría de las veces en el centro denso de
  una ciudad. Rompe el principio de "solo lo verificable" del Prompt
  Maestro — queda anotado como posible visión futura si se suma alguna
  fuente de datos de elevación, no como deuda técnica de esta versión.
- **Sed — sumada, como trigger nuevo.** Ver DA-64 para el diseño completo.
  Iteración importante: la primera versión ("calor moderado + distancia")
  se descartó al notar que en climas como Cali (22-29°C es el estado
  normal del día, no una excepción) dispararía en casi toda caminata,
  rompiendo el principio de "el caminante nunca debe sentir que una
  máquina le está dando instrucciones". Se resolvió limitando el trigger
  a una sola vez por caminata (`_thirstShownThisWalk`), no por el
  cooldown estándar de 20 min.

### DT-42 implementado — Care generativo real

Con el alcance de 7 triggers cerrado y documentado en
`dt42_care_miniprompt.md` v2, se implementó de punta a punta:

- **`narration.js`**: `callClaude()` con `maxTokens` parametrizable (Care
  usa 120, narración sigue en 380). `CARE_SYSTEM_PROMPT` + `buildCarePrompt()`
  con los 7 templates. `getCareMessage(type, places, ctx)` nueva, expuesta
  en la API pública.
- **`care.js`**: reescritura de `triggerSuggestion()` — ahora async,
  ramifica por `TRIGGER_META` entre Overpass (hot/cold/lunch/tired/rain),
  POIs de zona ya cargados (special), o ningún candidato (thirst).
  `findNearbyRestPlace()` a 5 candidatos (antes 3), callback recibe el
  array completo en vez de quedarse con el primero sin criterio.
  `matchChosenPlace()` nuevo — identifica que candidato mencionó Claude
  por nombre exacto en la respuesta, para saber donde centrar el mapa.
  `showCareCard()` acepta texto generado opcional; si `Narration.getCareMessage()`
  falla o `AppState.offline`, cae sola al fallback estático de `MESSAGES`
  (ahora con entradas nuevas para `rain` y `thirst` también).
- **`weather.js`**: eliminado el sistema paralelo completo —
  `showRainAlert()`, `findNearbyRefuge()`, `showRefugeSuggestion()`,
  `dismissAlert()`, `_alertShown`. `check()` pasa a solo actualizar
  `AppState.weather`, sin decidir nada de UI — esa decisión es de Care
  ahora, con el mismo cooldown de 20 min que el resto de los triggers.
- **`debug-sim.js`**: 5 botones de test pasan a 7 — se suman `🌧️ Lluvia`
  y `💧 Sed`.

Instrumentación de latencia incluida desde el primer commit:
`generateAndShowCard()` en `care.js` usa `Debug.metricStart('care', ...)`
por tipo de trigger — sale directo en el `.txt` exportado desde Logs, sin
necesidad de tocar nada más.

### Deuda generada, sin cerrar en esta sesión

- **`Care.resetWalk()` sin cablear en `app.js`.** La función existe y
  resetea `_thirstShownThisWalk`, pero nadie la llama todavía. Hasta que
  no se conecte donde se resetea `AppState._walkChapters` (DA-54), el
  trigger `thirst` va a mostrarse una sola vez en toda la vida de la
  sesión del navegador, no una vez por caminata como fue diseñado.
- **`'alert'` sigue en la lista de fases válidas** de `setPhase()` en
  `app.js`, aunque ya no se usa en ningún lado — código muerto, no rompe
  nada, pendiente de limpieza cosmética.

### Bug encontrado en campo — botón de bici no visible (Firefox y Chrome)

Al agregar el preset `🚲 Bici 14km/h` a la fila de velocidad del simulador
(quinto botón en una fila que antes tenía 3), el botón no aparecía en
ningún navegador. Causa: `.dbg-poi-btn-row { display: flex; gap: 6px; }`
sin `flex-wrap` — por default eso es `nowrap`, así que los 5 botones
intentaban entrar en una sola línea en el panel angosto (pensado para
mobile), recortando o empujando el último fuera del área visible. Mismo
bug en cualquier navegador porque es el mismo CSS — no era cache.

Fix: `flex-wrap: wrap` agregado a `.dbg-poi-btn-row`. Sin `flex: 1` ni
ancho fijo en `.dbg-poi-action`, el wrap acomoda limpio sin deformar
ningún botón existente en ninguna otra fila del panel.

### `sw.js` v5 → v8

- v6: DT-42 (narration.js, care.js, weather.js, debug-sim.js)
- v7: preset de bici en debug-sim.js
- v8: fix de flex-wrap en debug.js

---

### Deuda técnica — actualización final de sesión

| ID | Estado |
|----|--------|
| DA-55 | ✅ Resuelta |
| DA-57 | ✅ Resuelta — Care generativo implementado, ver DA-64/DA-65 para el detalle ampliado a 7 triggers |
| DT-42 | ✅ Resuelta — implementado de punta a punta, ver arriba |
| Nueva | 🔲 Cablear `Care.resetWalk()` en `app.js`, donde se resetea `_walkChapters` |
| Nueva | 🔲 Limpiar `'alert'` de la lista de fases válidas en `setPhase()` (`app.js`) — código muerto |

---

### Próxima sesión

1. Cablear `Care.resetWalk()` en `app.js` — bloqueante para que `thirst`
   funcione como fue diseñado (una vez por caminata, no una vez por sesión
   de navegador)
2. Validar en campo real los 7 triggers — especial atención a `rain`
   (primera vez que pasa por voz generativa) y `thirst` (primera vez que
   se prueba el patrón de "una sola vez por caminata")
3. Con datos de latencia ya exportables por tipo de trigger: decidir si
   `max_tokens: 120` de Care es suficiente o necesita ajuste
4. Prueba de campo en Cali — sigue pendiente: DT-44, DT-32, DT-29/30
5. Limpieza cosmética: quitar `'alert'` de `setPhase()`

---

*Follower — Bitácora v0.9 | Sesión 19 | 1 Julio 2026*

---

## Continuación Sesión 19 (cierre) — Fixes de `app.js` y definición de DT-45

### Bug reportado en campo — mensaje de bienvenida congelado

Captura real: "Tu ciudad te espera." pegado al borde izquierdo de la
pantalla, sin desaparecer nunca, con un ícono ✨ desconocido al lado.
Diagnóstico en dos partes:

- El ícono ✨ es **Writing Tools nativo de iOS** (aparece al seleccionar
  texto en Safari) — no es un bug de Follower, no requirió ninguna acción.
- El texto congelado sí era un bug real, y la causa no era la que se
  sospechaba en un principio (posicionamiento CSS) — era un
  **`ReferenceError` silencioso** en `welcomeCity()` (`app.js`):
  `Debug.log('info', \`Bienvenida ciudad: "${text}" · narrador=${style}\`)`
  referenciaba una variable `style` que ya no existe desde DA-50
  (narrador único). El error se disparaba **después** de mostrar el texto
  pero **antes** de programar el `setTimeout` de auto-cierre a 5s y el
  listener de tap-to-dismiss — ambos quedaban sin ejecutarse nunca. El
  mensaje quedaba visualmente en pantalla para siempre porque el código
  que lo hubiera cerrado nunca llegaba a correr.

### Deuda adicional encontrada — memoria de capítulo sin resetear

Al revisar `initExplore()` para cablear `Care.resetWalk()` (pendiente
desde la implementación de DT-42), se encontró que **`AppState._walkChapters`
nunca se reseteaba en ningún lado** — ni ahí ni en `Debug.startTestSession()`.
Crecía sin límite mientras la pestaña del navegador siguiera abierta entre
caminatas distintas, con el riesgo de que la memoria de capítulo (DA-58)
inyectara contexto de una caminata de días atrás como si fuera el capítulo
inmediatamente anterior.

### Los 4 fixes — todos en `app.js`, primera vez que se tocó en la sesión

1. Eliminada la referencia a `style` en `welcomeCity()` — causa raíz del
   bug de la captura
2. `AppState._walkChapters = []` agregado a `initExplore()`
3. `Care.resetWalk()` cableado en el mismo lugar — pendiente desde DA-63
4. `'alert'` eliminado de las fases válidas de `setPhase()` — código
   muerto desde la migración de lluvia a Care (DA-65)

`sw.js` v9 → v10.

### Comparación de UI — capturas de Citymapper (derivó a documento aparte)

Sesión de comparación de patrones de interfaz (no funcionalidades — se
aclaró explícitamente que Follower no incorpora transporte público) contra
capturas reales de Citymapper. Ideas capturadas para DT-47 (wizard de
configuración, sin diseñar): pantalla de "priming" antes del permiso nativo
del sistema, jerarquía tipográfica de datos resaltados (distancia/tiempo)
en cards. Se extrajo a un documento separado (`docs/deuda_tecnica_interfaz.md`)
para continuar en otro chat sin mezclar con los fixes operativos de esta
sesión.

### Deuda que sigue abierta al cierre de Sesión 19

| ID | Estado |
|----|--------|
| DA-66 validación con llamadas reales | Pendiente — el laboratorio fue manual, no probó contra el Worker real |
| DT-9 | Pendiente — revocar key OpenAI |
| DT-29/30/32 | Pendiente — validación de campo |
| DT-44 | Pendiente — más relevante ahora que el prompt creció con DA-66 |
| DT-45 | Diseño cerrado (`docs/dt45_bienvenida_animada.md`), código pendiente a propósito |
| DT-47 | Sin diseñar — notas de referencia en `docs/deuda_tecnica_interfaz.md` |

---

*Follower — Bitácora v0.9 | Sesión 19 (cierre) | 1 Julio 2026*

---

## Continuación Sesión 19 (cierre real) — Arqueología de git: la regresión de `poi.js`

### Cómo se encontró

Se compartió un log real de campo (exportado desde el debug panel del
iPhone) mostrando **cero éxitos de Overpass en ~20 horas de uso**, en 3
sesiones distintas. El log también reveló algo que no se esperaba: **nunca
aparece un solo intento de Wikipedia GeoSearch** — solo `[poi] Overpass
fetch`, siempre con error.

Se confirmó con `poi.js` real que, en efecto, no existe ningún código de
Wikipedia GeoSearch — contradiciendo `README.md`, `producto.md`,
`arquitectura.md` y `REGLAS_IA.md`, los cuatro afirmando que es la fuente
primaria.

### El fix inmediato — query Overpass rota

Causa del 100% de fallos: un comentario (`// artwork excluido...`) quedó
metido dentro de un filtro Overpass QL sin cerrar la comilla ni el
corchete antes de él — sintaxis inválida, el servidor devolvía HTTP 400
con una página de error HTML. Bug introducido en el commit `ba52f5e` de
Sesión 18 ("remove artwork from POI query"), vigente desde el 30 de junio
hasta hoy. **Fix aplicado y subido** — ver `js/poi.js`.

### La investigación más grande — ¿Wikipedia se perdió o nunca existió?

Usando `git log -S "wikipedia" --oneline -- js/poi.js` se reconstruyó la
línea de tiempo completa: Wikipedia GeoSearch se implementó el 26 de
junio (`a31ab95`), se mejoró dos veces más ese mismo día (BUG-041, DA-49
idioma local), y seguía funcionando el 27 de junio (`6de7186`, que incluso
la usa activamente). Descartando candidatos uno por uno con `git show`,
se confirmó que el commit `9a6ac50` (DA-50, narrador único, 30 de junio)
revirtió `poi.js` a un estado anterior al 26 de junio — perdiendo Wikipedia
y 6 features más que nada tenían que ver con el narrador. Detalle completo
en `arquitectura.md`, DA-68.

### Por qué importa más allá del bug puntual

Es la prueba más contundente de toda la sesión de por qué existe la Regla
de Oro. No es un bug de código — es el resultado directo de trabajar sobre
un archivo desactualizado sin confirmarlo primero, exactamente lo que la
regla pide preguntar siempre antes de tocar cualquier archivo. La ironía:
pasó en la sesión de mayor volumen de cambios (DA-50, "7 archivos
afectados"), donde más falta hacía.

### Decisión de cierre

No se restauran las 6 features perdidas en esta sesión — alcance
demasiado grande, cada una necesita evaluarse contra el `poi.js` actual
en vez de pegarse a ciegas. Plan de restauración documentado en
`docs/restauracion_poi_js.md`. Ejecución: **chat nuevo**, dedicado.

---

*Follower — Bitácora v0.9 | Sesión 19 (cierre real) | 1 Julio 2026*

## Sesión 20 — Restauración de `poi.js`: las 6 features vuelven a casa

*2 de Julio 2026*

### Verificación de freshness — la Regla de Oro se paga sola otra vez

Antes de tocar una línea, se verificó la copia de `poi.js` contra el repo
real. Resultado: la copia montada en el chat estaba **desactualizada** —
todavía contenía la query Overpass rota (BUG-045), mientras el panel del
proyecto y GitHub ya tenían el fix. De haber trabajado sobre ella, se
habría reintroducido el bug de las 20 horas de campo en la misma sesión
destinada a reparar sus consecuencias.

De ahí salió una aclaración operativa importante: los archivos del panel
del proyecto son la fuente de verdad, pero cada chat recibe una
**fotografía estática** tomada al iniciar. Protocolo de cierre de sesión
formalizado: **commit → actualizar panel → actualizar instrucciones →
chat nuevo**, en ese orden. La verificación contra GitHub queda como
árbitro cuando haya sospecha de desfase.

### Método: arqueología, no memoria

Las features no se reescribieron — se **trasplantaron del commit
`6de7186`** (27 de junio, la última versión que las contenía), clonando el
repo con historial completo. Código ya probado en campo, adaptado solo
donde el archivo actual cambió después.

### Lo restaurado (commit en `js/poi.js`, sw.js → v12)

1. **Pieza 2 — BUG-044:** `_visitedInSession` + `markVisited()` +
   `resetVisited()`. Loop de restauración de `visited` en las 3 rutas de
   carga (Wikipedia, Overpass, cache). Los llamadores con guards en
   `narration.js`, `debug.js` y `app.js` se reactivaron solos.
2. **Pieza 3 — BUG-014:** candado `_isFetchingPOIs` con liberación en
   `finally`. Verificado sin colisión con DT-38: el flush del detect
   pendiente vive en la ruta ganadora, no en la rechazada. Nota de campo:
   cuando el candado rechaza una llamada, `loadPOIs` loguea el warning de
   "0 POIs normalizados" — engañoso pero inofensivo (junio igual).
3. **Pieza 7 — filtro geográfico del cache:** `CACHE_RADIUS_M` =
   `FETCH_RADIUS_KM × 1.5`. Previene POIs de otra ciudad. Se restauró
   también `_lastFetchPos` en la ruta de cache (comportamiento de junio).
4. **Pieza 5 — mirrors Overpass:** kumi.systems → overpass-api.de → lz4,
   timeout 20s por mirror con `AbortController`, header `Content-Type`
   restaurado (fix `93bb9aa` también perdido). `lz4` — el que falló 20
   horas — pasa de único endpoint a última opción. Cadena completa de
   fallbacks: kumi → overpass-api.de → lz4 → IndexedDB.
5. **Pieza 4 — cola narrativa S2-A2:** `QUEUE_MAX_SIZE=3`,
   `QUEUE_TTL_MS=4min`, `enqueuePOI()` con dedup y respeto de `visited`,
   `processQueue()` con expiración y verificación de proximidad
   (descarta si el usuario se alejó a más de radio×1.5).
6. **Pieza 1 — Wikipedia GeoSearch como fuente primaria:** pipeline
   restaurado Wikipedia → Overpass → IndexedDB, timeout 8s por idioma,
   corte a ≥10 POIs, dedup por coordenadas, schema compatible verificado
   (tags vacíos tolerados por QuickFacts; `cleanPOIName` de DT-36 es
   ideal para títulos de Wikipedia). Incluye el guard **BUG-041**: si
   Wikipedia ya cargó, Overpass no se dispara.

### Decisiones de diseño de la sesión

- **Care y la cola narrativa son independientes a propósito** — resuelto
  con el manifiesto de Care, no con opinión técnica: "el Care nunca debe
  romper un momento importante" (ya cumplido vía guard de diástole en
  `care.js:145,476`) y "la hospitalidad tiene sentido del tiempo" — un
  mensaje de lluvia encolado 4 minutos es lo contrario de hospitalidad.
  Los capítulos son historias y las historias esperan; el Care son
  momentos, y los momentos no se almacenan. Cero cambios en `care.js`.
- **Idioma de Wikipedia vía DT-41, no tabla lat/lng duplicada** —
  aplicación directa del principio de no segundo sistema. La tabla de
  junio (8 rangos) ya había divergido una vez (parche `d392478` para
  Portugal/Brasil, caso que DT-41 cubría). Degradación a `[es, en]` si
  `countryCode` aún no llegó del reverse geocoding.
- **Radio de la cola vía `GPS.getRadiusConfig().poiRadius`** (fallback
  120) en vez del hardcode de junio — si `POI_RADIUS_METERS` cambia tras
  campo, la cola se ajusta sola.
- **`artwork` NO restaurado en `PRIORITY`** — respeta el fix editorial
  de Sesión 18.
- **Pieza 6 (`nwr`) diferida → DT-48** — ver arquitectura.

### Pendiente de validación en campo

- Hipótesis TTF: Wikipedia debería bajar el time-to-first-narration de
  ~358s a <90s. Nunca se midió — el código desapareció antes.
- Comportamiento del guard BUG-041 al cambiar de zona: tras moverse
  fuera de cobertura Wikipedia, el guard conserva los POIs previos en
  vez de consultar Overpass. Comportamiento fiel a junio — observar en
  paseos reales.

---

## Sesión 21 — El narrador que inventó un taller: la fuente de POIs era el problema

### La evidencia de campo

Sesión de campo en Cali (real) + teletransporte a Pasto (simulador). Nueve
capítulos de Cali y dos de Pasto, más export completo de debug. Tres clases
de fallo, de gravedad creciente:

1. **Capítulos pre-DA-66 servidos desde cache**: Palacio de San Francisco y
   Catedral llegaron con título inventado, personificación acumulada y la
   negación de la fe — exactamente los vicios que DA-66 corrigió. La clave
   del cache de narraciones (`poiId_lang_topic`) no incluye versión del
   prompt: los capítulos generados antes del fix se sirven para siempre.
   → **DT-50**.

2. **Alucinación factual en Pasto**: Haiku recibió como POI "Pasto, Colombia"
   (el artículo de la propia ciudad) e inventó un taller de barniz, un origen
   español para una técnica precolombina y una etimología invertida. En la
   catedral: orden religiosa equivocada, fechas fabricadas. Datos con forma
   de verdad, inventados con total confianza.

3. **Solo 3-5 POIs en Pasto, con títulos en inglés** ("St. Ezequiel Moreno
   Cathedral, Pasto") pese a que es.wikipedia tiene las iglesias de Pasto
   documentadas en español.

### Causa raíz: el loop de idiomas sobrescribía en vez de acumular

En `fetchWikipediaPOIs()`, el loop [local → es → en] hacía
`places = data.query.geosearch` en cada vuelta — *reemplazaba*, no sumaba —
y solo cortaba si un idioma devolvía ≥10. En ciudades medianas: es.wikipedia
devolvía <10 → el loop seguía → en.wikipedia devolvía aún menos → y esos (los
peores) eran los que quedaban. Los resultados en español se descartaban
enteros. La deduplicación por coordenadas que sigue al loop estaba pensada
para *fusionar* idiomas — su comentario lo declara — pero nunca recibía más
de un idioma: código que hacía lo contrario de lo que su comentario dice.

Segundo agujero: GeoSearch devuelve *cualquier* artículo geoetiquetado. En
esta sesión llegaron como POI la propia ciudad (type=city), la Provincia de
Buenaventura (type=adm2nd) y el evento Solar Decathlon (type=event). El
narrador no puede narrar dignamente lo que no es un lugar.

Tercer agujero: el cache IndexedDB acumulaba 359 POIs sin fecha ni criterio
de origen (queries viejas, bancos incluidos), sirviéndose como fallback para
siempre. En esta sesión Overpass falló 16 de 16 veces y toda la experiencia
dependió de ese cache heredado.

### Lo corregido (commit `71462d9` en js/poi.js + `1fef001` sw.js → v13)

Nota de arqueología: `71462d9` contiene los TRES cambios siguientes aunque
su mensaje solo describe la purga versionada — se optó por commit único
sobre `poi.js` y el mensaje quedó corto. Esta entrada es la corrección
documental (lección DA-50: el commit debe decir todo lo que hace).

- **Fusión acumulativa de idiomas** (DA-69): local y es acumulan con
  `places.push(...)`, nada pisa lo anterior. en.wikipedia degradada a
  emergencia: solo entra si el acumulado es < 3 (`EMERGENCY_MIN`), y sus
  POIs se marcan `_lang: 'en'` como insumo para el grounding futuro. Si el
  idioma local ES inglés, en.wikipedia es primaria por derecho propio.
- **Filtro editorial `gsprop=type`** (DA-70): blacklist de tipos no-lugar
  (`city`, `adm1st/2nd/3rd`, `country`, `continent`, `event`, `satellite`);
  `type: null` pasa (la mayoría de iglesias/teatros/plazas no tienen tipo).
  Cinturón adicional: descarte de títulos que coincidan con `AppState.city`.
  Agujero residual asumido: basura *sin tipo* se cuela — lo cierra el
  grounding con extracts (DT-51), no este filtro.
- **Purga versionada del cache de POIs** (DA-71): constante
  `POI_CACHE_VERSION` comparada contra localStorage al arrancar; si difiere,
  se purga `STORE_POIS` completo. Estrena v1, purgando los 359 heredados.

### Hallazgos registrados pero NO tratados (una variable a la vez)

- **Overpass 16/16 fallos** (`httpStatus=400` y `Load failed`) durante toda
  la sesión, más un 400 del Worker en health check de arranque. Posible
  recaída de BUG-045 o regresión del trasplante — triaje pendiente, sesión
  dedicada.
- **BUG-046 — POIs re-disparan en bucle si la voz se cancela**: `markVisited`
  solo se ejecuta al *completar* la narración. Palacio de San Francisco se
  narró 3 veces en 4 minutos (23:00, 23:02, 23:03), las últimas dos con
  `error=canceled`. Fix candidato de una línea: marcar visited al *iniciar*.
- **BUG-047 — Truncamiento a media palabra**: el capítulo de La Merced
  (1216 chars) cortó en "antes de que algu". El Prompt Maestro pide un rango
  de palabras que `max_tokens: 380` no siempre cubre en español. El objetivo
  del prompt y el techo duro se contradicen — decisión de producto pendiente.
- **Dedup por cuadrícula de ~111m se come vecinos legítimos** → DT-49
  (evidencia: smoke test donde una plaza a 50m del templo colisionó en la
  misma celda y desapareció).
- **Voz narrativa** (evidencia para futura sesión de prompt, sin DT): cierre
  formulaico repetido ("Eso dice/cuenta/revela algo sobre Cali"), repetición
  de idea central a distancia n-2 (la memoria DA-52 solo compara contra n-1),
  dimensión humana genérica ("los caleños") y personificación residual pese
  al EVITA.

### Validación de campo pendiente para este deploy

- Teletransporte a Pasto: esperar >5 POIs con títulos en español, sin
  "Pasto, Colombia" ni "Provincia de Buenaventura" en la lista.
- Log `POI: cache purgado — criterio v0 → v1` en el primer arranque.
- Log `Wikipedia: N artículos no-lugar descartados (filtro editorial)`.
- Sigue pendiente de Sesión 20: hipótesis TTF (<90s).

### Anexo — Validación de campo del deploy v13 (ejecutada en Sesión 22)

**Resultados de los cuatro criterios:**

- ✅ **Purga versionada** (DA-71): log `criterio v0 → v1` presente; cache 359 → 77 POIs.
- ✅ **Filtro editorial** (DA-70): log `1 artículos no-lugar descartados` — el artículo "Pasto" murió antes de llegar al narrador. La alucinación tipo Pasto de Sesión 21 ya no puede reproducirse por esa vía.
- ✅ **Fusión de idiomas** (DA-69): títulos en español en el centro de Pasto. Emergencia en.wikipedia probada en zona rural con 0 POIs primarios: dispara correctamente.
- ✅ **Overpass respondió 200 en desktop.** Los 16/16 fallos de Sesión 21 quedan como anomalía específica del iPhone — el triaje sigue pendiente y ahora tiene una variable acotada: no es la query.

**Hallazgo estructural (motiva DT-52):** solo 3 POIs netos en el centro de Pasto. No es bug — es.wikipedia solo tiene 4 artículos geoetiquetados en un radio de 2km. La cascada actual (Wikipedia primaria → Overpass *solo si 0*) nunca consulta Overpass porque 3 > 0.

**Evidencia decisiva** (export overpass-turbo con la query del proyecto sobre el mismo centro): Overpass tiene ~26 elementos con nombre ahí — Museo Taminango, Pinacoteca Departamental, Teatro Imperial, Museo del Carnaval, la placa de Hernando de Ahumada (1565). Además, la Catedral y San Juan Bautista **no aparecen ni en Overpass**: son `ways` con `amenity=place_of_worship` y la query solo pide `node` para esa tag. DT-48 se reclasifica: de optimización de sintaxis a **problema de cobertura**.

**Contra-evidencia de curaduría:** el mismo export trae Cinemark (cadena comercial), salones del Reino, iglesias de barrio sin relevancia narrativa y racimos de memoriales sin nombre (6 nodos anónimos en ~15m). Overpass como complemento exige filtro editorial propio y dedup fina (DT-49).

**Consecuencia:** se abre **DT-52 — Fuente compuesta de POIs**: Wikipedia primaria + Overpass complementario cuando el neto sea insuficiente, con curaduría por tiers. Absorbe DT-48 y conecta con DT-51 (grounding diferenciado: POI con artículo narra con hechos; POI solo-OSM narra lo observable sin inventar fechas).

---

# Sesión 22 — Fuente compuesta de POIs (DT-52) — 4 Julio 2026

## Qué se hizo

Definición punto por punto e implementación completa de **DT-52 — fuente
compuesta de POIs**: Wikipedia primaria + Overpass complementario curado,
con dedup fina (DT-49) y query `nwr` (DT-48) absorbidas. Siete commits,
dos deploys, validación de campo en iPhone. **DT-48 y DT-49 quedan
CERRADAS.**

### Definición cerrada (5 puntos, protocolo punto por punto)

1. **Umbral:** `COMPOSITE_THRESHOLD = 8`, absoluto, evaluado sobre el neto
   post-filtros (DA-69/70). Overpass **condicional**: si Wikipedia ≥ 8, no
   se consulta — cero latencia donde no hay hambre. Regla relativa por
   densidad descartada: exigiría datos que no tenemos y rompería la
   predictibilidad del diagnóstico de campo.
2. **Curaduría del ramal OSM** (`classifyOSMElement`): compuerta 0 (sin
   `name`, descarte — mata memoriales anónimos y ~40 parques sin nombre),
   blacklist de `brand`/`brand:wikidata` (Cinemark), `cinema` fuera de la
   query, worship por denominación {jehovahs_witness, pentecostal, mormon}
   y palabras clave en nombre {salón del reino, pentecostal, ministerial,
   testigos, gnosis}. Comparaciones case-insensitive y sin tildes.
   **Tier 1** (entra siempre): museum/gallery/viewpoint/attraction, theatre,
   monument, memorial con nombre (la placa de Hernando de Ahumada, 1565, es
   oro narrativo), wikidata/heritage, y — tras dos correcciones de campo —
   **worship supervivientes completos**. **Tier 2** (solo si neto < 8 tras
   Tier 1): parks, gardens, fountains.
3. **Dedup fina (DT-49):** clave = título normalizado sin prefijos de
   *tipología* (estatua, monumento, busto, memorial + enmienda Fátima:
   parroquia, templo, capilla, iglesia, santuario — jamás sustantivos con
   identidad como Museo o Catedral) + distancia < 25m intra-OSM.
   Superviviente por `wikidata`, luego por cantidad de tags; hereda el mejor
   `_tier`; el perdedor lega `inscription` y `wikidata`
   (`_transferUsefulTags`). Fusión inter-fuente: **wiki gana SIEMPRE**,
   umbral 60m (geotag de Wikipedia menos preciso que un center de OSM).
   Evidencia que forzó la enmienda: "Estatua/Monumento Corazón de Jesús" a
   20cm; "Parroquia/Templo Nuestra Señora de Fátima" a 10m.
4. **Contrato con DT-51:** todo POI lleva `_source: 'wiki'|'osm'`; los OSM
   además `_osmType`. 'wiki' garantiza artículo → grounding con hechos;
   'osm' garantiza que no hay artículo → narrar lo observable. `inscription`
   viaja como hecho verificable (texto grabado en piedra). Los POIs OSM
   **narran desde ya** con el prompt actual — riesgo de alucinación
   documentado y aceptado hasta DT-51, como el agujero residual de DA-70.
5. **Cascada Opción A:** wiki local+es → si neto < 8 → Overpass curado →
   si neto < 3 → **en.wikipedia** (emergencia reposicionada al final; salió
   de `fetchWikipediaPOIs` como modo `emergencyOnly`) → IndexedDB. Dedup de
   emergencia solo por coordenada <60m (nombres cross-idioma no comparan);
   el existente gana — nombre local sobre inglés.

### Decisiones de implementación ratificadas

- **Guard BUG-041 eliminado**: su intención ("no disparar Overpass si
  Wikipedia ya cargó") la hereda el umbral con mejor criterio, y en refetch
  por movimiento devolvía el set del área anterior directo a la fusión
  (mezcla de áreas). El candado BUG-014 se conserva, pero su rama paralela
  devuelve `[]` en vez de `_pois` — mismo motivo.
- **Principio nuevo (→ DA-73): curar antes de exponer.** Curaduría y dedup
  corren ANTES de que los POIs entren al store que alimenta `getPOIs()`:
  una sola compuerta protege narrador y Care simultáneamente. Sin ella, el
  racimo de 6 memoriales anónimos habría fabricado una zona especial falsa.
- care.js NO se tocó. `SPECIAL_ZONE_MIN: 3` queda en observación: con
  densidad compuesta, la zona especial podría sobre-disparar en centros
  históricos (comportamiento probablemente correcto — Pasto ES especial).

### Commits

Serie 1 (deploy sw v14): `b90a270` DT-48 query nwr + cinema fuera +
`POI_CACHE_VERSION` v1→v2 · `8f3e979` curaduría editorial · `9f7a93c`
dedup + fusión · `a337739` cascada compuesta · `72b2747` sw.js v14.
Serie 2 (deploy sw v15): promoción worship a Tier 1 + `POI_CACHE_VERSION`
v2→v3 · sw.js v15 (+ commit vacío por fallo transitorio del paso deploy
de GitHub Pages, run #133 — build verde, deploy rojo, patrón conocido).

### Dos correcciones por evidencia de campo (el diseño cedió dos veces)

1. **Catedrales en Tier 2**: la prueba unitaria contra el export reveló que
   la Catedral de Pasto y la Concatedral nunca narrarían (worship = Tier 2,
   y Tier 1 sacia el umbral). Promoción por `building=cathedral|basilica` o
   nombre/second_name normalizado.
2. **Worship completo en Tier 2**: la primera validación iPhone mostró
   `20 netos (Tier 1: 17, Tier 2 no necesario)` — Lourdes, San Felipe Neri
   y Santiago Apóstol fuera. El defecto: el hambre se medía globalmente,
   no por categoría, y Pasto es una ciudad de templos. La blacklist YA es
   el filtro editorial: lo que la sobrevive es arquitectura con historia.
   Worship supervivientes → Tier 1 (absorbe la corrección 1). Tier 2 queda
   como relleno genuino: parks/gardens/fountains.

### Hallazgos registrados

- **Misterio Overpass iPhone, hipótesis fuerte:** los 16/16 fallos
  históricos son `httpStatus=400` y `Load failed` de sesiones PRE-deploy
  (query vieja). Post-deploy: **2/2 OK en el mismo iPhone** (~32s vía
  overpass-api.de tras abort de kumi). El triaje cambia de "misterio
  iPhone" a "la query vieja devolvía 400 en Safari iOS" — pendiente
  confirmación en caminata real antes de cerrar.
- **Artefacto de simulador (conocido, no bug):** teletransportes en ráfaga
  disparan cascadas paralelas; el candado devuelve `[]` a las paralelas y
  alguna cae hasta la emergencia en.wikipedia en pleno centro de Pasto.
  En caminata real no ocurre — los refetch los limita `REFETCH_KM`.

### Validación de campo ejecutada (iPhone, deploy v15)

Purga `v2 → v3` ✓ · Pasto centro con fuente compuesta incluyendo templos
coloniales ✓ · curaduría viva (158 crudos → 85 curados → 81 únicos) ✓ ·
Corazón de Jesús único ✓ · emergencia re-validada en el orden nuevo ✓ ·
ciudad densa sin consulta a Overpass ✓.

### Pendientes que salen de esta sesión

- DT-51 es la siguiente sesión natural: el contrato `_source` ya está
  servido. Junto con DT-50 (mismo patrón DA-71 en narraciones) y DT-44
  (medir latencia antes de tocar narration.js).
- Confirmación en caminata real de la hipótesis Overpass-iPhone.
- Observación de `SPECIAL_ZONE_MIN` con densidad compuesta.
- BUG-046, BUG-047, DT-9 siguen abiertos, sin cambios.

---

# SESIÓN 23 — Prompt Maestro v3.0 + DT-50 (cache de narraciones versionado)

**Fecha:** 5 Julio 2026

**Objetivo:** corregir la narración — revisar manifiesto y prompt actuales
vs las versiones v3.0 propuestas.

### Hallazgo previo (Regla de Oro)

`docs/prompt_maestro_follower.md` del panel estaba desactualizado (copia
pre-S18b: 220–280 palabras, apertura sensorial). La base real de
comparación fue el v2.7 embebido en `narration.js` (130–160 palabras,
apertura con dato verificable).

### Método

Decisión punto por punto con ejemplos generados para cada alternativa
(Templo de San Juan Bautista e Iglesia de Cristo Rey de Pasto como POIs
de referencia — el terreno de pruebas real). Seis decisiones cerradas
antes de tocar código:

1. v3.0 como base (voz más ágil: identificación + pregunta natural + puente)
2. Bloque de cinco correcciones de campo reincorporado — el ejemplo
   contrastado de Cristo Rey mostró los cinco fallos documentados
   reapareciendo juntos sin ellas
3. Verificación final mínima de 5 preguntas (opción c) — incluye la
   pregunta de fe por decisión explícita: el terreno de pruebas es Pasto,
   ciudad de templos
4. Regla de fusión fuera — el puente narrativo es el único cierre
5. Longitud 90–130/150 · `MAX_TOKENS: 380` intacto · BUG-047 cerrada
6. DT-50 como co-requisito (excepción legítima a "una variable a la vez":
   desplegar prompt nuevo sin cache versionado ES el bug que DT-50 previene)

Ver DA-74 para el detalle completo.

### Implementado

- `narration.js`: SYSTEM_PROMPT es+en → v3.0 · `PROMPT_VERSION: 'v3.0'`
  en CONFIG · clave de cache versionada `${PROMPT_VERSION}_${poiId}_${lang}_${topic}`
  (DT-50) · comentarios actualizados · sintaxis verificada con node --check
- `sw.js` → v16 (commit final aparte)
- `docs/prompt_maestro_follower.md` → v3.0 oficial con cabecera de
  trazabilidad y regla espejo de DA-71
- `docs/manifiesto_narrativo.md` → v3.0 fusionado (Opción B: estructura
  nueva + Los Silencios, Memoria Narrativa, El Lenguaje y Care
  conservados — esos principios de producto no tienen otro hogar documental)

### Cerradas / reformuladas

- **DT-50 CERRADA** — implementada, sin purga de entradas v2.7 (huérfanas
  en IndexedDB, volumen despreciable)
- **BUG-047 CERRADA por diseño** — causa raíz: objetivo 130–160 palabras
  vs techo 380 tokens; con 90–130 el conflicto desaparece
- **DT-44 reformulada** — medir latencia del checklist mínimo (5
  preguntas), prioridad baja

### Nueva

- **DT-53** — `getFarewell()` documentada en "Funciones únicas" pero
  inexistente en el código; nadie la invoca; la despedida de caminata no
  tiene implementación. Verificar historial git para descartar regresión
  tipo DA-68.

### Pendiente de campo (dos variables — diagnósticos separados)

1. Validar la voz v3.0 en caminata real: ¿los capítulos "cierran" sin la
   regla de fusión? ¿la identificación suena a compañero o a guía?
2. Hipótesis Overpass-iPhone (2/2 OK post-deploy) — aún sin confirmar

PRECAUCIÓN: pueden observarse en la misma caminata, pero si algo falla,
exportar logs y separar diagnósticos.

### Commits de la sesión

1. `narration.js` — Prompt Maestro v3.0 + DT-50 cache versionado
2. `docs/` — prompt_maestro v3.0, manifiesto v3.0, arquitectura (DA-74,
   DT-50, DT-44, BUG-047, DT-53), bitacora S23, instrucciones
3. `sw.js` v16 — standalone, último

## Sesión 24 — 7 Julio 2026 — Diseño del flujo de entrada: el wizard, el title card y el nombre

**Tipo de sesión: diseño puro. Cero código tocado.**

La sesión arrancó para revisar la deuda de interfaz y terminó cerrando el
diseño completo del flujo de entrada, dos deudas técnicas de fondo
resueltas en papel y un usuario nuevo descubierto.

### DT-47 — Wizard de entrada: DISEÑO CERRADO

Reencuadre clave: no es un wizard de preferencias (Follower casi no tiene
qué configurar tras DA-50) — es una **coreografía de los desbloqueos de
iOS** que hoy se disparan sin contexto. Solo primera vez.

Flujo: splash → wizard (primera vez) → title card + bienvenida hablada → explore

Orden resuelto por dependencias (cada paso alimenta al siguiente):

1. **Priming GPS** (patrón Citymapper): pantalla propia antes del prompt
   nativo. GPS obligatorio → sin botón "ahora no", solo enlace explicativo.
2. **Idioma:** autodetectado de `navigator.language`, confirmación 1 tap.
   Va ANTES de la voz — la frase de muestra debe sonar en idioma confirmado.
3. **Nombre (DA-75):** opcional, "Prefiero no decirlo" sale limpio. Va
   ANTES de la voz — recompensa inmediata del dato en el paso 4.
4. **Desbloqueo de voz — cierre del wizard:** el corazón latiendo ES el
   botón. Tap = gesto confiable que desbloquea `speechSynthesis` (linaje
   BUG-036, listener `touchend`) + frase de muestra: "Hola, Jaime. Soy
   Follower. Tu ciudad tiene historias que contarte." (fallback sin
   nombre: "Hola. Soy Follower..."). Último paso a propósito: el
   desbloqueo queda fresco justo antes de la bienvenida hablada. Doble
   función: restricción técnica disfrazada de preview de la experiencia.

Mockup ratificado: `docs/dt47_wizard_mockup_final.html` (tokens reales de
main.css, animaciones de latido y fade incluidas).

### DT-45 — REDISEÑADA: title card (supera la definición de Sesión 19)

Evolución en la sesión: letra por letra → A/B/C tipográfico (DM Serif
regular vs itálica vs script mano pegada; la script se descartó porque
las ligaduras se cortan al revelarse y castiga baja visión) → itálica
ratificada con wordmark + slogan → decisión final que supera todo lo
anterior:

**La pantalla es un title card estático:** FOLLOWER + *your city
soundtrack* (DM Serif Display Itálica dorada) apareciendo de la nada —
fade puro, sin movimiento. **El saludo se muda 100% al canal de voz:**
`getCityWelcome()` dice "Bienvenido a Pasto, Jaime" en idioma local, con
nombre. Separación de canales de cine: la pantalla titula, la voz saluda.

Se retiran del diseño anterior: animación letra por letra, texto del
saludo en pantalla y su fallback, dependencia del reverse geocoding en la
pantalla (la carrera de 5s desaparece del UI). Simplificación resultante:
la pantalla no espera a nadie — implementación = CSS + timer + tap.
Timing propuesto (se fija en mano): fade-in ~1.8s → sostiene → sale al
entrar a explore, techo 4s, tap salta.

Enmienda registrada en `docs/dt45_bienvenida_animada.md`.

### DT-54 — NUEVA: wake lock + modo caminata

**Problema:** al bloquearse la pantalla, iOS suspende el JS de la PWA:
`watchPosition` deja de entregar, timers congelados, `speechSynthesis`
cortada. El apagado automático de pantalla rompe la experiencia completa.

**Solución ratificada:**
- `navigator.wakeLock.request('screen')` al iniciar caminata (Safari ≥ iOS 16.4)
- Re-adquirir en `visibilitychange` (el lock se libera al ocultar la app)
- **Modo caminata:** pantalla casi negra (negro OLED ≈ apagada en
  consumo), solo corazón + fase sístole/diástole. El teléfono va al
  bolsillo con la pantalla técnicamente encendida, visualmente dormida
- Bloqueo manual del usuario: suspensión aceptada, reanudación limpia.
  Nunca mostrar error

El modo caminata es momento de marca, no pantalla de utilidad.
Convergencia directa con la visión v2.0 de accesibilidad (audio-first).
Largo plazo: GPS en background real solo existe en nativo (Capacitor) —
decisión de v2.0, fuera de alcance.

### DT-55 — NUEVA: prefetch de narraciones cercanas

**Problema:** generar narraciones exige red en el momento del trigger;
la latencia del Worker se percibe en el peor momento (usuario ya frente
al POI) y una zona sin señal rompe la experiencia.

**Solución ratificada:** tras cargar POIs cercanos, pre-generar en
segundo plano las narraciones de los N más próximos. Reutiliza el cache
existente (`${PROMPT_VERSION}_${poiId}_${lang}_${topic}`) — cero
estructura nueva. Convierte "conexión permanente" en "conexión al inicio
+ ráfagas".

Abiertas: valor de N y criterio (proximidad vs proximidad+rumbo) · no
interferir con `trigger()` en curso · medir hit-rate vs costo Haiku.
**Sinergia con DT-44:** el prefetch elimina la latencia percibida — puede
volver innecesaria la medición en campo.

### DA-75 — Nombre del acompañado (ratificada)

Ver `docs/arquitectura.md`. Resumen: captura opcional en wizard,
localStorage, solo welcome/farewell, nunca capítulos ni Care, fallback
siempre funcional.

### Visión v2.0 — Follower accesible (registrada en producto.md)

Descubrimiento de la sesión: el linaje Soundscape (Microsoft Research,
open source tras descontinuarse; sucesores VoiceVista, Soundscape
Community, Soundscape STA — todos sobre OSM) validó la demanda de
exploración urbana por audio para personas ciegas. El vacío que señala
esa comunidad no es evitar obstáculos (bastón, perro) — es saber qué hay
alrededor y qué es interesante. Ese vacío es el territorio exacto de
Follower. Condiciones: nunca ayuda de movilidad · variante de prompt
"narrar lo perceptible" (depende DT-51) · conversar con usuarios reales
antes de codificar. Criterio vigente desde ya: no agregar dependencias
de pantalla.

### Pendiente que esta sesión NO tocó

- Las dos variables de campo (voz v3.0, Overpass-iPhone) siguen sin validar
- `Care.resetWalk()` sin cablear en `app.js` (anotado desde S19)
- DT-46 (cierre de caminata) sigue acoplada a DT-53 (getFarewell)

### Commits de la sesión

1. `docs/` — registro_sesion24_interfaz.md + dt47_wizard_mockup_final.html
   + arquitectura (DA-75) + bitacora S24 + producto (tabla DTs, sección 9
   enmendada, visión v2.0) + dt45_bienvenida_animada (enmienda)
2. Instrucciones del proyecto actualizadas (campo del panel)

Sin código, sin sw.js bump — ningún archivo servido cambió.

**Próxima sesión: implementación del flujo de entrada** (DT-45 + DT-47 +
DA-75). Commits quirúrgicos: 1) title card, 2) wizard + localStorage +
desbloqueo voz, 3) nombre en getCityWelcome, 4) sw.js v17 aparte.

---

## Sesión 25 — 7 Julio 2026 — Implementación del flujo de entrada

**Objetivo:** implementar los diseños ratificados en S24 (DT-45 + DT-47 + DA-75).

### Qué se hizo

El flujo de entrada completo pasó de diseño a producción: title card estático
(DT-45), wizard de 4 pasos (DT-47), nombre en localStorage inyectado en el
saludo (DA-75). Trabajo entregado como archivos completos y aplicado como
**commit integrado de código + sw.js v17 aparte + commit de docs** (los 4
commits quirúrgicos planificados se colapsaron porque app.js e index.html
cruzaban los cuatro; la granularidad queda documentada aquí).

**Flujo resultante:** splash (sin prompt GPS en 1ª vez) → wizard (GPS priming →
idioma autodetect → nombre opcional → corazón/voz `touchend`) → title card
(fade puro ~1.8s, tap salta y desbloquea, techo 4s) → explore → saludo de
ciudad hablado, con nombre e idioma local.

### Ratificaciones de sesión

- **DA-76 — Modo Libre por default, sin pantalla de modo.** El modal de modo
  sale del flujo de entrada: cuatro pasos de wizard + un quinto modal
  contradecía la pregunta rectora. Recorrido pasa a opt-in desde explore.
  `modal-mode` e `initModeModal()` quedan intactos sin llamador — DT-56
  registra el punto de entrada pendiente (sin ella Recorrido es inalcanzable).
- **DA-77 — Saludo pendiente con TTL + semántica de `_audioUnlocked`.**
  El saludo vive 100% en voz; si llega con la voz bloqueada queda pendiente
  y suena en el primer gesto (tap del title card desbloquea de paso); pasado
  el TTL (~90s, en mano) se descarta en silencio. Corrección asociada:
  `_audioUnlocked` es por carga de página, no por caminata — `initExplore()`
  ya no la resetea. `_unlockAudioOnFirstTap()` es la puerta única de
  desbloqueo (wizard, title card y explore convergen ahí).

### Cierres

- **DT-9 CERRADA** — key OpenAI revocada en console.openai.com (verificado:
  0 keys activas). Historial git inerte. Sin cambios de código. La única
  deuda con riesgo de seguridad activo: eliminada.
- **DT-45 CERRADA** (implementada) · **DT-47 CERRADA** (implementada) ·
  **DA-75 implementada** en welcome (farewell espera DT-53).

### Registradas

- **DT-56:** punto de entrada a Modo Recorrido desde explore (reciclar
  modal-mode como picker). Consecuencia asumida de DA-76.
- **DT-57:** i18n de la copy del wizard (hoy español estático salvo el título
  del paso 2, dinámico). Baja.
- **BUG-046 → micro-sesión propia ANTES de la caminata (opción B ratificada).**
  Razón: "marcar al iniciar" esconde una micro-decisión sin ratificar — si la
  narración falla de inmediato (red, Worker), el POI quedaría visitado sin
  narrarse nunca. Merece lectura de `trigger()` con cabeza fresca.

### Hallazgos de sesión

- `_audioUnlocked` se reseteaba en `initExplore()` — semántica latente rota
  que el flujo viejo toleraba y el nuevo no.
- El pill "+12" del modal viejo era un stub nunca implementado — muere con
  el modal.
- `poi.css` nunca estuvo en el precache de sw.js — corregido en v17.
- producto.md tenía entrada huérfana "Cablear `Care.resetWalk()`" (cableado
  en S19, verificado en `app.js`) — limpiada.

### Timing en mano (fijar en caminata)

Fade-in title card ~1.8s · techo 4s · TTL saludo 90s.

**Próximo:** micro-sesión BUG-046 → caminata de campo (3 observables con
diagnósticos separados: voz v3.0, Overpass-iPhone, flujo de entrada) →
DT-51 grounding.

### Addendum S25b — verificación en dispositivos

- Nivel A (Chrome escritorio): wizard OK tras `localStorage.clear()`.
- iPhone: el borrado de datos vía Ajustes → Safari no resucitó la primera
  vez. Se implementó **hook de campo `?reset=1`** (limpia localStorage al
  cargar y simula primera vez; no toca IndexedDB). Windows + iPhone sin Web
  Inspector = sin consola en el teléfono: esta es la vía práctica. Destino
  del hook: decidir junto con DT-8 antes de v1.0. sw.js **v18**.
- Detectado durante verificación: no existe acceso a configuración
  post-wizard (hueco preexistente, hoy significativo por DA-75) —
  **DT-58 propuesta**, pendiente de ratificación: hoja de ajustes en explore
  (idioma · nombre · volVoice huérfano de UI) como casa natural de DT-56.

### Addendum S25c — fusión de saludos + hallazgo de calidad de voz

**Fusión de saludos (ratificada — opción A):** la frase de muestra del
wizard ("Hola, [nombre]. Soy Follower...") y el saludo de ciudad
("[Ciudad]. Un capítulo te espera...") sonaban ambas en los primeros ~15s,
sentido redundante. Se fusionaron en un solo mensaje que suena **solo la
primera vez que efectivamente se pronuncia**: "Hola, [nombre]. Soy Follower.
[Ciudad] tiene historias que contarte." Llegadas posteriores — otra ciudad,
otro día, caminata 50 — vuelven al saludo breve de siempre, sin
reintroducción. Un compañero no se presenta cada vez que sales a caminar.

- **Mecánica:** `introHeard` (nueva bandera en `DEFAULTS`, config.js) se
  marca `true` únicamente en el callback `onEnd` de `Voice.speak()` — es
  decir, cuando la frase *efectivamente sonó*, no al componerla. Si el
  saludo queda pendiente por voz bloqueada (DA-77) y el TTL lo descarta sin
  sonar, la bandera no se toca: el usuario conserva su única oportunidad de
  escuchar la presentación la próxima vez.
- **`_wizFinish()` simplificado:** el corazón del paso 4 ya no habla frase
  de muestra — desbloquea en silencio (el propio `Voice.unlockFromGesture()`
  ya usa un utterance silencioso internamente; nunca dependió de hablar algo
  audible) y avanza al title card tras una pausa de cortesía de 400ms.
- **`CITY_INTRO`** (19 idiomas, narration.js) + `getCityIntroFallback()`
  para el caso raro (Nominatim no resuelve a tiempo + primera vez) —
  recicla textualmente la frase que antes vivía en `WIZ_PHRASE`.
- **Bug propio detectado y corregido en la misma sesión:** al eliminar
  `WIZ_PHRASE`, `_startWizard()` seguía dependiendo de ella para el
  autodetect de idioma — habría roto el wizard al abrir. Corregido usando
  `WIZ_LANG_TITLE` (mismas 4 claves), verificado con `node --check` antes
  de entregar.
- sw.js **v19**.

**Caso de borde sin probar:** un dispositivo con config *anterior* a v19
(sin `?reset=1`) tendrá `Config.get('introHeard')` como `undefined` en vez
de `false` hasta que el objeto de config se reescriba con los defaults
nuevos — comportamiento no verificado en campo, anotado para la caminata.

**Hallazgo de calidad de voz (sin ratificar — DT-59 propuesta):** en
`voice.js`, la selección de voz para español prioriza voces **locales**
primero y cae a online solo si no hay ninguna; para el resto de idiomas es
al revés (online primero). En iOS, las voces locales de español suelen ser
las "compact" del sistema (más robóticas); las online enrutan por síntesis
de mejor calidad. Posible causa de la voz percibida como robótica. Pendiente
de evidencia real: revisar el log de debug (`Voice: voz seleccionada → ...`)
para confirmar qué voz se usó antes de tocar código. Trade-off real a
resolver en esa sesión: preferir online rompe con "offline obligatorio"
(principio central del proyecto) si falla la señal a mitad de caminata.

**Configuración post-wizard (sin ratificar — DT-58 propuesta):** sigue
pendiente de tu confirmación explícita antes de entrar al registro oficial
de deuda técnica.

### Addendum S25d — diagnóstico de campo con log real + DT-60 registrada

**Diagnóstico del primer log de campo (iPhone, sesión real):**

- **Worker Cloudflare status=400 al arranque:** falsa alarma. Es
  `checkWorker()` en debug.js — un healthcheck que pega a `/weather` sin
  parámetros solo para confirmar que el Worker responde. Un 400 ahí es el
  resultado correcto y esperado (confirma que el Worker está vivo). Sin
  relación con nada de esta sesión.
- **Ciudad no detectada — causa real:** `fetchCityName()` en gps.js nunca
  tuvo instrumentación (`catch` silencioso sin log). El log confirmó que
  el saludo sonó a los 10s exactos tras cargar los POIs — el timer de
  `_scheduleWelcomeFallback()` corriendo porque Nominatim no resolvió a
  tiempo. Los POIs sí cargaron (9 en 665ms, Wikipedia), confirmando que el
  GPS en sí funcionó — el fallo es puntual a la llamada de Nominatim, causa
  aún desconocida (red, CORS, o respuesta sin campo de ciudad utilizable).
- **Comportamiento confirmado, no bugs:** Safari normal requiere `?reset=1`
  para volver a ver el wizard (localStorage persiste, correcto); Safari
  privado siempre muestra el wizard (storage efímero, correcto); el saludo
  sonó ya en el mapa porque el title card nunca espera a la ciudad (DT-45
  por diseño) — el saludo vive en un canal desacoplado.

**Instrumentación puente aplicada (gps.js → `fetchCityName()`):** tres
`Debug.log` nuevos — offline abortado, éxito con ciudad+tiempo+status, sin
campo de ciudad util (con el `address` crudo de Nominatim), y excepción con
mensaje real. Cero cambio de comportamiento — solo visibilidad para la
próxima prueba de campo. sw.js **v20** (gps.js cambió, ya estaba en
precache).

**DT-60 REGISTRADA — mover carga real de GPS/ciudad/POIs al wizard +
title card, splash decorativo eliminado.**

Origen: Jaime notó que el splash (corazón latiendo) ya no hace ningún
trabajo real para primera vez tras el cambio de GPS de esta misma sesión —
sus propios mensajes ("cargando puntos históricos...") son falsos en ese
caso. Flujo objetivo, co-diseñado en esta conversación:

```
Abrir app → Splash estático (logo + corazón quieto, sin latir, sin mensajes)
  → Wizard paso 1: autorización GPS (fix único → AppState.gps)
  → Wizard paso 2: idioma — AQUÍ arranca en paralelo fetchCityName()
    + prefetch de datos POI (mientras el usuario interactúa, tiempo muerto
    productivo — más ventana que solo el title card)
  → Wizard paso 3: nombre
  → Wizard paso 4: corazón — si la ciudad ya resolvió, suena YA el saludo
    fusionado completo (DA-78). El mecanismo de saludo pendiente con TTL
    (DA-77) queda como red de seguridad, no como camino principal
  → Title card — termina de cachear POIs si aún no cerró; el mapa se
    construye ya poblado
  → Explore — cero espera visible
```

**Piedra técnica identificada, a resolver en esa sesión:** Leaflet necesita
contenedor VISIBLE para inicializarse bien (mapa en 0×0 queda roto). Hoy
`initMap()` y `fetchCityName()` nacen juntos en el primer `onPosition()`
(gps.js) — hay que separar "conseguir posición + pedir ciudad + pedir datos
de POI" (puede correr con la pantalla oculta) de "construir el objeto
Leaflet visual" (debe esperar a que `#screen-explore` sea visible).
Requiere refactor real de `onPosition()`, no un simple mover de código.

**Decisión de cierre:** cerrar esta sesión aquí; DT-60 espera sesión propia
con ratificación punto por punto (mismo rigor que DT-45/47). La
instrumentación de `fetchCityName()` es el puente — su próximo log dirá
cuánto tarda Nominatim en la práctica, dato que define si dos pasos de
wizard son ventana suficiente.

---

## Sesión 25e — 8 Julio 2026 — BUG-048 (instrumentación S25d rindió fruto inmediato)

El segundo log de campo llegó con la instrumentación puente de S25d activa,
y reveló algo distinto a lo esperado: **no era Nominatim lento — era un
`ReferenceError`.**

```
fetchCityName: excepcion tras 1038ms — Can't find variable: updateTopPill
```

**Arqueología de commits** (`git log --all -S "updateTopPill"`) confirmó la
causa raíz: en el commit `8db0c0d` ("v0.6 — rediseño UI exploración + debug
overlay"), `updateTopPill()` se reemplazó deliberadamente por
`updateCareStrip()`. El llamador en `initExplore()` se actualizó
correctamente en ese momento — pero **`gps.js` nunca se revisó**, y siguió
llamando a la función eliminada en 3 sitios; además, `handleOnline()` /
`handleOffline()` en el propio `app.js` también quedaron huérfanas. Cinco
llamadas rotas, invisibles durante sesiones porque caían en `try/catch`
silenciosos o en event handlers sin manejo de errores — el patrón exacto de
DA-68, esta vez con final feliz porque la instrumentación de la sesión
anterior lo cazó al primer intento de campo.

**Consecuencia real:** dentro de `fetchCityName()`, el crash ocurría
*después* de que Nominatim resolviera correctamente y guardara
`AppState.cityName`/`countryCode` — pero *antes* de llegar a
`welcomeCity(city, country)`. La ciudad se detectaba bien todo este tiempo;
el saludo con el nombre real nunca llegaba a sonar porque el código
crasheaba una línea antes. Por eso siempre caíamos al fallback genérico de
10s — no por red, sino por esta excepción silenciosa.

**Fix aplicado (BUG-048, commit propio):** las 5 llamadas huérfanas
(`app.js`: `handleOnline`, `handleOffline`; `gps.js`: `fetchCityName`,
`fetchCityByIP` ×2) corregidas a `updateCareStrip()` — la función viva de
hoy, ya defensiva, sin dependencia del concepto de "ciudad". sw.js **v21**.

**BUG-048 CERRADO.**

---

## Sesión 25f — 8 Julio 2026 — BUG-049 (el hook de reset no limpiaba Config en memoria)

Tercer log de campo, ya con BUG-048 corregido: la ciudad se detectó bien
("Cali, CO" en 1825ms) pero el saludo sonó en su forma **breve**
("Cali. Un capítulo te espera en cada esquina, Jaime.") en una sesión que
el propio log marcaba como `first-time: 1` — donde debía sonar la versión
con intro ("Soy Follower...") por ser, en teoría, la primera vez.

**Causa raíz:** en `index.html`, `config.js` se carga antes que `app.js`
(línea 408 vs 409). El IIFE de `Config` — incluyendo su `load()` desde
`localStorage` — corre al analizar el script, antes de que `init()` exista
para ejecutarse. El hook `?reset=1` vive dentro de `init()`. Secuencia real:

1. `config.js` se parsea → `load()` lee `localStorage` **todavía sin
   limpiar** → encuentra `introHeard: true` de una prueba anterior (donde
   el saludo con intro sí sonó completo y marcó la bandera) → lo guarda en
   memoria
2. `app.js` se parsea, `DOMContentLoaded` dispara `init()` → ahora sí ve
   `?reset=1` y limpia `localStorage`
3. `Config.isFirstTime()` vuelve a leer `localStorage` directamente (no la
   memoria) → correctamente dice "primera vez" → el wizard corre
4. El wizard sobreescribe `lang`/`mode`/`userName` explícitamente — pero
   nunca toca `introHeard` (solo se setea dentro de `welcomeCity()`). Queda
   viva en memoria con el valor viejo el resto de la sesión

`?reset=1` limpiaba el disco pero no el objeto `Config` ya poblado en
memoria — la promesa de "simular primera vez" quedaba a medias, exactamente
para el único campo que ningún flujo reescribe explícitamente. Bug propio
de la herramienta de prueba — **nunca afectó a un usuario real** (un
primer arranque genuino en producción nunca tiene esta carrera, porque
`localStorage` está vacío desde el origen, sin "memoria vieja" que
precargar).

**Fix aplicado (BUG-049):** el hook ahora llama `Config.reset()`
explícitamente tras `localStorage.clear()` — `Config.reset()` ya reasigna
el objeto `_config` en memoria (no solo el storage), así que corrige el
único hueco. sw.js **v22**.

**BUG-049 CERRADO.**

### Addendum — refinamiento de diseño DT-60 (sin código, para la próxima sesión)

Confirmado con Jaime: la primera pantalla (splash estático, corazón +
brújula) queda completamente anónima — sin nombre, sin ciudad, sin nada
personalizado. Toda la personalización (nombre, ciudad, "Soy Follower")
se concentra en el gesto del corazón al final del wizard ("toca para
escucharme").

**Hallazgo clave: el mecanismo ya existe, no hay que construir nada
nuevo.** El sistema DA-77 (saludo pendiente con TTL) ya resuelve esto sin
código adicional:
- `welcomeCity()` se dispara en cuanto `fetchCityName()` resuelve, sin
  importar la pantalla activa
- Si `_audioUnlocked` sigue en `false` (caso normal mientras el usuario
  todavía está en los pasos de idioma/nombre), el saludo se encola en
  `_pendingWelcome` en silencio
- El tap del corazón ya es el gesto que llama a `_unlockAudioOnFirstTap()`,
  que ya vacía ese pendiente en el mismo instante

Si DT-60 adelanta `fetchCityName()` al paso 2 del wizard (idioma) y la
ciudad resuelve antes de llegar al corazón, el saludo sonará automáticamente
en ese tap — gratis, reutilizando código existente. Si Nominatim tarda más
que el wizard, la misma red de seguridad (TTL 90s) cubre el caso raro en
title card o el primer tap en explore. Flujo confirmado:

```
Splash estático (corazón + brújula quietos, sin nombre, sin nada)
  → Wizard paso 1: GPS
  → Wizard paso 2: idioma — arranca fetchCityName() en paralelo
  → Wizard paso 3: nombre
  → Corazón ("toca para escucharme") — desbloquea voz Y, si la ciudad
    ya resolvió, el saludo completo suena AQUÍ MISMO
  → Title card / explore — red de seguridad si aún no sonó
```

**Sesión cerrada aquí.** Próxima sesión: ratificación punto por punto de
DT-60 con este flujo como base, o BUG-046 primero — decisión de Jaime al
abrir el chat nuevo.

---

## Sesión 26 — 8 Julio 2026 — BUG-046 CERRADO (micro-sesión)

Jaime abrió con BUG-046 primero, como quedó ratificado en S25.

### Diagnóstico — causa raíz real, distinta a la asumida

La bitácora original (S21) proponía como fix candidato "marcar visited al
iniciar en vez de al completar". Arqueología de código en `poi.js` reveló
que el problema real era otro: `activatePOI()` marcaba `poi.visited = true`
**de inmediato al activar** (líneas huérfanas de antes de S2-A1),
contradiciendo el propio comentario "marcar al completar" que sí vive
correctamente en `narration.js`. Dos consecuencias:

1. **Sin guard de re-entrada.** `activatePOI()` no revisaba `poi.visited`
   antes de llamar `Narration.trigger()` (a diferencia de `enqueuePOI()`,
   que sí lo hace). Cuando el GPS urbano parpadeaba cerca del borde del
   radio de 120m, `detectPOI()` disparaba `deactivatePOI()` →
   `Narration.stop()` (corta la voz a mitad, `error=canceled`) y, al volver
   a detectar el mismo POI un instante después, `activatePOI()` lo
   reactivaba desde cero — cache o llamada nueva a Claude, sin memoria del
   intento anterior. De ahí las 3 narraciones en 4 minutos del hallazgo
   original de Sesión 21.
2. **BUG-044 revivido en la práctica.** `POI.markVisited(id)` (el que llena
   `_visitedInSession`, fix de BUG-044) solo se llama desde el callback de
   finalización en `narration.js`, protegido por `if (poi && !poi.visited)`.
   Como `activatePOI()` ya había puesto `poi.visited = true` de inmediato,
   ese guard siempre era falso — `markVisited()` nunca se ejecutaba en
   operación normal. El fix de BUG-044 estaba muerto: un POI narrado podía
   volver a narrarse tras un refetch (>2km) o una recarga desde IndexedDB.

### Fix — dos partes, un solo archivo (`poi.js`)

1. **Histéresis de desactivación** (opción B, ratificada sobre un guard de
   re-entrada en `activatePOI` — opción A descartada por ahora, sin
   evidencia de que haga falta encima de B): `CONFIG.DEACTIVATE_CONFIRM_COUNT
   = 3`. Nuevo contador `_outOfRadiusStreak`, incrementado solo cuando no
   hay `closestPOI` pero sí `AppState.activePOI`; se resetea a 0 en
   cualquier chequeo donde sí hay `closestPOI` (mismo o distinto).
   `deactivatePOI()` solo se llama al llegar a 3 chequeos consecutivos sin
   nadie cerca — con `POI_CHECK_INTERVAL=5000ms` en `gps.js`, son ~15s
   sostenidos fuera de radio, no un parpadeo momentáneo. Reset del contador
   también en `resetPOIs()`.
2. **Marcado de `visited` eliminado de `activatePOI()`** — `narration.js`
   vuelve a ser la única fuente de verdad (S2-A1), y con ella
   `POI.markVisited()` finalmente se ejecuta como se diseñó.

sw.js **v23**.

### Validación de campo (log real iPhone, sesión sin `?reset=1`)

```
18:14:51  POI: fuera de radio (1/3) — esperando confirmación antes de desactivar
18:14:57  POI: fuera de radio (2/3) — esperando confirmación antes de desactivar
```

La histéresis cuenta correctamente en producción; la sesión terminó antes
de llegar a 3/3, sin señales de re-narración del mismo POI. No sustituye la
prueba dedicada en modo "🛤️ Dibujar ruta" del simulador (pendiente,
`_mode='teleport'` fue descartado como método de prueba — ver hallazgo
abajo), pero es evidencia real consistente con el fix funcionando.

**BUG-046 CERRADO.**

### Hallazgo — modo teletransportar no sirve para probar histéresis de GPS

Al intentar reproducir el parpadeo con clics repetidos en modo
"📍 Teletransportar", cada clic disparaba `POI.resetPOIs()` (por diseño,
`debug-sim.js` línea ~156 — pensado para simular salto de ciudad, no
parpadeo de GPS). Eso reseteaba `_outOfRadiusStreak` a 0 en cada clic,
neutralizando la prueba antes de que la histéresis pudiera acumular nada.
Efecto secundario observado en el mismo log: los clics, muy juntos en
distancia/tiempo, calcularon una velocidad sostenida de 51km/h → disparó
DA-55 (pausa de detección por tránsito) de forma independiente. Corrección
de método, no de código: usar modo "🛤️ Dibujar ruta" para este tipo de
prueba — no llama `resetPOIs()` ni invalida clima, simula movimiento
continuo sin destruir estado entre puntos.

### Falso positivo descartado — saludo de ciudad

Jaime reportó que, al reabrir la app ya configurada (sin `?reset=1`), sonó
"Hola, soy Follower..." de nuevo — parecía revivir BUG-049/introHeard. El
log real lo descartó: `Bienvenida (voz): "Cali. Un capítulo te espera en
cada esquina, Jaime."` — sin el sufijo `, con intro`, exactamente la
plantilla `CITY_WELCOME` (breve, sin presentación). `introHeard` sí
persistió correctamente desde la sesión con reset; el recuerdo de Jaime del
audio se mezcló con la conversación reciente sobre DA-78. Sin acción
necesaria — DA-78 funcionando como se diseñó. Vale como recordatorio: sin
el log real, esto se habría diagnosticado mal.

### Hallazgo nuevo — narración inventando hechos (para otra sesión)

Jaime detectó una narración que "se inventó todo" sobre un POI — violación
directa de la regla "HECHO VERIFICABLE — nunca inventes" del Prompt
Maestro. Evidencia de campo real y probablemente aplicable directo a
**DT-51 (grounding con extracts)**, que ya estaba en la mira como siguiente
sesión de código mayor. Detalle (POI exacto, texto generado, fuente
wiki/osm) pendiente de traer a sesión dedicada — no se investigó en esta
sesión por decisión de Jaime.

---

# SESIÓN 27 — DT-51: grounding de narración (definición + implementación + calibración de campo)

**Fecha:** 9 Julio 2026

**Objetivo:** cerrar el hallazgo de Sesión 26 (narración inventada, detalle
pendiente). Jaime trajo el caso concreto: Monumento a la Maceta, Cali —
la narración le atribuyó autoría a Fernando Botero (1976) y un significado
de "cultivo urbano", cuando el monumento real es de Diego Pombo (2015),
homenaje al dulce tradicional "maceta" y al vínculo padrino-ahijado. Único
dato correcto: la ubicación aproximada. Autor, fecha, escala y significado
— inventados de cero, con el mismo tono de certeza que un hecho verificado.

**Causa raíz confirmada en código, no solo en el caso puntual:**
`buildPrompt()` en `narration.js` enviaba a Claude Haiku solo nombre +
ciudad ("Estoy en 'X' en Ciudad. Escribe el capítulo de este lugar.") —
cero extracto, cero hechos. `fetchWikipediaPOIs` nunca pedía descripción
(`description: ''` siempre). El mecanismo que produjo la alucinación de
la Maceta es el mismo que corre para cualquier POI real en producción,
no un artefacto del chat.

### Definición ratificada punto por punto (antes de tocar código)

1. **Cuándo pedir el extract:** en `fetchWikipediaPOIs`, para todos los
   POIs del área (no lazy por POI activado) — así no depende de la red
   en el momento crítico de narrar, y respeta "offline nunca rompe la
   experiencia"
2. **Sin umbral de calidad del extract:** se descartó introducir un
   `MIN_EXTRACT_LENGTH` — la existencia del artículo ya es la señal de
   relevancia; la disciplina de no inventar vive en el prompt, no en un
   filtro de longitud
3. **Fuente del extract — `exintro=true`** (resumen editorial curado por
   Wikipedia) en vez de truncamiento por conteo de caracteres fijo, con
   `EXTRACT_MAX_CHARS` como salvavidas de seguridad, no como estrategia
   principal. Instrucción anti-invención cubriendo autor, fecha, cifras,
   materiales, motivo, significado, estilo arquitectónico y detalles
   religiosos (a petición explícita de Jaime, motivada por precedente de
   Sesión 21 — Pasto)
4. **POIs solo-OSM:** bloque equivalente y más restrictivo — nombre +
   inscripción heredada si existe, prohibiendo inventar autor/fecha/
   estilo/orden religiosa
5. **Cache y versión:** `POI_CACHE_VERSION` v3→v4, `PROMPT_VERSION`
   v3.0→v3.1, commits separados (`poi.js` → `narration.js` → `sw.js`)

### Implementación

- **`poi.js`:** nueva función `_attachExtracts()` — tras el filtro
  editorial y el dedup (no antes: solo se pide extract de lo que
  sobrevive), agrupa pageids por `_baseUrl` de origen, pide
  `exintro=true&explaintext=true&exchars=N&exlimit=max` en lotes de 20.
  Decisión de arquitectura: **no** se fusionó con `generator=geosearch`
  en una sola llamada — eso cambia la forma de la respuesta
  (`query.pages` en vez de `query.geosearch`) y hubiera arriesgado el
  filtro `gsprop=type` de DA-70. Dos llamadas, cero riesgo al código que
  ya funciona en campo — "una variable a la vez"
- **`narration.js`:** nueva función `buildGroundingBlock(poi, lang)` —
  arma el bloque wiki (hechos + restricción) u osm (restricción sola)
  según `_source`, inyectado en el user prompt como bloque aparte (mismo
  patrón que `prevBlock`)

### Calibración de campo — cinco rondas de evidencia real, mismo síntoma

**Ronda 1 (EXTRACT_MAX_CHARS=1000, PROMPT_VERSION v3.1):** narración de
la Maceta desde el pipeline real — ya no inventa autor/fecha, pero
tampoco los incluye porque el extracto se cortó antes de llegar al
párrafo de autoría (artículo sin subtítulos, cuerpo completo ~1904
caracteres, el corte cayó ~500 caracteres antes del final). Hallazgo:
"no alucinar" y "usar los datos disponibles" son cosas distintas — aquí
solo se cumplió la primera, por casualidad de dónde cayó el corte.

**Fix de cache descubierto en el camino:** repetir la prueba tras subir
`EXTRACT_MAX_CHARS` a 2500 sirvió la MISMA narración vieja —
`[narration] cache lookup: hit`. La clave de cache
(`promptVersion_poiId_lang_topic`) no tenía forma de notar que el
*insumo* (extract) cambió sin que `PROMPT_VERSION` cambiara. Sin Mac ni
Web Inspector en el iPhone de campo, Jaime no podía purgar IndexedDB a
mano — "esa no es la solución, hay que encontrarla de otra forma".
**Fix:** `_fingerprint()` (hash corto del `_extract`) se agrega a la
clave de cache en ambos lados (`loadFromCache`/`saveToCache`). Cualquier
cambio futuro al extract invalida el cache solo, en cualquier
dispositivo, sin intervención manual — autoinvalidante por diseño.

**Ronda 2 (EXTRACT_MAX_CHARS=2500, v3.1, cache miss real):** hechos
verificables correctos (acero, 37 figuras/7 niveles, aves, patrimonio
2013) pero SIGUE omitiendo autor/fecha aunque el extracto completo
(1904 caracteres) ya cabía entero. Además generalizó una característica
del conjunto de 12 aves a un ave individual ("canarios del Valle del
Cauca"). Y el cierre filosófico ("¿qué necesita una ciudad para recordar
sus propias manos?") no tenía ninguna conexión con Cali — válido para
cualquier ciudad del mundo.

**v3.2:** tres correcciones ratificadas — (a) autor/fecha OBLIGATORIOS
si el extracto los trae, (b) prohibido generalizar conjunto→individuo,
(c) punto 6 IDEA CENTRAL del SYSTEM_PROMPT modificado: anclar a
identidad/cultura/naturaleza de la ciudad específica, nunca reflexión
filosófica genérica.

**Ronda 3 (v3.2, cache miss real vía huella nueva):** (b) resuelto — sin
generalización esta vez. (c) resuelto pero chocó con otra regla ya
existente: el cierre "Eso es Cali viéndose a sí misma" cumplía el
anclaje local pero violaba la prohibición de personificar la ciudad
(DA-66, Sesión 16/18) — el modelo encontró el camino más fácil hacia
"anclaje local" convirtiendo a la ciudad en sujeto. Anotado como
observación de campo, sin tocar la regla de personificación todavía.
(a) SIGUE fallando — tercera vez.

**v3.3:** hipótesis — la instrucción de autor/fecha vivía al final de un
bloque cargado de restricciones y se perdía en el ruido. Reubicada como
PRIMERA verificación del bloque de grounding + nueva pregunta en
VERIFICACIÓN FINAL del SYSTEM_PROMPT (mismo nivel que título/metáfora/
personificación/fe).

**Ronda 4 (v3.3, cache miss confirmado por log):** (a) sigue fallando —
CUARTA vez. Nuevo dato: "durante siglos ha sido el vínculo..." — el
extracto no dice "siglos", invención temporal menor no capturada por
ninguna regla anterior.

**Hipótesis revisada:** no era problema de ubicación de la instrucción,
sino de conflicto directo con una regla YA EXISTENTE en HISTORIA — "Las
fechas y hechos históricos... nunca aparecer como una lista de datos".
El modelo probablemente resolvía el conflicto entre "no listar datos" y
"debes incluir autor/fecha" priorizando la regla vieja, más establecida.

**v3.4:** bloque de grounding recibe el CÓMO además del QUÉ — ejemplo de
integración natural ("Diego Pombo lo construyó en 2015..." vs. formato
de ficha técnica) + aclaración de que la prosa fluida no exime de
incluir el dato. Sección HISTORIA del SYSTEM_PROMPT modificada con
excepción explícita: esa regla no autoriza omitir lo que el grounding
exige.

**Ronda 5 (v3.4 aplicado a un POI nuevo — Parroquia San Alfonso María de
Ligorio, `_source` probable 'osm', servido desde cache tras fallo total
de la cascada online):** categoría de alucinación DISTINTA, nunca antes
cubierta — el modelo no inventó sobre el templo, inventó biografía sobre
el SANTO que da nombre al lugar ("jesuita italiano" — en realidad
Alfonso María de Ligorio fundó su propia congregación, los
Redentoristas). Ninguna regla anterior contemplaba una tercera entidad
nombrada (persona/santo homónimo) distinta del lugar mismo.

**v3.5:** nueva regla universal en LÍMITES ESTRICTOS (aplica con o sin
grounding): prohibido inventar biografía de personas/santos que dan
nombre a un lugar, salvo que el extracto lo confirme. Refuerzo explícito
en el bloque OSM + nueva pregunta en VERIFICACIÓN FINAL.

### Estado al cierre de la sesión

`POI_CACHE_VERSION` v4. `PROMPT_VERSION` v3.5. `sw.js` v29.

**NO se considera DT-51 cerrada.** Cinco versiones de prompt en una sola
sesión, cada una respondiendo a un caso puntual de campo — exactamente
el método correcto ("evidencia de campo dirige la calibración"), pero
sin confirmar todavía que esto converge. Cada POI nuevo probado reveló
una categoría de alucinación distinta que la versión anterior no cubría
(autor/fecha omitidos → conflicto con regla vieja → biografía de figura
homónima). Falta validar con un lote de POIs variados (templo, monumento,
plaza, museo) antes de dar el prompt por estable.

### Idea nueva registrada para próxima sesión (sin ticket de código aún)

Jaime planteó revisar el criterio de qué POIs merecen capítulo completo.
No todos los POIs detectados tienen sustancia narrativa real — algunos
son solo un nombre sin extracto útil ni nada observable distintivo.
Propuesta a definir: si un POI no tiene contenido suficiente, Follower
debería anunciarlo simple ("Aquí está la Iglesia San Felipe") en vez de
forzar un capítulo de 90-130 palabras y arriesgar rellenar con invención
lo que no amerita narración. Pendiente de definición punto por punto —
ver DT-61 en `producto.md`.

---

# SESIÓN 27b — DT-51: prueba probabilística n=4 (mismo POI, mismo prompt)

**Fecha:** 10 Julio 2026

**Motivación.** Cierre de S27 dejó una advertencia explícita: cinco
iteraciones de prompt sobre el mismo síntoma (autor/fecha omitidos) sin
convergencia clara podían significar que el problema ya no era de
redacción sino de cómo Haiku resuelve conflictos entre instrucciones, o
simplemente de la naturaleza no determinista del modelo — una sola
muestra por versión (n=1) no alcanza para distinguir "se corrigió" de
"esta vez salió bien". Jaime decidió correr **la misma corrida cuatro
veces** (mismo POI — Monumento a la Maceta — mismo `PROMPT_VERSION` v3.5),
usando cuatro navegadores distintos (Chrome, Firefox, Edge, Safari) para
forzar cache miss real en cada una sin depender de borrar IndexedDB a
mano.

**Resultado (n=4, PROMPT_VERSION v3.5):**

| Regla | Chrome | Firefox | Edge | Safari | Tasa |
|---|---|---|---|---|---|
| Autor/fecha (Diego Pombo, 2015) | ❌ | ❌ | ❌ | ❌ | **0/4 (0%)** |
| No generalizar conjunto→individuo | ✅ | ✅ | ✅ | ❌ | 3/4 (75%) |
| No inventar duración ("durante siglos") | ❌ | ✅ | ✅ | ❌ | 2/4 (50%) |
| No personificar la ciudad (regla preexistente DA-66) | ✅ | ❌ | ✅ | ✅ | 3/4 (75%) |

**Lectura del resultado.** Autor/fecha en 0/4 tras tres rondas de refuerzo
de prompt (v3.2, v3.3, v3.4) es evidencia fuerte de que el problema no es
de redacción — el modelo, dado este extracto y este conjunto de
instrucciones, sistemáticamente prioriza el flujo narrativo sobre incluir
el dato. Seguir iterando el texto del prompt sobre este punto
probablemente no mueve la aguja; se necesita un enfoque distinto (ver
Pendientes).

**Hallazgo nuevo — invención de duración temporal ("durante siglos"), 2/4
fallos.** Esta categoría ya se había visto en la Ronda 4 de S27 pero
nunca tuvo una regla explícita, solo quedó anotada como observación. Con
evidencia repetida (2 de 4 corridas), se ratificó una regla nueva.

**Hallazgo secundario — ninguna regla es 100% incluso cuando "funciona".**
La generalización conjunto→individuo, que la Ronda 3 de S27 había dado
por resuelta con una sola muestra positiva, reaparece en 1 de 4 corridas
aquí. Y la personificación de la ciudad — regla preexistente desde DA-66,
con varias sesiones de uso — falla en Firefox ("una ciudad se conoce a sí
misma"). Confirma que ninguna corrida individual, pase o falle, es
evidencia suficiente sobre una regla; hace falta muestreo repetido para
hablar de tasas reales.

### v3.6 (ratificado, implementado)

Regla nueva en LÍMITES ESTRICTOS (es/en) — no afirmar cuánto tiempo lleva
una tradición/vínculo/práctica ("durante siglos", "durante generaciones",
"desde tiempos ancestrales") salvo que el extracto lo respalde
explícitamente. Reforzada también en la lista de hechos permitidos del
bloque de grounding wiki. `PROMPT_VERSION` v3.5→v3.6, `sw.js` v29→v30.

**Autor/fecha (0/4) deliberadamente sin tocar en este commit** — no se
sigue ajustando texto de prompt sobre este punto; se traslada a la
próxima sesión como problema de enfoque, no de redacción.

### Pendientes para próxima sesión (dos caminos, sin decidir aún)

**A. Enfoque estructural (determinista):** verificar programáticamente
si el extracto trae autor/fecha (regex sobre patrones de fecha y verbos
de autoría) y, si el capítulo generado no los menciona, regenerar con un
prompt más directivo o insertar la mención de forma controlada fuera de
la prosa libre del modelo. Más costoso (posible llamada extra), pero
garantizado.

**B. Enfoque de medición (probabilístico) generalizado:** aceptar que el
prompt nunca será determinista al 100%, y establecer un protocolo formal
de n=5-10 corridas por versión antes de considerar cualquier ajuste
"validado" — no solo para autor/fecha, sino para toda regla del Prompt
Maestro de aquí en adelante. Esta sesión ya demostró que n=1 no es
confiable ni para reglas que parecían simples (personificación, con
sesiones de historial detrás, falló 1/4).

**DT-51 sigue NO cerrada.** Estado real tras S27+S27b: cero invención de
autor/fecha *falsos* (mejora real desde el caso Maceta original), pero
omisión sistemática de autor/fecha *reales* cuando están disponibles
(0/4). El grounding cumple su promesa mínima (no mentir) pero no la
promesa completa (usar lo que se sabe).

---

### Continuación S27b (misma fecha) — hipótesis 3, BUG-050, lección de proceso

**Hipótesis 3 probada y DESCARTADA: presupuesto de palabras.** Sospecha
de Claude: el rango de 90-130 palabras (`MAX_TOKENS=380`) podía estar
compitiendo con incluir autor/fecha — el modelo sacrificaría el dato
"extra" para proteger un cierre narrativo elegante dentro de un espacio
apretado. Prueba aislada (única variable): rango subido a 90-170 palabras
(excepcional 200), `MAX_TOKENS` 380→500, etiquetado explícitamente
`PROMPT_VERSION: 'v3.7-test'` para dejar claro en el código que era un
experimento reversible. **Resultado: autor/fecha siguió sin aparecer.**
Revertido a los valores estables de v3.6 (`MAX_TOKENS=380`, rango
90-130/150) — el mismo `PROMPT_VERSION: 'v3.6'` se reutiliza
deliberadamente porque el contenido es idéntico al v3.6 original, lo que
además revalida cualquier narración vieja cacheada bajo esa versión.

**Conclusión acumulada sobre autor/fecha (0/n en todos los intentos):**
cuatro enfoques de prompt distintos (obligación explícita v3.2,
reubicación + verificación final v3.3, ejemplo de integración v3.4,
presupuesto de palabras v3.7-test) fallaron en el mismo punto. Esto
descarta con bastante confianza seguir iterando el texto del prompt para
este caso específico — la recomendación para la próxima sesión es el
enfoque estructural (verificación programática post-generación), no otro
ajuste de redacción.

**BUG-050 — nombre de ciudad con sufijo administrativo genérico
("Cali ciudad").** Reportado por Jaime en `Firefox` y `Chrome`, reproducido
tres veces con la misma coordenada. Causa confirmada por log: Nominatim
devolvió literalmente `"Cali ciudad"` en `data.address.city` (o el
fallback que haya aplicado) — no era una concatenación del código.
Hipótesis: Cali, como varios municipios colombianos, puede tener una
frontera OSM de "área urbana" separada del municipio completo, con un
nombre administrativo que incluye el sufijo genérico. **Fix:**
`_sanitizeCityName()` en `gps.js` — elimina palabras administrativas
genéricas (`ciudad, municipio, distrito, corregimiento, comuna`) SOLO
cuando aparecen al final del string, como palabra suelta. Diseño
deliberadamente conservador para no romper nombres propios legítimos que
empiezan con esas palabras ("Ciudad de México", "Ciudad Juárez", "Ciudad
Bolívar") — el patrón real del bug es "Nombre + genérico", nunca
"Genérico + de + Nombre". `sw.js` bump correspondiente.

**Lección de proceso — desfase entre archivos entregados y commits
reales.** Durante esta sesión, Jaime se atrasó comiteando algunos
archivos que Claude ya había vuelto a modificar en un paso posterior de
la conversación; al copiar el archivo "más reciente" pensando que
conservaba el estado anterior, terminó comiteando cambios acumulados de
varios pasos bajo un mensaje de commit pensado para uno solo — y en un
caso reusó (copió/pegó) un mensaje de commit viejo sin actualizarlo.
Arqueología de git (`git log -S`) confirmó: mensaje "DT-51: fetch de
extract Wikipedia en batch tras dedup, POI_CACHE_VERSION v4" duplicado
en dos commits distintos; el commit dedicado a subir `EXTRACT_MAX_CHARS`
a 2500 nunca existió como tal (el cambio quedó dentro de uno de los
duplicados); `sw.js` saltó de v30 a v32 sin que v31 tuviera su propio
commit. **Verificado que el contenido final en GitHub es idéntico byte a
byte a los archivos entregados** — es un problema puramente de
trazabilidad del historial, no de código. Causa raíz identificada por
Jaime mismo: cada archivo que Claude entrega en una sesión activa es el
acumulado completo hasta ese punto, no un parche — si el commit real se
atrasa respecto a la conversación, el archivo copiado ya contiene pasos
posteriores a los que se pensaba comitear por separado. Sin acción
correctiva sobre el historial (reescribirlo tiene más riesgo que
beneficio para un problema cosmético); simplemente comitear con más
disciplina de aquí en adelante.

---

---

# SESIÓN 28 — DT-51: enfoque estructural (verificación programática, solo instrumentación)

**Fecha:** 10 Julio 2026

**Motivación.** Cierre de S27b recomendó explícitamente abandonar el
ajuste de texto del Prompt Maestro para el punto autor/fecha (0/n tras
cuatro enfoques de redacción distintos) y pasar a un enfoque estructural:
verificación programática post-generación. Esta sesión ejecutó esa
recomendación, en modo exploratorio y con ratificación punto por punto
antes de tocar código.

### Diseño del detector — cinco iteraciones sobre tres POIs reales

Se usaron los extractos reales de Wikipedia (no inventados) de tres POIs
de prueba elegidos a propósito: Monumento a la Maceta (el caso
fundacional del ticket), Catedral de Pasto y Sagrada Familia de
Barcelona.

- **Enfoque A — regex de año suelto.** Funciona en Maceta (extracto con
  solo 2 años, ambos relevantes) pero falla en Pasto y Sagrada Familia:
  extractos reales traen 5-6 años (resoluciones administrativas,
  declaraciones patrimoniales, fundación de asociaciones) que no tienen
  por qué aparecer en un capítulo de 100 palabras. El detector marcaba
  como "incompleto" un capítulo que en realidad cumplía bien la regla.
  Descartado.
- **Enfoque B — año + nombre en la misma oración.** Reduce ruido pero
  falla exactamente en el caso Maceta: en el extracto real, "2015" y
  "Diego Pombo" están en oraciones distintas ("La obra fue revelada el 25
  de julio de 2015... La ceremonia... fue dirigida por... Diego Pombo").
  La ventana de una sola oración no los empareja — habría fallado en
  detectar justo el caso que originó el ticket. Descartado.
- **Enfoque C — ventana ±1 oración + patrón de atribución (verbo tipo
  "construido/diseñado/dirigido... por/de").** Resuelve Maceta, Pasto y
  Sagrada Familia en sus casos principales. Pero el filtro de "nombre
  propio" (heurística de mayúsculas) confunde instituciones/lugares con
  personas — capturó "Sagrado Corazón" y "El Templo Expiatorio" como si
  fueran nombres de persona.
- **Enfoque D — patrón ceñido (verbo+conector+nombre en secuencia) +
  veredicto OR (basta que UN candidato aparezca, no todos).** El
  veredicto OR resuelve el problema de POIs con más de una figura
  atribuible (Sagrada Familia tiene a Bocabella/Manyanet como fundadores
  de la idea Y a Gaudí como arquitecto — exigir que aparezcan TODOS
  penalizaba capítulos que narraban bien solo a Gaudí). Validado 6/6
  sobre narraciones escritas a mano (3 POIs × con/sin el dato) — pero se
  encontraron dos bugs de implementación (ver abajo) que daban un falso
  "cumple" en el caso Maceta sin el dato.
- **Enfoque E — D con los dos bugs corregidos.** 6/6 correcto sobre las
  narraciones escritas a mano.

**Dos bugs de implementación encontrados y corregidos, antes de dar el
detector por validado:**
1. `re.IGNORECASE` (Python) / flag `i` (JS) aplicado a todo el patrón
   neutralizaba sin querer la exigencia de mayúscula inicial del grupo
   que captura el nombre — capturaba basura en minúscula como si fuera un
   "nombre propio" (`"se hizo coincidir con los"`, `"duró"`).
2. Verificación de presencia por `substring` (`token in texto`) daba
   falsos positivos con tokens cortos: un "apellido" mal capturado de una
   sola palabra corta (`"los"`) aparece como substring de casi cualquier
   texto (`"los caleños"`), dando un falso "sí lo incluyó".

Ambos bugs eran del código de verificación, no de Follower ni de Haiku —
pero el resultado final parecía razonable hasta auditar candidato por
candidato. Corregidos: `IGNORECASE` acotado solo al grupo del verbo,
verificación por límites de palabra completa (`\b...\b`).

### Validación contra narraciones REALES de Claude Haiku 4.5

El entorno de Claude no tiene salida de red hacia
`followernarration.jaimeand.workers.dev` (bloqueado por allowlist del
proxy de egress) ni una API key propia — no se pudo invocar el Worker de
producción directamente. En su lugar, Jaime generó tres narraciones
reales pegando el `SYSTEM_PROMPT` v3.6 completo + el bloque de grounding
exacto (`buildGroundingBlock`, replicado fielmente con los extractos
reales) en un chat aparte con **Claude Haiku 4.5**, un POI a la vez
(Maceta, Catedral de Pasto, Sagrada Familia). **Metodología exploratoria,
no confirmada como equivalente al Worker real** — quedó sin resolver si
el prompt se envió en el campo `system` real de la API o concatenado en
un solo mensaje de usuario (ver DT-62 más abajo).

**Resultado — Enfoque E, 3/3 correcto:**

| POI | Candidato correcto detectado | Veredicto |
|---|---|---|
| Maceta | Diego Pombo / 2015 | ✅ CUMPLE |
| Catedral de Pasto | Antonio María Pueyo / 1899, 1920 | ✅ CUMPLE |
| Sagrada Familia | Antoni Gaudí / 1882 | ✅ CUMPLE |

Contraste fuerte con el 0/4 de S27b — pero n=3, muestra pequeña, y la
metodología de prueba (ver arriba) no está confirmada como comparable al
comportamiento real de producción.

**Tercer bug encontrado durante esta prueba conjunta.** En Sagrada
Familia, el candidato detectado fue inicialmente "Sagrada Familia" (el
propio nombre del lugar) en vez de "Antoni Gaudí" — el patrón de nombre
buscaba el primer conector (`de`/`por`/`by`) de TODA la oración, no el
que sigue específicamente al verbo de atribución detectado. La oración
real tiene un "de" anterior ("Templo Expiatorio **de** la Sagrada
Familia... diseñada **por** el arquitecto Antoni Gaudí"). El veredicto
final no cambiaba (coincidencia: "Sagrada Familia" aparece en cualquier
capítulo sobre ese POI), pero el candidato identificado era incorrecto.
Fix: anclar la búsqueda del nombre inmediatamente después del
verbo+conector que hizo match específicamente, no en la oración completa.

**Limitación conocida, sin resolver.** Los límites de palabra (`\b`) en
JavaScript son ASCII-only — con nombres acentuados (ej. "Gaudí") pueden
fallar en detectar el límite correcto. No bloqueante aquí porque la
lógica es OR (basta el nombre o el año), pero queda anotado.

### Hallazgo colateral — longitud y personificación (sin ticket propio, ver DT-62)

Las tres narraciones reales, independientemente del resultado de
autor/fecha, mostraron dos violaciones consistentes del Prompt Maestro
v3.6 que nadie estaba buscando:

| POI | Longitud | Personificación de la ciudad |
|---|---|---|
| Maceta | 198 palabras | Sí — "la ciudad diciéndose a sí misma quién es" |
| Pasto | 192 palabras | Sí — "la ciudad decidió reconstruir" |
| Sagrada Familia | 153 palabras | No (pero varias metáforas apiladas) |

Objetivo de longitud es 90-130 (excepcional 150) — dos de tres casi
duplican el techo. La personificación de la ciudad está prohibida
explícitamente en LÍMITES ESTRICTOS. Como la metodología de prueba no
confirmó el uso del campo `system` real de la API, no se puede saber
todavía si esto es una falla genuina del prompt v3.6 o un artefacto de
haber concatenado las instrucciones en vez de enviarlas como `system` —
de ahí **DT-62** (`producto.md`), registrada sin ratificar.

### Punto 2 — decisión de alcance (ratificada)

Tres caminos evaluados para qué hacer cuando la verificación detecta
"falla": regenerar con refuerzo (descartada — costo/latencia sin
garantía), insertar el dato de forma determinista sin IA (descartada — el
detector a veces engancha candidatos de baja calidad, insertarlos sería
peor que omitirlos, y choca con 5 versiones de prompt evitando que
autor/fecha suene a ficha técnica), y **solo instrumentar/loguear**
(elegida) — no altera ni bloquea la narración entregada, solo registra
`Debug.log` con el veredicto para juntar evidencia real de campo antes de
decidir el resto.

### Implementado

`narration.js`: `_dt51ExtractCandidates()`, `_dt51WordPresent()`,
`_dt51VerifyAutorFecha()`, invocadas en `trigger()` tras
`sanitizeNarration()`, solo si `source !== 'fallback'`. No se tocó
`SYSTEM_PROMPT` ni el bloque de grounding — `PROMPT_VERSION` se mantiene
en v3.6. `sw.js` v33→v34. Ver DA-80 (`arquitectura.md`) para el detalle
de diseño completo.

### Pendiente

**DT-51 sigue NO cerrada** — ahora instrumentada, a la espera de datos
reales de campo (no simulados, no exploratorios) antes de decidir el
Punto 2 completo (regenerar/insertar) o dar el problema por resuelto.

**DT-62 (nueva, registrada, sin ratificar)** — revalidar si longitud y
personificación son fallas reales del Prompt Maestro v3.6 o un artefacto
de la metodología de prueba de esta sesión (campo `system` vs.
concatenado), repitiendo el mismo experimento con el campo `system`
confirmado antes de decidir si ameritan trabajo de prompt.

---

## Sesión 29 — 11 Julio 2026 — Icono PWA (DT-1 cerrada), splash eliminado, title card unifica carga (DA-81)

**DT-1 cerrada.** Ícono C2 (corazón+brújula) llevado a producción:
`assets/icon-master.svg` (fuente del PNG del ícono PWA, mark centrado con
margen de seguridad para `purpose: maskable`) + `assets/icons/icon-192.png`,
`icon-512.png`, `apple-touch-icon.png` + `assets/logo.svg` (lockup
completo para README/listing, con la tipografía corregida contra los
tokens reales del title card en vez de una versión inventada anterior).
Iteración de escala del mark dentro del ícono cuadrado: 0.8 → 1.15 → 1.4,
buscando "grande, casi al borde, sin recortar el trazo". Prueba de fondo
azul (`--color-systole`) revertida a `--color-night` original — no se veía
bien.

**Revisión de interfaz pantalla por pantalla.** Se recorrieron splash,
wizard 1-4 y title card uno por uno con mockups HTML standalone (tokens
reales de `main.css`/`wizard.css`/`splash.css`). Iconos de wizard
explorados en tres direcciones: (1) brújula técnica + burbuja de chat +
carnet de identificación — descartada por sentirse "distante, no
cercana"; (2) variaciones del corazón de marca (pin, ondas, firma) —
más cálida pero se alejaba del lenguaje ya usado en la app; (3) versión
final: **emoji simple** (📍 🗣️ 👋 💗), igual que ya estaba en producción
para los pasos 1-2, extendido a nombre y voz por consistencia. Decisión
de fondo: el mark elaborado (corazón+brújula real, con latido y anillos)
queda reservado exclusivamente para el title card, no se reparte diluido
en los 4 círculos del wizard — el paso 4 pierde su badge circular con
gradiente y pasa a ser el mismo `.wizard-icon` plano que los demás pasos.

**Hallazgo que motivó DA-81.** Al ir a codificar la eliminación del
splash, se encontró que `runSplash()` no era solo decorativo de primera
vez — era la única pantalla de espera para el usuario recurrente
(`Config.isFirstTime() === false`), donde se pedía GPS y se esperaba
hasta 8s antes de entrar a explorar. Eliminar el splash sin más habría
dejado a ese usuario sin ningún lugar donde esperar datos. Decisión
(confirmada por Jaime): el title card absorbe esa función para ambos
casos — primera vez (datos ya en camino desde el paso 1 del wizard) y
recurrente (único disparo de `requestGPSPermission()`, repetido en **cada**
apertura de la app, porque el mismo usuario puede estar hoy en Barcelona y
mañana en Lisboa — no hay nada que cachear de una sesión a otra sobre
"dónde está").

**Implementación.** `index.html`: `#screen-splash` eliminado; `#screen-titlecard`
gana el mark+anillos+barra de progreso (`titlecardProgressFill`/`Label`);
paso 4 del wizard usa `.wizard-icon`; `<link rel="apple-touch-icon">`
agregado. `css/splash.css` reescrito completo — cero líneas de splash,
solo title card (`.titlecard-wrap`/`.titlecard-ring`/`.titlecard-mark` con
latido propio, `.titlecard-progress-*`). `css/wizard.css`: `.wizard-heart`
y sus keyframes eliminados, `cursor:pointer` movido a `#wizHeartBtn`.
`js/app.js`: `runSplash()`/`expandHeart()` eliminados; `_showTitleCard()`
reescrito para pedir GPS (si recurrente) y correr la barra de progreso con
los mismos mensajes que tenía el splash viejo, piso de 1.8s
(`TITLECARD_MIN_MS`) + techo de 8s (`TITLECARD_TIMEOUT_MS`); `init()`
bifurca directo a `_startWizard()` o `_enterExploreViaTitleCard()` según
`Config.isFirstTime()`, sin splash de por medio. Validado con
`node --check`. `sw.js` v34→v35 (STATIC_ASSETS gana los 3 íconos nuevos).

**Fix post-entrega (`sw.js` v35→v36).** Jaime mandó screenshots reales del
dispositivo y se detectaron dos piezas acordadas en el chat que no
llegaron al archivo entregado: el ícono 👋 del paso 3 (nombre) faltaba
por completo, y el paso 4 (voz) no tenía el texto explicativo que sí
tienen los demás pasos. Corregido en un commit aparte de `index.html`.
Lección repetida (ya vista en S27b): el desfase entre lo acordado en
conversación y lo realmente escrito en el archivo es un riesgo
estructural — verificar con screenshots reales del dispositivo, no
asumir que la conversación se tradujo 1:1 al código.

**DT-63 registrada** — validación de campo pendiente de ambos caminos
(primera vez y recurrente) del flujo sin splash.

### Pendiente

**DT-63 (nueva)** — probar en iPhone real primera vez (`?reset=1`) y
usuario recurrente; confirmar que la barra del title card no se sienta
como un "segundo splash" ni como espera injustificada, y que el cambio de
ciudad de una sesión a otra se refleje de verdad.

---

## Sesión 30 — 14 Julio 2026 — Segunda pasada del ícono PWA (DA-83), logo.svg sincronizado

Sesión centrada por completo en refinar el ícono que S29/DA-82 había dado
por cerrado. Motivo: capturas reales de iPhone (no preview de escritorio)
mostraron que el ícono se perdía en el home screen — trazo delgado, aguja
con muesca cóncava poco legible, ticks pegados al corazón y casi
invisibles a opacidad 0.55.

**Iteración validada con capturas reales en cada paso (sw.js v38→v41):**
- v38: prueba de aguja+ticks rotados 40° con corazón fijo. Descartada por
  Jaime tras verla junto a la recta — no comunica nada como "norte" fijo,
  y rompe la convención de brújula en reposo. Hallazgo técnico registrado:
  un corazón no es simétrico bajo rotación arbitraria, así que cada tick
  quedaba a distinta distancia real del contorno según el ángulo —
  verificado con esqueletización de imagen + medición de distancia
  mínima por píxeles (no a ojo), y corregido con radio individual por
  tick antes de descartar la variante entera.
- v39-v40: aguja recta de vuelta; corazón y ticks engrosados; ticks
  separados del corazón y su opacidad lateral subida.
- v41 (definitivo, confirmado por Jaime en su iPhone): ticks eliminados
  del ícono por completo; aguja rediseñada de 4 puntos (con muesca
  cóncava) a 3 puntos (rombo liso), inspirada en una referencia externa
  que Jaime compartió; corazón+aguja agrandados usando el espacio que
  dejaron libre los ticks.

**Exploraciones probadas y descartadas** (con evidencia real de pantalla,
no solo discusión): fondo blanco completo, corazón relleno de blanco
sólido, anillo de dial alrededor del hub ("se satura con detalles"),
ícono alternativo tipo clipart de una "F" con corazón y flecha (rechazado
en conversación, sin necesidad de mockup, por romper la continuidad de
marca ya construida en splash/wizard/title card).

**Experimento aparte, sin éxito:** exploración de un wordmark "FOLLOWER"
en estilo "single line art" (una sola línea continua, a partir de una
foto de referencia que Jaime compartió de otra presentación). Se probaron
dos caminos — extracción de contorno real de un font cursivo (Alex Brush,
vía fonttools) y construcción manual de un path geométrico con un solo
comando `M` — y se verificó matemáticamente que el resultado del font
tiene 13 puntos finales y 35 cruces (no es ni puede ser una sola línea
real sin simplificar mucho las letras). El intento manual sí cumplió la
condición técnica (un solo `M`, cero cortes) pero Jaime lo vio en su
pantalla y no se leía bien como "follower" — descartado. Aprendizaje de
proceso explícito: en esta sesión no hubo verificación visual confiable
de mi parte al revisar los renders, así que todo lo que sí se pudo
verificar (continuidad del trazo, márgenes de seguridad, distancias
tick-corazón) se hizo por medición de píxeles, y el veredicto estético
final siempre vino de que Jaime lo viera en su propia pantalla, no de mi
propia inspección.

**`logo.svg` actualizado para quedar sincronizado con el ícono v41:**
corazón engrosado (misma proporción 2→4.5), aguja rombo liso, hub
corregido a la proporción real (v41 tiene el hub más chico que el
semi-ancho de la aguja, no más grande — primer intento se pasó a r=10,
corregido a r=6), wordmark corregido a mayúsculas (`FOLLOWER`, coincide
con `.titlecard-wordmark`; tenía minúsculas por error heredado de una
versión anterior). A diferencia del ícono, `logo.svg` sí conserva los 4
ticks — ahí el tamaño de uso (README, listing) no tiene el problema de
legibilidad que forzó a quitarlos del ícono pequeño.

### Pendiente

Sigue abierta **DT-63** (validación de campo del flujo sin splash,
primera vez y recurrente) — sin cambios esta sesión, no se tocó
`app.js`/`index.html`/wizard. Todo el trabajo de S30 fue ícono/logo.

---

## Sesión 31 — 14 Julio 2026 — Auditoría de deuda técnica/interfaz/Care + 6 bugs de campo + DA-84 (brújula)

**Tipo de sesión: revisión + diseño puro. Cero código tocado.**

Sesión de escritorio dividida en dos partes: (1) auditoría cruzada de
deuda técnica, deuda de interfaz, bugs generales, manifiesto de Care vs.
implementación real, y narración/voz robótica — pedida por Jaime para
tener panorama antes de seguir con DT-62; (2) seis bugs de interfaz que
Jaime traía anotados de uso real, más una pregunta técnica sobre la
brújula que terminó en decisión de arquitectura (DA-84).

### Parte 1 — Auditoría cruzada

Sin cambios de código ni de tickets nuevos — solo síntesis de lo ya
registrado, para ubicar a Jaime antes de la próxima sesión de escritorio
(DT-62):

- **Deuda técnica activa:** DT-51/62/61 siguen siendo la cadena
  bloqueante principal (DT-62 es prerequisito lógico de DT-61 y de
  cualquier ajuste de prompt por longitud/personificación). DT-63 y
  DT-54 (wake lock) siguen como las de mayor riesgo práctico sin caminata
  de campo todavía.
- **Deuda de interfaz (`deuda_tecnica_interfaz.md`):** confirmado que la
  mayoría de sus ítems de S19 ya fueron absorbidos por DA-77/81 y
  DT-45/47 — candidato real a archivar como histórico, dejando DT-16
  como el único ítem de interfaz genuinamente vivo.
- **Manifiesto Care vs. código:** la brecha grande de S19 (lluvia como
  "segundo sistema separado", prohibido explícitamente por el
  manifiesto) fue cerrada por DA-65/DT-42. Pendiente suelto encontrado
  de nuevo en esta revisión: `Care.resetWalk()` sigue existiendo en
  `care.js` sin cablear en `app.js` (deuda ya anotada en su momento,
  S19, nunca resuelta) — `_thirstShownThisWalk` posiblemente no se
  resetea entre caminatas reales.
- **Narración vs. voz robótica:** dos problemas distintos que no deben
  confundirse. Narración (DT-51/61/62) es un problema de *contenido*
  del modelo. Voz robótica (DT-59, sin ratificar) es un problema de
  *selección de voz* en `voice.js` — prioriza locales para español y
  online para el resto de idiomas; en iOS las locales de español suelen
  ser las "compact" del sistema. Nunca confirmado con el log real qué
  voz se usa en campo antes de decidir tocar código.

### Parte 2 — Seis bugs de campo (BUG-051 a BUG-056)

Revisados contra el código en vivo (`raw.githubusercontent.com`, Regla
de Oro) antes de registrar cualquier hipótesis. Ninguno tiene fix
aplicado — quedan documentados en `producto.md` §19 como hipótesis a
confirmar en campo, no como causas cerradas:

1. **BUG-051** — tap extra necesario tras configurar por primera vez
   para que suene el saludo. Hipótesis: falta auto-avance en
   `_showTitleCard()` cuando los datos resuelven antes del techo de 8s.
2. **BUG-052** — saludo dice "tu ciudad tiene historias que contarte"
   en vez del nombre real. Confirmado: es literalmente
   `getCityIntroFallback()` en `narration.js`, el camino de emergencia
   de Nominatim, disparándose más de lo esperado. Se recomienda
   fusionar con DT-63 en vez de abrir ticket propio — misma causa raíz
   que el hallazgo sin instrumentar de `fetchCityName()` (S25d).
3. **BUG-053** — el mapa no sigue al caminante. Confirmado en código:
   `updateUserPosition()` (`gps.js`) solo mueve el marcador, nunca el
   mapa; `centerMap()` solo se dispara manualmente desde `btnCenter`.
   Pendiente ratificar si el comportamiento deseado es auto-centrado
   continuo o manual — hoy no es ninguno de los dos de forma útil.
4. **BUG-054** — el pill de "siguiente POI" no se cierra con un segundo
   tap. El código de `btnNearbyStories` en `app.js` usa
   `classList.toggle('hidden')`, que en teoría sí debería cerrar.
   Pendiente descartar solapamiento visual o reapertura periódica antes
   de tener causa confirmada.
5. **BUG-055** — pantalla de POI expandido con información sobrante de
   v1. Confirmado: `renderExpanded()` (`poi.js`) sigue llamando
   `renderQuickFacts()` y `renderDepthPills()`, relictos pre-DA-50, más
   una referencia a `Config.getNarratorLabel()` probablemente muerta.
   No es un bug nuevo — es la ejecución pendiente de **DT-16**.
6. **BUG-056** — el care strip superior sigue mostrando pasos y km.
   Confirmado en `index.html`: `#careStrip` conserva `csSteps`/`csKm`
   de DA-19 (S9, v0.6), anterior al manifiesto de Care vigente. Viola
   textualmente "no es una app fitness". DT-42 nunca tocó esta barra
   persistente, solo el contenido de las care cards. Requiere decisión
   de diseño (eliminar / ocultar salvo alerta / rediseñar con DT-16).

### DA-84 — Brújula: permiso silencioso, sin ícono; cono solo con POI activo

Pregunta de Jaime: ¿se puede tener la brújula "siempre activa" para
eliminar el ícono y el permiso? Respuesta técnica: el **permiso** no se
puede evitar ni pedir una sola vez para siempre — iOS 13+ exige gesto
directo (`requestPermission()`) y, a diferencia de GPS, no lo persiste
entre recargas de página. Pero el **ícono/botón sí es eliminable**: nada
obliga a que el gesto que dispara el permiso sea un botón dedicado.

Decisión: pedir el permiso dentro del mismo tap ya usado para
`_unlockAudioOnFirstTap()` (DA-77) — wizard paso 4 o primer tap del
title card. Una vez concedido, el heading se lee en silencio de fondo
toda la sesión, sin estados reposo/latido/activo ni botón propio. El
cono visual en el mapa deja de ser manual y pasa a mostrarse **solo
cuando hay un POI activo** (fase diástole) — refuerza "el compañero te
ayuda a encontrar la historia", no "herramienta de navegación
permanente". Se elimina `#btnCompass` y las funciones de activación
manual; se conserva el cono SVG combinado (BUG-027) y el listener de
`DeviceOrientationEvent`. Diseño cerrado, sin código tocado esta sesión
— ver DA-84 (`arquitectura.md`) para el detalle completo y DT-64
(`producto.md`) para el ticket de implementación. Redefine el alcance
de DT-20.

### Pendiente

Ningún archivo `.js`/`.html`/`.css` tocado esta sesión — sw.js se
mantiene en v41. Los seis bugs y DT-64 quedan como diseño/hipótesis
registrados, a la espera de definición punto por punto y/o validación
de campo antes de escribir cualquier fix.

---

### Continuación Sesión 31 — Verificación en código real de DA-81/DT-60

Jaime pidió confirmar contra código, no contra este documento, si DT-60
estaba realmente cerrada como decía la bitácora de S29. Se releyó
`_showTitleCard()` completa en `app.js` (vivo, GitHub raw) en vez de
confiar en el resumen de DA-81.

**Resultado: DA-81 estaba incompleta en un punto central.** Es cierto
que el splash se eliminó del todo (`#screen-splash` no existe,
`runSplash()`/`expandHeart()` no existen — confirmado). Pero la frase
"el title card absorbe la carga real de GPS/ciudad/POIs" no es exacta:
`dataPromise` en `_showTitleCard()` solo espera
`requestGPSPermission()` — ni `fetchCityName()` ni la carga de POIs
están adentro de esa promesa. Ambas arrancan recién en `initExplore()`,
después de que el title card ya navegó a explore. La barra de progreso
es puramente cosmética (`Math.random()` por tick).

**Esto resultó ser la causa exacta de dos de los seis bugs reportados
antes en la misma sesión — no había que especular más:**

- **BUG-051** (tap extra tras configurar): el tap sobre el title card
  llama `_unlockAudioOnFirstTap()` antes de `finish()`; si el usuario no
  toca y el title card termina solo por el timer de piso/techo,
  `_audioUnlocked` queda en `false`. `initExplore()` ya tiene, con
  comentario explícito en el código, una "red de seguridad" — un
  listener global de `touchend`/`click` de una sola vez para desbloquear
  audio en el primer tap de exploración si nadie tocó wizard ni title
  card. Ese es, literalmente, el tap extra que describía Jaime.
- **BUG-052** (saludo genérico): `_scheduleWelcomeFallback()` corre su
  ventana de 10s desde que arranca `initExplore()`, no desde el arranque
  de la app. Como `fetchCityName()` ni siquiera empieza hasta ese punto,
  el margen real antes de caer a `getCityIntroFallback()` es más corto
  de lo que el diseño original (DA-77/S25c) asumía.

**Decisiones tomadas, sin tocar código todavía:**
- **DT-60 reabierta** en `producto.md`, con alcance corregido: extender
  `dataPromise` para esperar también `fetchCityName()` y el primer batch
  de POIs (mismo techo de 8s).
- **BUG-051 y BUG-052 pasan de "hipótesis" a "confirmado en código"** en
  la tabla de bugs, y se fusionan con DT-60 en vez de quedar sueltos —
  comparten la misma causa raíz.
- **DA-81 (`arquitectura.md`) recibe una corrección**, no una reescritura
  — se preserva el diseño original documentado en S29 y se agrega el
  hallazgo de S31 debajo, con la cita exacta de código que lo sostiene.

**Lección de proceso:** la bitácora de S29 daba el ticket por cerrado
basándose en la intención de diseño acordada, no en una lectura línea por
línea del archivo final entregado — el mismo patrón de desfase ya visto
en S27b (mensajes de commit desalineados) y en el propio DA-81 (íconos y
textos acordados en chat que no llegaron al archivo). Refuerza la Regla
de Oro: ante cualquier duda sobre si algo "ya quedó hecho", el árbitro es
el código en `raw.githubusercontent.com`, no el resumen que quedó escrito
sobre él.

### Validación de campo — BUG-051 confirmado en dispositivo real (no solo en código)

Tras el análisis de código de la sección anterior, Jaime reprodujo el
síntoma en su iPhone real, cerrando y reabriendo la app en Cali: el
saludo *"Cali. Un capítulo te espera en cada esquina, Jaime."* — plantilla
`CITY_WELCOME` de `narration.js` (DA-75, nombre correctamente insertado al
final de la frase, confirmando que ese punto específico sí funciona bien
— no es parte del bug) — **solo sonó al tocar la pantalla**, no al abrir
la app. Confirma exactamente el mecanismo ya identificado por lectura de
código: el camino automático de `_showTitleCard()` (`finish()` disparado
por el timer de piso/techo) no llama `_unlockAudioOnFirstTap()` — solo lo
hace el camino de tap manual (`tapFinish`). El saludo quedó correctamente
resuelto y guardado en `_pendingWelcome`, pero bloqueado hasta el primer
tap de la "red de seguridad" en `initExplore()`.

**Descripción correcta del síntoma, en palabras de Jaime:** el saludo se
activa al hacer tap, no automáticamente al abrir la app — la app debería
hablar sola con solo abrirla.

**Fix propuesto, sin aplicar todavía (pendiente de ratificación):** que
`finish()` en `_showTitleCard()` llame `_unlockAudioOnFirstTap()` en
ambos caminos (automático y por tap), no solo en `tapFinish`:

```js
const finish = () => {
  if (done) return;
  done = true;
  if (iv) clearInterval(iv);
  _unlockAudioOnFirstTap();   // nuevo — cubre también el cierre automático
  if (cardId) Debug.metricEnd(cardId, isFirst ? 'first-time' : 'returning-user');
  onDone();
};
```

**Pregunta abierta antes de escribir el fix:** iOS exige que
`speechSynthesis.speak()` cuelgue de un gesto de usuario *reciente*, no
de cualquier tap en el historial de la sesión. Si el title card corre los
8 segundos completos sin que el usuario toque nada, no queda claro si
llamar `_unlockAudioOnFirstTap()` desde el timer automático (sin gesto
trusted directo en ese instante) sigue siendo válido para
`speechSynthesis` en iOS Safari, o si WebKit lo descarta igual que
descarta llamadas fuera de un trusted event (mismo linaje que BUG-036).
Esto solo se puede confirmar probando en el dispositivo real, no leyendo
el código — queda como paso previo a aplicar el fix.

Ningún archivo `.js`/`.html`/`.css` tocado — `sw.js` se mantiene en v41.
El fix queda diseñado y documentado, no aplicado, a la espera de resolver
la pregunta abierta sobre el gesto trusted en iOS.

### Continuación Sesión 31 — Primera prueba de campo de DT-54: deadlock BUG-057, wake lock rechazado, y evidencia de producción para DT-62

DT-54 se desplegó (sw.js v42; deploy verificado vía `walkmode.js` como
testigo — archivo nuevo que no existía antes, HTTP 200 en Pages) y Jaime
salió a probar de inmediato con el simulador en modo ruta (Barcelona)
desde su ubicación real (Palmira). La prueba destapó un bug crítico
preexistente, un problema del propio DT-54, y — el hallazgo más valioso —
evidencia de producción para DT-62. Todo con log de debug exportado y
foto real del bloqueo.

**BUG-057 (nuevo, crítico) — deadlock de diástole al volver del
background.** Anatomía completa, con timestamps del log:

- 10:00:43 — arranca la narración de Parroquia San Carlos Borromeo
  (1118 chars). `onstart` llega… y después silencio total: ni `onend`,
  ni `onerror`. El congelamiento silencioso de iOS que el keep-alive
  (pause/resume cada 10s) intentaba prevenir, ocurriendo igual.
- 10:00:43 → 10:05:05 — el safety timer tarda **262 segundos** en
  rescatar, porque estaba calibrado proporcional al texto **sin techo**
  (~12 chars/s + 5s de buffer → 1118 chars = 262s). Durante esos 4+
  minutos: fase diástole clavada, tab de narración bloqueado, triggers
  futuros ignorados (guard `_isNarrating`), voz zombie — lag texto→voz
  de 43.7s y dos `error=canceled` en cadena en los speaks siguientes.
- La foto de campo mostró además que el panel HISTORIAS CERCA cubría
  ~80% de la pantalla y su único cierre era tocar el mapa — cuya franja
  visible era mínima. Jaime no podía ni llegar al debug: tuvo que matar
  la app. Esto redefine **BUG-054** con causa entendida: no era un
  toggle roto, era que no había dónde tocar.

**Wake lock (DT-54) rechazado en iOS.** Tras reabrir la app:
`NotAllowedError` dos veces (10:07:30 en `initExplore`, 10:07:41 en
`visibilitychange`) — aunque en la sesión anterior sí se había adquirido
(el log muestra "liberado por el sistema" al cerrar). Hipótesis: iOS
rechaza la petición sin activación de usuario reciente tras cargar la
página, o Modo de Bajo Consumo activo. Pendiente de confirmar cuál.

**Evidencia de producción para DT-62 (hallazgo mayor).** Las 4
narraciones reales de la sesión midieron 1008, 1047, 1097 y 1118
caracteres (~170-190 palabras) contra el objetivo de 90-130. La
violación de longitud ya no es hipótesis de artefacto metodológico de
S28: **está pasando en producción con el Worker real.** Además conecta
los problemas: sobre-longitud → safety timers más largos → ventanas de
bloqueo más largas cuando la voz muere. Corregir DT-62 ahora tiene
urgencia de campo, no solo de calidad narrativa.

**Hallazgos menores del mismo log:** `userName` guardado como "Jaimr"
(typo en el wizard, sin pantalla de configuración para corregirlo —
argumento vivo para DT-58); Overpass caído en cadena (504 + Load failed
en los 3 mirrors — la cascada DT-52 degradó correctamente a cache
IndexedDB con 40 POIs); Worker 400 en el warm-up (ya conocido de S25d,
inofensivo).

**Paquete de fixes A-E, ratificado en bloque y aplicado (sw.js v43):**

- **A — `voice.js`, recuperación por `visibilitychange`:** referencia a
  nivel de módulo `_forceFinish` al `_finish` del speak activo (limpiada
  en `_finish` y en `stop()`); al volver a visible, `resume()` suave
  primero y, si tras 1.5s la síntesis no está hablando de verdad, cierre
  forzado por el camino único → `onEnd` → fase vuelve a sístole → la app
  revive. La narración interrumpida no se repite (el POI no quedó
  visitado; puede re-dispararse naturalmente).
- **B — `voice.js`, techo absoluto del safety timer:**
  `SAFETY_MAX_MS = 120000`. Se eligió 120s y no 90s deliberadamente: una
  narración legítima de ~1100 chars tarda ~93s reales — 90s la cortaría a
  mitad de frase. Cuando DT-62 corrija la longitud, el techo puede bajar.
- **C — `app.js`, cierre del panel de historias (BUG-054):** tap en
  cualquier zona del propio panel cierra; un tap en un ítem primero
  activa el POI (su onclick inline corre antes en el burbujeo) y luego
  cierra — sin conflicto.
- **D — `walkmode.js`, reintento del wake lock por gesto:** si la
  adquisición falla, `_retryOnGesture` programa un reintento en el
  siguiente gesto real del usuario (reutilizando `_registerInteraction`,
  que ya escucha `touchend`/`click`); el log del rechazo ahora incluye
  `visibilityState` y el mensaje del error para diagnóstico.
- **E — documentación:** BUG-057 registrado con causa confirmada y fix;
  BUG-054 actualizado a causa entendida + fix aplicado; DT-62 actualizada
  con la evidencia de producción.

`node --check` OK en los tres JS. sw.js v42→v43, commit final aparte.

### Continuación Sesión 31 — Segunda prueba de campo (v43): victorias confirmadas, BUG-058, y fix de BUG-053

Jaime repitió la prueba con el simulador (ruta en Barcelona) ya con
sw.js v43 activo. Log exportado + 4 capturas. Resultado neto: los fixes
de la ronda anterior funcionan, apareció un bug nuevo de secuestro de
pantalla, y se implementó el auto-seguimiento del mapa.

**Victorias confirmadas en el log:**

- **Wake lock (fix D) validado:** `NotAllowedError` al cargar →
  "reintento programado al primer gesto" → 2s después: "wake lock
  adquirido". El ciclo completo rechazo→gesto→adquisición operando como
  se diseñó. El lock además se re-adquirió solo tras cada liberación del
  sistema durante la sesión (3 ciclos limpios en el log).
- **Modo caminata (DT-54, entrada C) debutó:** `12:49:15 ON — movimiento
  sostenido sin interaccion` → `12:49:50 OFF — tap del usuario`. Primera
  activación real, entrada y salida limpias.
- **BUG-057 contenido:** la voz siguió muriendo en silencio (2 de 3
  narraciones cerraron por safety-timer — el keep-alive iOS sigue sin
  prevenir el congelamiento), pero con el techo de 120s los rescates
  llegaron en 87-94s en vez de 262s, y la app siguió narrando después.
  Cero errores de síntesis, cero voz zombie, lag texto→voz normal
  (131ms promedio vs. 43.7s de la prueba anterior).
- **Primera verificación DT-51 en producción:** "cumple · Templo
  Expiatorio de la Sagrada Familia · candidatos=[Antoni Gaudí]" — el
  detector de autor/fecha generando evidencia real, como se diseñó en
  S28.
- El typo "Jaimr" ya no está (Jaime lo corrigió); la bienvenida sonó
  con ciudad real y nombre correcto.

**BUG-058 (nuevo) — pantalla secuestrada con el panel de historias
abierto.** Con el panel abierto, ningún tap respondió: ni el propio
panel (el fix C de v43 debía cerrarlo), ni el mapa, ni la barra de
debug. Jaime tuvo que matar la app. Que los taps mueran también FUERA
del panel apunta a un interceptor global, no al panel. Hipótesis
principal: `#walkmodeOverlay` — fixed, z-index 9999, el único elemento
de pantalla completa nuevo de DT-54 — presente pero invisible por una
carrera (p.ej. la ventana de 600ms del fade de salida en la que sigue
en `display:flex` con `opacity:0`, capturando todos los taps sin que se
vea nada). Blindaje aplicado en `explore.css`: `pointer-events: none`
por defecto en el overlay, `auto` solo con `.visible` — el overlay ya
no puede capturar eventos siendo invisible, sea o no la causa exacta.
Si el secuestro se repite con v44, la hipótesis queda descartada.

**BUG-053 — fix aplicado (auto-seguimiento del mapa).** Diseño
ratificado en esta misma sesión: `panTo` suave (0.8s) en
`updateUserPosition()` solo cuando el caminante sale del 70% central
del viewport (`getBounds().pad(-0.3).contains()`), nunca en cada
lectura. Respeto a la intención del usuario: `dragstart` del mapa pausa
el seguimiento por 10s (gracia temporal — sin botón ni estado extra; se
descartó `dragging.moved()` de Leaflet porque queda en true tras el
primer arrastre y mataría el seguimiento para siempre). El fallo del
seguimiento nunca rompe el GPS (try/catch silencioso).

**Observación de campo para DT-61 (cara inversa del problema):** un
parque urbano grande y evidente en el recorrido no existe para Follower
— sin artículo de Wikipedia geolocalizado, y `leisure=park` no está en
los tiers curados de Overpass — mientras POIs menores sí narran.
Registrado en la fila de DT-61: decidir si los parques con nombre
entran a la curaduría OSM es parte de la definición pendiente (tocarla
implica `POI_CACHE_VERSION++`, deliberadamente fuera de esta tanda de
interfaz).

sw.js v43→v44. Archivos tocados en esa ronda: `gps.js` (BUG-053),
`explore.css` (blindaje BUG-058), docs.

### Continuación Sesión 31 — Tanda v45: BUG-059 (preámbulo hablado), BUG-051, BUG-056, BUG-055 + log de 4 horas

**BUG-059 (nuevo, el hallazgo de la sesión).** Jaime compartió una
narración real de Igreja de São Lourenço (Lisboa, simulador) que
empezaba: *"Verificación obligatoria: El extracto menciona: autor (João
Peres Nogueira), fecha (1258 o 1271)... DEBO incluir... --- No será
fácil verla desde la calle..."*. Diagnóstico contra código vivo: el
modelo ejecuta EN VOZ ALTA la "VERIFICACIÓN OBLIGATORIA PRIMERO" del
bloque de grounding — que nunca le pidió hacerla en silencio (el "No
muestres esta verificación" del system prompt aplica solo a la
VERIFICACIÓN FINAL) — y `sanitizeNarration()` solo limpiaba markdown.
El log de 4 horas confirmó producción: 1207 chars en `onstart` = la voz
leyó el preámbulo completo. Doble contaminación adicional: el detector
DT-51 corre sobre ese texto (posible "cumple" por el autor citado en el
preámbulo, no en el capítulo — falsos positivos en la instrumentación) y
los conteos de longitud quedaban inflados ~15-20% (matiz registrado en
DT-62).

**La cara buena de BUG-059 — hallazgo colateral mayor:** el capítulo
tras el preámbulo incluyó autor, fecha y motivo tejidos con naturalidad
en la prosa — **primera vez tras seis versiones de prompt fallando
0/n**. Enumerar los datos en voz alta antes de escribir (chain-of-thought
accidental) parece ser la técnica que funciona. Registrada como
candidata a técnica deliberada para v3.7: pedir explícitamente el
scratchpad de verificación + capítulo, y entregar solo el capítulo.

**Fix BUG-059 (estructural, cero cambio de prompt, cero
PROMPT_VERSION++):** en `sanitizeNarration()`, patrón determinista —
inicio con "Verificación/Verification/Mandatory first check" + separador
`---` dentro de los primeros 1200 chars → corte del preámbulo + log
`Debug.log`. Sin separador, no toca nada (fallo seguro: se habla el
preámbulo, como hoy). Un solo punto de inserción cubre voz, detector
DT-51, cache (sanitize corre también al leer de cache, línea 512) y
mediciones.

**Resto de la tanda (plan de impresión, ratificado):**

- **BUG-051 (fix aplicado):** `_unlockAudioOnFirstTap()` agregado a
  `finish()` del title card — cubre el camino automático del timer, no
  solo el tap. Si iOS rechaza el desbloqueo sin gesto directo, la red de
  seguridad de `initExplore()` queda intacta: nunca peor que antes.
- **BUG-056 (fix aplicado):** `csSteps`/`csKm` eliminados de
  `index.html` y `updateCareStrip()`. El care strip queda solo con
  clima. `AppState.steps`/`kmWalked` se siguen calculando (los usa el
  debug), solo dejaron de mostrarse. La app deja de violar su propio
  manifiesto.
- **BUG-055 (fix aplicado):** `renderExpanded()` limpiada — fuera
  `renderQuickFacts()`, `renderDepthPills()`, `onDepthPill()` (y sus
  contenedores en `index.html`), y las dos referencias a
  `Config.getNarratorLabel()`, función que NO existe desde DA-50 y
  sobrevivía como bomba latente solo porque los elementos que la
  invocaban ya no están en el HTML. El rediseño de la pantalla sigue
  siendo DT-16.

**Análisis del log de 4 horas (Barcelona → Sintra → Lisboa → Cali):**
wake lock ya rutinario (rechazo→gesto→adquirido + re-adquisiciones
automáticas); primer cache hit de narración registrado (Parque Güell,
13ms vs ~5000ms de API — el cache por huella funcionando); el
safety-timer de 792s del Palácio de Sintra NO es regresión — el timer
estuvo congelado en background (JS suspendido; nada corre ahí), y lo que
importa es que al volver la app se destrancó sola y siguió narrando;
rescates en primer plano dentro del techo (87-94s). Ruido de `canceled`
al saltar rápido entre POIs en simulador — esperable, a vigilar en
caminata real.

sw.js v44→v45. `node --check` OK en narration.js, app.js, poi.js.
Archivos: narration.js, app.js, poi.js, index.html, sw.js.

### Continuación Sesión 31 — Ronda v46: BUG-051 cerrado con veredicto de plataforma (decisión B) y BUG-058 con causa real encontrada

**BUG-051 — el fix v45 resultó PEOR que el síntoma, y eso cerró la
pregunta abierta.** Log de campo (18:22-18:28): primera apertura con tap
real → todo sonó. Segunda apertura sin tocar → `finish()` llamó el
unlock desde el timer → iOS lo aceptó **sin error y sin efecto** → la
bandera `_audioUnlocked` quedó en `true` falsamente → `_pendingWelcome`
no retuvo nada y la red de seguridad no tenía qué rescatar → cero
`onstart` en toda la sesión: bienvenida y DOS narraciones completas
mudas (892 y 992 chars hablados a la nada). Veredicto de plataforma,
documentado y cerrado: **el desbloqueo de audio en iOS exige gesto
directo del usuario; no existe camino automático.**

**Decisión B ratificada por Jaime — el tap se vuelve diseño:** si al
completar la carga el audio sigue bloqueado, el title card no avanza
solo — la etiqueta cambia a **"toca para comenzar"** y espera. Ese tap
es gesto real garantizado (`tapFinish` ya desbloquea y avanza), el
saludo suena al entrar a explore, y el tap deja de ser un misterio para
volverse umbral intencional — el "presiona start" de la experiencia. Si
el audio ya está desbloqueado (corazón del wizard en primera vez, o tap
temprano sobre el title card), avanza solo como siempre. Se eliminó el
unlock falso de `finish()`.

**Victoria del mismo log: la recuperación por `visibilitychange`
(BUG-057) se ejercitó DOS veces y funcionó perfecta** — síntesis muerta
tras volver del background → rescate en ~1.5s → POI marcado → siguiente
narración normal. Y el detector DT-51 dio su primera "falla" honesta
(Gaudí ausente del capítulo de la Sagrada Familia) — con BUG-059
limpiando el texto, la instrumentación ya mide de verdad.

**BUG-058 — hipótesis del overlay DESCARTADA, causa real encontrada.**
El secuestro se repitió con v45 (blindaje pointer-events activo), lo que
descartó la hipótesis por el criterio que dejamos escrito. Causa real:
`updateHistCount()` reescribía `listEl.innerHTML` con la lista completa
en **cada tick de stats**. En iOS un tap tarda ~200ms entre `touchstart`
y `click`; si el elemento tocado es destruido y recreado a mitad del
gesto — y el simulador en movimiento cambia las distancias en cada tick,
forzando rebuild constante — Safari **cancela el click por completo**,
sin burbujeo: no llega ni al contenedor. Todos los taps dentro del panel
morían contra un DOM que ya no existía. Los taps al mapa en modo
"Dibujar ruta" los consume además el handler de waypoints del simulador
— por eso tampoco el mapa cerraba. Fix: con el panel abierto, el rebuild
se congela (contenido levemente desactualizado mientras está abierto —
aceptable); se reconstruye en el siguiente tick tras cerrarse. El
blindaje pointer-events del overlay (v44) se conserva como defensa
válida en sí misma.

**Hallazgos de escritorio de la misma ronda (sin código):**
- **Narración-regaño (simulador):** el modelo rompió el personaje ante
  la contradicción ciudad-extracto ("dices estar en Cali pero el
  extracto es de Barcelona...") producida por la carrera del
  teletransporte: trigger a las 12:47:57, `fetchCityName` de Barcelona
  recién a las 12:51:04 — el prompt salió con la ciudad vieja. En
  caminata real es casi imposible, pero la cola de producción existe
  (abrir la app en ciudad nueva → POI activado antes de que resuelva la
  ciudad) — refuerza DT-60 como prioridad. Regla de blindaje anotada
  para v3.7: nunca romper el personaje; ante contradicción, confiar en
  el extracto. El regaño quedó cacheado para ese POI; el
  `PROMPT_VERSION++` de v3.7 lo purgará.
- **Media DT-62 resuelta leyendo código:** `callClaude()` envía
  `body.system = systemPrompt` como campo `system` REAL de la API,
  separado de `messages`. En producción el Prompt Maestro viaja por el
  canal correcto — la duda metodológica de S28 era sobre las pruebas de
  escritorio, no sobre producción. Falta solo confirmar que el Worker
  reenvía sin tocar. Consecuencia: las violaciones de longitud en
  producción ya no tienen excusa metodológica — el problema queda
  oficialmente en la cancha del prompt v3.7.

sw.js v45→v46. Archivos: app.js, sw.js.

---

## Sesión 32 — 17 Julio 2026 — Paquete narrativo v3.7: el scratchpad gana su guerra (DT-62 cerrada, DT-51 a cierre parcial, BUG-060)

**La sesión que destronó a S31 como la más productiva del proyecto.** Sesión
de escritorio + tres tandas de validación probabilística en el día (once
corridas totales entre cuatro navegadores, iPhone incluido), con un fix de
campo intermedio. El resultado central: el problema de autor/fecha — 0/n a
lo largo de cinco sesiones y cuatro enfoques de redacción — quedó resuelto
por la técnica del scratchpad, con estadística perfecta 4/4 y el primer
"cumple" del detector DT-51 en la historia de Follower.

### Cierre de DT-62 — el canal quedó verificado punta a punta

Prueba directa al Worker desplegado con curl: `system` de control
("Responde únicamente con la palabra: PASSTHROUGH") → el modelo respondió
literal. Combinado con la lectura de código de S31 (`callClaude()` envía
`system` como campo real de la API) y la lectura de `cloudflare/worker.js`
en el repo (passthrough puro: `await request.json()` →
`JSON.stringify(body)` sin tocar nada), la cadena cliente → Worker → API
usa el canal correcto de punta a punta. **DT-62 CERRADA.** Consecuencia
formal: las violaciones de longitud de producción (4/4 en S31) quedaron
sin excusa metodológica — eran falla del prompt v3.6, y esta sesión las
atacó.

### El material de ChatGPT — triaje en tres destinos

Jaime trajo trabajo paralelo hecho con ChatGPT: un replanteamiento
narrativo completo (tesis de ciudad, actos, epílogo), un Manifiesto
Narrativo v3.1 y un Manifiesto de POIs v1.0. Triaje ratificado:

1. **Ruta de tres fases:** Fase 1 = v3.7 (validar el instrumento de
   cumplimiento); Fase 2 = curaduría cinematográfica (DT-65); Fase 3 =
   Arquitectura Narrativa (tesis/actos/epílogo, candidata a DA, sesión de
   diseño propia). Razón del orden: la Fase 3 le pide a Haiku sostener
   estructuras complejas y la evidencia decía que no cumplía ni
   instrucciones simples — primero validar el vehículo (scratchpad).
2. **Manifiesto Narrativo v3.1 adoptado** (reemplaza v3.0) con sección
   obligatoria "Estado de implementación" (lección DT-60: los documentos
   no dicen "hecho" sobre lo que el código no hace). Su sección Puente
   Narrativo resolvió el Punto 4 de v3.7 tal cual estaba escrita.
3. **Manifiesto de POIs v1.0 adoptado** (documento nuevo): POI Detectado ≠
   Visible ≠ Narrable; Niveles A/B/C como criterio editorial (primera
   aplicación: DT-61/parques); Nivel D (infraestructura funcional) como
   alcance computable de DT-65; tensión Escasez vs. DA-72 registrada como
   pregunta abierta.

**La sesión de diseño de Fase 3 (tesis/actos/epílogo + las 6 preguntas del
resumen de ChatGPT) queda como agenda de apertura de un chat futuro
dedicado, con los dos manifiestos como documentos base.** Prerequisitos ya
definidos: scratchpad validado (cumplido esta misma sesión), DT-60, DT-53.

### El paquete v3.7 — decisiones ratificadas punto por punto

1. **Scratchpad deliberado, solo grounding wiki (2a=A):** la cara buena de
   BUG-059 convertida en técnica. Respuesta en dos partes: borrador de
   verificación con formato fijo (línea literal "Verificación
   obligatoria:" / "Mandatory first check:", enumeración autor/fecha/
   motivo o "no aparece", línea de presupuesto, cierre `---`) + capítulo
   directo. Alcance limitado al caso con evidencia (una variable a la
   vez); extensión a OSM = v3.8 con datos.
2. **El prompt dicta el formato que el strip ya reconoce (2b=A):** cero
   cambio a `sanitizeNarration()` — código validado en campo no se toca
   por hipótesis.
3. **`MAX_TOKENS` 380→550 (2c=A):** capacidad para el andamiaje que se
   descarta, NO permiso de longitud — distinción explícita contra la
   hipótesis 3 fallida de S27b, documentada en el comentario.
4. **Longitud por presupuesto en el scratchpad (3=A):** una línea más en
   el borrador; la sección LONGITUD del system prompt no se tocó (habría
   sido el séptimo intento del enfoque con seis fracasos). Plan B si
   fallaba: enforcement programático (no hizo falta).
5. **Regla 8: PUENTE NARRATIVO → CIERRE (4=A):** redacción derivada del
   Manifiesto v3.1. Elimina la promesa estructuralmente imposible ("el
   siguiente POI debe poder responderla" — el narrador no lo conoce) y la
   pregunta filosófica genérica (evidencia v3.2).
6. **Regla anti-regaño en LÍMITES ESTRICTOS (5=A):** evidencia S31
   (narración-regaño por contradicción ciudad-extracto). Nunca romper el
   personaje; ante conflicto, confiar en el extracto (dato verificado
   gana sobre string de ciudad). Cinturón mientras DT-60 mata la causa.
7. **Aclaración anti-conflicto en VERIFICACIÓN FINAL (detectada en
   implementación, lección v3.4):** "No muestres esta verificación"
   chocaba frontalmente con el scratchpad — aclarada su jurisdicción.

Un solo `PROMPT_VERSION v3.6→v3.7` (purgó de paso el regaño cacheado de
Sagrada Familia). Template validado contra el regex del strip antes de
entregar. Commits ①narration.js ②prompt maestro ③manifiestos ④sw.js v47.

### Tanda 1 (Maceta, n=4): v3.7 valida todo lo medible — y desentierra BUG-060

Firefox 128 / Chrome 150 / Edge 137 / Safari-EN 125 palabras — **cero
violaciones** contra 4/4 en 170-190 de S31. Formato 4/4 (strip 143/377/
308/390 chars). Cierres 4/4 sin promesa ni pregunta genérica. Safari
validó de regalo el espejo inglés completo. La bandera de "aves
inventadas" se disolvió: las 12 especies están nombradas en el extracto y
cada corrida muestreó un subconjunto legítimo.

Pero autor/fecha salió **vacuo**: ningún capítulo traía a Pombo ni 2015, y
la investigación (artículo real de Wikipedia + mapa de posiciones) reveló
el porqué — **BUG-060**: `poi.js` pedía `exchars=2500` pero la API
TextExtracts acepta máximo 1200 y recorta EN SILENCIO. La subida 1000→2500
de la sesión DT-51 nunca funcionó: "tángara multicolor" (pos. 1166)
entraba por un pelo; Pombo (1849), jamás. El scratchpad de Firefox (143
chars = todo "no aparece") era honestidad, no fallo — incluso leyó con
precisión que 2013 es la declaratoria del dulce, no fecha de creación.

**Fix ratificado (opción A):** `exchars` fuera del request + truncado en
cliente a 2500 con retroceso al último punto. `POI_CACHE_VERSION v4→v5`
mismo commit (DA-71); el cache de narraciones se auto-invalidó gratis vía
`extractFingerprint` — la decisión de diseño de S28 pagó exactamente para
lo que fue creada. sw.js v48.

### Tanda 2 (Maceta post-fix): falsa alarma resuelta con evidencia, no con pánico

Los tres capítulos nuevos siguieron sin Pombo → sospecha de fallo del
scratchpad en su prueba real. La disciplina de logs la desarmó: cache
purgado v0→v5 en los tres (poi.js nuevo al mando), 34/34 extractos, y el
desempate definitivo por consola en los tres navegadores: **extracto de
1332 chars, idéntico byte a byte, terminando en "...se encuentran 7
iconos."** — el artículo SÍ tiene sección (la lectura del render la había
aplanado) y Pombo/2015 viven tras el encabezado, donde `exintro` no llega
POR DEFINICIÓN. Nadie falló: BUG-060 quedó bien cerrado (+132 chars
reales recuperados — la "alegoría al 7" apareció en los capítulos nuevos
y en ninguno de los viejos), los scratchpads eran honestos, y la Maceta
es estructuralmente incapaz de ser la prueba reina. El hueco pasa a
**DT-66** (candidatas: fetch completo del POI activado vs. Wikidata
claims P170/P84/P571 — instinto: Wikidata es la definitiva).

### Tanda 3 (Sagrada Família, n=4): LA PRUEBA REINA — 16/16

| Corrida | Strip | Detector DT-51 | Palabras | Cierre |
|---------|-------|----------------|----------|--------|
| Safari iPhone | 355 | **cumple** [Antoni Gaudí] | 121 | anclado |
| Edge | 341 | **cumple** [Antoni Gaudí] | 130 | anclado |
| Chrome | 237 | **cumple** [Antoni Gaudí] | 119 | anclado |
| Firefox | 276 | **cumple** [Antoni Gaudí] | 113 | anclado |

"Antoni Gaudí empezó aquí en 1882" / "iniciada en 1882 por Antoni Gaudí"
— la frase imposible durante cinco sesiones, cuatro veces seguidas, tejida
con naturalidad. Primer "cumple" del detector en la historia del proyecto
(Safari, 07:06:55 del 17-jul). **DT-51 pasa a CIERRE PARCIAL:** misión
original cumplida; DT-66 hereda el caso fuera-de-intro.

Acumulado del día: 11 corridas, 11 scratchpads limpios, 0/11 violaciones
de longitud, 0/11 promesas hacia adelante. La única regla que siguió
fallando: personificación de la ciudad (2/3 en tanda-2 Maceta: "Cali
recordándose a sí misma", "Cali decidió"; 0/4 en Sagrada Família) — y la
regla de una-metáfora tomó un golpe en Edge/Sagrada (tres imágenes).
Ambas candidatas a líneas de scratchpad en v3.8, que es ahora la
herramienta probada para hacer cumplir lo que la redacción sola no logra.

### Hallazgos colaterales de los logs (tickets nuevos)

- **BUG-061:** re-narración de POI visitado tras salir del modo caminata
  por tap (2/2 Edge+Chrome, correlación perfecta con el tap de salida).
  Confirmar en código antes de tocar; si fue tap intencional al marcador,
  reclasificar como feature.
- **BUG-062:** visibility-recovery marca `visited=true` sobre narración
  interrumpida — capítulo perdido para siempre. Es el "fix 1b" de S31,
  hoy con TRES ocurrencias documentadas. Fix propuesto (sin ratificar):
  no marcar visited en ese camino de cierre; con cache el re-disparo es
  instantáneo.
- **Observaciones sin ticket:** voz tardía también en escritorio (43-48s
  de lag, rescatada por safety); bienvenida en idioma cruzado en Safari
  (wizard `lang=en`, bienvenida en español — posible fuga de DT-41);
  rendimiento de voz iOS notable (114-141ms de lag constante).

### Estado al cierre

sw.js **v48** · `PROMPT_VERSION` **v3.7** · `POI_CACHE_VERSION` **v5** ·
`MAX_TOKENS` **550**. Cerradas: DT-62, BUG-060. Cierre parcial: DT-51.
Nuevas: DT-65 (curaduría wiki Nivel D), DT-66 (autor/fecha fuera del
intro), BUG-061, BUG-062. Adoptados: `manifiesto_narrativo.md` v3.1,
`manifiesto_pois.md` v1.0. **Próximo chat dedicado: sesión de diseño de
Arquitectura Narrativa (Fase 3)** — tesis inicial de ciudad, tema/actos,
epílogo (absorbe DT-53), con las 6 preguntas del replanteamiento como
agenda y los manifiestos como base.

---

## Sesión 33 — 17 Julio 2026 — Diseño de Arquitectura Narrativa (Fase 3): nace DA-85

Sesión de escritorio 100% de diseño — cero código, patrón S24/DA-84
(definir antes de implementar). Agenda de apertura ratificada: las 6
preguntas del replanteamiento (traídas por Jaime al inicio del chat)
cruzadas con las 4 preguntas abiertas del manifiesto narrativo v3.1, con
los dos manifiestos como documentos base.

### El documento de Jaime cambió el punto de partida

Antes de arrancar el Punto 1, Jaime trajo una propuesta trabajada en
paralelo ("Arquitectura Narrativa + UX post-S32"): NO convertir Follower
en ruta guiada; la ciudad recibe una **tesis fija** ("Lisboa — la ciudad
que aprendió a mirar el mar") que actúa como **lente**, no como
itinerario; comportamiento de **tráiler, no índice** (responde "¿quién es
esta ciudad?", nunca "¿qué haré después?"); title card que se contrae a
tarjeta persistente con "Por descubrir · N" (POIs cercanos detectados
ahora — evidencias variables bajo tesis fija); actos internos pero
**inicialmente invisibles**; y Modo Curado como evolución premium por
selección narrativa, no por interfaz distinta. Triaje ratificado: el
concepto entra de lleno a la sesión (resuelve el Punto 1 y simplifica el
Punto 2); la tarjeta persistente sale a ticket propio de interfaz
(DT-67); Modo Curado queda como nota estratégica (v2.0, sin ticket).

Cuatro banderas levantadas y resueltas en el triaje: (1) "Por descubrir"
lista POIs que el propio documento prohíbe revelar — defendible por la
distinción detectados-ahora ≠ guion futuro, pero qué aporta vs. el mapa y
qué cuenta el N van al ticket DT-67; (2) la tesis es personificación pura
→ ratificada como **válvula**: personificación autorizada SOLO en
prólogo/tesis, prohibida en capítulos como hasta ahora; (3) el documento
no dice cómo se genera la tesis → trabajo central de la sesión; (4) la
contracción del title card es interfaz → DT-67.

### Decisiones ratificadas punto por punto (el paquete DA-85)

1. **Tesis: 100% generada por Haiku (opción A** sobre tabla curada B y
   solo-curada C): "la ciudad propone" no puede depender de una tabla
   escrita a mano. El riesgo de calidad se mitiga con el scratchpad —
   la herramienta que ganó su guerra en S32.
2. **Cache versionado:** `${THESIS_PROMPT_VERSION}_${cityName}_${lang}`;
   fijeza para el usuario, no para el desarrollo (espejo de DT-50).
3. **Insumo y degradación:** extracto wiki de la ciudad por el canal
   BUG-060-safe (sin `exchars`, truncado cliente 2500 con retroceso al
   último punto); wiki local primero (DT-41), fallback en.wiki;
   scratchpad con prohibición de datos literales (el prólogo promete, no
   informa); cascada de degradación sin cachear, nunca mostrar error;
   sin detector programático (no hay dato auditable — validación de
   campo).
4. **Momento y carrera:** fetch de tesis al resolver `fetchCityName()`
   primera vez, en paralelo con POIs; consumida por el prólogo hablado de
   primera vez (DA-78 intacta); **el saludo nunca espera a Haiku** — si
   la tesis no llegó, saludo actual y la tesis debuta en la tarjeta
   (pérdida acotada de su versión hablada, preferible a bloquear por
   red).
5. **Actos: opción A — la tesis es el único arco.** "Tema actual" no se
   modela en v1; continuidad sigue capítulo-a-capítulo (DT-39/DA-52).
   Una variable a la vez: no hay evidencia de que Haiku sostenga arcos.
6. **Capítulos: tesis como lente débil (opción A)** — bloque en system
   prompt ("cuando el lugar lo permita naturalmente... nunca literal,
   nunca forzada"), sin línea de scratchpad. Si el campo muestra que la
   ignora siempre, se gradúa con evidencia (doctrina v3.8). Fingerprint
   de tesis en la clave de cache de narración (auto-invalidación, la
   decisión que pagó en S32).
7. **Epílogo: disparador único = cierre confirmado DT-46**, jamás por
   inferencia — premio del cierre intencional. Haiku + scratchpad;
   insumo = capítulos de esta caminata (nace DT-68); bookend con la
   tesis (único lugar donde citarla literal es legítimo); `userName`
   permitido (DA-75); presupuesto corto; sin cache; degradación fija;
   0 capítulos → despedida simple. **DT-53 queda absorbida.**

### Respuestas formales a las 6 preguntas

1. ¿Tesis inicial de ciudad? — **Sí** (DA-85 §1). 2. ¿DA específica? —
**Sí: DA-85.** 3. ¿Modelar tema actual? — **No en v1** (la tesis es el
arco). 4. ¿Qué recibe cada capítulo? — lo de hoy + tesis como lente
débil. 5. ¿Farewell/Epílogo? — DA-85 §4. 6. ¿Formalizar curaduría? —
**aparcada a Fase 2** (DT-65 + tensión Escasez vs. DA-72), por la ruta de
tres fases de S32.

### Estado al cierre

Nace **DA-85** (arquitectura.md). Tickets nuevos: **DT-67** (tarjeta
persistente, sesión de diseño propia) y **DT-68** (acumulación de
capítulos, habilitador del epílogo). DT-53 absorbida por DA-85. DT-46 y
DT-60 anotadas como prerequisitos de implementación (epílogo y prólogo
respectivamente — DT-60 es el commit 1 de la implementación).
Manifiesto narrativo v3.1: sección "Estado de implementación"
actualizada (la Fase 3 pasa de "sesión pendiente" a "diseño ratificado,
implementación pendiente"). Cero código, cero sw.js bump (solo docs).
**Orden sugerido post-S33:** BUG-062 (fix pequeño ya propuesto) →
BUG-061 → DT-60 → implementación DA-85.

---

*Follower — Bitácora v0.9 | Sesión 33 | 17 Julio 2026*
