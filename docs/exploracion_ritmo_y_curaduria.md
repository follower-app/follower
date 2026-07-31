# Exploración — Ritmo narrativo y curaduría de POIs

**Estado: EXPLORACIÓN — nada de este documento está ratificado.**
Es insumo para decisiones futuras, no un registro de decisiones tomadas.
Distinguir siempre: *verificado en código* ≠ *evidencia externa* ≠ *hipótesis* ≠ *propuesta*.

**Fecha:** 30 jul 2026 · Sesión 37
**Revisión 2 (mismo día, tras validación de campo):** corregida §5.2 — se retiró una "evidencia de campo" que era falsa. Ver §9.
**Origen:** conversación abierta que arrancó revisando bugs/DTs pendientes y derivó a arquitectura narrativa. Se documenta aparte para no contaminar `bitacora.md` (que registra sesiones de implementación) ni `arquitectura.md` (que registra decisiones ratificadas).

---

## 1. Hallazgos verificados en código

Todos contrastados contra `raw.githubusercontent.com` durante la sesión, no contra el panel.

### 1.1 `DT-68` está mal planteado en su premisa

`AppState._walkChapters` **ya acumula todos los capítulos de la caminata**, no solo el último:

```js
{ poiId, poiName, text, ts }   // narration.js:1300
```

- Se hace `push` en cada narración real; los `source === 'fallback'` quedan fuera (correcto).
- Se resetea por caminata en `app.js:535`.
- El log ya emite `capítulo #N guardado`.

Lo que solo usa el último es el **consumo**: `buildPrompt()` lee `chapters[chapters.length - 1]` para la continuidad de DT-39/DA-52.

**Consecuencia:** DT-68 no es "acumular". Es **"definir qué consume el epílogo y en qué forma"**. Ticket más pequeño de lo que se creía. El ticket debe reescribirse antes de trabajarse.

### 1.2 "Título de capítulo" no existe y no debe existir

DT-68 pide guardar "título + idea central". El Prompt Maestro **prohíbe** que el modelo genere títulos — está en el scratchpad de verificación (*"¿Generé un título que no fue pedido?"*). El único identificador disponible es `poiName`, que ya se guarda.

**Acción sugerida:** redefinir "título" como `poiName` en el enunciado de DT-68.

### 1.3 "Idea central" no se captura en ninguna parte

Solo existe el texto completo del capítulo. Ver §4.1 para las opciones evaluadas.

### 1.4 `_attachExtracts()` trae extractos de TODOS los POIs wiki

`poi.js:364` — lotes de 20 (`exlimit` para anónimos), `prop=extracts&exintro=true`, al cargar. No solo del POI activo.

**Consecuencia importante:** el insumo para clasificar temáticamente todos los POIs de una ciudad **ya está en memoria y no cuesta fetches adicionales**. Esto vuelve factible la curaduría por lente (§5).

### 1.5 La regla 7 del Prompt Maestro ya es un mecanismo anti-saciedad

> *"CONTINUIDAD — Construye sobre el capítulo anterior... No repitas su idea central. No repitas su recurso sensorial o sonoro."*

Escrita antes de tener la evidencia que la justifica (§2). Opera sobre `prevBlock` y está verificada en el scratchpad. Extenderla de "recurso sensorial" a "ángulo narrativo" es un delta de una línea, no un subsistema nuevo.

### 1.6 DA-50 no eliminó los cuatro registros como capacidades

Texto literal de la decisión:

> *"Los cuatro registros anteriores (storyteller, historian, explorer, local) no desaparecen como capacidades: el narrador único los absorbe implícitamente, eligiendo el ángulo según el POI, no según una preferencia de configuración."*

Lo que se eliminó fue **el selector**, no los registros. Cualquier reintroducción invisible es compatible con DA-50; cualquier reintroducción como pantalla de configuración la contradice.

### 1.7 Comentario fósil en `care.js`

El comentario de `Care.resetWalk()` dice *"PENDIENTE: cablear esta llamada en app.js"*, pero `app.js:539` ya la llama. Candidato a colgarse de **DT-70**.

---

