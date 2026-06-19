# 📋 Follower — Documento de Producto v0.3

> Junio 2026 — Diseño completo · Iniciando desarrollo

---

## 1. Visión del Producto

> *"Your city soundtrack."*

Follower es una PWA de audio guía turística que convierte cualquier paseo en una experiencia cinematográfica y humana — narración AI en tiempo real, música que cambia según el lugar, y un acompañante que cuida de ti mientras exploras.

**Follower no es una app de mapas. No es un audio guide. Es una experiencia cinematográfica que ocurre mientras caminas.**

---

## 2. El Problema que Resuelve

| Problema | Descripción |
|----------|-------------|
| **Audio guides aburridos** | Estáticos, pregrabados, genéricos. La misma narración para todos sin importar idioma, mood o momento. |
| **Free tours inconsistentes** | Dependen de un guía que puede ser bueno o malo. Horarios fijos, grupos grandes, sin personalización. |
| **Mapas sin alma** | Google Maps te da datos fríos. No te cuenta historias. No sabe que llevas 3km caminando. |
| **Experiencia desconectada** | La música, la narración y el mapa son tres apps diferentes. Nadie las orquesta juntas. |
| **Sin cuidado humano** | Ninguna app sabe que está lloviendo, que estás cansado, o que hay un café histórico a 200m. |

---

## 3. Propuesta de Valor

> Follower no vende información. Vende **inmersión, emoción y compañía**.

La sensación de: caminar una ciudad extraña y sentir que ella te está contando su propia historia.

**Lo que el usuario experimenta:**
- ✅ Camina y la música aparece sola cuando se acerca a algo importante
- ✅ Una voz le cuenta historias en su idioma, al ritmo de su paseo
- ✅ La app lo cuida — sabe cuándo descansar, cuándo buscar refugio
- ✅ Cada ciudad se siente como una película diferente

### Diferencial Competitivo

| # | Diferencial | Descripción |
|---|-------------|-------------|
| 1 | **Cinematográfico** | Música + narración + timing = experiencia de película. Ningún competidor lo hace. |
| 2 | **Manos libres total** | El celular va en el bolsillo. La app orquesta todo sola. |
| 3 | **Narración AI en tiempo real** | No es audio pregrabado. Se genera en el momento, en tu idioma, con tu mood. |
| 4 | **Toque humano** | La app lee tu contexto — clima, cansancio, hora — y reacciona como un amigo. |
| 5 | **Sístole / Diástole** | Dos estados de vida que guían toda la UX. La app late contigo. |

---

## 4. Usuario Objetivo

| Perfil | Descripción |
|--------|-------------|
| **Principal** | Viajero independiente entre 25 y 45 años. Viaja solo o en pareja. Busca experiencias auténticas sobre tours masivos. |
| **Secundario** | Turista cultural que quiere profundidad histórica sin la rigidez de un guía. |
| **Terciario** | Local que quiere redescubrir su propia ciudad de forma diferente. |

---

## 5. Principios

**Cinematográfico.** Cada paseo debe sentirse como una película.
**Manos libres.** El usuario no toca la pantalla mientras explora.
**Humano.** La app cuida, siente y reacciona como un acompañante real.
**Global.** Funciona en cualquier ciudad, en cualquier idioma, desde el día 1.
**Invisible.** La tecnología desaparece — solo queda la experiencia.
**Resiliente.** Funciona sin señal. La experiencia no se rompe nunca.

---

## 6. Modos de Exploración

### Modo Libre *(default)*
El usuario camina sin rumbo. La app detecta POIs cercanos y reacciona automáticamente. Sensación de descubrimiento orgánico. Sin presión, sin ruta impuesta.

### Modo Recorrido *(opt-in)*
El usuario elige una ruta temática. La app traza el camino y ordena los POIs narrativamente — cada lugar cuenta la historia que el siguiente continúa. Arco narrativo completo.

### Transición inteligente
Si el usuario está a menos de 300m del inicio de un recorrido popular, la app sugiere activarlo suavemente. Nunca lo activa automáticamente.

---

## 7. Recorridos Temáticos

Los recorridos tienen orden curado pero narración siempre generada en tiempo real por AI.

| Recorrido | Distancia | Duración | POIs | Mood ideal |
|-----------|-----------|----------|------|------------|
| 🏛️ Roma Imperial | 3.2 km | 2h | 8 | Épico |
| 🌙 Roma Nocturna | 2.1 km | 1.5h | 6 | Misterio |
| 🔮 Roma Secreta | 4.0 km | 2.5h | 10 | Misterio |
| 🌹 Roma Romántica | 2.8 km | 2h | 7 | Romántico |
| 😄 Roma Curiosa | 3.5 km | 2h | 9 | Curioso |

