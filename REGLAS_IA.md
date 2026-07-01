# 🎬 Follower — Instrucciones del Proyecto

## Qué es este proyecto

Follower es una PWA de exploración cinematográfica que usa narración AI en tiempo real, GPS y cuidado humano contextual para convertir cualquier paseo en una experiencia memorable. La ciudad misma es la banda sonora.

Stack: HTML + CSS + JS Vanilla · Leaflet.js · Claude Haiku (vía Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch · GitHub Pages · PWA
Sin frameworks. Sin npm. Sin build step.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" — nunca trabajar sobre versiones desactualizadas.

## Documentos del proyecto

- README.md → visión, flujo, pantallas, roadmap
- REGLAS_IA.md → reglas completas de trabajo
- docs/contexto_maestro.md → alma del producto, principios fundamentales, pregunta rectora
- docs/producto.md → producto v0.9, usuarios, principios, DTs activas
- docs/arquitectura.md → decisiones DA-1 a DA-61
- docs/bitacora.md → historial, bugs, deuda técnica (hasta Sesión 18)
- docs/manifiesto_narrativo.md → voz narrativa, capítulos, tesis de ciudad
- docs/manifiesto_care_strip.md → hospitalidad urbana, voz del cuidado
- docs/prompt_maestro_follower.md → Prompt Maestro v2.7 oficial
- docs/dt42_care_miniprompt.md → spec de Care generativo (system + 5 prompts por trigger)

## Arquitectura de archivos

```
follower/
├── index.html          → shell mínimo, sin selector de narrador (DA-50)
├── sw.js               → service worker v4 (siempre último en commits)
├── manifest.json       → PWA config
├── css/                → main, splash, explore, poi, modal, components
├── js/                 → app, config, gps, poi, narration, voice,
│                          weather, care, routes, debug, debug-sim
│                          (music.js eliminado en v0.9 — DA-50, stub vacío)
├── assets/             → logo.svg (pendiente DT-1), icons/
└── docs/               → contexto_maestro, producto, arquitectura,
                           bitacora, manifiesto_narrativo,
                           manifiesto_care_strip, prompt_maestro_follower,
                           dt42_care_miniprompt
```

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe — es el latido de la app
- La ciudad sonora vive en el prompt narrativo, no en archivos de audio — `music.js` no existe (eliminado, DA-50)
- Modo Libre es default — Modo Recorrido es siempre opt-in
- Offline obligatorio — 4 capas de cache — la experiencia nunca se rompe
- sw.js siempre último en commits
- Nunca mostrar errores al usuario — siempre hay fallback
- Narración: objetivo 130-160 palabras, máximo duro 170 (`max_tokens: 380`)
- Pregunta rectora: ¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

## Funciones únicas — nunca duplicar

- `detectNearby()` → poi.js
- `trigger(poi, lang, topic)` → narration.js
- `getFarewell()` → narration.js
- `getCareMessage(type, candidatos, ctx)` → narration.js
- `checkCareContext()` / `checkSpecialZone()` → care.js
- `cleanPOIName()` → narration.js
- `setPhase(phase)` → app.js
- `navigateTo(screen)` → app.js
- `welcomeCity(city)` → app.js
- `onWalkInactivity()` → app.js

## Estado actual

v0.9 — Sesión 18 completada. Narrador único implementado y en código
(DA-50, 7 archivos afectados). Memoria de capítulo, bienvenida multilingüe,
detección de inactividad y zona especial: todas implementadas y activas.

Próximo: implementar Care generativo en `care.js` (DT-42 — prompt ya
redactado, código pendiente) y validar en campo la arquitectura consolidada.

## Completado en Sesión 18

- DA-50: narrador único (Prompt Maestro v2.7) — `narration.js`, `config.js`,
  `app.js`, `index.html` (selector eliminado)
- DT-26, 36, 38, 39, 40, 41, 43 — todos resueltos
- DT-42: mini-prompt de Care redactado (código aún no implementado)
- Fix post-campo: narración 130-160 palabras, `artwork` eliminado de query Overpass
- sw.js v4

## Pendientes críticos

- DT-42: implementar Care generativo en `care.js` (prompt listo en
  `docs/dt42_care_miniprompt.md`)
- DT-32 / DT-29 / DT-30: validar en campo real la arquitectura consolidada
- DT-9: revocar key OpenAI de commits históricos
- DT-45: UI de bienvenida animada
- DT-44: medir si la autoevaluación interna del v2.7 afecta latencia
  (antes de tocar más `narration.js`)
- DT-47: wizard de configuración (pendiente de diseño)

## El Narrador

Una sola voz. No hay selector de narradores. El Prompt Maestro v2.7 define
la voz completa — ya implementado en `narration.js`. Ver
`docs/prompt_maestro_follower.md`.

## Identidad

Logo: Corazón C2 con brújula · Slogan: "your city soundtrack"
Fuentes: DM Serif Display (display) + Inter (UI)
App: https://follower-app.github.io/follower/
Worker: https://followernarration.jaimeand.workers.dev

---

*Follower — REGLAS_IA.md | v0.9 post-campo | Julio 2026*