## 2. Evidencia externa — fatiga y atención del visitante

**Literatura de museos y tours guiados. No es evidencia de campo de Follower.** Sirve para formular hipótesis con números, no para ratificarlas. La doctrina de validación probabilística (n≥4) sigue mandando.

| Hallazgo | Cifra | Fuente |
|---|---|---|
| Proporción de elementos en que el visitante se detiene | ~1/3 | Serrell, 108 exhibiciones con seguimiento |
| Duración total de visita | <20 min en el 80% de los casos, sin importar tamaño ni tema | Serrell |
| Rango en revisiones posteriores | 20–40%, interpretado como estrategia inteligente del visitante, no como falla | revisión posterior a Serrell |
| Declive general de atención | 30–45 min | Bitgood (saciedad por objetos) |
| "Gradiente de salida" | atención concentrada en las primeras salas, caída brusca después | literatura de museos |
| Recorrido autorregulado vs. orden impuesto | el autorregulado alcanza la saciedad **más tarde** y reporta mayor satisfacción | estudios de saciedad |
| Paradas óptimas en tour autoguiado a pie | 6–12; por encima de 12 se recomienda partir en itinerarios temáticos | práctica de diseño de tours |
| Duración por parada | 60–90 s buenos > 4 min "completos" | práctica de audio tours |
| Comportamiento tras cumplir objetivos | el turista se vuelve "vagabundo sin rumbo" — y ese aflojamiento es cuando está **más receptivo** | estudio de comportamiento con audioguías |

### 2.1 Los tres números que importan para Follower

1. **~8 capítulos es el techo real de una caminata**, no 25. El problema de las caminatas larguísimas casi no existe; el problema real es el opuesto (densidad de POIs en centro histórico).
2. **90–130 palabras ≈ 50–60 s hablados.** El Prompt Maestro ya está en el punto óptimo de la literatura. **No hay nada que cambiar ahí.**
3. **30–45 min es la ventana de atención plena** ≈ ~2 km a ritmo urbano. En un centro histórico denso Follower puede detectar 20 POIs en esa ventana; narrarlos todos produce exactamente la saciedad descrita.

### 2.2 Validación colateral del Modo Libre

El hallazgo de "recorrido autorregulado retrasa la saciedad" implica que el Modo Libre no es solo una decisión de producto: está **estructuralmente favorecido contra la fatiga** frente a cualquier ruta impuesta. Argumento adicional para no construir rutas guiadas.

---

## 3. Concepto nuevo — Presupuesto de ritmo

**No existe hoy en el proyecto. Es el hallazgo principal de la sesión.**

DT-61 y DT-65 están planteados como filtros de **calidad** ("¿este POI merece capítulo?"). La evidencia dice que hace falta además un filtro de **ritmo**: aunque los 20 POIs detectados fueran todos excelentes, narrarlos todos destruye la experiencia.

> **Presupuesto de ritmo:** número máximo de narraciones por unidad de tiempo o de caminata, independiente del mérito individual de cada POI.

Es el número que la **Filosofía de Escasez** nunca tuvo. Hasta ahora era una intuición sin cifra; la literatura ofrece un rango defendible (6–12 por caminata, ~30–45 min de ventana plena).

**Es transversal:** ni DT-61 ni DT-65 ni DT-68 se pueden dimensionar bien sin él.

---

## 4. Decisiones alcanzadas en la conversación (ratificadas por Jaime)

### 4.1 Insumo del epílogo — **opción A confirmada**

Cómo obtiene el epílogo las "ideas centrales" de los capítulos:

- **A. Mandar los textos completos al epílogo.** ✅ **Elegida.**
- **B.** Capturar `Idea central:` en el scratchpad del Prompt Maestro. ❌
- **C.** Segunda llamada a Haiku que comprima al cerrar. ❌ (latencia en el momento emocional del cierre)

**Razón — matemática de costo (Haiku 4.5: US$1/M entrada, US$5/M salida):**

| | Costo por caminata (8 capítulos) | 1.000 caminatas/mes |
|---|---|---|
| A — textos completos | ~2.100 tokens de entrada → **~US$0,002** | ~US$2 |
| B — scratchpad | ~120 tokens de salida → **~US$0,0008** | ~US$0,76 |

