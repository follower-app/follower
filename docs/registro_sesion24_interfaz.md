# Registro Sesión 24 (interfaz) — bloques para pegar por documento

---

## → `docs/arquitectura.md`

### DA-75 — Nombre del acompañado (RATIFICADA — Sesión 24)

**Decisión:** Follower puede conocer el nombre del usuario para humanizar
bienvenida y despedida.

1. **Captura:** paso opcional del wizard (DT-47), "¿Cómo quieres que te
   llame?", skippable sin fricción.
2. **Persistencia:** `localStorage`. Nunca viaja al Worker como dato
   independiente — solo inyectado en el texto del prompt.
3. **Contrato de uso:** exclusivamente `getCityWelcome()` y futuro
   `getFarewell()` (DT-53). Prohibido en capítulos y en Care — el narrador
   habla de la ciudad; el nombre abre y cierra el paseo.
4. **Fallback:** sin nombre, todo funciona igual que hoy. Cero
   condicionales nuevos en el flujo principal.
5. **Sin cambios** en `trigger()` ni en el Prompt Maestro v3.0 — no
   contamina la variable de campo pendiente (voz v3.0).

**Microcopy como contrato:** la pantalla declara al usuario el uso real:
"Solo lo usaré para saludarte y despedirme."

---

## → `docs/bitacora.md` (deuda técnica nueva)

### DT-54 — Wake lock + modo caminata

**Problema:** al bloquearse la pantalla, iOS suspende el JS de la PWA:
`watchPosition` deja de entregar, timers congelados, `speechSynthesis`
cortada. El apagado automático de pantalla rompe la experiencia completa.

**Solución ratificada:**
- `navigator.wakeLock.request('screen')` al iniciar caminata
  (Safari ≥ iOS 16.4).
- Re-adquirir en `visibilitychange` (el lock se libera al ocultar la app).
- **Modo caminata:** pantalla casi negra (negro OLED ≈ pantalla apagada en
  consumo), solo corazón latiendo + fase sístole/diástole. El teléfono va
  al bolsillo con la pantalla técnicamente encendida, visualmente dormida.
- Si el usuario bloquea manualmente: suspensión aceptada, reanudación
  limpia al desbloquear. Nunca mostrar error — siempre hay fallback.

**Pregunta rectora:** el modo caminata es momento de marca, no pantalla de
utilidad. Convergencia directa con visión v2.0 accesibilidad (audio-first).

**Nota de largo plazo:** GPS verdaderamente en background solo existe en
nativo (wrapper tipo Capacitor). Decisión de v2.0, fuera de alcance actual.

### DT-55 — Prefetch de narraciones cercanas

**Problema:** generar narraciones exige red en el momento del trigger.
Túnel o zona sin señal rompe la experiencia; la latencia del Worker se
percibe en el peor momento (usuario ya frente al POI).

**Solución ratificada:**
- Tras cargar POIs cercanos, pre-generar en segundo plano las narraciones
  de los N más próximos.
- Reutiliza el cache existente (`${PROMPT_VERSION}_${poiId}_${lang}_${topic}`)
  — cero estructura nueva.
- Convierte "conexión permanente" en "conexión al inicio + ráfagas".

**Consideraciones abiertas:**
- Valor de N y criterio (proximidad pura vs proximidad + rumbo).
- No interferir con un `trigger()` en curso (prefetch cede prioridad).
- Costo Haiku de narraciones no usadas: tolerable, pero medir hit-rate.
- **Sinergia con DT-44:** el prefetch elimina la latencia percibida —
  puede volver innecesaria la medición de latencia del Worker en campo.

---

## → `docs/producto.md` (visión, sin ticket de código)

### Visión v2.0 — Follower accesible (modo de narración no-visual)

Linaje validado: Microsoft Soundscape (open source tras descontinuarse)
y sus sucesores (VoiceVista, Soundscape Community, Soundscape STA) probaron
la demanda de exploración urbana por audio para personas ciegas — todos
sobre OSM, la misma fuente de Follower. El vacío que señala la comunidad:
no es evitar obstáculos (bastón, perro), es saber qué hay alrededor y qué
es interesante. Ese vacío es el territorio exacto de Follower: Soundscape
anuncia "iglesia a tu derecha"; Follower cuenta por qué importa.

