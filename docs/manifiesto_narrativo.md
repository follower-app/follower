# docs/manifiesto_narrativo.md

# 🎬 MANIFIESTO NARRATIVO — FOLLOWER v3.1

**Sesión 32.** Reemplaza al manifiesto v3.0 (Sesión 23, DA-74). Este
documento es el norte narrativo del proyecto: describe la obra que
Follower quiere ser. No todo lo que describe existe ya en código — ver la
sección "Estado de implementación" al final, que es parte obligatoria de
este documento (lección DT-60/S31: un documento nunca debe decir "hecho"
sobre algo que el código no hace). La voz operativa vive en
`docs/prompt_maestro_follower.md` v3.7.

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

### El Caminante

Es el protagonista.

Debe sentirse acompañado.

No guiado.

### La Ciudad

Es el gran personaje de la historia.

No es un escenario.

Es aquello que intentamos comprender.

### Follower

Es un compañero invisible.

No es un profesor.

No es un guía turístico.

Es alguien que ama la ciudad y ayuda a descubrirla.

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

## Continuidad

La caminata es la historia.

Los capítulos forman una historia continua.

Cada capítulo debe:

- recordar lo descubierto
- aportar algo nuevo
- avanzar la comprensión de la ciudad
- abrir naturalmente el siguiente capítulo

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
- **Puente Narrativo** — la sección de este manifiesto se tradujo tal
  cual a la regla 8 (CIERRE) del Prompt Maestro v3.7: cierre anclado en
  lugar/tema/ciudad, pregunta no obligatoria, prohibida la pregunta
  universal, prohibida la promesa hacia adelante.
- **Verdad Narrativa** — bloque de grounding DT-51 (hechos del extracto
  como material, nunca como ficha) + detector programático + scratchpad
  v3.7.

**Visión ratificada, DISEÑO CERRADO en DA-85 (Sesión 33), implementación
PENDIENTE:**

- **Prólogo / tesis de ciudad** — diseñado en DA-85 §1: tesis 100%
  generada por Haiku + scratchpad sobre el extracto wiki de la ciudad,
  cache `${THESIS_PROMPT_VERSION}_${cityName}_${lang}`, degradación en
  cascada, el saludo nunca espera a Haiku. Personificación autorizada
  SOLO aquí. Prerequisito de implementación: DT-60 (commit 1 de la fase
  de implementación).
- **Actos / tema actual** — decisión DA-85 §2: NO se modela en v1; la
  tesis es el único arco. La continuidad sigue capítulo-a-capítulo
  (DT-39/DA-52). "Tema actual" = evolución futura condicionada a
  evidencia de campo.
- **Capítulos** — DA-85 §3: la tesis entra al system prompt como lente
  débil (nunca literal, nunca forzada), sin scratchpad; fingerprint de
  tesis en la clave de cache de narración.
- **Epílogo** — DA-85 §4 (absorbe DT-53): disparador único = cierre
  confirmado de DT-46; insumo = capítulos de la caminata (DT-68);
  bookend con la tesis; `userName` (DA-75); sin cache. La despedida
  resume descubrimientos, no lugares.

**Estado de los prerequisitos (S33):** (1) scratchpad validado n≥4 ✔
(S32); (2) DT-60 pendiente — prerequisito de implementación del Prólogo;
(3) sesión de diseño ✔ (S33 → DA-85). Prerequisito nuevo del Epílogo:
DT-46 + DT-68.
