# 🎬 Follower — Criterio de trabajo (REGLAS_IA.md)

> **Este archivo es la fuente canónica del criterio de trabajo de Follower.** Vive en el
> repo, versionado en git, y sirve a las dos superficies: Claude Code lo lee aquí, y el
> campo de *instrucciones del proyecto* de claude.ai es una copia pegada de este archivo.
>
> **Si los dos difieren, gana este.** Al cambiar algo: editar aquí, commitear, y volver a
> pegar el contenido en las instrucciones del proyecto. Sin ese segundo paso quedan dos
> versiones y la de claude.ai —que no tiene historial— es la que va a mentir.
>
> **La misma regla aplica al `SKILL.md`:** la copia canónica es la del repo
> (`.claude/skills/follower/SKILL.md`); la que se sube empaquetada a la interfaz de Skills
> es derivada. Todo par repo↔interfaz se sincroniza **desde** el repo, nunca al revés.
> Commitear sin subir deja activo el skill viejo; subir sin commitear deja el repo atrás.
>
> Este documento es dueño de **una sola cosa: lo que no tiene otro dueño posible.** Criterio que no se deriva de ningún archivo, invariantes que ningún código declara, convenciones sobre cómo se trabaja. Todo lo demás —qué es el producto, su estado, su vara editorial— vive en el repo y se lee ahí.
>
> **Filtro de admisión:** antes de agregar algo, preguntar *¿qué documento es el dueño de esto?* Si la respuesta no es "las instrucciones", va allá. Un hallazgo de sesión, por bueno que sea, no es un principio: va a la bitácora.

---

## Quién manda sobre qué

La redundancia no molesta por ocupar espacio: molesta porque cuando las dos copias divergen, nadie sabe cuál gana, y la que se lee primero suele ser la vieja.

| Documento | Manda sobre | Cambia |
|---|---|---|
| **`docs/contexto_maestro.md`** | Qué es Follower, qué NO es, hipótesis, ADN del producto | Rara vez |
| **Estas instrucciones** | Criterio, invariantes, convenciones de trabajo | Cuando cambia un principio |
| **`SKILL.md`** | Identidad breve, vocabulario y **dónde ir a mirar** | Rara vez |
| **`arquitectura.md`** | Decisiones ratificadas y su razonamiento (DA) | Cada decisión |
| **`producto.md`** | Tickets, estado, alcance (DT, BUG) | Cada sesión |
| **`bitacora.md`** | Qué pasó, con qué evidencia y en qué orden | Cada sesión |
| **Manifiestos** | Vara editorial de narración, POIs y care | Rara vez |
| **`README.md`** | Puerta de entrada pública: qué es, cómo se despliega, índice | Rara vez |
| **El código** | Lo que la app hace de verdad | Cada commit |

**Regla de conflicto: el documento más específico gana sobre el más general, y el código gana sobre todos.** Si estas instrucciones dicen una cosa y una DA dice otra, manda la DA — se tomó mirando el caso. Si la DA dice una cosa y el código hace otra, manda el código y la DA está desactualizada.

*Excepción declarada:* las instrucciones que dicen **dónde mirar** son redundantes con el código a propósito, porque solo sirven estando fuera de él. La Regla de Oro es el caso — "el árbitro es el código" no puede vivir en el código.

*Colisión de vocabulario a tener presente:* en `contexto_maestro.md`, "Regla de Oro" significa *la ciudad siempre es la protagonista*. Aquí significa *el árbitro es el código*. Son dos cosas distintas con el mismo nombre.

## La pregunta rectora

**¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?** Si acerca a audioguía, es la decisión equivocada. Es el filtro de toda decisión de producto, no un eslogan.

*Ejemplo real de rechazo por este criterio:* la brújula tenía un botón flotante en el mapa con tres estados y tap para activar. Se eliminó — un control que hay que operar caminando contradice "el teléfono va en el bolsillo". El cono en cambio se conserva y es permanente: es un indicador pasivo de hacia dónde estás dado, no una instrucción. La distinción que separa las dos cosas es que **el cono muestra heading, nunca bearing**: no gira hacia el POI y no dice "es por allá". Lo que falla la pregunta rectora es lo que exige interacción o dirige al caminante, no lo que simplemente le devuelve orientación.

