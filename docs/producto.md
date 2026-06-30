# 📋 Follower — Documento de Producto v0.9

> Junio 2026 — Narrador único · Care generativo · Ciudad sonora · Bienvenida en idioma local

---

## 1. Visión del Producto

> *"your city soundtrack"*

Follower es una experiencia cinematográfica de exploración urbana. Transforma cualquier paseo en una historia: narración AI en tiempo real, un compañero invisible que cuida de ti mientras caminas, y la ciudad misma como banda sonora.

**Follower no es un mapa. No es una audioguía. No es Wikipedia hablada. No es un reproductor de música.**

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
| **Experiencia fragmentada** | Narración, ambientación y mapa son herramientas separadas |
| **Sin cuidado humano** | Ninguna app sabe que estás cansado, que va a llover o que llevas 3km caminados |
| **Carga cognitiva** | La logística del viaje roba espacio a la experiencia misma |

---

## 4. Propuesta de Valor

Follower no vende información. Vende **inmersión, emoción y compañía**.

- La narración reacciona al lugar exacto donde estás, en tiempo real
- Cada historia es un capítulo que construye una tesis sobre la ciudad
- La app sabe cuándo sugerir descanso, refugio del calor o un café — con la misma voz que narra
- La ciudad misma es la banda sonora: Follower enseña a escucharla
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

**Métrica técnica principal:** ⏱ Tiempo hasta primera historia. Semáforo: verde ≤90s / amarillo 90-300s / rojo >300s.

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

## 7. El Narrador *(v0.9 — narrador único)*

En v0.9, los cuatro narradores (Storyteller, Historiador, Explorador, Local) se consolidan en **una sola voz**. No desaparecen como capacidades — el narrador único los absorbe, eligiendo el ángulo según el POI, no según una preferencia del usuario.

> El amigo más culto que conoces, que nunca presume de lo que sabe.

Puede haber nacido en la ciudad o haberse enamorado de ella. Conoce su historia, sus barrios, sus personajes y sus costumbres. No habla como profesor. No habla como guía turístico.

**Principio técnico:** un solo system prompt (Prompt Maestro v2.7), fijo. La caché usa `poiId_lang_topic` — sin `style`. `max_tokens: 480` como techo duro (≈330-350 palabras).

**Memoria de sesión:** cada narración recibe como contexto solo el capítulo inmediatamente anterior (idea central + recurso sensorial usado). El historial completo solo se usa en la despedida final. Esto mantiene el tamaño del input constante durante toda la caminata.

La definición completa de la voz: `docs/manifiesto_narrativo.md` y `docs/prompt_maestro_follower.md`

---

## 8. La Banda Sonora *(v0.9 — ciudad sonora)*

En v0.9, la música generada por la app desaparece por completo. `music.js` se elimina.

La banda sonora de Follower **es la ciudad**: sus campanas, sus mercados, sus conversaciones, sus músicos, sus tranvías, sus silencios.

Follower no reproduce nada. Enseña al caminante a escuchar lo que ya está sonando a su alrededor, nombrándolo en la narración a través de la sección "Ciudad Sonora" del Prompt Maestro v2.7.

La regla "narración siempre sobre música" se retira como regla de audio. La presencia sonora es ahora responsabilidad narrativa del prompt.

---

## 9. Bienvenida de Ciudad *(v0.9 — idioma local)*

Al entrar a una ciudad, Follower muestra el nombre de la ciudad animado letra por letra, en el idioma local del lugar detectado — no el idioma del usuario.

"Hola Cali" / "Hello Atlanta" / "Bonjour Paris"

El idioma se resuelve mediante una tabla simple país→idioma a partir del `country_code` del reverse geocoding. Esta pantalla actúa como pantalla de carga real de POIs, no como overlay decorativo.

**Flujo de arranque v0.9:**
```
Logo Follower (breve, mientras carga GPS)
    → Bienvenida animada en idioma local (mientras cargan POIs)
        → Exploración
```

Fallback si GPS o geocoding tardan: saludo genérico en el idioma del usuario.

---

## 10. Cierre de Caminata *(v0.9 — sin botón explícito)*

No existe un botón "Terminar paseo". El cierre se activa por señales implícitas:

1. **Inactividad de movimiento prolongada** cruzada con el estado de Care
   (una pausa sugerida por Care no es el fin de la caminata)
2. **Pregunta hablada por el narrador:** *"Veo que llevas un rato sin moverte. ¿Cerramos nuestro capítulo de [ciudad] por hoy?"*
3. **Confirmación por tap** — UI mínima, binaria (sí/no)
4. Si confirma → despedida narrativa generada con el historial completo de capítulos
5. Si ignora → Follower no insiste, vuelve a sístole normal

Cada apertura nueva de la app es una caminata nueva. `_walkChapters[]` vive solo en memoria de sesión — se pierde al cerrar la app.

Interacción por voz bidireccional (que el usuario responda hablando) es una visión futura, no una deuda técnica de esta versión.

---

## 11. Sistema de Cuidado Contextual *(v0.9 — generativo)*

