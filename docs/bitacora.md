# 📓 Follower — Bitácora v0.4

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
