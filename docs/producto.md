# 📋 Follower — Documento de Producto v0.7

> Junio 2026 — Rediseño de experiencia completo · Narradores, música, UI · Iniciando pruebas de campo

---

## 1. Visión del Producto

> *"your city soundtrack"*

Follower es una experiencia cinematográfica de exploración urbana. Transforma cualquier paseo en una historia: narración AI en tiempo real, música que prepara emocionalmente antes de cada relato, y un acompañante que cuida de ti mientras caminas.

**Follower no es un mapa. No es una audioguía. No es Wikipedia hablada.**

Follower compite por emoción, no por información.

> *Pregunta rectora de cada decisión de producto:*
> **¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?**
> Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

## 2. Origen

Follower nace de una experiencia real durante un viaje por Europa. Se necesitaban cuatro herramientas distintas simultáneamente: Google Maps para orientarse, ChatGPT para contexto histórico, Free Tours para narrativa y Spotify para ambientación. La experiencia era valiosa pero fragmentada.

La pregunta fundacional: **¿por qué nadie reúne todo esto en una sola experiencia?**

---

## 3. El Problema que Resuelve

| Problema | Por qué importa |
|----------|----------------|
| **Audioguías aburridas** | Pregrabadas, genéricas, sin reacción al contexto real del usuario |
| **Free tours rígidos** | Dependen de un guía, horarios fijos, grupos grandes, sin personalización |
| **Mapas sin alma** | Google Maps da datos fríos, no cuenta historias ni genera emoción |
| **Experiencia fragmentada** | Música, narración y mapa son cuatro apps distintas abiertas en paralelo |
| **Sin cuidado humano** | Ninguna app sabe que estás cansado, que va a llover o que llevas 3 km caminados |
| **Carga cognitiva** | La logística del viaje roba espacio a la experiencia misma |

---

## 4. Propuesta de Valor

Follower no vende información. Vende **inmersión, emoción y compañía**.

- La narración reacciona al lugar exacto donde estás, en tiempo real
- La música aparece sola antes de cada historia, preparando la emoción
- Un narrador con personalidad propia te acompaña durante todo el paseo
- La app sabe cuándo sugerir descanso, refugio del calor o un café
- Funciona sin señal — la experiencia no se rompe nunca

La ciudad siempre es la protagonista. Follower nunca debe sentirse más importante que el lugar que el usuario está explorando.

---

## 5. Usuarios Objetivo

| Perfil | Descripción |
|--------|-------------|
| **Principal** | Viajero independiente 25-45 años, solo o en pareja, que busca experiencias auténticas sobre itinerarios turísticos estándar |
| **Secundario** | Turista cultural que quiere profundidad histórica sin la rigidez de un grupo ni la frialdad de una audioguía |
| **Terciario** | Local que quiere redescubrir su propia ciudad con una mirada nueva |

**Métrica principal de validación:** no usuarios registrados, no POIs detectados, no minutos escuchados.

> ¿La experiencia fue memorable?

---

## 6. Principios del Producto

| Principio | Descripción |
|-----------|-------------|
| **Cinematográfico** | Cada paseo debe sentirse como una película, no como una clase |
| **Manos libres** | El usuario no toca la pantalla mientras explora |
| **Humano** | La app cuida, siente y reacciona como un acompañante real |
| **Global** | Cualquier ciudad, cualquier idioma, desde el día 1 |
| **Invisible** | La tecnología desaparece — solo queda la experiencia |
| **Resiliente** | Funciona sin señal, la experiencia no se rompe nunca |
| **La ciudad primero** | Los POIs son actores secundarios. La historia es la protagonista |

---

## 7. Sistema de Narradores *(v0.7 — activo)*

En v0.7, el sistema de "moods" fue reemplazado completamente por **cuatro narradores con personalidad propia**. Cada narrador tiene voz, sistema de prompts (system + user, en español e inglés) y caché independiente por estilo.

