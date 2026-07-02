# Restauración de `poi.js` — plan de trabajo

Estado: **DEFINICIÓN — para ejecutar en chat nuevo dedicado**
Origen: Sesión 19, 1 Julio 2026 — ver `arquitectura.md` DA-68 y `bitacora.md`

---

## Contexto para quien retome esto en el chat nuevo

El commit `9a6ac50` (30 jun, "DA-50: consolidate to single narrator voice")
revirtió `poi.js` a un estado anterior al 26 de junio, perdiendo 7
features/fixes independientes sin que el mensaje del commit lo mencionara.
Causa raíz: trabajar sobre una copia desactualizada de `poi.js` — el
riesgo exacto que la Regla de Oro existe para prevenir.

**Ya resuelto, no repetir:** la query Overpass rota (comentario mal
ubicado rompiendo la sintaxis) ya se arregló y subió — ver `js/poi.js`
actual y `sw.js` v11.

**Confirmado sin crash activo:** `narration.js`, `debug.js`, `app.js`
siguen llamando `POI.markVisited()`, `POI.processQueue()`,
`POI.resetVisited()` con guards `typeof === 'function'` — no rompen nada,
pero tampoco corren nunca. Restaurarlas en `poi.js` las reactiva
automáticamente sin tocar esos 3 archivos.

---

## Regla de Oro — aplicar literal antes de cualquier edición

Antes de tocar `poi.js`, confirmar explícitamente con el usuario: *"¿Este
`poi.js` que tengo en `/mnt/project/` es la versión real y actualizada del
repo?"* — no asumir, dado que este documento existe precisamente porque
esa pregunta no se hizo a tiempo la vez anterior.

---

## Las 7 piezas a evaluar — una por una, no en bloque

### 1. Wikipedia GeoSearch — la más importante, la más urgente

Restaurar `fetchWikipediaPOIs()` con el pipeline Wikipedia → Overpass →
IndexedDB. Antes de copiar el código de junio tal cual, revisar:

- ¿Sigue siendo válido el orden de idiomas por coordenadas geográficas
  (Francia→fr, Italia→it, etc.), o conviene reusar `COUNTRY_LANG` de
  `narration.js` (DT-41, más completo — 35+ códigos ISO) en vez de la
  lógica de rangos lat/lng duplicada que tenía la versión original?
- El schema de salida (`_source: 'wikipedia'`, tags vacíos) — ¿sigue
  siendo compatible con `normalizePOI()` y con `cleanPOIName()`
  (agregada después, en Sesión 18 vía DT-36)?
- Confirmar en campo la hipótesis original: *"Wikipedia reduce TTF de
  358s a <90s en ciudades turísticas"* — nunca se validó con datos reales
  porque el código desapareció antes de esa prueba

### 2. `_visitedInSession` / `markVisited()` / `resetVisited()` (BUG-044)

Restauración directa — el bug original ("Igreja da Madalena narrada dos
veces" en Lisboa) sigue siendo válido. `narration.js`/`debug.js`/`app.js`
ya llaman estas funciones, protegidas por guards — restaurarlas en
`poi.js` las reactiva sin más cambios.

### 3. Candado `_isFetchingPOIs` (BUG-014)

Restauración directa — previene fetches paralelos a Overpass. Verificar
que no colisione con el patrón de `_pendingDetect` (DT-38) agregado
después en el mismo archivo.

### 4. Cola narrativa `enqueuePOI`/`processQueue` (S2-A2)

Restauración directa — `narration.js` ya llama `POI.processQueue()`
protegido. Revisar `QUEUE_MAX_SIZE`/`QUEUE_TTL_MS` contra el
comportamiento actual de Care (¿debería Care también respetar la cola,
o son sistemas independientes a propósito?).

### 5. Mirrors de Overpass con fallback

Restaurar la lista de 3 mirrors (`kumi.systems`, `overpass-api.de`,
`lz4`) con fallback automático. Directamente relevante al bug de campo de
hoy — con mirrors, un fallo de `lz4` no habría tumbado toda la detección
durante 20 horas.

### 6. Query `nwr` optimizada

Evaluar si vale la pena restaurar `nwr` (node+way+relation combinado) en
vez de `node`/`way` separados — mejora de velocidad, pero confirmar que
sigue siendo válido con el filtro de `artwork` ya excluido (el fix de
Sesión 18 que causó el bug de sintaxis debe aplicarse también acá si se
restaura esta versión de la query).

### 7. Filtro geográfico del cache (`CACHE_RADIUS_M`)

Restauración directa — previene mostrar POIs de otra ciudad si el cache
IndexedDB tiene varias. Bajo riesgo, alta seguridad de que sigue siendo
correcto.

---

## Orden sugerido de trabajo

1. Confirmar freshness de `poi.js` (Regla de Oro)
2. Piezas 2, 3, 7 — restauración directa, bajo riesgo, sin rediseño
3. Pieza 5 (mirrors) — restauración directa, alto impacto en el bug de hoy
4. Pieza 4 (cola narrativa) — restauración con una pregunta de diseño (Care)
5. Pieza 6 (`nwr`) — evaluar, no bloqueante
6. Pieza 1 (Wikipedia) — la más grande, con las preguntas de diseño
   listadas arriba, al final para no bloquear el resto con esa discusión

---

*Follower — Plan de Restauración poi.js | Sesión 19 | 1 Julio 2026*
