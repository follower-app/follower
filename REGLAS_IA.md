# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Overpass OSM · GitHub Pages · PWA
Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

## Documentos del proyecto

- README.md → visión, flujo, pantallas, roadmap
- REGLAS_IA.md → reglas completas de trabajo
- docs/contexto_maestro.md → alma del producto, principios fundamentales, pregunta rectora
- docs/producto.md → producto v0.9, usuarios, principios
- docs/arquitectura.md → decisiones DA-1 a DA-61
- docs/bitacora.md → historial, bugs, deuda técnica (hasta Sesión 18)
- docs/manifiesto_narrativo.md → voz narrativa, capítulos, tesis de ciudad
- docs/manifiesto_care_strip.md → hospitalidad urbana, voz del cuidado
- docs/prompt_maestro_follower.md → Prompt Maestro v2.7 oficial
- docs/dt42_care_miniprompt.md → mini-prompt de Care, listo para implementar

## Arquitectura de archivos

```
follower/
├── index.html          → shell mínimo
├── sw.js               → service worker (siempre último en commits)
├── manifest.json       → PWA config
├── css/                → main, splash, explore, poi, modal, components
├── js/                 → app, config, gps, poi, narration, voice,
│                          weather, care, routes, debug, debug-sim
│                          (music.js eliminado en v0.9 — DA-50)
├── assets/             → logo.svg (pendiente DT-1), icons/
└── docs/               → contexto_maestro, producto, arquitectura,
                           bitacora, manifiesto_narrativo,
                           manifiesto_care_strip, prompt_maestro_follower,
                           dt42_care_miniprompt
```

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en archivos de audio — `music.js` no existe
- Modo Libre es default — Modo Recorrido es siempre opt-in
- Offline obligatorio — 4 capas de cache — la experiencia nunca se rompe
- sw.js siempre último en commits — nunca junto a otros archivos
- Nunca mostrar errores al usuario — siempre hay fallback
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?
- PowerShell en Windows: nunca usar `&&` para encadenar comandos — ejecutar por separado
- Mensajes de commit sin caracteres acentuados

## Funciones únicas — nunca duplicar

- `detectNearby()` → poi.js
- `trigger(poi, _unused, lang, topic)` → narration.js (style eliminado en DA-50)
- `getCityWelcome(city, _unused, lang)` → narration.js
- `getLocalLang(countryCode)` → narration.js (DT-41)
- `checkCareContext()` → care.js
- `checkSpecialZone(lat, lng)` → care.js (DT-43)
- `setPhase(phase)` → app.js
- `navigateTo(screen)` → app.js
- `welcomeCity(city, countryCode)` → app.js (countryCode agregado DT-41)
- `onWalkInactivity()` → app.js (DT-40)

## Estado actual

v0.9 — En campo. Primera prueba completada 1 Jul 2026 (Barcelona sim + Cali real).

**Implementado en Sesión 18:**
- DA-50: Narrador único — Prompt Maestro v2.7 — 5 archivos
- DT-26: Weather.invalidateCache() en startTestSession() — removido
- DT-36: cleanPOIName() — sufijos Wikipedia eliminados antes del prompt
- DT-38: _pendingDetect — detectPOI inmediato post-carga (TTF reducido)
- DT-39: _walkChapters[] — memoria de capítulo anterior en buildPrompt
- DT-40: inactividad 30m/10min → onWalkInactivity()
- DT-41: COUNTRY_LANG + getLocalLang() — bienvenida en idioma local
- DT-43: checkSpecialZone() — ≥3 POIs en 150m → Care "zona especial"
- DT-42: mini-prompt de Care redactado (docs/dt42_care_miniprompt.md)

**Fixes post-campo (1 Jul 2026):**
- narration.js: longitud 220-280 → 130-160 palabras, max_tokens 480 → 380
- poi.js: artwork removido de query Overpass (murales de artistas foráneos)
- sw.js: v4

## Pendientes críticos

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-44 | Medir latencia v2.7 en campo real (próxima caminata) | Crítica |
| DT-42 | Implementar Care generativo (prompt ya redactado) | Alta |
| DT-32 | Confirmar cola narrativa en campo | Alta |
| DT-29 | Confirmar cobertura Wikipedia en Centro Histórico Cali | Alta |
| DT-45 | UI: pantalla de bienvenida animada | Alta |
| DT-46 | UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración | Media |
| DT-9  | Revocar key OpenAI expuesta (console.openai.com) | Alta |
| DT-1  | Logo SVG final + iconos PWA | Alta |

## El Narrador

Una sola voz. No hay selector de narradores. El Prompt Maestro v2.7 define la voz completa.
Target de longitud: **130-160 palabras. Máximo absoluto: 170.**
Ver `docs/prompt_maestro_follower.md`.

## Cache IndexedDB

Clave de narración: `${poiId}_${lang}_${topic}` — sin style desde DA-50.
Limpiar cache en campo cuando se actualice el prompt.

## Identidad

Logo: Corazón C2 con brújula · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev
