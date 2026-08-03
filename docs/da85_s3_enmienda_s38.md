## DA-85 §3 — Enmienda (S38): lente operativo — diseño ratificado, SIN IMPLEMENTAR

*Sesión 38, 31 julio 2026. Enmienda a DA-85 §3 (S33). Sustituye el diseño original de §3, que quedaba corto en dos puntos. **Nada de esto existe en código** — es diseño cerrado a la espera de sus prerrequisitos.*

### Qué decía §3 en S33

> *"Capítulos — DA-85 §3: la tesis entra al system prompt como lente débil (nunca literal, nunca forzada), sin scratchpad; fingerprint de tesis en la clave de cache de narración."*

Se conserva: **lente débil, nunca literal, nunca forzada** y el **fingerprint en la clave de caché**. Se enmienda lo demás.

### Origen de la enmienda

Tres auditorías externas (ChatGPT, S38) propusieron que la idea central del capítulo naciera de la tesis. La propuesta era correcta en el objetivo —que la caminata se sienta como una obra y no como historias sueltas— e insuficiente en el mecanismo: encadenar el capítulo a la tesis le hace heredar su voz personificada y sus fallos.

### 1. Principio estructural: hermanos, no cadena

La tesis y el lente **no** están encadenados. Ambos nacen del mismo rasgo verificado en el scratchpad de la Parte 1 de la llamada de bienvenida:

```
extracto ciudad → scratchpad: rasgo + evidencia literal
                        ↓
        ┌───────────────┼───────────────┐
      TESIS          PRÓLOGO      LENTE OPERATIVO
    (hablada)       (pantalla)      (interno)
```

En una cadena, un fallo se propaga. Entre hermanos, se contiene: si la tesis queda mal redactada pero el rasgo era correcto, el lente sigue siendo válido, y viceversa.

**Esta es la decisión de la que cuelga todo lo demás.** Si en el futuro alguien propone volver al modelo en cadena (`tesis → capítulos`), lo que hay que releer es esta sección.

### 2. Por qué el lente no personifica

La diferencia es **gramatical**, no de contenido.

- La **tesis** es una proposición sobre la ciudad: *"la ciudad que cultiva respuestas"*. Sujeto: la ciudad. Personifica por naturaleza — no puede no hacerlo.
- El **lente operativo** es una instrucción de atención dirigida al narrador: *"entre dos datos igualmente ciertos del extracto, prioriza el que involucre…"*. Sujeto: el narrador. La ciudad no aparece como sujeto.

La personificación se vuelve **estructuralmente imposible, no prohibida por regla**. Es la diferencia entre un invariante diseñado y uno defendido a punta de regaños en el prompt — y S32 ya demostró que los regaños cuestan calidad.

Tres propiedades del lente:

1. **Nunca se habla ni se muestra.** Andamiaje interno, como el scratchpad. El caminante jamás lo lee.
2. **Gobierna la selección, no el contenido.** Decide *qué mirar* del extracto del POI. Nunca autoriza afirmar nada que el extracto no diga. Frontera de BUG-068, no negociable.
3. **El capítulo lo obedece en silencio, nunca lo cita.**

### 3. Por qué la tesis no se vuelve dependencia frágil

**a) El lente es consejo, nunca mandato.** Jerarquía explícita en el prompt: *grounding del extracto > reglas del Prompt Maestro > lente*. Y línea de escape literal: *"si el lente no encuentra asidero en este extracto, ignóralo por completo y escribe el capítulo con normalidad"*.

Esto fija el piso: **un lente malo degrada a la calidad de v3.7, nunca por debajo.** La apuesta es asimétrica — puede mejorar, no puede empeorar. Sin esta línea el diseño sería indefendible antes de la validación de campo.

**b) El lente ausente es un estado válido, no un fallo.** Si el rasgo no sostiene una instrucción de atención —extractos puramente administrativos, que es justo donde la tesis es más débil— no se emite lente. Nulo explícito. Los capítulos corren sin él.

**c) El capítulo nunca espera al lente.** Mismo principio que el saludo en DA-85 §1. Cero acoplamiento temporal.

**d) Fingerprint del lente en la clave de caché del capítulo.** Enmienda al §3 original, que fingerprintaba la tesis: lo que entra al prompt del capítulo es el lente, así que es el lente lo que debe entrar a la clave. Sin esto, un bump de `THESIS_PROMPT_VERSION` regenera el lente pero deja capítulos cacheados bajo el lente viejo — la película se desincroniza sin que nada falle visiblemente.

### 4. Homogeneización: dos mecanismos, no uno

Veinte capítulos bajo un mismo lente pueden aplanarse.

> **El lente es la tonalidad. La rotación de facetas impide que sea una sola nota.**

- La **regla 7** (capítulo anterior, DT-39/DA-52) cubre el eco inmediato.
- La **ventana de 8 facetas** cubre el eco a media distancia.

Ninguna regla nueva: solo enunciar en el prompt que cada capítulo revela una **faceta distinta** del mismo lente.

### 5. La faceta se declara en el scratchpad (enmienda a "sin scratchpad")

El §3 original decía "sin scratchpad". Se enmienda: el capítulo **declara su propia faceta** en la Parte 1 de verificación, que ya existe y ya se descarta.

```
Faceta: <3-5 palabras>
```

`sanitizeNarration` la extrae antes de descartar el andamiaje. El modelo declara la faceta en el mismo movimiento en que la elige: sin llamada extra, sin latencia, sin replicar comprensión semántica en JS. Costo ~8 tokens por capítulo.

**Alternativas descartadas:** derivar la faceta leyendo el capítulo con una segunda llamada (latencia y costo en caliente) o con heurística en JS (frágil, y duplica en JS la comprensión semántica que ya vive en el modelo).

