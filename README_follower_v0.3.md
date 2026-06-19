# 🎬 Follower

> **Your city soundtrack.**

Follower es una PWA de audio guía turística que convierte cualquier paseo en una experiencia cinematográfica y humana — narración AI en tiempo real, música que cambia según el lugar, y un acompañante que cuida de ti mientras exploras.

**App en producción:** [follower.github.io] *(próximamente)*

---

## El problema que resuelve

Los audio guides tradicionales son aburridos, estáticos y genéricos. Los free tours dependen de un guía que puede ser bueno o malo. Las apps de mapas te dan datos fríos sin emoción.

**Follower existe para que caminar una ciudad extraña se sienta como protagonizar una película.**

---

## Objetivo

**Para el usuario:**
Explorar ciudades de forma inmersiva, emocional y sin esfuerzo — como protagonizar una película con soundtrack propio.

**Para el producto:**
Ser el primer audio guide que combina ubicación en tiempo real, narración AI, música contextual y cuidado humano en una sola experiencia manos libres.

**Para el negocio:**
Convertirse en el compañero de viaje global — disponible en cualquier idioma, cualquier ciudad, para cualquier viajero.

---

## La experiencia en 3 palabras

**Escucha. Camina. Vive.**

El usuario guarda el celular en el bolsillo. La app orquesta todo sola:
- Se acerca a un punto de interés → música hace fade in según el mood del lugar
- Narración AI empieza sobre la música, en el idioma del usuario
- Se aleja → música hace fade out suavemente
- Lleva mucho tiempo caminando o va a llover → la app lo cuida y sugiere dónde descansar

---

## Identidad de marca

**Logo:** Corazón C2 — el contorno del corazón con ticks cardinales y aguja de brújula adentro. El norte en rojo. El corazón representa exploración con alma — la marca es humana.

**Slogan:** *your city soundtrack*

**Paleta — sístole y diástole:**

| Nombre | Hex | Uso |
|--------|-----|-----|
| Navy | `#0d1b2a` | Base, fondo claro |
| Noche | `#0d1420` | Fondo oscuro, pantallas |
| Rojo diástole | `#c0392b` | Acento principal, narración activa, norte |
| Rojo vivo | `#e74c3c` | Alertas, dark mode accent |
| Azul sístole | `#1a5276` | Movimiento, caminando, usuario en mapa |
| Humo | `#c8d4e0` | Textos secundarios dark mode |
| Crema | `#f5f3ef` | Fondo claro, respiro |
| Dorado | `#f0c87a` | Descanso, pausa, sugerencias cálidas |
| Hielo | `#e8eef4` | Textos principales dark mode |

> **Sístole (azul)** = el corazón se contrae, avanza, el usuario camina.
> **Diástole (rojo)** = el corazón se expande, recibe, el usuario escucha.
> El usuario nunca lo sabe — solo lo siente.

**Tipografía:**

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | DM Serif Display | Nombre app, títulos de POIs |
| Narración | Inter 200 | Texto de narración, descripciones |
| UI | Inter 300 | Slogan, labels, botones |
| Datos | Inter 500 | Métricas, distancias, estados |

---

## Modos de exploración ⚡ DECISIÓN CLAVE

Follower ofrece dos modos de exploración — el usuario elige al inicio y puede cambiar en cualquier momento.

### Modo Libre
El usuario camina sin rumbo. La app detecta POIs cercanos y reacciona automáticamente. Sensación de descubrimiento orgánico. Sin presión, sin ruta impuesta.

```
Usuario camina → app detecta POI cercano → música fade in → narración → usuario sigue caminando
```

### Modo Recorrido *(guiado)*
El usuario elige una ruta temática. La app traza el camino en el mapa y ordena los POIs narrativamente — cada lugar cuenta la historia que el siguiente continúa. Es como un capítulo de serie: hay arco narrativo.

```
Usuario elige ruta → app traza camino → POIs en orden narrativo → historia conectada → final del recorrido
```

