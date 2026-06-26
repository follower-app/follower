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