**Riesgo aceptado — autoevaluación del modelo:** si declara *"faceta: arquitectura religiosa"* y escribe algo que va de comercio, la rotación trabaja sobre una etiqueta falsa. Fallo silencioso, detectable solo leyendo caminatas completas en campo. Costo acotado: un capítulo que repite ángulo, nunca un dato inventado.

### 6. La faceta viaja dentro del registro cacheado

La caché de narraciones es durable y está indexada por POI. En una ciudad ya caminada, buena parte de los capítulos **no se generan: se sirven** — y un capítulo servido nunca pasa por el scratchpad.

Un ledger ciego a los cacheados se degradaría **peor en la ciudad donde más caminas**, justo al revés de lo deseable, y en silencio.

Por eso el registro cacheado pasa de texto plano a `{ texto, faceta }`, y al servir desde caché la faceta se registra en el ledger igual que si se hubiera generado. **La rotación es indiferente al origen del capítulo.**

El cambio de formato invalida la caché existente — pero eso ya ocurre de todos modos con el bump `PROMPT_VERSION` v3.7→v3.8 que este ticket exige. **Una sola invalidación paga todos los cambios de formato.**

*(Descartada por invariante: no cachear capítulos cuando hay lente activo destruiría el offline obligatorio.)*

### 7. Ventana de inyección

El ledger inyecta al prompt **solo las últimas 8 facetas, FIFO**. Acota tokens en caminatas largas y refleja que lo que molesta es repetir un ángulo reciente, no uno de hace dos horas. **El Epílogo, en cambio, lee el ledger completo** — sus necesidades son otras.

### 8. DT-68 pasa a prerrequisito duro

La rotación de facetas necesita memoria de sesión. Sin ella, el capítulo 5 puede repetir la faceta del 2 sin violar ninguna regla: la regla 7 solo ve el capítulo inmediatamente anterior. Sobre veinte POIs, la rotación sería aleatoria con reemplazo.

**DT-68 deja de ser prerrequisito solo del Epílogo y pasa a serlo también de §3.** Reordenamiento de hoja de ruta con causa: DT-68 sube al puesto 5, §3 baja detrás.

```
Validación campo (#1 Palmira ✔ S37, #4 Cali pendiente)
            ↓
          DT-68  ← ledger de sesión
         ↙      ↘
   DA-85 §3    DT-46 → Epílogo (DA-85 §4)
```

DT-68 tiene ahora **dos consumidores con necesidades distintas**: el Epílogo necesita sustancia (capítulos completos, lectura única al final); la rotación necesita etiquetas (compactas, lectura en caliente en cada prompt). El ledger guarda ambas vistas del mismo evento.

### 9. Superficie de implementación

| Dónde | Qué |
|---|---|
| `THESIS_SYSTEM_PROMPT` | Parte 4 — LENTE OPERATIVO, separador `+++` (`---` y `===` están tomados) |
| Parser de bienvenida | Tercer split; lente al registro de caché de tesis |
| `THESIS_MAX_TOKENS` | 400 → ~480 |
| `SYSTEM_PROMPT` (Maestro) | Línea `Faceta:` en Parte 1 · bloque de lente + jerarquía + escape · ventana de 8 facetas · verificación: *¿usé el lente o lo cité?* |
| `sanitizeNarration` | Extraer `Faceta:` antes de descartar andamiaje |
| Registro cacheado | `texto` → `{ texto, faceta }` |
| Clave de caché de capítulo | `+ _fingerprint(lente)` |
| DT-68 | Ledger de sesión: capítulo completo + faceta |
| Versiones | `THESIS_PROMPT_VERSION` v5→v6 · `PROMPT_VERSION` v3.7→v3.8 · `sw.js` aparte y último |

Ambos bumps van en el mismo commit que los motiva y ambos invalidan caché.

### 10. Abierto deliberadamente: palabras vedadas

Se evaluó prohibir al capítulo las palabras de contenido de la tesis, para evitar eco léxico. **Decisión diferida**: hoy no existe ninguna caminata con lente operativo, así que la magnitud del eco es hipotética. Decidir contramedida ahora violaría "una variable a la vez" y "n≥4, no n=1".

Inclinación registrada: **emisión por Haiku dentro de la Parte 4** (cubre sinónimos y flexiones, mantiene la comprensión semántica en el modelo), sobre la derivación mecánica en JS. Añadirlo después es cambio de prompt + bump: **reversible y barato**, razón principal para diferirlo.

**Dos observaciones SEPARADAS para la validación de campo:**

1. **Repetición de eje narrativo** — la atacan el lente + la rotación de facetas.
2. **Eco léxico** — no nace de mirar lo mismo, sino de que el texto del lente está dentro del prompt (contaminación por vecindad). **Puede sobrevivir aunque las facetas sí roten.** Son dos mediciones, no una.

### Riesgos conocidos

- **Autoevaluación del modelo** (§5): faceta mal declarada → rotación sobre etiqueta falsa. Fallo silencioso.
- **Amplificación**: una tesis mala ya no muere en una frase, condiciona toda la caminata. Mitigado por §3.a, no eliminado. Es la razón de que la validación de campo sea prerrequisito duro y no una recomendación.

### Estado

**DISEÑO RATIFICADO — CERO CÓDIGO ESCRITO.** La siguiente acción sobre §3 no es de diseño: es validar DA-86 en Cali y cerrar DT-68.

**Relacionado:** DA-85 §1 (tesis/prólogo), DA-85 §2 (actos, no modelados), DA-85 §4 (Epílogo), DA-52/DT-39 (continuidad), DT-68 (prerrequisito duro, reespecificada), DT-46, BUG-068, DA-87.

---

*Follower — Arquitectura v0.9 | Sesión 38 | 31 Julio 2026*
