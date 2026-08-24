---
name: "follower"
description: "Contexto del proyecto Follower: PWA cinematografica de exploracion urbana con narracion AI via GPS. Usalo cuando se trabaje en diseno, codigo, arquitectura o producto de Follower - logos, interfaz, prompts de narracion, bugs, decisiones de arquitectura (DA/DT/BUG)."
---

# Follower - Contexto del proyecto

## Que es
PWA en espanol que convierte caminatas urbanas en experiencias narrativas cinematograficas. GPS detecta proximidad a puntos de interes (POIs) y dispara narracion AI generada en el momento, en una sola voz narradora unificada.

**Pregunta rectora de producto (aplicar a toda decision):**
Esto nos acerca a una experiencia cinematografica o a una audioguia tradicional?

## Vision central
"Invisible companion": el telefono va en el bolsillo, la app orquesta todo de forma autonoma, sin que el usuario tenga que operarla activamente durante la caminata.

Ritmo sistole/diastole como metafora del latido:
- Sistole #1a5276 = caminando
- Diastole #c0392b = narrando
- Nunca invertir estos colores/estados.

Care Strip: cuidado humano contextual (clima, fatiga, hidratacion, densidad de POIs) como canal paralelo e independiente de los capitulos narrativos - nunca mezclar la cola de cuidado con la cola narrativa.

Filosofia de POIs: si Wikipedia tiene articulo, es lo bastante notable para Follower. **Pero notable no es lo mismo que bien ubicado:** la coordenada llega de la fuente sin validar, y puede errar cientos de metros o venir declarada con precision de kilometros. Ver DT-91.

## Sistema de diseno

**Los valores viven en `css/main.css` (`:root`) y en `assets/`. No se duplican aqui.**
Paleta, tipografias, pesos, espaciado y radios estan ahi definidos y comentados: si hacen
falta para decidir, se traen. Un hex copiado aqui miente el dia que cambie el CSS, y
miente en silencio.

Vocabulario de tokens (para razonar y para pedir el archivo correcto):
`--color-night` · `--color-systole` · `--color-diastole` · `--color-gold` ·
`--color-smoke` · `--color-alert`

Lo que el CSS no puede decir, y por eso vive aqui:
- **Sistole = caminando, diastole = narrando. Nunca invertir.** No es un error de color:
  rompe el significado.
- El logo oficial es el **corazon-brujula** (`assets/logo.svg`, `assets/icons/icon-master.svg`).
  Hay direcciones alternativas en estudio, no vigentes; ninguna sustituye al oficial
  mientras no se ratifique.
- **El emblema no entra en un pin.** A 16px el trazo cae a sub-pixel; a ~38px (marcador
  del caminante) funciona. Si aparece en el mapa, aparece una sola vez y sobre quien camina.
- Slogan: "your city soundtrack"

## Stack tecnico
HTML/CSS/JS vanilla - sin frameworks, sin npm, sin build step. Leaflet.js para mapa. Claude Haiku via Cloudflare Worker (cloudflare/worker.js, passthrough puro). Web Speech API para voz. Wikipedia GeoSearch como fuente primaria de POIs, Overpass OSM como complemento. Nominatim para geocoding. OpenWeatherMap para clima. Despliegue en GitHub Pages (follower-app/follower, repo publico).

## Regla de Oro (critica - aplicar siempre)
El panel/documentacion es fotografia estatica. El arbitro real es el codigo en GitHub. Antes de editar o afirmar el estado de cualquier archivo, traer la version viva desde raw.githubusercontent.com/follower-app/follower/main/[path]. Ante cualquier "ya quedo hecho", verificar contra el codigo, no contra el resumen.

**Corolario: la Regla de Oro aplica tambien al enunciado de un ticket propio.** Un hallazgo de campo escrito como diagnostico tecnico es una hipotesis, no un hecho. En S42 el ticket decia que el radio de descubrimiento y el de activacion "se estaban tratando como uno"; el codigo vivo mostro cuatro radios ya separados. Traer los archivos antes de aceptar la premisa evito una sesion completa de rediseno sobre algo que no existia.

