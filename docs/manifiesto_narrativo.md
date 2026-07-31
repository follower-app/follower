# docs/manifiesto_narrativo.md

# 🎬 MANIFIESTO NARRATIVO — FOLLOWER v3.2

**Sesión 38.** Reemplaza al manifiesto v3.1 (Sesión 32). Este documento
es el norte narrativo del proyecto: describe la obra que Follower quiere
ser. No todo lo que describe existe ya en código — ver la sección
"Estado de implementación" al final, que es parte obligatoria de este
documento (lección DT-60/S31: un documento nunca debe decir "hecho"
sobre algo que el código no hace). La voz operativa vive en
`docs/prompt_maestro_follower.md` v3.7.

**Cambios de v3.1 a v3.2:** (1) se resuelve la contradicción de "Los
Personajes" contra el código vivo; (2) se absorbe la separación
autor / guion / actor; (3) se añade la tabla de responsabilidades por
bloque; (4) se actualiza el estado con la enmienda S38 a DA-85 §3.

---

## La pregunta rectora

¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?

Si la respuesta es audioguía, debemos replantearlo.

---

## Qué es Follower

Follower no es una audioguía.

Follower es un compañero invisible que transforma una caminata en una obra narrativa.

El teléfono debe desaparecer.

La ciudad debe aparecer.

---

## La Obra

Follower no narra lugares.

Follower construye una obra sobre una ciudad.

La caminata completa es la obra.

Cada capítulo aporta una nueva pieza para comprender mejor esa ciudad.

---

## Los Personajes

*Sección corregida en S38. La v3.1 decía de la Ciudad "es el gran
personaje, no es un escenario", mientras el Prompt Maestro en producción
decía desde S32 "la ciudad es el escenario, el caminante es el
protagonista". La v3.1 además se contradecía a sí misma, porque también
llamaba protagonista al Caminante. Resuelto a favor del código: el
caminante actúa, la ciudad es lo que se revela. Es justamente lo que
separa a Follower de una audioguía — la audioguía trata al usuario como
público.*

### El Caminante

Es el protagonista.

Es quien actúa: camina, elige, se detiene.

Debe sentirse acompañado.

No guiado.

### La Ciudad

Es el escenario donde ocurre la obra.

Y es, al mismo tiempo, aquello que intentamos comprender.

No es un personaje que decide, habla, late o siente — nunca se
personifica en los capítulos.

La única excepción es la tesis y el prólogo, donde la ciudad sí toma voz
propia. En ningún otro texto.

### Follower

Es un compañero invisible.

No es un profesor.

No es un guía turístico.

Es alguien que ama la ciudad y ayuda a descubrirla.

---

## El autor, el guion y el actor

*Absorbido en S38 de una auditoría externa. La metáfora es útil y se
adopta; sus afirmaciones sobre el estado del proyecto se corrigieron
contra el código.*

### El autor es el diseño del producto

Define la identidad de Follower, la arquitectura narrativa, las reglas,
el universo y la evolución emocional del recorrido.

Ese trabajo no pertenece al modelo de IA.

### El guion son los prompts

El guion define qué debe ocurrir, qué nunca debe ocurrir, qué información
revelar y qué emoción provocar.

No es la actuación.

Vive versionado en `docs/`, porque es el activo.

### El actor es el modelo

Cada modelo interpretará el mismo guion con un estilo distinto.

Ninguno define la identidad de Follower.

### Qué significa esto, y qué no

Significa que la arquitectura narrativa es el patrimonio del proyecto, no
el proveedor.

**No significa que hoy seamos independientes del modelo.** El guion
vigente está tallado sobre comportamientos específicos de Haiku: la
técnica del scratchpad, los separadores que el parser lee por posición,
los presupuestos de tokens. Cambiar de actor exige reescribir acotaciones
y volver a validar. La independencia es dirección, no estado.

### Cómo se diagnostica una mala narración

El orden importa, y el primer escalón es el que más se olvida:

```
Sale una mala narración
        ↓
¿El grounding era correcto?     ← BUG-068 murió aquí
        ↓ sí
¿Siguió el guion?
        ↓ sí
¿La interpretación emociona?
        ↓ no
Entonces sí: evaluar otro actor
```

BUG-068 costó cuatro versiones de prompt persiguiendo un síntoma. La
causa no era el guion ni el actor: el extracto venía de otra ciudad.

Cambiar de modelo mueve dos variables a la vez. Es el último recurso,
nunca el primero.

---

## Estructura Narrativa

### Prólogo

La ciudad se presenta.

Follower ofrece una primera intuición sobre ella.

No presenta datos.

Presenta una promesa narrativa.

### Actos

Toda caminata desarrolla uno o varios temas.

El tema puede surgir de:

