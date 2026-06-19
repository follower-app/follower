# 📓 Follower — Bitácora v0.3

> Registro cronológico de decisiones, cambios y aprendizajes.
> Actualizar después de cada sesión de trabajo.

---

## Cómo usar esta bitácora

- Cada sesión tiene su propia entrada con fecha
- Registrar: qué se hizo, qué se decidió, qué problemas surgieron
- Los bugs resueltos quedan aquí — no en el código
- Las decisiones importantes van TAMBIÉN a arquitectura.md

---

## Sesión 1 — Junio 2026

### Exploración de la idea
- Idea nació del viaje a Europa y la experiencia con free guides
- Concepto: audio guide cinematográfico con AI en tiempo real
- Diferenciador clave: música que cambia según el lugar + cuidado humano
- Nombre: **Follower**
- Slogan: **your city soundtrack**

### Decisiones de producto
- PWA (no app nativa) — liviana, sin app stores, multiplataforma
- Mapas: OpenStreetMap + Leaflet — gratuito, sin restricciones
- AI: Claude API para narración en tiempo real
- Stack: HTML + CSS + JS Vanilla — mismo que Organiza2
- Deploy: GitHub Pages

### Investigación de mercado
Competidores encontrados:
- **SmartGuide** — 1500+ destinos, AI CMS, sin experiencia cinematográfica
- **GuideToGo** — GPS + AI, sin música contextual
- **Detour** — más cercano al concepto cinematográfico, pero contenido estático y pocas ciudades
- **Gamana** — narradores con personalidad, sin música automática
- **Audiala** — 11 idiomas, sin cuidado contextual

**Conclusión:** El hueco real es la combinación de música cinematográfica automática + cuidado contextual + narración AI. Ningún competidor lo tiene todo junto.

### Identidad de marca
- Logo: Corazón C2 — corazón con brújula adentro
  - Exploración (brújula) + alma (corazón) = Follower
  - Ticks cardinales, aguja, N en rojo
- Paleta basada en sístole/diástole:
  - Sístole azul `#1a5276` = movimiento, caminando
  - Diástole rojo `#c0392b` = narración, recibiendo
  - Dorado `#f0c87a` = descanso, cuidado
- Tipografía: DM Serif Display + Inter

### Diseño de pantallas completado
- ✅ Splash con corazón latiendo y transición a config
- ✅ Config inicial — idioma + mood
- ✅ Modo Exploración — caminando (sístole)
- ✅ Modo Exploración — sugerencia de descanso (dorado)
- ✅ POI expandido — Coliseo épico + Fontana di Trevi romántico

### Decisiones de arquitectura
- DA-1: index.html solo shell
- DA-2: AppState centralizado en app.js
- DA-3: Funciones únicas por responsabilidad
- DA-4: Sístole/Diástole como sistema de color
- DA-5: Offline por 4 capas
- DA-6: Narración con fallback obligatorio
- DA-7: GPS nunca se interrumpe
- DA-8: Modo Libre es default
- DA-9: sw.js siempre último en commits
- DA-10: CSS variables en main.css

### Decisión clave — Modo híbrido
Después de evaluar si la app debería trazar recorridos como un guía turístico, se decidió el **modo híbrido**:
- Modo Libre por defecto — orgánico, sin presión
- Modo Recorrido opt-in — narrativo, curado
- Transición inteligente: sugerencia si el usuario está cerca del inicio de un recorrido

### Offline — decisión crítica
Inspirado en Organiza2. El offline es obligatorio:
- 4 capas de cache (sw.js, Leaflet, IndexedDB, Cache API)
- Pre-carga en splash: POIs 5km, narraciones top 10, música 4 moods
- Fallback de narración: cache → OSM básico → nunca error visible

### Documentación creada en esta sesión
- `README_follower_v0.3.md`
- `REGLAS_IA_follower.md`
- `producto_v0.3.md`
- `arquitectura_v0.3.md`
- `bitacora_v0.3.md` (este archivo)
- Mockups: splash, exploración, POI expandido

---

## Deuda técnica

| Item | Descripción | Prioridad |
|------|-------------|-----------|
| DT-1 | Logo SVG final pendiente — trazo del corazón a mano por el usuario | Alta |
| DT-2 | Pantalla selección de modo libre/recorrido no construida | Alta |
| DT-3 | Pantalla alerta de lluvia no construida | Media |
| DT-4 | Pantalla resumen del paseo no construida | Media |
| DT-5 | Música por mood — archivos de audio no definidos | Alta |
| DT-6 | REGLAS_IA.md sin archivo de docs/arquitectura referenciado | Baja |

---

## Bugs conocidos

*Ninguno por ahora — fase de diseño.*

---

## Próxima sesión

**Objetivo:** Arrancar el código real

**Orden sugerido:**
1. `index.html` — shell base con todas las pantallas
2. `css/main.css` — variables globales y reset
3. `sw.js` — service worker base
4. `manifest.json` — config PWA
5. `js/app.js` — AppState y router de pantallas

---

*Follower — Bitácora v0.3 | Junio 2026*