## Donde vive el estado dinamico (no lo asumas, ve a buscarlo)

Buscar en un solo documento NO es buscar. Las DA viven en arquitectura.md y los DT/BUG en producto.md: un grep de producto.md que no encuentra algo NO prueba que no este especificado. Antes de declarar que algo falta en la documentacion, buscarlo en todos los documentos listados abajo.
Antes de responder sobre el estado actual del proyecto (bugs abiertos, en que va una arquitectura, que se decidio en la ultima sesion), consulta:
- REGLAS_IA.md (raiz) - criterio de trabajo, invariantes de experiencia, convenciones
  propias del proyecto y protocolo de arranque de chat. Es la Parte II de las
  instrucciones de proyecto de claude.ai (la Parte I es `~/.claude/CLAUDE.md`).
- docs/contexto_maestro.md - alma del producto: que es, que NO es, hipotesis principal,
  ADN, filosofia de experiencia. Casi no caduca; se lee al discutir identidad o alcance.
  **Ojo con el vocabulario: alli "Regla de Oro" significa "la ciudad siempre es la
  protagonista", no la regla de verificacion de este documento. Son dos cosas distintas
  con el mismo nombre.**
- docs/producto.md - bugs, features, estado de producto
- docs/arquitectura.md - decisiones DA-1 a la actual
- docs/bitacora.md - historial de sesiones
- docs/manifiesto_narrativo.md - reglas narrativas vigentes
- docs/prompt_maestro_follower.md - prompt de capitulos vigente
- docs/exploracion_ritmo_y_curaduria.md - presupuesto de ritmo (DT-74), curaduria de POIs y preguntas abiertas de producto

Estos documentos cambian cada sesion. Este Skill NO los duplica - solo indica que existen y donde estan.

**Historicos, no vigentes** (se conservan como registro, no mandan sobre nada):
`docs/restauracion_poi_js.md` (plan de la regresion DA-68, S19) y
`docs/dt42_care_miniprompt.md` (spec de Care generativo, S19, ya implementada).

## Sistema de tickets
- DA-###: decisiones de arquitectura (en arquitectura.md)
- DT-###: deuda tecnica
- BUG-###: bugs (en producto.md)
- Historial de sesiones en bitacora.md

## Versionado de cache (critico, no olvidar)
- POI_CACHE_VERSION++ en el mismo commit si cambia query/filtros/normalizacion de POIs
- PROMPT_VERSION++ en el mismo commit si cambia el Prompt Maestro de capitulos
- THESIS_PROMPT_VERSION versiona la generacion de tesis de ciudad, por separado

## Criterio de trabajo — no vive aqui

Convenciones de sesion, disciplina de validacion, PowerShell y las lecciones aprendidas
viven en **`REGLAS_IA.md`** (raiz del repo, criterio especifico de Follower) y en
**`~/.claude/CLAUDE.md`** (comportamiento agnostico de proyecto). Ambos se pegan juntos
como instrucciones de proyecto en claude.ai (Parte I + Parte II). No se duplican en este
Skill: este Skill carga condicionalmente segun coincidencia con su descripcion, y una
regla de comportamiento que a veces aplica y a veces no es peor que no tenerla.

Unica redundancia deliberada: la Regla de Oro de arriba. Es la mas cara de olvidar.

## Al trabajar visualmente (Claude Design)
- Respetar sistole/diastole sin invertir colores
- El corazon-brujula es el simbolo de marca central, no reemplazar
- Cualquier propuesta de interfaz debe evaluarse contra la pregunta rectora antes de darse por buena
- No asumir estados de UI sin confirmarlos contra docs/arquitectura.md (DA-85 describe el estado actual del wizard, title card y tab de ciudad)

## Al trabajar en codigo (Claude Code)
- Aplicar Regla de Oro: fetch del archivo real antes de editar
- Respetar funciones unicas ya existentes por archivo (ver arquitectura.md para el listado - no duplicar detectNearby, getCityWelcome, setPhase, etc.)
- Bump de versiones de cache en el mismo commit cuando aplique
- No escribir codigo durante sesiones marcadas como "diseno/definicion"