# docs/manifiesto_pois.md

# 🗺️ MANIFIESTO DE POIs — FOLLOWER v1.0

**Sesión 32.** Documento nuevo: el criterio editorial de qué lugares
merecen existir en Follower. Complementa la arquitectura de fuentes
(DA-69/72/73, cascada compuesta + curaduría OSM) con la pregunta que esa
arquitectura no responde: no *de dónde* vienen los POIs, sino *cuáles
merecen quedarse*. Ver "Estado de implementación" al final — parte
obligatoria de este documento (lección DT-60/S31).

---

## Principio Fundamental

No todo POI merece existir en Follower.

Follower busca únicamente aquello que ayuda a descubrir el alma de una ciudad.

---

## Definiciones

### POI Detectado

Lugar encontrado por Wikipedia, OSM u otras fuentes.

### POI Visible

Lugar que aparece en el mapa.

### POI Narrable

Lugar que puede convertirse en un capítulo.

---

## Regla Fundamental

POI Detectado ≠ POI Visible ≠ POI Narrable

---

## Curación Cinematográfica

Follower actúa como un director de cine.

No como un sistema GIS.

La pregunta no es:

¿Qué lugares existen cerca?

La pregunta correcta es:

¿Qué lugares merecen una historia?

---

## Niveles de Relevancia

### Nivel A — Identidad de Ciudad

Si desapareciera, la ciudad perdería parte de su identidad.

### Nivel B — Identidad de Barrio

Si desapareciera, el barrio perdería parte de su carácter.

### Nivel C — Contexto Narrativo

Ayudan a comprender una historia relevante.

### Nivel D — Infraestructura Funcional

Deben excluirse.

Ejemplos:

- estaciones de metro
- estaciones MIO
- paradas de autobús
- cajeros
- bancos
- farmacias
- gasolineras
- parqueaderos

---

## Filosofía de Escasez

Es preferible mostrar cinco lugares extraordinarios que cincuenta lugares mediocres.

La ausencia de ruido es una característica de Follower.

---

## Pregunta Rectora

Si este lugar desapareciera del recorrido:

¿seguiríamos entendiendo la ciudad igual?

Si la respuesta es sí, probablemente no pertenece a Follower.

---

## Estado de implementación

*Esta sección separa lo que existe en código de lo que es criterio
editorial o trabajo pendiente.*

**Vigente en producción:**

- **Curaduría OSM (DA-73):** compuerta 0 (sin nombre → fuera) +
  blacklist, aplicada ANTES de exponer al store que alimenta `getPOIs()`.
  Los POIs OSM ya pasan por un filtro — parcial respecto a este
  manifiesto, pero existente.
- **Dedup y fusión (DT-49):** wiki gana; el perdedor lega
  inscription/wikidata.

**Hueco identificado — alcance del ticket de Fase 2 (curaduría
cinematográfica, pendiente de registrar como DT):**

- **La rama Wikipedia NO tiene compuerta.** La curaduría de DA-73 solo
  filtra OSM; los POIs wiki entran sin filtro y además ganan toda fusión.
  Evidencia de campo: estaciones MIO en Cali narradas como capítulos —
  muchas estaciones de transporte tienen artículo de Wikipedia (también
  en Lisboa y Barcelona: bocas de metro con artículo propio).
- **Alcance concreto del ticket:** blacklist de Nivel D en la rama wiki
  (por patrón de título y/o categoría del artículo), espejo de la
  blacklist OSM existente. Implica `POI_CACHE_VERSION++` en el mismo
  commit (DA-71).

**Criterio editorial (Niveles A/B/C) — NO es algoritmo:**

Ninguna fuente de datos dice "identidad de ciudad". Los niveles A/B/C son
la vara con la que se deciden los casos frontera de curaduría (qué entra
a los tiers, qué patrones van a la blacklist), no una clasificación en
runtime. **Primera aplicación pendiente: DT-61** — el parque urbano
grande invisible de S31 es Nivel B mínimo → `leisure=park` con nombre es
candidato a entrar a los tiers curados (implica `POI_CACHE_VERSION++`).

**Pregunta abierta registrada (para la sesión de Fase 2, no resolver
antes):**

La Filosofía de Escasez ("cinco extraordinarios > cincuenta mediocres")
tensiona con la mecánica anti-hambre de DA-72: `COMPOSITE_THRESHOLD = 8`
existe para *rellenar* cuando hay pocos POIs, y el Tier 2 se abre "si
sigue el hambre". Este manifiesto sugiere que el hambre puede ser
aceptable si lo que hay es bueno. La sesión de Fase 2 decide: bajar el
umbral, someter el relleno Tier 2 a la Pregunta Rectora, o mantener
DA-72 y documentar la convivencia.
