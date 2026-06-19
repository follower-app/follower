# 🤖 REGLAS_IA.md
# Reglas de trabajo para asistentes IA en Follower

> Este archivo debe leerse ANTES de tocar cualquier línea de código.
> Aplica para Claude, ChatGPT, Gemini o cualquier IA que trabaje en este proyecto.

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

- `README_follower.md` — visión, pantallas, flujo completo
- `REGLAS_IA.md` — este archivo
- `docs/arquitectura.md` — decisiones técnicas *(próximamente)*
- `docs/bitacora.md` — historial, bugs resueltos, deuda técnica *(próximamente)*

Preguntarse siempre: **¿esto acerca al usuario a sentir que está en una película, o agrega fricción?**

---

## Regla de Producto

- **El GPS es el corazón** — nunca bloquear, pausar ni interrumpir su ciclo de detección
- **La narración siempre va SOBRE la música** — nunca antes, nunca sin música de fondo
- **El modo Libre es el default** — el modo Recorrido es siempre opt-in
- **Las sugerencias de cuidado son contextuales** — nunca intrusivas ni automáticas sin datos reales (pasos, clima)
- **No construir monetización** hasta completar piloto con viajeros reales (v1.0)

---

## Reglas Técnicas Críticas

| Regla | Descripción |
|-------|-------------|
| `detectPOI()` | ÚNICA función para detectar puntos de interés cercanos — nunca lógica duplicada |
| `triggerNarration(poi, mood, lang)` | ÚNICA función para iniciar narración AI — siempre recibe los 3 parámetros |
| `fadeMusic(mood, direction)` | ÚNICA función para transiciones de música — `direction`: 'in' o 'out' |
| `checkCareContext()` | Revisa pasos + clima + hora — NUNCA sugerir descanso sin pasar por esta función |
| Sístole `#1a5276` | Color de movimiento/caminando — nunca usar en estado de narración |
| Diástole `#c0392b` | Color de narración activa — nunca usar en estado de caminando |
| Dorado `#f0c87a` | Solo para estados de descanso y sugerencias de cuidado |
| POIs | Siempre desde OpenStreetMap via Leaflet — nunca hardcodeados en el código |
| Idioma | Siempre desde `userConfig.lang` — nunca asumir español por defecto |
| Mood | Siempre desde `userConfig.mood` — nunca asumir épico por defecto |

---

## Regla de Mockup

**Antes de implementar cualquier pantalla nueva:**
1. Hacer mockup interactivo en HTML
2. Iterar con el usuario hasta aprobación
3. Solo entonces integrar al proyecto real

Aplica para: nuevas pantallas, rediseños, cambios en flujos, onboarding.

---

## Regla de Estados — Sístole / Diástole

La app tiene dos estados de vida. **Nunca mezclarlos:**

| Estado | Color | Cuándo |
|--------|-------|--------|
| Sístole | `#1a5276` azul | Usuario caminando entre POIs |
| Diástole | `#c0392b` rojo | Usuario escuchando narración |
| Descanso | `#f0c87a` dorado | Sugerencia de pausa activa |
| Alerta | `#e74c3c` rojo vivo | Lluvia, urgencia, advertencia |

El color del botón central del bottom bar refleja SIEMPRE el estado actual. Es el indicador de vida de la app.

---

## Regla de Modos

| Modo | Default | Activación |
|------|---------|------------|
| Libre | ✅ Sí | Automático al iniciar |
| Recorrido | ❌ No | Solo si el usuario lo elige explícitamente |

**Transición inteligente:** si el usuario está a menos de 300m del inicio de un recorrido popular, la app puede sugerir activarlo — pero nunca activarlo automáticamente.

**Salida del recorrido:** en cualquier momento, sin perder el progreso de POIs visitados.

---

## Regla de Narración AI

- El prompt a Claude API siempre incluye: `poi.nombre`, `poi.descripcion`, `userConfig.mood`, `userConfig.lang`, `currentWeather`, `timeOfDay`
- La narración tiene máximo **3 minutos** — concisa, cinematográfica
- Si la API falla → reproducir narración de fallback pregenerada (offline)
- Nunca mostrar texto de error al usuario — la experiencia no se rompe

