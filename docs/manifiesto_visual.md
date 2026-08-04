# MANIFIESTO VISUAL

## Follower se ve como se siente

La interfaz de Follower no es una capa sobre la experiencia.

Es la experiencia.

No es un tema.

No es una paleta.

No es una guía de estilo.

Es la forma en que el caminante entiende, sin que nadie se lo explique, que esto no es una audioguía.

---

# Dónde viven los valores

**Este documento no contiene un solo valor hexadecimal, ni un tamaño, ni un peso.**

Los tokens están definidos y comentados en `css/main.css`, en `:root` — paleta, tipografía, pesos, espaciado, radios, transiciones y capas. El logo vive en `assets/logo.svg`.

Duplicarlos aquí crearía dos fuentes que pueden divergir, y la que ganaría sería la que alguien leyó primero. Si hace falta un valor, se lee del CSS.

Lo que este manifiesto contiene es lo que el CSS **no puede decir**: por qué esos valores son esos, y qué pasa si se cambian.

---

# La Metáfora Central

**Sístole y Diástole no son una paleta. Son el latido.**

`--color-systole` es el azul de caminar. El estado de tránsito, de expectativa, de ciudad que todavía no ha hablado.

`--color-diastole` es el rojo de narrar. El estado en que la ciudad está contando algo y el caminante está escuchando.

**Nunca invertir.**

Invertir sístole y diástole no es un error de color. Es decir que caminar es el clímax y escuchar es el intervalo, que es exactamente al revés de lo que Follower cree.

`--color-gold` es el tercer estado: descansar. No compite con los otros dos; los enmarca.

---

# El Logo

El símbolo son **manos**.

**Nunca se invierte.**

Invertido, la silueta se lee como audífonos. Y un objeto que se pone entre el caminante y la ciudad es la definición exacta de lo que Follower no quiere ser.

No es una regla de composición. Es la única regla del logo que no admite excepción.

---

# La Tipografía Tiene Dos Voces

`--font-display` es la voz de la ciudad. Aparece donde la ciudad habla de sí misma: tesis, prólogo, títulos. Una serif tiene edad, tiene peso, tiene la autoridad de algo que estaba ahí antes que tú.

`--font-ui` es la voz del acompañante. Aparece en todo lo demás: controles, etiquetas, care. Una sans no compite; informa y se aparta.

Cuando una interfaz nueva no sabe qué fuente usar, la pregunta no es cuál se ve mejor.

**Es quién está hablando.**

---

# Qué No Es

**No es una interfaz de navegación.**

Cualquier elemento que se sienta a GPS —rutas trazadas, indicaciones de giro, brújulas siempre visibles— acerca a Follower a la audioguía, aunque técnicamente funcione.

*El caso que sentó el criterio:* el cono de brújula se descartó como elemento permanente y se rediseñó para aparecer **solo cuando hay un POI narrando**. El compañero te ayuda a encontrar lo que está por contarte. No te guía.

**No es un tablero.**

Ni contadores, ni progreso, ni logros, ni métricas de rendimiento. El care strip en particular no muestra pasos ni kilómetros: eso es una app fitness, y Follower no lo es.

**No es una app clara.**

El fondo es noche. No por estética: porque la pantalla compite con la ciudad, y una pantalla oscura pierde esa competencia a propósito.

---

# El Movimiento

Las transiciones no decoran. Dicen algo.

`--transition-fast` es respuesta: el sistema te oyó.

`--transition-base` es cambio de estado: algo pasó.

`--transition-spring` es aparición: algo llegó.

Lo que nunca es aceptable es el movimiento que llama la atención sobre sí mismo. Follower es un acompañante invisible; una animación que se hace notar deja de ser invisible.

**El mejor movimiento en Follower es el que el caminante no recuerda haber visto.**

---

# La Pantalla Cede

El caminante mira la ciudad, no el teléfono.

Cada decisión visual se juzga por cuánto tiempo obliga a mirar la pantalla. Menos es mejor. Cero es el ideal.

Un elemento que solo se entiende deteniéndose a leerlo ha fallado, por bonito que sea.

Por eso la jerarquía no se construye con tamaño sino con contraste y espacio: `--color-ice` para lo que hay que ver, `--color-smoke` y sus grados para lo que solo debe estar disponible.

---

# Cuando Aparece Algo Nuevo

Antes de la guía de estilo, tres preguntas:

**1. ¿Esto acerca a experiencia cinematográfica o a audioguía?** Es el filtro de todo, también de lo visual.

**2. ¿Quién habla aquí?** La ciudad usa display; el acompañante usa UI.

**3. ¿Cuánto tiempo obliga a mirar la pantalla?**

Si las tres tienen buena respuesta, entonces sí: tokens del `:root`, nada inventado fuera de ellos.

Un color nuevo en un componente es casi siempre la señal de que el componente está resolviendo mal el problema.

---

# Objetivo Final

Que el caminante nunca piense en la interfaz.

Que levante la vista, vea la ciudad, y la pantalla solo confirme lo que ya estaba sintiendo.

Que si algún día describe Follower, no mencione ni un color ni una fuente — solo que la ciudad le habló.
