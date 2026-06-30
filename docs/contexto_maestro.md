# Follower — Contexto Maestro

Versión: 2.0
Fecha: Junio 2026
Estado: Sprint S3 — Narrador único · Care generativo · Ciudad sonora

---

# Qué es Follower

Follower es una experiencia cinematográfica de exploración urbana que transforma cualquier paseo en una historia.

No es una audioguía turística.

No es un mapa.

No es un asistente de viajes.

No es Wikipedia hablada.

Follower utiliza narrativa AI en tiempo real, GPS y cuidado humano contextual para ayudar a las personas a sentir una ciudad, no solamente a conocerla.

Slogan:

**your city soundtrack**

---

# Origen

Follower nace de una experiencia real durante un viaje por Europa.

Durante el viaje fue necesario utilizar múltiples herramientas:

* Google Maps para orientarse
* ChatGPT para obtener contexto
* Free Tours para conocer la historia
* Spotify para ambientar los recorridos

La experiencia era valiosa, pero fragmentada.

La pregunta que dio origen al proyecto fue:

> ¿Por qué nadie reúne todo esto en una sola experiencia?

---

# Problema

Explorar una ciudad genera carga cognitiva.

El viajero debe constantemente:

* decidir qué visitar
* buscar información
* orientarse
* elegir recorridos
* evitar perder tiempo
* coordinar horarios

La logística termina robándole espacio a la experiencia.

---

# Misión

Ayudar a las personas a disfrutar mejor una ciudad sin que la logística se convierta en protagonista.

---

# Visión

Convertirse en el compañero invisible de exploración más humano del mundo.

Un compañero que:

* acompaña
* narra
* sugiere
* cuida
* inspira

sin interrumpir la experiencia.

---

# Qué NO es Follower

No es una audioguía tradicional.

No es Wikipedia hablada.

No es un listado de POIs.

No es una aplicación para memorizar datos históricos.

No es una aplicación de planificación de viajes.

No es un chatbot turístico.

No es un reproductor de música de fondo.

---

# Principio Fundamental

Follower no compite por información.

Follower compite por emoción.

---

# Hipótesis Principal

Los usuarios no recordarán los datos históricos.

Recordarán cómo se sintieron mientras caminaban.

---

# ADN del Producto

## La ciudad es el escenario

Los POIs son actores secundarios.

La historia es la protagonista.

El caminante es el protagonista de esa historia.

Follower es la banda sonora.

---

## Los capítulos construyen una tesis

Follower no cuenta lugares.

Follower cuenta capítulos de una ciudad.

Cada capítulo aporta una pieza nueva a la misma pregunta:

> ¿Qué hace única a esta ciudad?

Al finalizar el recorrido el usuario debe sentir:

> "Ahora entiendo mejor esta ciudad."

---

## Los recorridos no son rutas

Los recorridos son relatos.

Un recorrido debe responder:

> ¿Qué historia estamos contando?

antes de responder:

> ¿Qué lugares vamos a visitar?

---

## La banda sonora es la ciudad

La ciudad tiene arquitectura visible.

También tiene arquitectura sonora.

Sus campanas. Sus mercados. Sus conversaciones. Sus músicos. Sus tranvías. Sus silencios.

Follower no reproduce música de fondo.

Follower enseña al caminante a escuchar la ciudad y a apreciar lo que ya suena a su alrededor.

La "banda sonora" de Follower vive en el texto narrativo, no en archivos de audio.

---

## La narración

La narración debe sentirse como:

> Un cuentero inteligente que amas la ciudad y camina junto a ti.

No como:

* un profesor
* una enciclopedia
* una audioguía tradicional
* un narrador omnisciente

Debe mezclar:

* historia
* presente
* curiosidades
* observación humana
* emoción

Cada capítulo parte del presente. Primero se vive. Después se comprende.

---

## El narrador

Follower tiene una sola voz.

No es un sistema con personalidades intercambiables.

Es el amigo más culto que conoces, pero que nunca presume de lo que sabe.

Puede haber nacido en la ciudad o haberse enamorado de ella.

Conoce su historia, sus barrios, sus personajes y sus costumbres.

No habla como profesor.

No habla como guía turístico.

Habla como alguien que ama profundamente la ciudad y disfruta compartiéndola.