---

## Regla de Commits

Un commit por cambio específico. Formato:

```
feat: descripción corta de la nueva funcionalidad
fix: descripción corta del bug corregido  
docs: descripción de documentación actualizada
refactor: descripción del cambio técnico sin nueva funcionalidad
design: cambio visual o de interfaz
```

---

## Regla de sw.js — Orden de commits obligatorio

El service worker cachea el shell en el momento del install. Si `sw.js` se sube antes que los archivos corregidos, el cache queda con la versión bugueada.

**Orden obligatorio:**

1. `git add [archivos modificados]` → `git commit` → `git push`
2. Esperar 1-2 minutos para que GitHub Pages propague
3. Recién entonces: `git add sw.js` → `git commit -m "fix: bump cache vX-Y"` → `git push`

**El bump de `sw.js` es siempre el último commit de cualquier deploy.**

---

## Stack — No cambiar sin consultar

```
HTML + CSS + JS Vanilla     — sin frameworks
Leaflet.js                  — mapas OpenStreetMap
Claude API                  — narración AI en tiempo real
Web Speech API              — síntesis de voz nativa
OpenWeatherMap API          — clima en tiempo real
Web Audio API               — música por mood nativa
GitHub Pages                — hosting
PWA                         — instalable
```

**No usar:** React, Vue, Angular, npm, webpack, ni ningún build tool.

---

## Contexto del Proyecto

- **App:** `follower.github.io` *(próximamente)*
- **Repo:** `github.com/follower/app` *(próximamente)*
- **Estado actual:** v0.3 — diseño completo, iniciando código
- **Pantallas listas:** splash, exploración, POI expandido
- **Próximo hito:** v0.4 — alerta lluvia + resumen del paseo

---

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | PWA principal — modo exploración |
| `splash.html` | Pantalla de carga con latido |
| `config.js` | Configuración del usuario (idioma, mood) |
| `gps.js` | Detección de ubicación y POIs cercanos |
| `narration.js` | Integración Claude API |
| `music.js` | Control de música por mood |
| `weather.js` | Integración OpenWeatherMap |
| `care.js` | Lógica de sugerencias de cuidado |
| `sw.js` | Service worker PWA |
| `README_follower.md` | Documentación principal |
| `REGLAS_IA.md` | Este archivo |

---

*Follower — REGLAS_IA.md | Junio 2026*

---

## Regla de Offline — CRÍTICA

El offline no es opcional en Follower. Un turista puede perder señal en cualquier momento.

### Qué DEBE funcionar siempre sin señal

- Interfaz completa (shell cacheado por sw.js)
- Mapa de la zona ya cargada (tiles Leaflet cacheados)
- POIs del radio de 5km (cacheados en splash)
- Narración de POIs pre-generados (cacheada en splash)
- Música de los 4 moods (pre-cargada en splash)

### Reglas de implementación

| Regla | Descripción |
|-------|-------------|
| `cacheOnSplash()` | SIEMPRE pre-cargar POIs + narraciones + música durante el splash — nunca lazy load |
| Indicador offline | SIEMPRE discrero en el top pill — nunca modal de error intrusivo |
| Fallback narración | SIEMPRE hay un texto de fallback — nunca silencio ni error visible |
| Timeout API | Claude API tiene máximo 8 segundos — si falla, usar cache sin avisar al usuario |
| IndexedDB | POIs y narraciones se guardan en IndexedDB — nunca solo en memoria |
| sw.js | NUNCA hacer commit de sw.js antes que los archivos que cachea |

### Estrategia de cache por capa

```
Capa 1 — sw.js        → shell HTML, CSS, JS (siempre disponible)
Capa 2 — Leaflet      → tiles del mapa (zona activa)
Capa 3 — IndexedDB    → POIs, narraciones pre-generadas, config usuario
Capa 4 — Cache API    → música por mood, assets estáticos
```

### Al recuperar señal

- Sincronización silenciosa en background
- No interrumpir la experiencia del usuario
- Actualizar POIs y clima sin que el usuario lo note