- un barrio significativo
- varios POIs relacionados
- una época histórica
- una tensión propia de la ciudad

### Escenas

Cada POI es una escena.

La escena debe revelar algo sobre el tema actual.

Y el tema actual debe revelar algo sobre la ciudad.

### Epílogo

Toda caminata merece un cierre.

La despedida no resume lugares.

La despedida resume descubrimientos.

---

## Responsabilidad de cada bloque

*Absorbida en S38, con el flujo corregido: la tesis y el lente son
hermanos nacidos de la misma evidencia, no eslabones de una cadena
(DA-85 §3, enmienda S38).*

| Bloque | Responsabilidad |
|---|---|
| Evidencia | Aportar hechos verificables |
| Tesis | Nombrar el carácter de la ciudad — se habla |
| Prólogo | Preparar la mirada — se muestra |
| Lente operativo | Decidir qué mirar de cada lugar — nunca sale |
| Capítulos | Revelar una faceta distinta del mismo lente |
| Epílogo | Cerrar la experiencia |

Tesis, prólogo y lente nacen del mismo rasgo verificado. Un fallo en uno
no contamina a los otros.

---

## Continuidad

La caminata es la historia.

Los capítulos forman una historia continua.

Cada capítulo debe:

- recordar lo descubierto
- aportar algo nuevo
- avanzar la comprensión de la ciudad
- abrir naturalmente el siguiente capítulo

El lente es la tonalidad. La rotación de facetas impide que sea una sola
nota.

---

## Puente Narrativo

No es obligatorio terminar con una pregunta.

Evitar preguntas filosóficas universales.

La última frase debe surgir del lugar, del tema actual o de la ciudad.

---

## Verdad Narrativa

Los hechos verificables son materiales narrativos.

Nunca son el objetivo principal.

La historia principal siempre es la ciudad.

---

## Frase Fundacional

Follower no narra monumentos.

Follower construye una obra sobre una ciudad.

Cada POI es una escena.

Cada caminata es una película.

---

## Estado de implementación

*Esta sección separa lo que existe en código de lo que es visión
ratificada. Se actualiza cada vez que una pieza cambia de columna.*

**Vigente en producción (Prompt Maestro v3.7 / `narration.js`):**

- **Escenas** — cada POI genera un capítulo (mecánica completa de las
  reglas 1-6 del Prompt Maestro).
- **Continuidad hacia atrás** — el capítulo anterior se inyecta en el
  prompt (DT-39/DA-52); el modelo construye sobre él sin repetir idea
  central ni recurso sensorial. La continuidad de *temas* (actos) NO
  existe todavía — hoy la continuidad es capítulo-a-capítulo, no de arco.
- **Puente Narrativo** — traducido tal cual a la regla 8 (CIERRE) del
  Prompt Maestro v3.7.
- **Verdad Narrativa** — bloque de grounding DT-51 + detector
  programático + scratchpad v3.7.
- **Prólogo / tesis de ciudad** — DA-85 §1 implementado (S35-S36) y
  **validado en campo en Palmira (S37)**. Personificación autorizada SOLO
  aquí. Ver DA-86 (mostrar siempre, narrar una vez) y DA-87 + BUG-068
  (título canónico vía tag OSM). Límite conocido: no funciona desde la
  periferia rural → DT-72.

**Visión ratificada, DISEÑO CERRADO, implementación PENDIENTE:**

- **Lente operativo / capítulos** — DA-85 §3, **enmendado en S38**. El
  lente es hermano de la tesis, no su descendiente; es instrucción
  dirigida al narrador, por lo que no puede personificar; es consejo y
  no mandato, con línea de escape, de modo que un lente malo degrada a
  v3.7 y nunca por debajo; el capítulo declara su faceta en el scratchpad
  y la faceta viaja dentro del registro cacheado. **Prerrequisitos duros:
  validación de DA-86 en Cali + DT-68.** Cero código escrito.
- **Actos / tema actual** — DA-85 §2: NO se modela en v1; la tesis es el
  único arco. Evolución futura condicionada a evidencia de campo.
- **Epílogo** — DA-85 §4 (absorbe DT-53): disparador = cierre confirmado
  de DT-46; insumo = ledger de la caminata (DT-68), leído completo;
  bookend con la tesis; `userName` (DA-75); sin cache.

**Prerrequisitos vigentes (S38):**

```
Validación campo (#1 Palmira ✔ S37, #4 Cali pendiente)
            ↓
          DT-68  ← ledger de sesión, dos consumidores
         ↙      ↘
   DA-85 §3    DT-46 → Epílogo
```

DT-68 dejó de ser prerrequisito solo del Epílogo: también lo es de §3.
Sube al puesto 5 de la hoja de ruta y §3 baja detrás.