| Narrador | Emoji | Personalidad | Estilo narrativo |
|----------|-------|--------------|-----------------|
| **Storyteller** | 🎭 | Cuentero apasionado | Personajes reales, emoción, suspenso |
| **Historiador** | 🏛️ | Académico riguroso | Fechas, contexto, causa y consecuencia |
| **Explorador** | 🔎 | Curioso incansable | Datos sorprendentes, conexiones inesperadas |
| **Local** | ❤️ | Vecino orgulloso | Vida cotidiana, anécdotas, orgullo de barrio |

Un quinto narrador (**Familiar**) está planificado para una versión futura.

**Principio técnico:** `trigger()` ignora el parámetro `mood` heredado y lee `AppState.narrationStyle`. La caché usa `style` en la key (`poiId_style_lang_topic`) — cada narrador guarda su propia narración para el mismo POI.

---

## 8. Sistema de Música *(v0.7 — activo)*

En v0.7, la música de fondo continua fue eliminada. Reemplazada por **intros cortas por narrador** (`playNarratorIntro()`) que suenan antes de cada narración y crean el momento cinematográfico de entrada.

- Implementación: Web Audio API con Promise-based, safety timer de 3s en iOS
- Si el MP3 no existe o falla, `Promise.race` garantiza que la voz arranca igual
- `initFromGesture()` activa el AudioContext desde el primer gesto del usuario (requerido en iOS Safari)
- Los 4 MP3 (`storyteller-intro.mp3`, `historian-intro.mp3`, `explorer-intro.mp3`, `local-intro.mp3`) están pendientes de creación — DT-19

---

## 9. Bienvenida de Ciudad *(v0.7 — activo)*

Al entrar a una ciudad, aparece una frase única centrada sobre el mapa con fade in/out. Cada narrador tiene su propia frase de bienvenida para la misma ciudad.

- Texto en DM Serif Display, centrado, sobre el mapa
- Se dispara una vez por sesión
- Desaparece automáticamente a los 5 segundos o al tocar
- Si Nominatim no responde en 10s, aparece un fallback genérico según idioma activo
- `_cityWelcomeDone` se resetea en cada `initExplore()` — nueva sesión, nueva bienvenida

---

## 10. Modos de Exploración

### Modo Libre *(default — DA-8)*
Camina sin rumbo. La app detecta POIs en un radio de 120m y reacciona. Descubrimiento orgánico. El usuario nunca recibe instrucciones de ruta.

### Modo Recorrido *(opt-in)*
Ruta temática curada con arco narrativo. La ruta existe para servir a la narrativa, no al contrario. El usuario elige activamente entrar a este modo.

> Un recorrido debe responder *¿qué historia estamos contando?* antes de responder *¿qué lugares vamos a visitar?*

### Transición inteligente
Sugerencia si el usuario está a < 300m del inicio de un recorrido. Nunca automático.

---

## 11. Recorridos Disponibles — Roma *(en routes.js)*

| Recorrido | Km | Duración | POIs |
|-----------|-----|----------|------|
| 🏛️ Roma Imperial | 3.2 | 2h | 8 |
| 🌙 Roma Nocturna | 2.1 | 1.5h | 6 |
| 🌹 Roma Romántica | 2.8 | 2h | 7 |
| 🔮 Roma Secreta | 4.0 | 2.5h | 10 |
| 😄 Roma Curiosa | 3.5 | 2h | 9 |

Ciudades planificadas para versiones futuras: Barcelona (Gaudí), París Romántico, Cali Salsera, Lisboa de los Exploradores.

---

## 12. Sistema de Cuidado Contextual

`care.js` evalúa condiciones en orden de prioridad. La experiencia humana tiene prioridad sobre la narración.

| Prioridad | Condición | Acción |
|-----------|-----------|--------|
| 1 | Temp ≥ 30°C | Buscar refugio del calor |
| 2 | Temp ≤ 5°C | Buscar lugar cálido |
| 3 | Hora almuerzo + > 1km caminado | Sugerir restaurante |
| 4 | > 2km caminados | Sugerir café de descanso |
| 5 | Lluvia | Alerta + buscar refugio |

Cooldown de 20 minutos entre sugerencias. Primer chequeo a los 5 minutos de sesión.

---

## 13. Metáfora Central — Sístole / Diástole