## Identidad visual — las reglas, no los valores

**Los valores viven en `css/main.css` (`:root`) y en `assets/`.** Paleta, tipografía, pesos, espaciado y radios están ahí definidos y comentados. No se duplican aquí: si hicieran falta, se leen. Un hex copiado miente el día que cambie el CSS, y miente en silencio.

Lo que el CSS no puede decir y por eso vive aquí:

- **Sístole / Diástole son la metáfora central, no una paleta.** Azul caminando, rojo narrando. **Nunca invertir.** Invertirlos no es un error de color: rompe el significado.
- **El logo oficial es el corazón-brújula** (`assets/logo.svg`, `assets/icons/icon-master.svg`, y el mismo path en la Etapa 2 del title card): corazón de trazo en `--color-smoke`, aguja bicolor con norte en rojo, pivote central. Follower se identifica a sí mismo como una brújula. Hay direcciones alternativas **en estudio, no vigentes** — manos (smoke + gold) y dos círculos. Ninguna sustituye al oficial mientras no se ratifique.
- **El emblema no entra en un pin.** A 16 px el trazo del corazón cae a sub-píxel y la aguja lo tapa; a ~38 px (marcador del caminante) funciona bien. Si el emblema aparece en el mapa, aparece una sola vez y sobre quien camina.
- Cualquier elemento nuevo se juzga con la pregunta rectora antes que con la guía de estilo.

## Invariantes que rompen la experiencia si se tocan sin pensarlo

- GPS nunca se interrumpe · Offline obligatorio · **Nunca mostrar errores crudos al usuario**
- Una sola puerta de desbloqueo de audio: el tap en la Etapa 2 del title card, igual primera vez y recurrente
- `userName` solo vive en welcome/farewell, **nunca llega al Worker**
- Care y cola narrativa son independientes por diseño: el cuidado es hospitalidad del presente, los capítulos son historias que pueden esperar

## Regla de Oro

**El resumen es fotografía estática; el árbitro es el código.** Ante "ya quedó hecho", se verifica en `raw.githubusercontent.com/follower-app/follower/main/...`, no en la memoria ni en un panel.

**Corolario 1 — buscar en un solo documento no es buscar.** Las DA viven en `arquitectura.md`, los DT y BUG en `producto.md`. Un grep fallido en uno no prueba que algo no esté especificado.

**Corolario 2 — el árbitro también puede mentir.** `raw.githubusercontent.com` cachea por rama, así que un archivo recién subido puede seguir devolviendo la versión anterior durante minutos, sin error y sin aviso. Ante un archivo tocado hoy, pedirlo por SHA de commit — ruta inmutable, sin caché:

```
raw.githubusercontent.com/follower-app/follower/<sha>/<path>
```

**Corolario 3 — aplica al enunciado del ticket, no solo al código.** Un hallazgo de campo escrito como diagnóstico técnico sigue siendo una hipótesis. En S42 el ticket afirmaba que el radio de descubrimiento y el de activación "se trataban como uno"; el código vivo mostró cuatro radios ya separados. Traer los archivos antes de aceptar la premisa evitó una sesión completa de rediseño sobre algo que no existía.

## Protocolo de arranque de chat

En vez de un resumen de estado que caduca, leer lo vivo:

1. **`docs/bitacora.md`**, última entrada — qué pasó y por qué
2. **`docs/producto.md`**, tabla de tickets — qué está abierto y con qué prioridad
3. **`docs/arquitectura.md`** — las DA del tema que se vaya a tocar
4. **El código de los archivos implicados** — antes de proponer cambios
5. **Nunca asumir versiones.** `sw.js` para `CACHE_VERSION`, `narration.js` para `PROMPT_VERSION` y `THESIS_PROMPT_VERSION`, `poi.js` para `POI_CACHE_VERSION`

Bajo demanda, cuando el tema los toca: `contexto_maestro.md` (identidad y alcance), los manifiestos (`narrativo`, `pois`, `care_strip`), `prompt_maestro_follower.md`, y `exploracion_ritmo_y_curaduria.md` para el presupuesto de ritmo.

## Convenciones de trabajo