### Regla híbrida
- **Por defecto:** Modo Libre
- **Si el usuario quiere estructura:** activa un recorrido desde la pantalla de selección
- **Transición inteligente:** si el usuario está cerca del inicio de un recorrido popular, la app sugiere suavemente: *"Estás a 200m del inicio de Roma Imperial — ¿arrancamos?"*
- **Salida libre:** en cualquier momento el usuario puede abandonar el recorrido y volver al modo libre sin perder el progreso

---

## Recorridos temáticos

Cada ciudad tendrá recorridos curados, generados y narrados por AI:

| Recorrido | Distancia | Duración | POIs | Mood ideal |
|-----------|-----------|----------|------|------------|
| 🏛️ Roma Imperial | 3.2 km | 2h | 8 | Épico |
| 🌙 Roma Nocturna | 2.1 km | 1.5h | 6 | Misterio |
| 🔮 Roma Secreta | 4.0 km | 2.5h | 10 | Misterio |
| 🌹 Roma Romántica | 2.8 km | 2h | 7 | Romántico |
| 😄 Roma Curiosa | 3.5 km | 2h | 9 | Curioso |

> Los recorridos NO son rutas pregrabadas — la narración se genera en tiempo real con AI, adaptada al idioma y mood del usuario. El orden de los POIs sí es curado para garantizar coherencia narrativa.

---

## Flujo completo de la app

```
[Splash — corazón latiendo]
        │ carga POIs de la ciudad en background
        ▼
[Config inicial]
        │ idioma + mood
        ▼
[Selección de modo]
        │
   ┌────┴──────────────────┐
   │                       │
   ▼                       ▼
[Modo Libre]         [Modo Recorrido]
[mapa reactivo]      [elige ruta temática]
   │                       │
   └──────────┬────────────┘
              │
              ▼
     [Modo Exploración]
      mapa + POIs + usuario
              │
     ┌────────┴──────────────┐
     │                       │
     ▼                       ▼
[POI cercano]          [Sugerencia]
[diástole — rojo]      [descanso — dorado]
[narración + música]   [lluvia — alerta]
     │
     ▼
[POI expandido]
[historia completa + datos + profundidad]
     │
     ▼
[Resumen del paseo]
[km · POIs · tiempo · momentos]
```

---

## Pantallas — estado actual

| Pantalla | Archivo | Estado |
|----------|---------|--------|
| Splash — latido + carga | `follower_splash_v1.html` | ✅ |
| Config inicial — idioma + mood | incluida en splash | ✅ |
| Selección de modo — libre / recorrido | — | 🔲 En curso |
| Modo Exploración — caminando | `follower_explore.html` | ✅ |
| Modo Exploración — descanso | incluida en explore | ✅ |
| POI expandido — historia completa | `follower_poi_expanded.html` | ✅ |
| Alerta de lluvia | — | 🔲 |
| Resumen del paseo | — | 🔲 |

---

## Ecosistema técnico

```
            🎬 FOLLOWER
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
📍 Ubicación  🎵 Música   🤖 Narración AI
    │                         │
    ▼                         ▼
🗺️ POIs OSM              🌤️ Clima + Pasos
    │                         │
    ▼                         ▼
🛤️ Recorridos            💬 Sugerencias
   temáticos               de cuidado
```

---

## Stack

```
HTML + CSS + JS Vanilla
Leaflet.js          → mapas reales (OpenStreetMap, gratuito)
Claude API          → narración AI en tiempo real
Web Speech API      → síntesis de voz (nativa del navegador)
OpenWeatherMap API  → clima en tiempo real
Web Audio API       → música por mood (nativa)
GitHub Pages        → deploy
PWA                 → instalable, funciona offline parcialmente
```

**Sin frameworks. Sin npm. Sin build step.**

---

## Filosofía de diseño

- **Manos libres** — el usuario no toca la pantalla mientras explora
- **Cinematográfico** — música + voz + timing = inmersión total
- **Humana** — la app late, cuida, siente con el usuario
- **Sístole / Diástole** — dos estados de vida que guían toda la UX
- **Híbrida** — libre por defecto, guiada cuando el usuario lo desea
- **Global** — multiidioma desde el día 1, narración generada en tiempo real
- **Liviana** — sin dependencias pesadas, carga rápida en cualquier red

---

## Moods disponibles

