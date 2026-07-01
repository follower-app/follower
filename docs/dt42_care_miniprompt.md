# DT-42 — Mini-prompt de Care (Follower v0.9)

Estado: **✅ IMPLEMENTADO** — Sesión 19, 1 Julio 2026. Código real en
`narration.js` (`getCareMessage()`, `CARE_SYSTEM_PROMPT`, `buildCarePrompt()`)
y `care.js` (`triggerSuggestion()`, `TRIGGER_META`, `generateAndShowCard()`).
Este documento queda como referencia de diseño de los 7 prompts, ya no como
spec pendiente.

---

## Contexto de uso

El mini-prompt reemplaza los mensajes estáticos (`MESSAGES.tired`, `.hot`, etc.)
en `care.js`. Se hace una única llamada a Claude que:
1. Elige editorialmente entre 3-5 candidatos de Overpass cuál lugar recomendar
2. Genera el mensaje completo en la voz narrativa de Follower

La llamada usa el mismo Worker de Cloudflare que narration.js.
`max_tokens: 120` — mensaje corto, se habla en voz alta.

**Cambio de alcance respecto a la v1 de este documento:** pasa de 5 a 7
triggers. Se suman `rain` (migrado de un sistema separado en `weather.js`)
y `thirst` (nuevo — recordatorio de hidratación sin lugar asociado). Se
evaluó y descartó `sunset`: sin datos de elevación/línea de vista, un
trigger basado solo en hora sugeriría un atardecer con la vista tapada por
edificios la mayoría de las veces en centros urbanos densos — rompe el
principio de "solo lo verificable" del Prompt Maestro.

---

## Orden de prioridad en checkCareContext()

```
1. rain    - weather.isRaining (proteccion real, puede anunciarse detenido)
2. hot     - temp >= 30C       (proteccion real)
3. cold    - temp <= 5C        (proteccion real)
4. lunch   - 12-14h + km > 1   (bienestar)
5. thirst  - 22-29C + km >= 1.2, una sola vez por caminata (bienestar)
6. tired   - km >= 2.0 o pasos >= 2600 (bienestar)
```

`special` no entra en este orden — se evalúa aparte en cada tick de GPS vía
`checkSpecialZone()`, no en el timer de 2 minutos de `checkCareContext()`.

---

## System prompt (invariante)

```
Eres la voz de Follower en un momento de cuidado.

No eres un asistente. No eres una app.
Eres alguien que camina junto al usuario y nota que necesita algo.

Tu tono: cálido, natural, como el amigo que conoce bien la ciudad.
Cuidas sin interrumpir. Sugieres sin insistir.

REGLAS:
- Máximo 55 palabras
- Sin saludos, sin signos de exclamación, sin emojis
- Menciona el lugar elegido con algo específico — no genérico (no aplica a thirst, ver abajo)
- Si hay varios candidatos, elige el que suene más auténtico del lugar (no el primero, no el mejor valorado)
- La razón del cuidado debe sentirse natural, no clínica
- Termina con una invitación suave, nunca con una orden
```

---

## User prompts por trigger

### Lluvia (rain) — NUEVO, migrado de weather.js

```
Está por llover / está lloviendo en {city}. El usuario sigue caminando.

Candidatos cercanos para resguardarse (elige uno):
{places_list}

Sugiere buscar refugio hasta que pase. Menciona el lugar elegido con un
detalle concreto — que suene a una pausa bienvenida, no a una alerta.
Idioma: {lang}
```

Nota de migración: hoy este mensaje vive 100% hardcodeado en `weather.js`
(`showRainAlert()`), sin pasar por Claude ni por `lang` — es la única
alerta de Care que no es bilingüe. Al implementar, `findNearbyRefuge()`
(amenity: `cafe|bar|library|museum`) se unifica con `findNearbyRestPlace()`
de `care.js` en una sola función parametrizable por tipo, y el timer propio
de 10 minutos de `weather.js` se elimina — `Care.checkCareContext()` ya lee
`AppState.weather` en su propio ciclo de 2 minutos.

### Calor extremo (hot)
```
El usuario lleva caminando en {city}. Temperatura actual: {temp}°C.

Candidatos cercanos (elige uno):
{places_list}

Sugiere hacer una pausa por el calor. Menciona el lugar elegido con un detalle concreto.
Idioma: {lang}
```

### Frío extremo (cold)
```
El usuario lleva caminando en {city}. Temperatura actual: {temp}°C.

Candidatos cercanos (elige uno):
{places_list}

Sugiere entrar a calentarse. Menciona el lugar elegido con un detalle concreto.
Idioma: {lang}
```

### Hora del almuerzo (lunch)
```
El usuario lleva explorando {city} y son las {hour}h.

Candidatos cercanos para comer (elige uno):
{places_list}

Sugiere parar a comer. Menciona algo del lugar que lo haga sonar como una buena decisión.
Idioma: {lang}
```