`care.js` en v0.9 deja de usar mensajes estáticos. Cada sugerencia se genera vía una única llamada a Claude que:

1. Selecciona, entre 3-5 candidatos de Overpass, el lugar que "se siente más propio del sitio" (criterio editorial, no popularidad)
2. Redacta el mensaje con la misma voz narrativa del Prompt Maestro

**Triggers de protección real** (lluvia, calor/frío extremo) → pueden anunciarse aunque el usuario esté detenido.

**Triggers de bienestar/contemplación** (cansancio, almuerzo, zona especial) → esperan a que el usuario retome el movimiento.

**Nuevo trigger — momentos memorables:** densidad de POIs Wikipedia en un radio de ~150m como proxy de "zona especial" (plaza, centro histórico). Calculado localmente sin llamadas de red adicionales.

| Prioridad | Tipo | Condición | Espera movimiento |
|-----------|------|-----------|-------------------|
| 1 | Protección | Lluvia inminente | No |
| 2 | Protección | Temp ≥ 30°C o ≤ 5°C | No |
| 3 | Bienestar | Hora almuerzo + >1km | Sí |
| 4 | Bienestar | > 2km caminados | Sí |
| 5 | Memorable | Densidad alta de POIs (~150m) | Sí |

Cooldown de 20 minutos entre sugerencias. Primer chequeo a los 5 minutos de sesión.

La definición completa: `docs/manifiesto_care_strip.md`

---

## 12. Tránsito Rápido *(v0.9 — pausa automática)*

Si el usuario se desplaza a >15-18 km/h sostenido por 30-60 segundos (taxi, bus, metro), Follower pausa automáticamente la detección de POIs. El GPS nunca se detiene.

Al volver a ritmo de caminata, la detección se reactiva sin fricción ni aviso.

---

## 13. Metáfora Central — Sístole / Diástole

El ritmo de la app replica el latido del corazón.

| Fase | Color | Representa |
|------|-------|-----------|
| **Sístole** | `#1a5276` (azul) | Movimiento · exploración · caminar |
| **Diástole** | `#c0392b` (rojo) | Narración · inmersión · historia |

`setPhase()` en `app.js` es la única función que cambia de fase. CSS hace el resto. Nunca estilos inline desde JS. **Regla absoluta:** Sístole es azul, Diástole es rojo. Nunca invertir.

---

## 14. Idiomas Soportados

Web Speech API — 12 idiomas BCP-47:

`es-419` (latam) · `es-MX` · `es-CO` · `es-ES` (último recurso) · `en-US` · `fr-FR` · `it-IT` · `de-DE` · `pt-BR` · `ja-JP` · `zh-CN` · `ko-KR`

Prioridad de selección en español: `es-CO → es-MX → es-US → es-419 → (otras latam) → es-ES`. Voces locales siempre sobre voces online.

Los prompts tienen versiones en español e inglés. Otros idiomas usan el prompt en inglés como base.

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

| Pantalla | Estado | Notas v0.9 |
|----------|--------|-----------|
| Splash — logo breve mientras carga GPS | 🔄 | Reemplaza el splash del corazón |
| Bienvenida de ciudad — animada en idioma local | 🔄 | Nueva — actúa como pantalla de carga real de POIs |
| Config inicial — wizard tipo Organiza2 | 🔲 | DT-47 — pendiente de diseño |
| Exploración — care strip + mapa + bottom bar | ✅ | |
| Care card — sugerencia generativa | 🔄 | Texto vía Claude, sin mensajes estáticos |
| Pregunta de cierre — confirmación tap | 🔲 | DT-46 — nueva |
| POI expandido | ✅ | |
| Resumen / despedida del paseo | 🔲 | DT-4 + DA-54 |

---

## 17. Costos Estimados

| Servicio | Piloto (1-5 usuarios) | MVP (10-20 usuarios) |
|----------|----------------------|----------------------|
| Claude Haiku (narración + Care) | $2-8/mes | $15-40/mes |
| OpenWeatherMap | $0 | $0 |
| Leaflet / OSM / Wikipedia / Overpass | $0 | $0 |
| GitHub Pages | $0 | $0 |
| Cloudflare Workers | $0 (plan gratuito) | $0 |
| **Total** | **$2-8/mes** | **$15-40/mes** |

*Care generativo vía Claude añade llamadas adicionales respecto a v0.8 — costo estimado 20-30% mayor.*

---

## 18. Hoja de Ruta

| Versión | Hitos | Estado |
|---------|-------|--------|
| v0.1–v0.4 | README · arquitectura · identidad · código base | ✅ |
| v0.5 | Panel de debug + métricas de experiencia | ✅ |
| v0.6 | UI rediseñada — bottom bar, pills, care strip, brújula | ✅ |
| v0.7 | Sistema de narradores · música por intro · bienvenida ciudad | ✅ |
| v0.7s | Estabilización: voz latam · narraciones cortas · laboratorio | ✅ |
| v0.8 | Wikipedia GeoSearch · cola narrativa · visited-on-complete | ✅ |
| v0.9 | Narrador único · Care generativo · ciudad sonora · bienvenida idioma local · cierre de caminata · pausa en tránsito | 🔄 En curso |
| v1.0 | Piloto con viajeros reales | 🔲 |
| v2.0 | Recorridos curados · interacción por voz · más ciudades | 🔲 |

