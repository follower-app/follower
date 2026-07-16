# 🎬 Follower — Instrucciones del Proyecto (compactas)

**Versión completa: `docs/instrucciones_proyecto.md` — leerla al iniciar cada sesión.**

## Qué es

Follower: PWA de exploración cinematográfica — narración AI en tiempo real, GPS, cuidado contextual. La ciudad es la banda sonora. Visión: el teléfono va al bolsillo y la app orquesta todo sola.

Stack: HTML+CSS+JS Vanilla · Leaflet · Claude Haiku (Cloudflare Worker) · Web Speech API · OpenWeatherMap · Wikipedia GeoSearch + Overpass OSM · GitHub Pages · PWA. Sin frameworks, sin npm, sin build.

## Regla de Oro

Antes de modificar cualquier archivo SIEMPRE preguntar: "¿El archivo [nombre] está actualizado?" El panel es fotografía estática; el árbitro ante desfase es `raw.githubusercontent.com/follower-app/follower/main/...`. Ante cualquier "ya quedó hecho", el árbitro es el código, no el resumen (DT-60 se reabrió en S31 por esto).

**Cierre de sesión:** commit → panel → estas instrucciones → chat nuevo. En ese orden.

## Reglas críticas

- Sístole `#1a5276` = caminando · Diástole `#c0392b` = narrando · Nunca invertir
- GPS nunca se interrumpe · Offline obligatorio · Nunca mostrar errores al usuario
- Modo Libre default (DA-76) · `music.js` stubbed
- POIs cascada DA-72: wiki local+es → si neto <8 → Overpass curado → si neto <3 → en.wikipedia → IndexedDB. Curar antes de exponer (DA-73)
- DA-71: cambio a query/filtros POIs → `POI_CACHE_VERSION++` mismo commit (actual v4)
- DT-50: cambio al Prompt Maestro → `PROMPT_VERSION++` mismo commit (actual v3.6)
- Archivo servido cambió → sw.js bump, commit final aparte (actual **v46**)
- Narración 90–130 palabras (max_tokens 380) · DA-75: userName solo welcome/farewell, nunca al Worker
- DA-77: `_unlockAudioOnFirstTap()` puerta única de audio, bandera por carga de página
- **VEREDICTO iOS (S31):** el desbloqueo de audio EXIGE gesto directo — desde timer se acepta sin efecto y mata toda la sesión de audio. Respuesta: umbral "toca para comenzar" en title card (decisión B)
- DT-54 (S31): walkmode.js — wake lock con reintento en primer gesto (`NotAllowedError` al cargar es normal) + modo caminata (movimiento sostenido + 15s sin tocar → overlay negro; tap sale)
- **Patrón freeze-while-open (S31):** nunca reescribir innerHTML de una lista con su panel abierto — en iOS mata los taps en vuelo (pantalla "secuestrada")
- BUG-059 (S31): `sanitizeNarration()` corta preámbulos meta ("Verificación... ---") — NO quitar ese strip
- DA-84 (S31, sin implementar — DT-64): brújula sin ícono; permiso en gesto existente; cono solo con POI activo
- `?reset=1`: simula primera vez (no toca IndexedDB)
- Sin `&&` en PowerShell · commits sin acentos · `node --check` antes de entregar JS
- Pregunta rectora: ¿experiencia cinematográfica o audioguía tradicional?

## Estado (Sesión 31, 15-jul-2026 — sw.js v41→v46 en un día)

**Desplegado:** DT-54 (wake lock validado en campo + modo caminata) · BUG-051 CERRADO (decisión B) · BUG-053 (mapa sigue al caminante, panTo con margen 30%, arrastre pausa 10s) · BUG-054/058 (panel: tap cierra + rebuild congelado) · BUG-055 (POI expandido sin relictos; getNarratorLabel era bomba latente) · BUG-056 (care strip solo clima) · BUG-057 (recuperación visibilitychange + techo 120s, validada 2x) · BUG-059 (strip preámbulo hablado)

**Hallazgos S31 (detalle en bitacora.md S31):**
1. DT-62 medio resuelta: `callClaude()` envía `system` REAL — la sobre-longitud (4/4 en ~170-190 palabras) es falla del prompt v3.6 en producción, sin excusa metodológica. Falta vistazo al Worker
2. Técnica scratchpad: verificación en voz alta = primera vez que autor/fecha entran al capítulo (6+ versiones fallando). Candidata a v3.7
3. Narración-regaño (simulador): contradicción ciudad-extracto por carrera de teletransporte → regla anti-regaño para v3.7. Cola real: POI antes de fetchCityName en ciudad nueva → refuerza DT-60
4. DT-60 REABIERTA: dataPromise del title card solo espera GPS, no ciudad ni POIs; barra cosmética
5. Contexto: familia de Jaime viaja a Europa próxima semana — prueba multi-ciudad real

## Pendientes (orden)

1. ~~Validar v46~~ HECHO (cierre S31, todo OK)
1b. Ratificar: en `visibility-recovery` NO marcar POI visited — hoy la narración interrumpida (foto/WhatsApp a mitad de capítulo) se pierde para siempre; sin marcar, se re-dispara al volver (cache = gratis)
1c. Documentar como DA: background en PWA iOS es limitación sin remedio JS (voz y GPS mueren). El caso diseñado (bolsillo + wake lock + modo caminata) sí funciona. Soluciones v2.0: TTS servidor + <audio>/Media Session, o Capacitor. Análisis Capacitor (S31): envoltorio, no migración — vanilla entra tal cual; cascarón 1-2 días + voice/gps nativos ~1-2 semanas, por fases. React Native descartado. Builds: Mac 10.13 de Jaime NO sirve; plan sin comprar Mac = Android local (Windows) + GitHub Actions macOS (gratis, repo público) para iOS. iPhone de pruebas sirve tal cual. Todo POST-viaje
2. **Paquete narrativo v3.7 (sábado):** DT-62 cierre + longitud + continuidad de Jaime corregida (sin promesas hacia adelante, ejemplos anclados) + scratchpad + anti-regaño. UN PROMPT_VERSION++ + prueba n≥4
3. DT-60: dataPromise espera fetchCityName
4. DT-64 (brújula) · DT-63 (campo flujo completo)
5. DT-61 + parques (POI_CACHE_VERSION++)
6. Panel rediseño (DT-16) · DT-53 · DT-58/59 sin ratificar
7. Vigilar: voz muere en silencio en primer plano 2-3x/sesión (safety la rescata)

## Enlaces

App: https://follower-app.github.io/follower/ · Worker: followernarration.jaimeand.workers.dev · Prompt Maestro: docs/prompt_maestro_follower.md (v3.6)
