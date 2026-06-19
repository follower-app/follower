# 📋 Follower — Documento de Producto v0.4

> Junio 2026 — Código base completo · Iniciando pruebas

---

## 1. Visión del Producto

> *"Your city soundtrack."*

Follower es una PWA de audio guía turística que convierte cualquier paseo en una experiencia cinematográfica y humana — narración AI en tiempo real, música que cambia según el lugar, y un acompañante que cuida de ti mientras exploras.

**Follower no es una app de mapas. No es un audio guide. Es una experiencia cinematográfica que ocurre mientras caminas.**

---

## 2. El Problema que Resuelve

| Problema | Descripción |
|----------|-------------|
| **Audio guides aburridos** | Estáticos, pregrabados, genéricos. |
| **Free tours inconsistentes** | Dependen de un guía. Horarios fijos, grupos grandes. |
| **Mapas sin alma** | Google Maps da datos fríos. No cuenta historias. |
| **Experiencia desconectada** | Música, narración y mapa son apps distintas. |
| **Sin cuidado humano** | Ninguna app sabe que estás cansado o que va a llover. |

---

## 3. Propuesta de Valor

> Follower no vende información. Vende **inmersión, emoción y compañía**.

- ✅ Música que aparece sola al acercarte a algo importante
- ✅ Narración en tu idioma, al ritmo de tu paseo
- ✅ La app sabe cuándo descansar, cuándo buscar refugio
- ✅ Cada ciudad se siente como una película diferente

---

## 4. Usuario Objetivo

| Perfil | Descripción |
|--------|-------------|
| **Principal** | Viajero independiente 25-45 años. Solo o en pareja. Busca experiencias auténticas. |
| **Secundario** | Turista cultural que quiere profundidad sin rigidez de guía. |
| **Terciario** | Local que quiere redescubrir su ciudad. |

---

## 5. Principios

- **Cinematográfico** — cada paseo debe sentirse como una película
- **Manos libres** — el usuario no toca la pantalla mientras explora
- **Humano** — la app cuida, siente y reacciona como un acompañante real
- **Global** — cualquier ciudad, cualquier idioma, desde el día 1
- **Invisible** — la tecnología desaparece, solo queda la experiencia
- **Resiliente** — funciona sin señal, la experiencia no se rompe nunca

---

## 6. Modos de Exploración

### Modo Libre *(default — DA-8)*
Camina sin rumbo. La app detecta POIs y reacciona. Descubrimiento orgánico.

### Modo Recorrido *(opt-in)*
Ruta temática curada con arco narrativo. Narración siempre AI en tiempo real.

### Transición inteligente
Sugerencia si el usuario está a <300m del inicio de un recorrido. Nunca automático.

---

## 7. Recorridos Disponibles — Roma

| Recorrido | Km | Duración | POIs | Mood |
|-----------|-----|----------|------|------|
| 🏛️ Roma Imperial | 3.2 | 2h | 8 | Épico |
| 🌙 Roma Nocturna | 2.1 | 1.5h | 6 | Misterio |
| 🌹 Roma Romántica | 2.8 | 2h | 7 | Romántico |
| 🔮 Roma Secreta | 4.0 | 2.5h | 10 | Misterio |
| 😄 Roma Curiosa | 3.5 | 2h | 9 | Curioso |

---

## 8. Sistema de Cuidado Contextual

`care.js` evalúa en orden de prioridad:

| Prioridad | Condición | Acción |
|-----------|-----------|--------|
| 1 | Temp ≥ 30°C | Buscar refugio del calor |
| 2 | Temp ≤ 5°C | Buscar lugar cálido |
| 3 | Hora almuerzo + >1km | Sugerir restaurante |
| 4 | >2km caminados | Sugerir café de descanso |
| 5 | Lluvia | Alerta + buscar refugio |

Cooldown de 20 minutos entre sugerencias. Primer chequeo a los 5 minutos.

---

## 9. Moods

| Mood | Música | Narración | Prompt style |
|------|--------|-----------|--------------|
| 🎬 Épico | Orquestal | Dramática, grandiosa | Hollywood movie |
| 🌹 Romántico | Acordeón, cuerdas | Poética, íntima | Love story |
| 🔮 Misterio | Ambient, tensa | Suspense, secretos | Thriller |
| 😄 Curioso | Ligera, alegre | Datos sorprendentes | Documentary |

---

## 10. Idiomas Soportados

Web Speech API — 12 idiomas BCP-47:
`es-ES` · `en-US` · `fr-FR` · `it-IT` · `de-DE` · `pt-BR` · `ja-JP` · `zh-CN` · `ko-KR` · `nl-NL` · `ru-RU` · `ar-SA`

---

## 11. Identidad Visual

**Logo:** Corazón C2 con brújula · *(SVG pendiente)*
**Slogan:** *your city soundtrack*
**Paleta:** Sístole azul `#1a5276` + Diástole rojo `#c0392b` + Dorado `#f0c87a`
**Tipografía:** DM Serif Display (display) + Inter (UI)

---

## 12. Pantallas

| Pantalla | Estado |
|----------|--------|
| Splash — latido + carga | ✅ Código listo |
| Config inicial — idioma + mood | ✅ Código listo |
| Selección de modo | ✅ Código listo |
| Modo Exploración — caminando | ✅ Código listo |
| Care card — descanso / lluvia / calor | ✅ Código listo |
| POI expandido | ✅ Código listo |
| Selección de recorrido | ✅ Código listo |
| Resumen del paseo | 🔲 Pendiente |

---

## 13. Costos Estimados

| Servicio | Piloto (1-5 usuarios) | MVP (10-20 usuarios) |
|----------|----------------------|----------------------|
| Claude API | $1-5/mes | $10-30/mes |
| OpenWeatherMap | $0 | $0 |
| Leaflet/OSM | $0 | $0 |
| GitHub Pages | $0 | $0 |
| **Total** | **$1-5/mes** | **$10-30/mes** |

---

## 14. Hoja de Ruta

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + mockups | ✅ |
| v0.3 | Documentación completa | ✅ |
| v0.4 | Código base completo | ✅ |
| v0.5 | Pruebas locales + debugging | 🔲 En curso |
| v0.6 | Logo SVG + iconos PWA | 🔲 |
| v0.7 | Archivos de música por mood | 🔲 |
| v0.8 | sw.js + deploy GitHub Pages | 🔲 |
| v1.0 | Piloto viajeros reales | 🔲 |
| v2.0 | Más ciudades + monetización | 🔲 |

---

*Follower — Documento de Producto v0.4 | Junio 2026*