---

## 19. Deuda Técnica Activa *(v0.9 · Sesión 17)*

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-1 | Logo SVG final + iconos PWA | Alta |
| DT-3 | sw.js — service worker (siempre último en commit) | Alta |
| DT-4 | Pantalla resumen / despedida del paseo | Alta |
| DT-5 | Más ciudades en routes.js | Baja |
| DT-8 | debug.js + debug-sim.js deshabilitados antes de v1.0 | Media |
| DT-9 | Revocar key OpenAI expuesta en commits históricos | Alta |
| DT-10 | Error IndexedDB "connection is closing" — Safari backgrounding | Media |
| DT-12 | Atribución CARTO/OSM no visible | Baja |
| DT-16 | Pantalla POI expandida: rediseñar con nuevo sistema visual | Media |
| DT-17 | Implementar bookmark y share (Web Share API) en pantalla POI | Baja |
| DT-20 | Test en campo con brújula real — verificar DeviceOrientation iOS | Alta |
| DT-25 | Backoff Overpass 30-60s después de 429 | Media |
| DT-26 | Weather.invalidateCache en modo ruta — solo en teleport | Media |
| DT-27 | clearCache() en debug.js no recarga la página | Media |
| DT-28 | Verificar cap 80 POIs con nwr en ciudades densas | Baja |
| DT-31 | Mejorar type/icon POIs Wikipedia con Wikidata | Baja |
| DT-34 | Cooldown mínimo entre narraciones — evaluar post campo | Media |
| DT-35 | BUG-036 iOS voz silenciosa — logs de diagnóstico pendientes | Crítica |
| DT-36 | Limpiar nombres POIs Wikipedia antes del prompt | Alta |
| DT-37 | Confirmar buildContext llega a Claude en narraciones | Alta |
| DT-38 | Chequeo inmediato al cargar POIs — reducir TTF | Media |
| DT-39 | Formato extracción metadatos por capítulo (idea central + recurso sensorial) | Alta |
| DT-40 | Umbral exacto de inactividad para disparar pregunta de cierre | Alta |
| DT-41 | Tabla país→idioma — cobertura inicial de países prioritarios | Alta |
| DT-42 | Mini-prompt de Care (misma voz, intención de hospitalidad) | Media |
| DT-43 | Umbral de densidad de POIs para trigger "zona especial" (~150m) | Media |
| DT-44 | Medir en campo si autoevaluación del v2.7 incrementa latencia | Alta |
| DT-45 | UI: pantalla de bienvenida animada (splash mínimo + texto letra por letra) | Alta |
| DT-46 | UI: confirmación por tap para cierre de caminata | Media |
| DT-47 | Wizard de configuración tipo Organiza2 | Media |
| ~~DT-19~~ | ~~4 MP3 de intro por narrador~~ — obsoleto, music.js eliminado | — |
| ~~DT-22~~ | ~~visited = true al activar~~ — resuelto S2-A1 | — |
| ~~DT-23~~ | ~~Sin cola narrativa~~ — resuelto S2-A2 | — |
| ~~DT-24~~ | ~~Cache agresivo Overpass~~ — resuelto Wikipedia + filtro geográfico | — |
| ~~DT-29~~ | ~~Cobertura Wikipedia Cali~~ — confirmada | — |
| ~~DT-30~~ | ~~TTF desde sesión nueva~~ — confirmado <90s | — |
| ~~DT-33~~ | ~~MP3 definitivos (tono sintético)~~ — obsoleto, music.js eliminado | — |

---

## 20. Principios aprendidos en campo

**Wikipedia como filtro editorial:** un lugar con artículo en Wikipedia es un lugar que merece ser narrado. Esta alineación con la visión cinematográfica de Follower no es coincidencia — es el modelo mental correcto para el descubrimiento de POIs.

**Validar antes de arquitecturizar:** el experimento mínimo (una función, sin nuevos archivos) validó la hipótesis en una sesión. La arquitectura formal de providers vendrá después, respaldada por evidencia de campo.

**La fuente de datos es parte del producto:** Overpass era un bottleneck técnico que afectaba directamente la promesa de Follower. Cambiar la fuente de datos no fue una decisión técnica — fue una decisión de producto.

**La banda sonora es la ciudad, no la app:** `music.js` se eliminó. La presencia sonora de Follower vive en el texto narrativo, no en archivos de audio. La ciudad ya suena — Follower enseña a escucharla.

**Care como hospitalidad, no como función:** el Care strip habla con la misma voz que el narrador. No existe un segundo narrador, no existe un sistema separado. Follower simplemente cambia de intención por un momento.

---

*Follower — Documento de Producto v0.9 | Sprint S3 | Junio 2026*
