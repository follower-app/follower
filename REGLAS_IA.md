# 🤖 REGLAS_IA.md
# Reglas de trabajo para asistentes IA en Follower

> Este archivo debe leerse ANTES de tocar cualquier línea de código.
> Aplica para Claude, ChatGPT, Gemini o cualquier IA que trabaje en este proyecto.
> Leer también: docs/contexto_maestro.md — el alma del producto.

---

## Regla de Oro — Archivos

**Antes de modificar cualquier archivo, SIEMPRE:**

1. Preguntar al usuario: *"¿El archivo [nombre] del proyecto está actualizado?"*
2. Si no está actualizado → pedirlo antes de tocar nada
3. Leer el archivo actual del proyecto o el que el usuario suba
4. Hacer SOLO el cambio necesario — nunca reescribir desde cero
5. Entregar SOLO el archivo modificado, no todos los archivos

**¿Por qué?** En sesiones anteriores se perdieron cambios porque se generaron archivos nuevos basados en versiones desactualizadas del proyecto, pisando el trabajo correcto. Esta regla evita ese problema.

---

## Regla de Cambios

- **Cambios pequeños y localizados** → el usuario los aplica directamente en VS Code con Ctrl+H
- **Cambios grandes o que afectan múltiples funciones** → la IA genera el archivo completo
- **Nunca reescribir un archivo completo si solo cambia una función**
- **Nunca generar un archivo desde cero si ya existe en el proyecto**

---

## Regla de Arquitectura

Antes de proponer cualquier cambio técnico, verificar alineación con:

- `docs/contexto_maestro.md` — alma del producto, pregunta rectora
- `README.md` — visión, pantallas, flujo completo
- `docs/arquitectura.md` — decisiones DA-1 a DA-10
- `docs/bitacora.md` — historial, bugs resueltos, deuda técnica

Preguntarse siempre:

> **¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?**

Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## Regla de Producto

- **El GPS es el corazón** — nunca bloquear, pausar ni interrumpir su ciclo de detección
- **La narración siempre va SOBRE la música** — nunca antes, nunca sin música de fondo
- **El modo Libre es el default** — el modo Recorrido es siempre opt-in
- **Las sugerencias de cuidado son contextuales** — nunca intrusivas ni automáticas sin datos reales
- **Los recorridos son relatos** — la ruta existe para servir a la narrativa, no al contrario
- **No construir monetización** hasta completar piloto con viajeros reales (v1.0)

---

## Reglas Técnicas Críticas

| Regla | Descripción |
|-------|-------------|
| `detectPOI()` | ÚNICA función para detectar POIs cercanos — nunca lógica duplicada |
| `triggerNarration(poi, mood, lang)` | ÚNICA función para iniciar narración AI |
| `fadeMusic(mood, direction)` | ÚNICA función para transiciones de música |
| `checkCareContext()` | Revisa pasos + clima + hora — NUNCA sugerir sin pasar por esta función |
| `setPhase(phase)` | ÚNICA función para cambiar sístole/diástole — nunca CSS directo |
| `navigateTo(screen)` | ÚNICA función para cambiar pantalla |
| Sístole `#1a5276` | Color de movimiento/caminando — nunca en estado de narración |
| Diástole `#c0392b` | Color de narración activa — nunca en estado de caminando |
| Dorado `#f0c87a` | Solo para estados de descanso y sugerencias de cuidado |
| POIs | Siempre desde OpenStreetMap via Overpass — nunca hardcodeados |
| Idioma | Siempre desde `Config.get('lang')` — nunca asumir español |
| Mood | Siempre desde `Config.get('mood')` — nunca asumir épico |

---

## Regla de Mockup

**Antes de implementar cualquier pantalla nueva:**
1. Hacer mockup interactivo en HTML
2. Iterar con el usuario hasta aprobación
3. Solo entonces integrar al proyecto real

---

## Regla de Estados — Sístole / Diástole

La app tiene dos estados de vida. **Nunca mezclarlos:**

| Estado | Color | Cuándo |
|--------|-------|--------|
| Sístole | `#1a5276` azul | Usuario caminando entre POIs |
| Diástole | `#c0392b` rojo | Usuario escuchando narración |
| Descanso | `#f0c87a` dorado | Sugerencia de pausa activa |
| Alerta | `#e74c3c` rojo vivo | Lluvia, urgencia, advertencia |

El color del botón central del bottom bar refleja SIEMPRE el estado actual.

---

## Regla de Modos

| Modo | Default | Activación |
|------|---------|------------|
| Libre | ✅ Sí | Automático al iniciar |
| Recorrido | ❌ No | Solo si el usuario lo elige explícitamente |

**Transición inteligente:** sugerir si el usuario está a <300m del inicio — nunca activar automáticamente.

**Salida del recorrido:** en cualquier momento, sin perder el progreso de POIs visitados.

---

## Regla de Narración AI

