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

Filosofia de POIs: si Wikipedia tiene articulo, es lo bastante notable para Follower.

## Sistema de diseno
- color-night: #0d1420
- color-systole: #1a5276
- color-gold: #f0c87a
- color-smoke: #c8d4e0
- color-alert: #e74c3c
- Tipografias: DM Serif Display Italic (texto de display/narrativo), Inter (UI)
- Marca: corazon-brujula ("corazon C2") como simbolo central
- Slogan: "your city soundtrack"

## Stack tecnico
HTML/CSS/JS vanilla - sin frameworks, sin npm, sin build step. Leaflet.js para mapa. Claude Haiku via Cloudflare Worker (cloudflare/worker.js, passthrough puro). Web Speech API para voz. Wikipedia GeoSearch como fuente primaria de POIs, Overpass OSM como complemento. Nominatim para geocoding. OpenWeatherMap para clima. Despliegue en GitHub Pages (follower-app/follower, repo publico).

## Regla de Oro (critica - aplicar siempre)
El panel/documentacion es fotografia estatica. El arbitro real es el codigo en GitHub. Antes de editar o afirmar el estado de cualquier archivo, traer la version viva desde raw.githubusercontent.com/follower-app/follower/main/[path]. Ante cualquier "ya quedo hecho", verificar contra el codigo, no contra el resumen.

## Donde vive el estado dinamico (no lo asumas, ve a buscarlo)

Buscar en un solo documento NO es buscar. Las DA viven en arquitectura.md y los DT/BUG en producto.md: un grep de producto.md que no encuentra algo NO prueba que no este especificado. Antes de declarar que algo falta en la documentacion, buscarlo en los cinco documentos.
Antes de responder sobre el estado actual del proyecto (bugs abiertos, en que va una arquitectura, que se decidio en la ultima sesion), consulta:
- docs/producto.md - bugs, features, estado de producto
- docs/arquitectura.md - decisiones DA-1 a la actual
- docs/bitacora.md - historial de sesiones
- docs/manifiesto_narrativo.md - reglas narrativas vigentes
- docs/prompt_maestro_follower.md - prompt de capitulos vigente
- docs/exploracion_ritmo_y_curaduria.md - presupuesto de ritmo (DT-74), curaduria de POIs y preguntas abiertas de producto

Estos documentos cambian cada sesion. Este Skill NO los duplica - solo indica que existen y donde estan.

## Convenciones de sesion (fijas, no cambian)
- Protocolo de cierre: commit -> actualizar panel -> actualizar instrucciones de proyecto -> chat nuevo, en ese orden
- Una decision a la vez; opciones presentadas como A/B/C con recomendacion y razonamiento; el usuario ratifica antes de implementar
- Cero codigo durante sesiones de diseno/definicion
- sw.js siempre se commitea al final, por separado
- PowerShell en Windows: sin && para encadenar comandos, sin head; mensajes de commit sin caracteres acentuados
- PowerShell: NUNCA escribir archivos de configuracion con redireccion `>` — los guarda en UTF-16 LE y git los lee como UTF-8. Un .gitignore asi no aplica ninguna de sus reglas y falla en silencio. Usar Set-Content con -Encoding ascii
- La documentacion se actualiza en la misma sesion que el codigo, nunca de forma especulativa
- Deploys: index.html se sirve cache-first, skipWaiting() deshabilitado a proposito (no interrumpir audio activo). F5 normal no trae el HTML mas reciente.

## Sistema de tickets
- DA-###: decisiones de arquitectura (en arquitectura.md)
- DT-###: deuda tecnica
- BUG-###: bugs (en producto.md)
- Historial de sesiones en bitacora.md

## Disciplina de validacion
- Hipotesis etiquetadas explicitamente; hallazgos clasificados como "hipotesis", "confirmado en codigo" o "confirmado en campo"
- Logs de debug exportados de iPhone son la fuente de verdad de campo (no hay acceso a Web Inspector)
- n>=4 de muestreo probabilistico antes de cerrar un ticket
- Un cambio a la vez

## Versionado de cache (critico, no olvidar)
- POI_CACHE_VERSION++ en el mismo commit si cambia query/filtros/normalizacion de POIs
- PROMPT_VERSION++ en el mismo commit si cambia el Prompt Maestro de capitulos
- THESIS_PROMPT_VERSION versiona la generacion de tesis de ciudad, por separado

## Lecciones aprendidas (aplicar, no repetir el error)
- El scratchpad deliberado (borrador de verificacion antes de cada capitulo) es la tecnica que logro que autor/fecha aparezcan naturalmente en las narraciones
- Los extractos de Wikipedia se truncaban silenciosamente en ~1200 caracteres pese a pedir 2500 - el fix se hizo del lado cliente, no confiar en el limite de la API
- El desbloqueo de audio en iOS requiere gesto touchend directo y real - touchstart con passive:true es interceptado por Leaflet antes del handler; esto es una restriccion dura de la plataforma, no un workaround pendiente
- La clave de cache debe incluir el fingerprint del extracto, no solo la version del prompt
- Las secciones de "estado de implementacion" son obligatorias en toda documentacion - ya hubo una regresion por un documento que afirmaba algo hecho que el codigo no soportaba
- Sacar un archivo del arbol NO lo saca del historial de git. En un repo publico, lo unico que mata el riesgo de una credencial filtrada es ROTARLA en el proveedor; reescribir el historial no deshace una exposicion pasada y los forks conservan copia igual. Revisar tambien el nombre del campo: una key de un proveedor puede estar guardada bajo el nombre de otro
- Un mismo sintoma puede tener dos mecanismos detras con almacenamientos distintos (ej: el texto que sobrevive al cierre de la app es cache de IndexedDB; que no se re-narre es una marca en localStorage). Antes de dar una validacion por buena, preguntar que mecanismo prueba exactamente la observacion
- Cuando dos causas producen el mismo codigo de error, probar el servicio DIRECTAMENTE, sacando de la ecuacion la capa intermedia. El Worker es passthrough puro: propaga status y body sin tocar, asi que un 401 suyo y uno del proveedor son indistinguibles desde la app
- Arquitectura narrativa (actos/epilogo) mas alla de la tesis es Fase 2+ hasta que evidencia de campo lo justifique - sobre-ingenierizar capas narrativas antes de validar es un anti-patron explicito para este proyecto

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