El ritmo de la app replica el latido del corazón. Es la metáfora de diseño fundamental.

| Fase | Color | Representa |
|------|-------|-----------|
| **Sístole** | `#1a5276` (azul) | Movimiento · exploración · caminar |
| **Diástole** | `#c0392b` (rojo) | Narración · inmersión · historia |

`setPhase()` en `app.js` es la única función que cambia de fase. CSS hace el resto. Nunca estilos inline desde JS.

**Regla absoluta:** Sístole es azul, Diástole es rojo. Nunca invertir.

---

## 14. Idiomas Soportados

Web Speech API — 12 idiomas BCP-47:

`es-ES` · `en-US` · `fr-FR` · `it-IT` · `de-DE` · `pt-BR` · `ja-JP` · `zh-CN` · `ko-KR` · `nl-NL` · `ru-RU` · `ar-SA`

Los prompts de narradores tienen versiones en español e inglés. Otros idiomas usan el prompt en inglés como base.

---

## 15. Identidad Visual

| Elemento | Valor |
|----------|-------|
| **Logo** | Corazón C2 con brújula · SVG pendiente (DT-1) |
| **Slogan** | *your city soundtrack* |
| **Paleta** | Sístole `#1a5276` · Diástole `#c0392b` · Dorado `#f0c87a` · Noche `#0d1b2a` |
| **Tipografía** | DM Serif Display (display / bienvenida ciudad) + Inter (UI) |
| **Tiles de mapa** | CartoDB Voyager — color, información y legibilidad bajo sol en iPhone |

---

## 16. Pantallas

| Pantalla | Estado | Notas v0.7 |
|----------|--------|-----------|
| Splash — latido + carga | ✅ | Flujo returning-user → exploración directa |
| Config inicial — idioma + narrador | ✅ | "Mood" reemplazado por selector de narradores |
| Selección de modo | ✅ | |
| Bienvenida de ciudad — fade sobre mapa | ✅ | Nuevo v0.7 · DM Serif Display |
| Exploración — care strip + mapa + bottom bar | ✅ | Bottom bar sólida, dos pills simétricos |
| Care card — descanso / lluvia / calor | ✅ | Reemplaza care strip en top, height 32px |
| POI expandido | ✅ | btnBookmark/btnShare eliminados (DT-17) |
| Selección de recorrido | ✅ | |
| Resumen del paseo | 🔲 | Pendiente — DT-4 |

---

## 17. Costos Estimados

| Servicio | Piloto (1-5 usuarios) | MVP (10-20 usuarios) |
|----------|----------------------|----------------------|
| Claude API (claude-haiku) | $1-5/mes | $10-30/mes |
| OpenWeatherMap | $0 | $0 |
| Leaflet / OSM / Overpass | $0 | $0 |
| GitHub Pages | $0 | $0 |
| Cloudflare Workers | $0 (plan gratuito) | $0 |
| **Total** | **$1-5/mes** | **$10-30/mes** |

---

## 18. Hoja de Ruta

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + mockups | ✅ |
| v0.3 | Documentación completa | ✅ |
| v0.4 | Código base completo | ✅ |
| v0.5 | Panel de debug + métricas de experiencia | ✅ |
| v0.6 | UI rediseñada — bottom bar, pills, care strip, brújula | ✅ |
| v0.7 | Sistema de narradores · música por intro · bienvenida ciudad | ✅ En pruebas |
| v0.8 | Logo SVG · MP3 de intros · sw.js | 🔲 |
| v0.9 | Pruebas de campo en iPhone · debugging iOS | 🔲 |
| v1.0 | Piloto con viajeros reales | 🔲 |
| v2.0 | Más ciudades · narrador Familiar · monetización | 🔲 |

---

## 19. Deuda Técnica Activa

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker (siempre último en commit) | Alta |
| DT-4 | Pantalla resumen del paseo | Media |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-19 | 4 MP3 de intro por narrador | Alta |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-21 | Worker 400 en arranque — endpoint /weather sin key configurada | Baja |

---

*Follower — Documento de Producto v0.7 | Junio 2026*