Diferencia: **~US$1,30/mes con mil caminatas**. En dinero no es una decisión.

**Dónde B sí es caro:**
- Tocar el Prompt Maestro implica bump de `PROMPT_VERSION`, que está en la clave de caché de narraciones → **invalida todos los capítulos cacheados de todos los usuarios**.
- Obliga a re-validar n≥4 un prompt que está 16/16 (S32).
- Cobra tokens de salida en **cada** capítulo, aunque el caminante nunca cierre la caminata. A solo paga cuando el epílogo ocurre de verdad.

> Principio destilado: **A gasta solo cuando hay premio; B cobra un peaje permanente por un premio opcional.**

B queda documentada como graduación futura si el campo muestra que el epílogo se ahoga con textos completos.

### 4.2 Tope de capítulos para el epílogo — **abierto**

Opciones planteadas, sin ratificar:
- **A.** Sin tope. Máxima fidelidad; riesgo de "epílogo-inventario" en caminatas largas.
- **B.** Últimos N (N≈12). Simple, pero descarta el arranque — que es lo que más se recuerda.
- **C.** Asimétrico: primeros 3 + últimos 9, activo solo por encima de 12 capítulos. Conserva el *bookend* natural y descarta el medio, donde vive la repetición. *(recomendación de Claude)*

La evidencia de §2 sugiere que el umbral de 12 está bien ubicado — y que el caso se activará rara vez.

---

## 5. Ideas exploradas — NO ratificadas

### 5.1 Rotación de ángulo narrativo (los "4 modos", en versión invisible)

**Origen:** intuición de Jaime de que los cuatro estilos originales podrían servir contra la fatiga.

**Corrección importante:** la implementación vieja **no** habría resuelto la fatiga. Un selector fijo al inicio entrega 20 capítulos en el mismo registro — monotonía uniforme. La saciedad viene de estímulos *similares repetidos*; una elección fija por caminata es ortogonal al problema, e incluso podría empeorarlo frente al narrador único, que hoy ya varía el ángulo según el lugar.

Lo que la evidencia respalda es **variación dentro de la caminata, decidida por el sistema, no por el usuario**. Un amigo culto no pregunta qué personalidad usar; una audioguía sí tiene modos y pistas.

**Caminos:**
- **A.** Extender la regla 7 ("no repitas el ángulo del capítulo anterior"). Delta de una línea. Costo: bump de `PROMPT_VERSION` + invalidación de caché + revalidación n≥4.
- **B.** Ángulo determinista por tipo de POI. Auditable pero rígido; con ocho iglesias vuelve la monotonía. Exige taxonomía inexistente. **Descartada.**
- **C.** Primero el presupuesto de ritmo; la rotación después, con evidencia. *(recomendación de Claude)*

**Razón de C:** si se implementan el presupuesto de ritmo y la rotación a la vez y la caminata mejora, no se sabrá cuál lo hizo — el caso exacto que "una variable a la vez" existe para evitar. Además A es barato de hacer después. Si el presupuesto baja la caminata de 20 a 8 capítulos, buena parte de la saciedad desaparece sin tocar el prompt.

**A queda como graduación condicionada**, mismo patrón que la lente de DA-85 §3 y que DT-71.

### 5.2 La narración como criterio de curaduría (lente temática)

**Origen:** propuesta de Jaime — que el modo/lente narrativa determine **qué POIs se narran**, no solo cómo.

**Ya estaba medio documentada:** nota de "Modo Curado" en bitácora S33 — *"misma arquitectura, diferencia de selección narrativa, no de interfaz"*.

**Por qué es fuerte:**
- Resuelve dos problemas con un mecanismo: baja N (ritmo) y produce coherencia.
- Cambia la pregunta difícil ("¿este POI vale un capítulo?") por una más fácil ("¿este POI pertenece a esta película?").
- Es el arco que DA-85 §2 renunció a construir vía prompt, conseguido por **selección** en vez de por instrucción.
- Es genuinamente cinematográfico: una película tiene género, y el género decide qué se muestra. Una audioguía muestra todo y deja elegir pista.