**Condiciones:**
1. Follower **nunca** es ayuda de movilidad — compañía cultural. Cero
   ambigüedad, declarado explícitamente.
2. Variante de prompt "narrar lo perceptible" (sonido, textura, historia)
   en vez de "lo observable" visual. Depende de DT-51.
3. Condicionada a conversar con usuarios reales antes de asumir
   necesidades. Sin ticket de código hasta entonces.

**Criterio de diseño vigente desde ya:** cada feature que tiente a
depender de la pantalla tiene ahora dos razones para resistir — la visión
cinematográfica y este usuario. El wizard paso 2 ("Toca para escucharme")
ya es puerta de entrada accesible: la app se presenta hablando.

---

## → `docs/dt45_bienvenida_animada.md` (enmienda — SUPERA el diseño anterior)

### Enmienda Sesión 24 — title card (ratificada)

**Decisión:** la pantalla de bienvenida es un **title card estático**:
solo FOLLOWER + *your city soundtrack* apareciendo de la nada (fade puro,
sin movimiento de letras). El saludo **se muda 100% al canal de voz**:
`getCityWelcome()` dice "Bienvenido a Pasto, Jaime" en idioma local, con
nombre (DA-75 intacta — su contrato siempre fue la voz). Separación de
canales de cine: la pantalla titula, la voz saluda.

**Composición:** wordmark FOLLOWER (Inter, tracking amplio, grande) +
slogan en DM Serif Display Itálica dorada (la itálica ratificada vive
aquí). Fondo noche con resplandor sístole inferior.

**Se retira del diseño anterior:**
- Animación letra por letra (y su rol de reloj de la pantalla)
- Texto del saludo en pantalla + su fallback "Tu ciudad te espera"
- Dependencia del reverse geocoding en la pantalla (la carrera de 5s
  desaparece del UI — el idioma local vive solo en la voz)
- La pregunta A/B de posición del slogan (sin objeto)

**Simplificación resultante:** la pantalla no espera a nadie — cero
estados de carga, cero fallback visual. Implementación: CSS fade + timer
+ tap.

**Timing propuesto (se fija en mano):** fade-in ~1.8s → sostiene →
sale al entrar a explore, techo 4s, tap salta.

---

## → spec DT-47 (estado de diseño tras mockups)

**Naturaleza:** no es wizard de preferencias (Follower casi no tiene qué
configurar) — es **coreografía de permisos/desbloqueos de iOS** que hoy se
disparan sin contexto. Solo primera vez.

**Flujo:** splash → wizard (primera vez) → bienvenida animada (DT-45) → explore

**Pasos ratificados en mockup final (orden resuelto por dependencias):**
1. **Priming GPS** (patrón Citymapper): pantalla propia antes del prompt
   nativo. GPS obligatorio → sin botón "ahora no", solo enlace explicativo.
2. **Idioma:** autodetectado de `navigator.language`, confirmación 1 tap,
   "Cambiar" abre selector existente. Va ANTES de la voz — la frase de
   muestra debe sonar en el idioma confirmado.
3. **Nombre (DA-75):** opcional, "Prefiero no decirlo" sale limpio. Va
   ANTES de la voz — recompensa inmediata del dato en el paso 4.
4. **Desbloqueo de voz — cierre del wizard:** el corazón latiendo es el
   botón. Tap = gesto confiable que desbloquea `speechSynthesis` (linaje
   BUG-036, `touchend`) + frase de muestra en idioma confirmado y con
   nombre: "Hola, Jaime. Soy Follower. Tu ciudad tiene historias que
   contarte." (fallback sin nombre: "Hola. Soy Follower..."). Último paso
   a propósito: el desbloqueo queda fresco justo antes de la bienvenida
   hablada.

**Abierto (único):** timing del fade del title card — se fija en mano.

**Mockup de referencia:** dt47_wizard_mockup_final.html (Sesión 24).