- Motor actual: **Claude API (claude-haiku-4-5)** vía Cloudflare Worker — key nunca expuesta en el repo
- Endpoint: `https://followernarration.jaimeand.workers.dev/narration`
- El prompt siempre incluye: `poi.name`, `poi.description`, `AppState.cityName`, `mood`, `lang`, `topic`
- La narración tiene máximo **3 minutos** — concisa, cinematográfica
- Flujo: cache IndexedDB → Claude API vía Worker (timeout 15s) → fallback genérico
- Nunca mostrar error al usuario — la experiencia no se rompe
- Histórico: se probó Gemini 1.5 Flash (abandonado por bug de Google AI Studio emitiendo
  keys en formato `AQ.` incompatible con el endpoint REST), y OpenAI gpt-4o-mini
  (abandonado por requerir billing activo desde el primer request)

---

## Regla de Offline — CRÍTICA

| Regla | Descripción |
|-------|-------------|
| Indicador offline | Discreto en el top pill — nunca modal de error intrusivo |
| Fallback narración | Siempre hay texto de fallback — nunca silencio ni error visible |
| Timeout API | Claude API (vía Worker) máximo 15 segundos — si falla, usar cache |
| IndexedDB | POIs y narraciones en IndexedDB — nunca solo en memoria |
| sw.js | NUNCA commitear antes que los archivos que cachea |

**4 capas de cache:**
```
Capa 1 — sw.js      → shell HTML, CSS, JS
Capa 2 — Leaflet    → tiles del mapa
Capa 3 — IndexedDB  → POIs, narraciones, config
Capa 4 — Cache API  → música, assets
```

---

## Regla de Commits

Un commit por cambio específico. Formato:

```
feat: nueva funcionalidad
fix: bug corregido
docs: documentación actualizada
refactor: cambio técnico sin nueva funcionalidad
design: cambio visual o de interfaz
```

---

## Regla de sw.js — Orden obligatorio

1. `git add [archivos]` → `git commit` → `git push`
2. Esperar 1-2 minutos (GitHub Pages propaga)
3. Recién entonces: `git add sw.js` → `git commit -m "fix: bump cache vX-Y"` → `git push`

**sw.js es siempre el último commit de cualquier deploy.**

---

## Stack — No cambiar sin consultar

```
HTML + CSS + JS Vanilla     — sin frameworks
Leaflet.js                  — mapas OpenStreetMap (mirror lz4.overpass-api.de)
Claude API (Haiku)          — narración AI, vía Cloudflare Worker proxy
Web Speech API              — síntesis de voz nativa (12 idiomas)
OpenWeatherMap API          — clima en tiempo real, vía Cloudflare Worker proxy
Web Audio API               — música por mood nativa
IndexedDB                   — cache offline
GitHub Pages                — hosting (repo público)
Cloudflare Workers          — proxy de API keys (gratis, sin tarjeta)
PWA                         — instalable
```

**No usar:** React, Vue, Angular, npm, webpack, ni ningún build tool.

---

## Contexto del Proyecto

- **App:** [follower-app.github.io/follower](https://follower-app.github.io/follower)
- **Repo:** [github.com/follower-app/follower](https://github.com/follower-app/follower) (público)
- **Worker:** [followernarration.jaimeand.workers.dev](https://followernarration.jaimeand.workers.dev) — proxy de Claude API y OpenWeatherMap
- **Estado actual:** v0.5 — debugging activo, POIs/narración/clima funcionando vía Worker, panel debug.js integrado
- **Próximo hito:** v0.6 — música por mood (DT-2), íconos PWA (DT-1), pruebas integración completa en iPhone

---

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Shell mínimo — 4 pantallas + 2 modales |
| `manifest.json` | PWA config |
| `sw.js` | Service worker (pendiente — siempre último) |
| `css/main.css` | Variables globales, reset, sistema de fases |
| `css/components.css` | Botones, pills, cards, waves |
| `css/splash.css` | Latido, rings, animación expansión |
| `css/modal.css` | Modales, care card, route picker |
| `css/explore.css` | Mapa, pins POI, card pequeña |
| `css/poi.css` | Pantalla POI expandida |
| `js/keys.js` | Vacío — LOCAL ONLY, .gitignore. Claude y clima vía Worker, no se carga en index.html |
| `js/config.js` | Idioma, mood, preferencias, localStorage |
| `js/app.js` | AppState, navigateTo(), setPhase(), init |
| `js/gps.js` | Leaflet, watchPosition, Haversine, Nominatim |
| `js/poi.js` | Overpass OSM (lz4 mirror), IndexedDB, detectPOI |
| `js/narration.js` | Claude API vía Worker, prompts × 4 moods × 2 langs |
| `js/voice.js` | Web Speech API, 12 idiomas BCP-47 |
| `js/music.js` | Web Audio API, fadeMusic, dip/restore |
| `js/weather.js` | OpenWeatherMap vía Worker, lluvia, cache 30min |
| `js/care.js` | checkCareContext, 4 prioridades, cooldown |
| `js/routes.js` | 5 recorridos Roma, Leaflet polyline, picker |
| `js/debug.js` | Panel debug flotante — Estado/Buscar POI/Logs/Tiempos, métricas con historial persistente (DA-12), export .txt |
| `docs/contexto_maestro.md` | Alma del producto, principios, pregunta rectora |
| `docs/producto.md` | Producto, usuarios, principios |
| `docs/arquitectura.md` | Decisiones DA-1 a DA-10 |
| `docs/bitacora.md` | Historial, bugs, deuda técnica |

---

*Follower — REGLAS_IA.md | Junio 2026*