**Factibilidad (verificada, §1.4):** los extractos de todos los POIs wiki ya están en memoria. Clasificar 40 POIs sería **una sola llamada a Haiku** (títulos + primera frase → etiquetas JSON): ~1.200 tokens de entrada, **~US$0,002**, una vez por ciudad, cacheable junto al POI cache.

**Riesgos:**
1. **Quién elige la lente.** Usuario en pantalla = selector = audioguía (contradice DA-50). Si la elige **la tesis de ciudad**, el círculo se cierra: la tesis pasaría de tono (§3) a criterio de selección. Pero eso es una promoción grande — una tesis equivocada dejaría de contaminar el tono para contaminar *qué se narra*. **Palmira/Siria pesa aquí.**
2. **El piso.** Un filtro temático puede dejar cero POIs. Follower promete que la ciudad habla — un filtro capaz de producir silencio es peligroso. El riesgo es **específico de Latinoamérica e invisible si se diseña con ciudades europeas**, y DT-29 sigue abierta por dudas de cobertura wiki en cascos históricos colombianos. *(Corrección — ver §9: este riesgo se sostiene por argumento, NO por evidencia de campo. La medición citada en la revisión 1 era inválida.)*

   > **CORRECCIÓN (S37, 30 jul 2026).** Una versión anterior de este documento citaba como evidencia de campo un log de Palmira con "0 POIs de Wikipedia / 1 POI total". **Esa evidencia era inválida y se retira.** El log se tomó desde el Ingenio Manuelita (km 7 vía Palmira–Buga), a 5,1 km del centro y rodeado de caña: cero POIs en un radio de 2 km es el resultado esperado, y no dice nada sobre la cobertura wiki de Palmira. El mismo día, desde el centro, el log dio `Wikipedia: 7 POIs → 6 únicos → 6/6 con extract`. Palmira **sí** tiene cobertura.
   >
   > El riesgo del piso **sigue siendo real por argumento**, pero queda degradado de *confirmado en campo* a **hipótesis sin respaldo empírico**. DT-29 sigue sin probarse ni a favor ni en contra.
   >
   > Nota de método: el error fue mío (Claude) — concluí cobertura de ciudad a partir de una muestra tomada en zona rural sin preguntar por la ubicación. Es exactamente la regresión documental que la regla de "distinguir lo que está en código de lo aspiracional" existe para evitar, aplicada a evidencia de campo.
3. **Versionado.** La clasificación entra al régimen de `POI_CACHE_VERSION`.

**Alcances posibles:**
- **A.** Lente completa desde la tesis: filtra POIs. Visión completa, ambos riesgos activos.
- **B.** Lente elegida por el usuario. **Descartada** (selector que DA-50 mató).
- **C.** Clasificación temática como criterio de **prioridad**, no de exclusión: se etiquetan todos los POIs y, cuando el presupuesto de ritmo obliga a elegir 8 de 20, se escogen maximizando **diversidad temática** en vez de por cercanía. Nunca excluye a cero. *(recomendación de Claude)*

**Razón de C:** construye el clasificador — prerrequisito compartido de todo lo demás — ataca la fatiga por las dos vías a la vez (menos capítulos *y* menos monotonía), y es imposible que produzca una caminata muda. A queda como graduación cuando el clasificador esté validado y la tesis tenga campo a favor.

### 5.3 Momento natural para preguntar por el cierre (insumo para DT-46)

El hallazgo del "vagabundo sin rumbo" (§2) sugiere que los 30–45 min, o el 7º–8º capítulo, son candidatos concretos para que Follower **pregunte** si la caminata terminó.

**Línea que no se cruza:** DA-85 prohíbe **inferir** el cierre. *Ofrecer la pregunta* en un buen momento no viola nada — el disparador del epílogo sigue siendo el tap de confirmación del usuario.

---

## 6. Tickets sugeridos (no creados)