La definición completa de esta voz vive en:

`docs/manifiesto_narrativo.md` y `docs/prompt_maestro_follower.md`

---

# Filosofía de Experiencia

El usuario debe sentir:

> Estoy donde debo estar.

No:

> Estoy siguiendo instrucciones.

---

# Modos de Uso

## Exploración Libre *(default)*

Follower reacciona a la ciudad.

El usuario decide el ritmo.

La ciudad sorprende.

---

## Recorridos Curados *(opt-in — versiones futuras)*

Follower cuenta una historia con arco narrativo predefinido.

La ruta existe para servir a la narrativa.

No al contrario.

Ejemplos planificados:

* La Barcelona de Gaudí
* Roma Imperial
* París Romántico
* Cali Salsera
* Lisboa de los Exploradores

---

# Sistema de Cuidado

Follower no solo informa.

También acompaña.

El Care es hospitalidad urbana, no una función de utilidad.

Habla con la misma voz que el narrador — no existe un segundo narrador, no existe un sistema separado.

Follower simplemente cambia de intención: por un momento deja de contar una historia y pasa a ejercer hospitalidad.

Puede reaccionar a:

* lluvia
* calor o frío extremo
* cansancio acumulado
* hora de almuerzo
* zonas de alta densidad de lugares notables (plazas, centros históricos)
* atardeceres y momentos especiales

La experiencia humana tiene prioridad sobre la narración.

El Care nunca ordena. Sugiere. Invita. Propone.

La definición completa vive en: `docs/manifiesto_care_strip.md`

---

# Principios de Diseño

## Sístole

Color: `#1a5276`

Representa movimiento.

Representa exploración.

Representa caminar.

---

## Diástole

Color: `#c0392b`

Representa narración.

Representa inmersión.

Representa historia.

---

## Regla absoluta

Sístole es azul. Diástole es rojo. Nunca invertir.

El usuario nunca lo sabe. Solo lo siente.

---

# Regla de Oro

La ciudad siempre es la protagonista.

Follower nunca debe sentirse más importante que el lugar que el usuario está explorando.

---

# MVP

Objetivo:

Demostrar que caminar con Follower es mejor que caminar con:

* Google Maps
* ChatGPT
* Free Tours
* Spotify

por separado.

---

# Métrica Principal de Validación

No:

* usuarios registrados
* POIs detectados
* minutos escuchados

Sí:

> ¿La experiencia fue memorable?

Métrica técnica principal: ⏱ **Tiempo hasta primera historia** — semáforo verde ≤90s / amarillo 90-300s / rojo >300s.

---

# Pregunta Rectora

Ante cualquier decisión de producto preguntar:

> ¿Esto nos acerca a una experiencia cinematográfica o nos acerca a una audioguía tradicional?

Si nos acerca a una audioguía, probablemente es la decisión equivocada.

---

# Aprendizajes Fundacionales

**Follower no construye recorridos. Follower construye relatos.**
Los recorridos son simplemente el camino físico por donde transcurren esos relatos.

**Wikipedia como filtro editorial.**
Un lugar con artículo en Wikipedia es un lugar que merece ser narrado. Esta alineación con la visión cinematográfica de Follower no es coincidencia — es el modelo mental correcto para el descubrimiento de POIs.

**La fuente de datos es parte del producto.**
Overpass era un bottleneck técnico que afectaba directamente la promesa de Follower. Cambiar la fuente de datos no fue una decisión técnica — fue una decisión de producto.

**Validar antes de arquitecturizar.**
Cada cambio importante debe primero probarse como experimento mínimo, con evidencia de campo, antes de formalizarse como arquitectura.

**La banda sonora es la ciudad, no la app.**
Follower no reproduce música. Enseña al caminante a escuchar lo que ya está sonando a su alrededor, y lo nombra en la narración.

**Interacción por voz bidireccional es una visión futura, no deuda técnica.**
Que el usuario pueda hablarle a Follower o interrumpir una narración con una pregunta es una categoría de producto distinta. Incompatible con "teléfono en el bolsillo" en la versión actual. Se anota como aspiración, no como pendiente.

---

*Follower — Contexto Maestro v2.0 | Sprint S3 | Junio 2026*