---

## 8. Moods

| Mood | Música | Narración | Color |
|------|--------|-----------|-------|
| 🎬 Épico | Orquestal, cinematográfica | Dramática, grandiosa | Diástole rojo |
| 🌹 Romántico | Acordeón, cuerdas suaves | Poética, íntima | Diástole rojo |
| 🔮 Misterio | Ambient, tensa | Suspense, secretos | Diástole rojo |
| 😄 Curioso | Ligera, alegre | Datos curiosos, humor | Diástole rojo |

---

## 9. Identidad Visual

**Logo:** Corazón C2 — contorno de corazón con ticks cardinales y aguja de brújula. Norte en rojo. Exploración con alma.

**Slogan:** *your city soundtrack*

**Paleta — Sístole y Diástole:**

| Nombre | Hex | Uso |
|--------|-----|-----|
| Navy | `#0d1b2a` | Base, fondo claro |
| Noche | `#0d1420` | Fondo oscuro, pantallas |
| Rojo diástole | `#c0392b` | Narración activa, norte, acento |
| Rojo vivo | `#e74c3c` | Alertas, dark mode |
| Azul sístole | `#1a5276` | Caminando, usuario en mapa |
| Humo | `#c8d4e0` | Textos dark mode |
| Crema | `#f5f3ef` | Fondo claro |
| Dorado | `#f0c87a` | Descanso, sugerencias cálidas |
| Hielo | `#e8eef4` | Textos principales dark mode |

**Tipografía:**

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | DM Serif Display | Nombre app, títulos POIs |
| Narración | Inter 200 | Texto narración, descripciones |
| UI | Inter 300 | Slogan, labels, botones |
| Datos | Inter 500 | Métricas, distancias, estados |

---

## 10. Pantallas

| Pantalla | Archivo | Estado |
|----------|---------|--------|
| Splash — latido + carga | `follower_splash_v1.html` | ✅ |
| Config inicial — idioma + mood | incluida en splash | ✅ |
| Selección de modo — libre / recorrido | — | 🔲 |
| Modo Exploración — caminando | `follower_explore.html` | ✅ |
| Modo Exploración — descanso | incluida en explore | ✅ |
| POI expandido | `follower_poi_expanded.html` | ✅ |
| Alerta de lluvia | — | 🔲 |
| Resumen del paseo | — | 🔲 |

---

## 11. Flujo Completo

```
[Splash — corazón latiendo]
        │ carga POIs en background
        ▼
[Config inicial — idioma + mood]
        │
        ▼
[Selección de modo]
        │
   ┌────┴──────────────────┐
   │                       │
   ▼                       ▼
[Modo Libre]         [Modo Recorrido]
   │                       │
   └──────────┬────────────┘
              ▼
     [Modo Exploración]
              │
     ┌────────┴────────────┐
     │                     │
     ▼                     ▼
[POI cercano]        [Sugerencia]
[diástole]           [descanso / lluvia]
     │
     ▼
[POI expandido]
     │
     ▼
[Resumen del paseo]
```

---

## 12. Modo Offline

| Función | Offline | Cómo |
|---------|---------|------|
| Interfaz completa | ✅ | Service worker |
| Mapa de la zona | ✅ | Tiles Leaflet cacheados |
| POIs cercanos | ✅ | IndexedDB |
| Narración POIs conocidos | ✅ | Pre-generada en cache |
| Música por mood | ✅ | Pre-cargada en splash |
| Narración POIs nuevos | ❌ | Requiere Claude API |
| Clima en tiempo real | ❌ | Requiere OpenWeatherMap |

---

## 13. Hoja de Ruta

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + splash + exploración | ✅ |
| v0.3 | POI expandido + documentación completa | ✅ |
| v0.4 | index.html base + sw.js + manifest.json | 🔲 En curso |
| v0.5 | GPS real + Leaflet + POIs OSM | 🔲 |
| v0.6 | Narración AI + voz | 🔲 |
| v0.7 | Música por mood | 🔲 |
| v0.8 | Clima + sugerencias de cuidado | 🔲 |
| v0.9 | Recorridos temáticos | 🔲 |
| v1.0 | PWA completa · Piloto viajeros reales | 🔲 |
| v2.0 | Monetización | 🔲 |

---

*Follower — Documento de Producto v0.3 | Junio 2026*
