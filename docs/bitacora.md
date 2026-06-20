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

*Follower — Bitácora v0.5 | Junio 2026*

