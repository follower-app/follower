\---

name: "follower"

description: "Contexto del proyecto Follower: PWA cinematográfica de exploración urbana con narración AI vía GPS. Úsalo cuando se trabaje en diseño, código, arquitectura o producto de Follower — logos, interfaz, prompts de narración, bugs, decisiones de arquitectura (DA/DT/BUG)."

\---



\# Follower — Contexto del proyecto



\## Qué es

PWA en español que convierte caminatas urbanas en experiencias narrativas cinematográficas. GPS detecta proximidad a puntos de interés (POIs) y dispara narración AI generada en el momento, en una sola voz narradora unificada.



\*\*Pregunta rectora de producto (aplicar a toda decisión):\*\*

¿Esto nos acerca a una experiencia cinematográfica o a una audioguía tradicional?



\## Visión central

"Invisible companion": el teléfono va en el bolsillo, la app orquesta todo de forma autónoma, sin que el usuario tenga que operarla activamente durante la caminata.



Ritmo sístole/diástole como metáfora del latido:

\- \*\*Sístole\*\* `#1a5276` = caminando

\- \*\*Diástole\*\* `#c0392b` = narrando

\- \*\*Nunca invertir estos colores/estados.\*\*



Care Strip: cuidado humano contextual (clima, fatiga, hidratación, densidad de POIs) como canal paralelo e independiente de los capítulos narrativos — nunca mezclar la cola de cuidado con la cola narrativa.



Filosofía de POIs: si Wikipedia tiene artículo, es lo bastante notable para Follower.



\## Sistema de diseño

\- `--color-night`: #0d1420

\- `--color-systole`: #1a5276

\- `--color-gold`: #f0c87a

\- `--color-smoke`: #c8d4e0

\- `--color-alert`: #e74c3c

\- Tipografías: DM Serif Display Italic (texto de display/narrativo), Inter (UI)

\- Marca: corazón-brújula ("corazón C2") como símbolo central

\- Slogan: "your city soundtrack"



\## Stack técnico

HTML/CSS/JS vanilla — sin frameworks, sin npm, sin build step. Leaflet.js para mapa. Claude Haiku vía Cloudflare Worker (`cloudflare/worker.js`, passthrough puro). Web Speech API para voz. Wikipedia GeoSearch como fuente primaria de POIs, Overpass OSM como complemento. Nominatim para geocoding. OpenWeatherMap para clima. Despliegue en GitHub Pages (`follower-app/follower`, repo público).



\## Regla de Oro (crítica — aplicar siempre)

El panel/documentación es fotografía estática. El árbitro real es el código en GitHub. Antes de editar o afirmar el estado de cualquier archivo, \*\*traer la versión viva\*\* desde `raw.githubusercontent.com/follower-app/follower/main/\[path]`. Ante cualquier "ya quedó hecho", verificar contra el código, no contra el resumen.



\## Dónde vive el estado dinámico (no lo asumas, ve a buscarlo)

Antes de responder sobre el estado actual del proyecto (bugs abiertos, en qué va una arquitectura, qué se decidió en la última sesión), consulta:

\- `docs/producto.md` — bugs, features, estado de producto

\- `docs/arquitectura.md` — decisiones DA-1 a la actual

\- `docs/bitacora.md` — historial de sesiones

\- `docs/manifiesto\_narrativo.md` — reglas narrativas vigentes

\- `docs/prompt\_maestro\_follower.md` — prompt de capítulos vigente



Estos documentos cambian cada sesión. Este Skill NO los duplica — solo indica que existen y dónde están.



\## Convenciones de sesión (fijas, no cambian)

\- \*\*Protocolo de cierre:\*\* commit → actualizar panel → actualizar instrucciones de proyecto → chat nuevo, en ese orden

\- Una decisión a la vez; opciones presentadas como A/B/C con recomendación y razonamiento; el usuario ratifica antes de implementar

\- Cero código durante sesiones de diseño/definición

\- `sw.js` siempre se commitea al final, por separado

\- PowerShell en Windows: sin `\&\&` para encadenar comandos, sin `head`; mensajes de commit sin caracteres acentuados

\- La documentación se actualiza en la misma sesión que el código, nunca de forma especulativa

\- Deploys: `index.html` se sirve cache-first, `skipWaiting()` deshabilitado a propósito (no interrumpir audio activo). F5 normal no trae el HTML más reciente.



\## Sistema de tickets

\- `DA-###`: decisiones de arquitectura (en `arquitectura.md`)

\- `DT-###`: deuda técnica

\- `BUG-###`: bugs (en `producto.md`)

\- Historial de sesiones en `bitacora.md`



\## Disciplina de validación

\- Hipótesis etiquetadas explícitamente; hallazgos clasificados como "hipótesis", "confirmado en código" o "confirmado en campo"

\- Logs de debug exportados de iPhone son la fuente de verdad de campo (no hay acceso a Web Inspector)

\- n≥4 de muestreo probabilístico antes de cerrar un ticket

\- Un cambio a la vez



\## Versionado de cache (crítico, no olvidar)

\- `POI\_CACHE\_VERSION++` en el mismo commit si cambia query/filtros/normalización de POIs

\- `PROMPT\_VERSION++` en el mismo commit si cambia el Prompt Maestro de capítulos

\- `THESIS\_PROMPT\_VERSION` versiona la generación de tesis de ciudad, por separado



\## Lecciones aprendidas (aplicar, no repetir el error)

\- El scratchpad deliberado (borrador de verificación antes de cada capítulo) es la técnica que logró que autor/fecha aparezcan naturalmente en las narraciones

\- Los extractos de Wikipedia se truncaban silenciosamente en \~1200 caracteres pese a pedir 2500 — el fix se hizo del lado cliente, no confiar en el límite de la API

\- El desbloqueo de audio en iOS requiere gesto `touchend` directo y real — `touchstart` con passive:true es interceptado por Leaflet antes del handler; esto es una restricción dura de la plataforma, no un workaround pendiente

\- La clave de cache debe incluir el fingerprint del extracto, no solo la versión del prompt

\- Las secciones de "estado de implementación" son obligatorias en toda documentación — ya hubo una regresión por un documento que afirmaba algo hecho que el código no soportaba

\- Arquitectura narrativa (actos/epílogo) más allá de la tesis es Fase 2+ hasta que evidencia de campo lo justifique — sobre-ingenierizar capas narrativas antes de validar es un anti-patrón explícito para este proyecto



\## Al trabajar visualmente (Claude Design)

\- Respetar sístole/diástole sin invertir colores

\- El corazón-brújula es el símbolo de marca central, no reemplazar

\- Cualquier propuesta de interfaz debe evaluarse contra la pregunta rectora antes de darse por buena

\- No asumir estados de UI sin confirmarlos contra `docs/arquitectura.md` (DA-85 describe el estado actual del wizard, title card y tab de ciudad)



\## Al trabajar en código (Claude Code)

\- Aplicar Regla de Oro: fetch del archivo real antes de editar

\- Respetar funciones únicas ya existentes por archivo (ver `arquitectura.md` para el listado — no duplicar `detectNearby`, `getCityWelcome`, `setPhase`, etc.)

\- Bump de versiones de cache en el mismo commit cuando aplique

\- No escribir código durante sesiones marcadas como "diseño/definición"