| Mood | Música | Narración |
|------|--------|-----------|
| 🎬 Épico | Orquestal, cinematográfica | Dramática, grandiosa |
| 🌹 Romántico | Acordeón, cuerdas suaves | Poética, íntima |
| 🔮 Misterio | Ambient, tensa | Suspense, secretos |
| 😄 Curioso | Ligera, alegre | Datos curiosos, humor |

---

## Para IAs y desarrolladores

**Leer antes de tocar cualquier archivo:** `REGLAS_IA.md` *(próximamente)*

Reglas clave:
- La pantalla principal es el **Modo Exploración** — todo gira alrededor de ella
- El GPS es el corazón — nunca bloquear o interrumpir su ciclo
- La narración AI siempre va **sobre** la música, nunca sola ni antes
- Las sugerencias de cuidado son **contextuales**, nunca intrusivas
- Sístole = azul `#1a5276` / Diástole = rojo `#c0392b` — nunca invertir
- Modo Libre es el default — Modo Recorrido es opt-in
- Los recorridos son curados en orden pero la narración es siempre AI en tiempo real
- Siempre pedir el archivo actual antes de modificarlo

---

## Roadmap

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1 | README + arquitectura + identidad | ✅ |
| v0.2 | Sistema de diseño + splash + exploración | ✅ |
| v0.3 | POI expandido + selección de modo + recorridos | ✅ |
| v0.4 | Alerta lluvia + resumen del paseo | 🔲 En curso |
| v0.5 | GPS real + Leaflet + POIs OSM | 🔲 |
| v0.6 | Narración AI + voz | 🔲 |
| v0.7 | Música por mood | 🔲 |
| v0.8 | Clima + sugerencias de cuidado | 🔲 |
| v0.9 | Multiidioma | 🔲 |
| v1.0 | PWA completa · Piloto viajeros reales | 🔲 |
| v2.0 | Monetización | 🔲 |

---

*Follower | Junio 2026*

---

## Modo Offline ⚡ DECISIÓN CLAVE

Follower debe funcionar aunque el turista pierda señal — en sótanos, callejones históricos, zonas rurales. El offline no es opcional, es parte de la experiencia.

### Qué funciona offline

| Función | Offline | Cómo |
|---------|---------|------|
| Interfaz completa | ✅ | Service worker cachea el shell |
| Mapa de la zona | ✅ | Leaflet cachea tiles al cargar |
| POIs cercanos | ✅ | Descargados en el splash |
| Narración de POIs conocidos | ✅ | Pre-generada y cacheada |
| Música por mood | ✅ | Pre-cargada al iniciar |
| Narración de POIs nuevos | ❌ | Requiere Claude API |
| Clima en tiempo real | ❌ | Requiere OpenWeatherMap |
| POIs fuera del radio cacheado | ❌ | Requiere OSM |

### Estrategia de cache — al cargar la ciudad (splash)

```
1. Descarga POIs en radio de 5km → IndexedDB
2. Pre-genera narración de los 10 POIs más relevantes → cache
3. Descarga música de los 4 moods → cache
4. Cachea clima actual por 30 minutos → cache
5. Cachea tiles del mapa de la zona → Leaflet cache
```

### Comportamiento sin señal

- Indicador discreto **"modo offline"** en el top pill — nunca un error intrusivo
- POIs conocidos narran desde cache — experiencia idéntica
- POIs desconocidos muestran datos básicos sin narración AI
- Música y mapa siguen funcionando
- Al recuperar señal → sincronización silenciosa en background

### Fallback de narración

Si Claude API no responde (offline o timeout):
1. Usar narración pre-generada del POI si existe en cache
2. Si no hay cache → narración básica generada localmente con datos OSM
3. Nunca mostrar error al usuario — la experiencia no se rompe

### Regla de sw.js — igual que Organiza2

**Orden obligatorio de commits:**
1. `git add [archivos modificados]` → `git commit` → `git push`
2. Esperar 1-2 minutos para propagación en GitHub Pages
3. Recién entonces: `git add sw.js` → `git commit -m "fix: bump cache vX-Y"` → `git push`

**El bump de sw.js es siempre el último commit de cualquier deploy.**

