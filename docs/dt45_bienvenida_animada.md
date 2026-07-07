# DT-45 — Bienvenida animada como pantalla de carga real

Estado: **SUPERADO POR ENMIENDA S24 (title card) — ver sección final. Código pendiente**
Sesión 19 (continuación), 1 Julio 2026 · Enmendado Sesión 24, 7 Julio 2026

> ⚠️ **La enmienda de Sesión 24 (al final de este documento) supera las
> secciones de diseño visual y disparador de este documento.** Sigue
> vigente de la definición original: qué reemplaza, el carácter
> bloqueante-skippable y el impacto en archivos.

---

## Qué reemplaza

Flujo actual (no bloqueante, sigue activo en producción):
```
splash (corazón) → explore (mapa) → welcomeCity() superpuesto, auto-cierra a 5s
```

Flujo nuevo:
```
splash mínimo → pantalla de bienvenida animada (letra por letra) → explore
```

Relación con DA-56: DA-56 definió el **idioma** del saludo (idioma local de
la ciudad, no del usuario) — esa parte ya está implementada desde DT-41,
Sesión 18. Lo que faltaba y define este documento es el **flujo y el
timing** — la parte que seguía pendiente y causó el bug reportado en esta
sesión (overlay huérfano, mal posicionado, mientras el mapa tardaba en
cargar).

---

## Decisiones cerradas

### 1. Disparador de fin de pantalla

**La animación de texto manda.** La pantalla de bienvenida termina cuando
termina de dibujarse el saludo letra por letra — independientemente de si
los POIs ya terminaron de cargar antes o no.

Consecuencia de diseño: esto convierte la pantalla en un **momento de marca
de duración fija**, no en un indicador de progreso real. Los POIs cargan en
paralelo detrás — con los tiempos de campo ya confirmados de Wikipedia
GeoSearch (<1s), casi siempre van a estar listos antes de que la animación
termine. Si por algún motivo tardan más, `explore` igual se muestra al
terminar la animación — el spinner/estado de carga normal de POIs se hace
cargo desde ahí, sin bloquear more tiempo del ya definido acá.

### 2. Timeout de fallback — geocoding lento

**5 segundos** (igual al auto-cierre del sistema actual). Si el reverse
geocoding (idioma local de la ciudad) no resolvió en 5s, se usa el saludo
genérico existente ("Tu ciudad te espera" / "Your city awaits") en el
idioma del **usuario** — nunca se omite la pantalla completa, nunca se
muestra un error.

### 3. Interacción — skippable

**Tap en cualquier lado de la pantalla la salta antes de tiempo.** No es
100% bloqueante. Esto baja la presión sobre acertar el timing exacto de la
animación — si a alguien le resulta lenta, la corta.

---

## Pendiente de validar en campo — NO son valores finales

La duración exacta de la animación letra por letra todavía no tiene
número confirmado. Se necesita probar antes de fijarlo, no asumirlo:

```javascript
// VALORES DE PARTIDA — sujetos a ajuste con pruebas reales,
// no bloqueantes para el resto del diseño
CHAR_DELAY_MS:    80    // por caracter
MIN_DURATION_MS:  1200  // piso, aunque el saludo sea muy corto
MAX_DURATION_MS:  3000  // techo, aunque el saludo sea muy largo
```

**Qué hace falta probar antes de fijar estos números:** cómo se siente en
mano (no en escritorio) el ritmo letra por letra a distintas velocidades,
con saludos cortos ("Hola Cali", 9 caracteres) y largos ("¡Bienvenido a
Cartagena de Indias!", 34 caracteres) — y si el `MAX_DURATION_MS` de 3s se
siente lento comparado con el tap-to-skip ya disponible como salida.

---

## Impacto en archivos — cuando se codifique (no ahora)

| Archivo | Cambio esperado |
|---------|------------------|
| `app.js` | `runSplash()` se acorta. `welcomeCity()` deja de ser overlay opcional — se vuelve parte bloqueante (pero skippable) del flujo de entrada. Nueva lógica de animación letra por letra con tap-to-skip |
| `narration.js` | `getCityWelcome(city, lang)` — ya no recibe `style` (DA-50), ya implementado. Sin cambios adicionales esperados acá |
| `gps.js` | Sin cambios esperados — `country_code` ya expuesto desde DT-41 |
| `explore.css` | Revisar `.city-welcome` — el bug de posicionamiento reportado en esta sesión (texto pegado a la izquierda en vez de centrado) puede resolverse solo con este rediseño, o puede necesitar fix aparte si persiste con el nuevo flujo |

---

## Deuda que este documento NO resuelve

- El ícono de destello (✨) reportado junto al texto — diagnosticado como
  probable "Writing Tools" nativo de iOS (aparece al seleccionar texto),
  no un bug de Follower. No requiere acción de código.
- Validación de campo de los 3 valores de timing — explícitamente fuera
  de alcance de este documento, pendiente de pruebas reales antes de
  escribir código.

---

*Follower — DT-45 Bienvenida Animada | Definición cerrada, código pendiente | Sesión 19 | 1 Julio 2026*

---

## ENMIENDA SESIÓN 24 — Title card (ratificada, supera el diseño anterior)

**Decisión:** la pantalla de bienvenida es un **title card estático**:
solo FOLLOWER + *your city soundtrack* apareciendo de la nada (fade puro,
sin movimiento de letras). **El saludo se muda 100% al canal de voz:**
`getCityWelcome()` dice "Bienvenido a Pasto, Jaime" en idioma local, con
nombre (DA-75 — su contrato siempre fue la voz). Separación de canales de
cine: la pantalla titula, la voz saluda.

**Composición:** wordmark FOLLOWER (Inter, tracking amplio, grande) +
slogan en DM Serif Display Itálica dorada (la itálica ratificada por A/B/C
en la misma sesión vive aquí). Fondo noche con resplandor sístole inferior.
Mockup: `docs/dt47_wizard_mockup_final.html`.

**Se retira del diseño de Sesión 19:**
- Animación letra por letra (y su rol de reloj de la pantalla)
- Texto del saludo en pantalla + su fallback "Tu ciudad te espera"
- Dependencia del reverse geocoding en la pantalla — la carrera de 5s
  desaparece del UI; el idioma local vive solo en la voz
- La decisión tipográfica intermedia de la sesión (saludo animado en
  itálica) — la itálica sobrevive en el slogan

**Historial de la decisión (misma sesión):** letra por letra → A/B/C
tipográfico (script mano pegada descartada: corta ligaduras al revelarse,
castiga baja visión) → itálica + identidad como marco → title card puro.

**Simplificación resultante:** la pantalla no espera a nadie — cero
estados de carga, cero fallback visual. Implementación: CSS fade + timer
+ tap.

**Timing propuesto (se fija en mano, NO son valores finales):** fade-in
~1.8s → sostiene → sale al entrar a explore, techo 4s, tap salta.

---

*Enmienda — Sesión 24 | 7 Julio 2026*
