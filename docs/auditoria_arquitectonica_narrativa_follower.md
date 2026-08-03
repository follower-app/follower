# Auditoría Arquitectónica Narrativa --- Follower

## Alineación entre THESIS_SYSTEM_PROMPT, PRÓLOGO y PROMPT MAESTRO

### Objetivo

Esta auditoría no busca reescribir los prompts existentes ni modificar
la arquitectura técnica del proyecto.

Su propósito es verificar que los tres bloques narrativos formen un
único sistema coherente y trabajen como una sola experiencia para el
caminante.

No se propone cambiar:

-   JSON
-   formato de salida
-   grounding
-   validaciones
-   caché
-   mecanismos de seguridad
-   límites de longitud

El foco es exclusivamente la arquitectura narrativa.

------------------------------------------------------------------------

# La nueva visión de Follower

Durante esta auditoría surgió una conclusión importante.

Follower ya no busca responder:

> ¿Cuál es la esencia de una ciudad?

Ahora busca responder:

> ¿Cuál es el mejor lente narrativo desde el cual toda esta ciudad puede
> convertirse en una película coherente?

Ese cambio afecta por igual a la tesis, el prólogo y los capítulos.

------------------------------------------------------------------------

# Arquitectura narrativa

``` text
Wikipedia + evidencia documental

↓

Identidad dominante

↓

Lente narrativo

↓

TESIS

↓

PRÓLOGO

↓

CAPÍTULOS

↓

Película completa
```

Cada bloque cumple una responsabilidad distinta.

------------------------------------------------------------------------

# Bloque 1 --- Tesis

## Estado actual

La generación de tesis ya es sólida.

El ajuste consiste en redefinir su objetivo.

La tesis deja de intentar resumir una ciudad y pasa a descubrir el lente
narrativo que hará coherente toda la experiencia.

## Nuevo razonamiento

``` text
Wikipedia

↓

Evidencia documental

↓

Identidad dominante

↓

Identidad cultural (como apoyo)

↓

Lente narrativo

↓

Validación narrativa

↓

TESIS
```

La identidad cultural nunca debe crear la tesis.

Solo puede confirmar una hipótesis nacida de la evidencia.

Antes de aceptar una tesis debe responderse:

> ¿Este lente puede sostener todos los capítulos de una caminata?

------------------------------------------------------------------------

# Bloque 2 --- Prólogo

## Función

El prólogo no explica la ciudad.

No resume su historia.

No compite con la tesis.

Su misión consiste en transformar la tesis en la primera escena de la
película.

La tesis define cómo mirar.

El prólogo enseña cómo empezar a mirar.

Cuando termina el prólogo el usuario todavía no conoce los POIs, pero ya
entiende desde qué perspectiva vivirá toda la ciudad.

------------------------------------------------------------------------

# Bloque 3 --- Prompt Maestro

## Estado actual

La arquitectura general del Prompt Maestro permanece vigente.

Se conservan:

-   identificación
-   rasgo visible
-   pregunta natural
-   explicación
-   arquitectura
-   cultura
-   personas
-   límites
-   verificación final

## Cambio conceptual

La IDEA CENTRAL ya no debe nacer únicamente del POI.

Debe derivarse de la tesis.

Nuevo flujo:

``` text
TESIS

↓

Lente narrativo

↓

¿Qué aspecto de ese lente revela este POI?

↓

Pregunta natural

↓

Explicación

↓

Idea central

↓

Capítulo
```

Además del capítulo anterior y el grounding, cada capítulo debería
recibir la tesis de la ciudad para mantener continuidad narrativa.

No debe repetirla literalmente.

Debe desarrollarla.

------------------------------------------------------------------------

# Relación entre los tres bloques

``` text
EVIDENCIA

↓

TESIS
(¿Cuál es el lente?)

↓

PRÓLOGO
(¿Cómo mirar?)

↓

CAPÍTULOS
(Cada lugar revela una nueva faceta del mismo lente)

↓

Película completa
```

------------------------------------------------------------------------

# Conclusión

La auditoría concluye que no es necesario rediseñar el sistema
narrativo.

La arquitectura actual es sólida.

Las mejoras consisten en:

1.  redefinir el concepto de tesis como lente narrativo;
2.  convertir el prólogo en la primera escena de ese lente;
3.  hacer que todos los capítulos desarrollen progresivamente la misma
    tesis.

Con estos ajustes, la experiencia deja de sentirse como una colección de
historias independientes y pasa a percibirse como una única obra
cinematográfica.