- **Tickets:** DA (decisión de arquitectura) · DT (deuda técnica) · BUG
- **Bumps de versión** (`POI_CACHE_VERSION`, `PROMPT_VERSION`, `THESIS_PROMPT_VERSION`) van en el **mismo commit** que el cambio que los motiva
- **`sw.js` siempre al final y en commit aparte.** Si cambió un archivo servido, hay bump
- **Deploys:** `index.html` se sirve cache-first y `skipWaiting()` está deshabilitado a propósito (no interrumpir audio activo). **No hay entorno local: un push es un despliegue.** F5 no trae lo último — usar 🔄 Actualizar app o cerrar todas las pestañas
- **Al anexar a los docs:** `Ctrl+End` antes de pegar. El pie de sesión anterior debe quedar encerrado entre separadores. En S38 se perdieron tres pies por pegar encima
- **Cierre de sesión:** commit → actualizar `docs/` → chat nuevo. *Estas instrucciones solo se tocan cuando cambia un principio o una convención, no cada sesión*
- **Una variable a la vez.** Si se cambian dos cosas y la caminata mejora, no se sabe cuál lo hizo. Validación de campo n≥4 cuando el comportamiento no es determinista
- **Diagnóstico antes que código.** Instrumentar y medir antes de proponer el fix
- **Funciones únicas — nunca duplicar.** Antes de crear una función, `grep` el archivo correspondiente. Los módulos con más riesgo son `poi.js`, `narration.js` y `app.js`

## PowerShell (Windows)

- Sin `&&` para encadenar, sin `head`; mensajes de commit sin acentos
- **Nunca escribir archivos de configuración con `>`**: los guarda en UTF-16 LE y git los lee como UTF-8. Un `.gitignore` así no aplica ninguna regla y falla en silencio. Usar `Set-Content -Encoding ascii`

## Lecciones que han costado tiempo

*Techo: ocho entradas. Una novena desplaza a la más débil — cada lección vive completa en la bitácora de su sesión, y esta lista es un índice de las que siguen mordiendo, no un archivo histórico.*

- **Un mismo síntoma puede tener dos mecanismos detrás con almacenamientos distintos.** Preguntar siempre qué prueba exactamente la observación, no qué parece probar
- **Ante dos causas con el mismo código de error, probar el servicio directamente**, sacando la capa intermedia de la ecuación. El Worker es passthrough puro: propaga status y body sin tocar
- **Los comentarios fósiles no son cosméticos.** Un comentario que promete un comportamiento que ya no existe hace leer un pase como fallo
- **Sacar un archivo del árbol no lo saca del historial de git.** En repo público, lo único que mata una credencial filtrada es rotarla en el proveedor. Revisar también el nombre del campo: una key puede estar guardada bajo el nombre de otro proveedor
- **Sobre auditorías externas:** otros modelos han descrito como propuesta lo ya implementado y como completo lo aspiracional. Útiles como generadores de vocabulario, poco fiables como auditoría. Pasarles los documentos vivos antes de pedir una
- **Para interfaz, el árbitro es la captura.** En S40 se dibujaron tres mockups del mapa y los tres estuvieron mal —basemap oscuro cuando Voyager es claro, pines sin ícono, pantalla sin franja de care ni barra de debug—. Ninguna cuarta pasada lo habría corregido: lo corrigieron dos capturas del iPhone. Antes de razonar sobre una pantalla, pedirla
- **Antes de inferir un dato del comportamiento, preguntar cuál es la observación más directa disponible.** En S42 se dedujeron coordenadas de POI a partir de qué narración se disparaba, durante varios turnos, teniendo el dato impreso a un clic en el panel. **El instrumento sabía más de lo que el export contaba:** si el panel conoce un dato y su salida no lo lleva, eso es un defecto del instrumento y se arregla antes de seguir diagnosticando
- **Las coordenadas de la fuente pueden estar mal y no hay señal para detectarlo.** Síntomas de "narra el POI equivocado" o "narra tarde" pueden no ser de radio ni de código. Con coordenadas que erran cientos de metros, cualquier valor de `POI_RADIUS_METERS` queda por debajo del ruido del dato: calibrar radios es inútil antes de verificar la calidad de la coordenada
