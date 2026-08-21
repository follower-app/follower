# 🎬 Follower — REGLAS_IA.md · Parte II

> **Este archivo es el original versionado de la Parte II de las instrucciones de proyecto de Follower.** La copia que vive en claude.ai se pega desde aquí, entera y sin editar. Si el criterio cambia, se cambia aquí, se commitea y se vuelve a pegar completo. Una sola edición hecha directamente en la interfaz reinstala la divergencia que esta reorganización eliminó — y nada la delata.
>
> Encima de este bloque va la **Parte I — Andamiaje**, transversal, que no vive en este repo: es `~/.claude/CLAUDE.md`. Lo que la Parte I ya manda **no se repite aquí**.
>
> **Filtro de admisión.** Antes de agregar algo, preguntar *¿qué documento es el dueño de esto?* Si la respuesta no es "estas instrucciones", va allá. Este documento es dueño de una sola cosa: **lo que no tiene otro dueño posible** — criterio que no se deriva de ningún archivo, invariantes que ningún código declara, convenciones sobre cómo se trabaja. Un hallazgo de sesión, por bueno que sea, no es un principio: va a la bitácora.
>
> **Prueba de caducidad.** Si una frase se puede verificar leyendo un archivo, sobra. No entran aquí: versiones, números de ticket abiertos, listas de archivos, valores de diseño, estado de ninguna clase. Sí entran las referencias históricas a sesiones pasadas (`S38`, `S40`), porque son hechos sobre el pasado y no caducan.

---

## La pregunta rectora

**¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?** Si acerca a audioguía, es la decisión equivocada. Es el filtro de toda decisión de producto, no un eslogan.

*Ejemplo real de rechazo por este criterio:* la brújula tenía un botón flotante en el mapa con tres estados y tap para activar. Se eliminó — un control que hay que operar caminando contradice "el teléfono va en el bolsillo". El cono en cambio se conserva y es permanente: es un indicador pasivo de hacia dónde estás dado, no una instrucción. La distinción que separa las dos cosas es que **el cono muestra heading, nunca bearing**: no gira hacia el POI y no dice "es por allá". Lo que falla la pregunta rectora es lo que exige interacción o dirige al caminante, no lo que simplemente le devuelve orientación.

*Colisión de vocabulario:* en el contexto maestro, "Regla de Oro" significa *la ciudad siempre es la protagonista*. Aquí significa *el árbitro es el código*. Son dos cosas distintas con el mismo nombre.

## Invariantes que rompen la experiencia si se tocan sin pensarlo

- GPS nunca se interrumpe · Offline obligatorio · **Nunca mostrar errores crudos al usuario**
- Una sola puerta de desbloqueo de audio: el tap en la Etapa 2 del title card, igual primera vez y recurrente
- `userName` solo vive en welcome/farewell, **nunca llega al Worker**
- Care y cola narrativa son independientes por diseño: el cuidado es hospitalidad del presente, los capítulos son historias que pueden esperar

## Identidad visual — las reglas, no los valores

**Los valores viven en `css/main.css` (`:root`) y en `assets/`.** Paleta, tipografía, pesos, espaciado y radios están ahí definidos y comentados. No se duplican aquí: si hicieran falta, se leen. Un hex copiado miente el día que cambie el CSS, y miente en silencio.

Lo que el CSS no puede decir y por eso vive aquí:

- **Sístole / Diástole son la metáfora central, no una paleta.** Azul caminando, rojo narrando. **Nunca invertir.** Invertirlos no es un error de color: rompe el significado.
- **El logo oficial es el corazón-brújula.** Follower se identifica a sí mismo como una brújula. Hay direcciones alternativas **en estudio, no vigentes**; ninguna sustituye al oficial mientras no se ratifique.
- **El emblema no entra en un pin.** A tamaño de marcador de POI el trazo del corazón cae a sub-píxel y la aguja lo tapa; al tamaño del marcador del caminante funciona bien. Si aparece en el mapa, aparece una sola vez y sobre quien camina.
- Cualquier elemento nuevo se juzga con la pregunta rectora antes que con la guía de estilo.

## Convenciones propias del proyecto

- **Tickets:** DA (decisión de arquitectura) · DT (deuda técnica) · BUG
- **Bumps de versión de caché y de prompts** van en el **mismo commit** que el cambio que los motiva
- **`sw.js` siempre al final y en commit aparte.** Si cambió un archivo servido, hay bump
- **No hay entorno local: un push es un despliegue.** `index.html` se sirve cache-first y `skipWaiting()` está deshabilitado a propósito, para no cortar audio activo. F5 no trae lo último — usar el botón de actualizar del panel o cerrar todas las pestañas
- **Funciones únicas — nunca duplicar.** Antes de crear una función, `grep` el módulo correspondiente

## Protocolo de arranque de chat

En vez de un resumen de estado que caduca, leer lo vivo:

1. **Bitácora**, última entrada — qué pasó y por qué
2. **Producto**, tabla de tickets — qué está abierto y con qué prioridad
3. **Arquitectura** — las decisiones del tema que se vaya a tocar
4. **El código de los archivos implicados** — antes de proponer cambios
5. **Nunca asumir versiones.** Cada constante se lee del archivo que la declara, nunca de un resumen

Bajo demanda, cuando el tema los toca: el contexto maestro (identidad y alcance), los manifiestos, el prompt maestro, y el documento de ritmo y curaduría.

## Lecciones que han costado tiempo

*Techo: ocho entradas. Una novena desplaza a la más débil — cada lección vive completa en la bitácora de su sesión, y esta lista es un índice de las que siguen mordiendo, no un archivo histórico.*

- **Un mismo síntoma puede tener dos mecanismos detrás con almacenamientos distintos.** Preguntar siempre qué prueba exactamente la observación, no qué parece probar
- **Ante dos causas con el mismo código de error, probar el servicio directamente**, sacando la capa intermedia de la ecuación. El Worker es passthrough puro: propaga status y body sin tocar
- **Los comentarios fósiles no son cosméticos.** Un comentario que promete un comportamiento que ya no existe hace leer un pase como fallo
- **Sacar un archivo del árbol no lo saca del historial de git.** En repo público, lo único que mata una credencial filtrada es rotarla en el proveedor. Revisar también el nombre del campo: una key puede estar guardada bajo el nombre de otro proveedor
- **Sobre auditorías externas:** otros modelos han descrito como propuesta lo ya implementado y como completo lo aspiracional. Útiles como generadores de vocabulario, poco fiables como auditoría. Pasarles los documentos vivos antes de pedir una
- **Para interfaz, el árbitro es la captura.** En S40 se dibujaron tres mockups del mapa y los tres estuvieron mal. Ninguna cuarta pasada lo habría corregido: lo corrigieron dos capturas del iPhone. Antes de razonar sobre una pantalla, pedirla
- **Antes de inferir un dato del comportamiento, preguntar cuál es la observación más directa disponible.** En S42 se dedujeron coordenadas de POI a partir de qué narración se disparaba, durante varios turnos, teniendo el dato impreso a un clic en el panel. **El instrumento sabía más de lo que el export contaba:** si una herramienta de diagnóstico conoce un dato y su salida no lo lleva, eso es un defecto de la herramienta y se arregla antes de seguir diagnosticando
- **Las coordenadas de la fuente pueden estar mal y no hay señal para detectarlo.** Síntomas de "narra el POI equivocado" o "narra tarde" pueden no ser de radio ni de código. Con coordenadas que erran cientos de metros, cualquier radio de activación queda por debajo del ruido del dato: calibrar radios es inútil antes de verificar la calidad de la coordenada