### Sed / hidratación (thirst) — NUEVO, sin lugar asociado

```
El usuario lleva caminando en {city}. Temperatura actual: {temp}°C (calor
moderado, no extremo). Lleva {km}km recorridos.

Este es un recordatorio de hidratación, no una sugerencia de lugar —
NO hay candidatos, no menciones ningún sitio específico.

Recuérdale de forma cálida y breve que tome agua seguido, aunque no sienta
sed todavía. Tono de amigo que avisa, no de app de salud. Sin instrucciones
clínicas, sin tono de alarma.
Idioma: {lang}
```

Diferencias estructurales respecto a los demás triggers:
- No se llama findNearbyRestPlace() — no hay places_list, no hay fetch a Overpass
- La card muestra un solo botón de cierre ("Entendido"), no el par "Ir aquí / Seguir igual"
- Se dispara una sola vez por caminata — flag `_thirstShownThisWalk`,
  reseteado junto con `AppState._walkChapters` (mismo ciclo de vida que la
  memoria de capítulo, DA-58), no por el cooldown estándar de 20 min

### Cansancio (tired)
```
El usuario lleva {km}km caminando por {city}.

Candidatos cercanos para descansar (elige uno):
{places_list}

Sugiere una pausa. Que suene como algo que el propio usuario ya estaba pensando.
Idioma: {lang}
```

### Zona especial (special) — DT-43
```
El usuario está en una zona con {count} lugares notables en 150 metros, en {city}.

POIs cercanos para contextualizar el momento:
{poi_names_list}

Invita al usuario a detenerse y prestar atención al entorno. No expliques qué hay —
sugiere que hay algo que merece ser notado.
Idioma: {lang}
```

---

## Formato de places_list

```
- Café La Palma (85m) — café
- Bar El Comercial (120m) — bar
- Mercado de San Ildefonso (200m) — mercado
```

Solo incluir nombre, distancia y tipo. Sin ratings. Sin reviews.

No aplica a thirst (sin lugar) ni a special (usa poi_names_list, POIs
de Wikipedia ya cargados, no candidatos de Overpass).

---

## Ejemplos de respuesta esperada

Calor (hot, Cali, candidatos reales):
> Hace calor de verdad. Ahí a ochenta metros está el Café del Parque —
> ese tipo de lugar con ventiladores de techo y jugo de lulo que parece
> hecho para momentos como este. Si quieres, pasamos.

Sed (thirst, sin lugar):
> Ya llevas un rato caminando y el sol de Cali no perdona. No lo pienses
> mucho — tomá agua seguido, aunque no sientas sed todavía. El cuerpo te
> lo va a agradecer en la próxima hora.

Lluvia (rain, migrado):
> El cielo ya lo está avisando. A pocos pasos, La Biblioteca Café tiene
> mesas adentro y buena luz para esperar que pase — a veces la lluvia le
> regala a uno una pausa que no sabía que necesitaba.

---

## Implementación en care.js

Reemplazar triggerSuggestion() para que:
1. Si type === 'thirst': saltar directo a showCareCard() sin
   findNearbyRestPlace(). Marcar _thirstShownThisWalk = true. Card con
   un solo botón de cierre.
2. Para el resto (hot/cold/lunch/tired/rain): fetch a Overpass
   con 3-5 candidatos (query existente en findNearbyRestPlace, unificada
   para incluir el caso de rain con amenity cafe|bar|library|museum)
3. Construir el user prompt correspondiente con places_list (o sin él,
   para thirst)
4. Llamar al Worker con system + user (Narration.getCareMessage())
5. Mostrar el texto generado en careText
6. El botón de aceptar sigue centrando el mapa en el lugar mencionado
   (excepto thirst, que no tiene botón de mapa)

Matching de lugar: el lugar elegido por Claude debe ser parseado de la
respuesta para saber en cuál centrar el mapa. Opción simple: Claude
menciona el nombre exacto del candidato en su respuesta →
findNearbyRestPlace ya tiene la lista → match por nombre. Si no hay match
exacto (paráfrasis), cae al primer candidato como fallback silencioso.

Migración de rain fuera de weather.js:
- Eliminar: showRainAlert(), findNearbyRefuge(), showRefugeSuggestion(), dismissAlert()
- Eliminar: timer propio de CONFIG.CHECK_INTERVAL (10 min) en Weather.start()
- checkCareContext() pasa a leer AppState.weather.isRaining como
  prioridad 1, usando el mismo cooldown de 20 min que el resto de Care
  (hoy _alertShown en weather.js no respeta ningún cooldown)
- AppState.phase === 'alert' deja de existir como fase propia — la
  lluvia usa el mismo flujo que cualquier otro trigger de Care

---

*Follower — DT-42 Care Mini-prompt v2 | Sesión 19 | 1 Julio 2026*