| Propuesto | Descripción | Estado |
|---|---|---|
| **Nuevo — Presupuesto de ritmo** | Techo de narraciones por caminata/tiempo, independiente del mérito. Transversal a DT-61, DT-65, DT-68. | Por crear |
| **Nuevo — Clasificador temático de POIs** | Una llamada Haiku por ciudad sobre extractos ya en memoria; etiquetas cacheadas. Prerrequisito de §5.2. | Por crear |
| **Nuevo — Rotación de ángulo (graduación)** | Extender regla 7 del Prompt Maestro. Condicionado a que el presupuesto de ritmo no baste. | Por crear, condicionado |
| **DT-68** | Reescribir enunciado: no es "acumular" (ya ocurre), es "definir consumo del epílogo". "Título" → `poiName`. Insumo = textos completos (§4.1). | A corregir |
| **DT-70** | Sumar el comentario fósil de `Care.resetWalk()` (§1.7). | A ampliar |
| **DT-61 / DT-65** | Reencuadrar: hoy son filtros de mérito; falta el eje de ritmo (§3). | A reencuadrar |
| **DT-46** | Sumar §5.3 como insumo de diseño del momento de cierre. | A ampliar |

---

## 7. Preguntas abiertas

1. ¿El presupuesto de ritmo es por **tiempo** (n narraciones / 30 min) o por **caminata** (máx. 8-12 totales)? La literatura respalda ambos encuadres.
2. ¿La tesis debe llegar a ser criterio de selección de POIs, o quedarse como lente de tono? Depende de la validación de campo de BUG-068.
3. Tope de capítulos para el epílogo (§4.2) — sin resolver.
4. ¿Qué pasa con el presupuesto de ritmo en una caminata de 3 horas? ¿Se recarga, o la caminata larga es intrínsecamente otra cosa?
5. ¿Los POIs no narrados por presupuesto quedan visibles en el mapa (silenciosos) o desaparecen? Toca el manifiesto de POIs.

---

## 8. Nota metodológica

Nada de §2 es evidencia de campo de Follower. Es literatura de museos y de práctica de tours guiados, con poblaciones y contextos distintos (interiores, visitas pagas, público autoseleccionado). Su valor es dar **rangos de partida y vocabulario**, no verdades. Toda cifra que llegue a código debe validarse en campo con la disciplina habitual: una variable a la vez, n≥4 para calidad narrativa, logs exportados del iPhone como árbitro.

---

## 9. Corrección registrada (revisión 2, 30 jul 2026)

**Qué se afirmó mal.** En la revisión 1, al analizar un export de campo de Palmira, se concluyó que "Palmira tiene 1 POI" y que eso **confirmaba DT-29 en campo**, usándolo como respaldo empírico del riesgo del piso en §5.2.

**Por qué era falso.** La medición se tomó en Ingenio Manuelita, km 7 vía Palmira-Buga — **5,1 km del centro**, rodeado de caña. Wikipedia GeoSearch con radio de 2 km desde ahí devuelve cero porque no hay nada que devolver, no porque Palmira tenga mala cobertura. El centro histórico quedaba fuera del radio.

**Qué mostró la medición correcta.** Export del mismo día desde el centro de Palmira:

```
15:29:18  Wikipedia: 7 POIs en 1249ms
15:29:18  Wikipedia: 1 artículos no-lugar descartados (filtro editorial)
15:29:19  Wikipedia: 6/6 POIs con extract (DT-51)
```

Seis POIs con extracto, y el filtro editorial descartando correctamente. **Palmira sí tiene cobertura wiki.**

**Estado corregido.** DT-29 **sigue sin evidencia ni a favor ni en contra**. El riesgo del piso de §5.2 se mantiene íntegro como argumento de diseño —un filtro temático estricto sobre un conjunto delgado puede producir silencio— pero baja de *"confirmado en campo"* a *"hipótesis"*.

**Por qué queda escrito.** Es exactamente la regresión documental contra la que existe la regla del proyecto de distinguir lo verificado de lo supuesto. Un dato de campo mal encuadrado es más peligroso que ningún dato, porque se cita después sin volver a mirar de dónde salió. La lección operativa: **antes de usar una medición de campo como evidencia, verificar dónde se tomó.**
