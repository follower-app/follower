# Deuda Técnica de Interfaz — Follower

Resumen para continuar en un chat nuevo. Extraído de Sesión 19, 1 Julio 2026.

---

## 1. Bug encontrado — mensaje de bienvenida de ciudad roto

Al abrir la app, el texto "Tu ciudad te espera." aparece **pegado al borde
izquierdo** en vez de centrado sobre el mapa, mientras el GPS/geocoding
todavía está resolviendo.

El ícono ✨ que aparecía al lado del texto se diagnosticó como **Writing
Tools nativo de iOS** (aparece al seleccionar texto en Safari) — no es un
bug de Follower, no requiere acción de código.

**Causa raíz real:** no es un bug aislado de CSS — es el síntoma de que el
sistema actual de bienvenida (`welcomeCity()` en `app.js`, overlay no
bloqueante que auto-cierra a 5s) nunca fue rediseñado como pantalla de
carga real. Ya estaba anotado como **DT-45**, sin diseño cerrado hasta
esta sesión.

---

## 2. DT-45 — definición cerrada, código pendiente

Documento completo ya escrito: `docs/dt45_bienvenida_animada.md`

Decisiones cerradas:
- **Fin de pantalla:** cuando termina la animación de texto letra por
  letra — no cuando terminan de cargar los POIs (los POIs cargan en
  paralelo, casi siempre listos antes según datos de campo de Wikipedia
  GeoSearch, <1s)
- **Timeout de fallback:** 5 segundos — si geocoding no resolvió el
  idioma local de la ciudad, usa el saludo genérico en idioma del usuario
- **Interacción:** tap en cualquier lado la salta antes de tiempo — no es
  100% bloqueante

Pendiente, explícitamente sin fijar:
- Timing exacto de la animación (ms por carácter, mínimo, máximo) —
  necesita prueba real en mano antes de definir números, no asumir

---

## 3. Ideas de interfaz — de comparar capturas de Citymapper

Aclaración importante: la comparación fue **solo de patrones de UI**, no
de funcionalidades de transporte (Follower es 100% peatonal, sin ruteo de
transporte público — eso no aplica y no se considera).

| Patrón observado | Dónde aplicaría en Follower |
|---|---|
| Pantalla propia de "priming" antes del permiso nativo del sistema — ícono, titular, ejemplo concreto entre comillas, dos botones (sólido + fantasma) | **DT-47** (wizard de configuración, todavía sin diseñar) — especialmente para el permiso de GPS, que hoy probablemente dispara el prompt nativo sin contexto previo |
| Dato clave resaltado en tipografía grande/color contra el resto del texto (minutos, distancia) | Card de POI (`poi.css`), care card (`.care-card`), tab de POIs del debug panel |
| Número grande + unidad chica al lado (ej. "5.171 mi") | Mismo patrón, reutilizable en cualquier lugar de Follower que muestre distancia |
| Estado de carga mínimo — spinner + 2 palabras, nada más | Ya validado — coincide con la decisión de "splash mínimo" ya tomada en DT-45 |
| Botón circular flotante de "centrar en mí" | Comparar contra el tratamiento visual actual de la brújula de Follower (mencionada en README, sin detalle de diseño confirmado) |

---

## Pregunta abierta sin responder

¿Arrancar por el wizard de permisos (DT-47) siguiendo el patrón de
priming de las capturas, o por la jerarquía tipográfica de datos
resaltados (distancia/tiempo) en las cards que ya existen?

---

## Contexto técnico relevante para el chat nuevo

- `Care.resetWalk()` sigue sin cablear en `app.js` (deuda de Sesión 19,
  no relacionada a interfaz pero pendiente)
- `sw.js` en v9 al cierre de esta sesión
- DT-42 (Care generativo) y DA-55 (pausa de tránsito) ya implementados
  completos en esta sesión — no confundir con los pendientes de este
  documento, que son puramente de interfaz

---

*Follower — Deuda Técnica de Interfaz | Extraído de Sesión 19 | 1 Julio 2026*
