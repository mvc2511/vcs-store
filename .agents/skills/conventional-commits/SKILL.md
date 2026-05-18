---
name: conventional-commits
description: >
  Genera commits siguiendo Conventional Commits con título ≤50 caracteres y
  descripción obligatoria clara y concisa. Lee AGENTS.md, CONTEXT.md y TODO.md
  para detectar el próximo paso inmediato y cambios importantes, sugerir el
  commit apropiado y actualizar los archivos de estado según las reglas del
  proyecto.
license: MIT
metadata:
  author: vcs-store
  version: "1.0"
---

# Conventional Commits para VC'S Store

Genera commits estructurados y mantiene sincronizados los archivos de estado del proyecto.

## Archivos de referencia

| Archivo | Ruta | Propósito |
|---------|------|-----------|
| **AGENTS.md** | `./AGENTS.md` | Estado del proyecto, próximo paso inmediato, completado/pendiente, reglas de cambios futuros |
| **CONTEXT.md** | `./CONTEXT.md` | Arquitectura: stack, rutas frontend (sección 3), endpoints backend (sección 4), esquema DB (sección 5) |
| **TODO.md** | `./TODO.md` | Tracking granular de tareas: En Progreso / Bloqueado / Completado |

---

## Formato del commit

```
<tipo>: <título hasta 50 caracteres>

<descripción obligatoria, clara y concisa, líneas ≤ 72 caracteres>
```

### Tipos permitidos

| Tipo   | Uso |
|--------|-----|
| `feat` | Nueva funcionalidad |
| `fix`  | Corrección de bug |
| `refactor` | Cambio interno sin cambio funcional |
| `style` | Cambios de formato, CSS, UI |
| `docs` | Documentación (README, AGENTS, CONTEXT, TODO) |
| `perf` | Mejora de rendimiento |
| `test` | Tests |
| `chore` | Mantenimiento, build, dependencias |
| `a11y` | Mejora de accesibilidad |
| `seo`  | Mejora de SEO / meta tags |

### Reglas del título

- Máximo **50 caracteres** (incluyendo tipo, dos puntos y espacio)
- Sin punto final
- En imperativo: "Añadir", "Corregir", "Actualizar"
- Primera letra del título en mayúscula después del tipo

✅ `feat: Añadir login con Google OAuth`
✅ `fix: Corregir cálculo de total en carrito`
❌ `feat: Añadir login con Google OAuth y también mejorar el navbar` (excede 50)

### Reglas de la descripción (OBLIGATORIA)

- Explicar **qué** y **por qué**, no **cómo**
- Si hay un solo cambio, usar una línea descriptiva
- Si hay múltiples cambios relacionados, usar viñetas (`- `)
- Máximo **72 caracteres por línea**
- Incluir `BREAKING CHANGE:` si es retro-incompatible
- Sección "Próximo paso inmediato" de `AGENTS.md` puede guiar el qué

✅ Correcto:
```
feat: Unificar sesiones Google y Email

Vincular cuentas de Google y email/password en un mismo perfil
para que el usuario acceda con cualquier método.
Actualizar AGENTS.md y TODO.md con estado completado.
```

---

## Flujo de trabajo

### 1. Antes del commit: analizar cambios

```bash
git status
git diff
git diff --cached
```

### 2. Leer los archivos de estado

```bash
cat AGENTS.md
cat TODO.md
cat CONTEXT.md
```

Identificar en `AGENTS.md`:
- **🎯 Próximo paso inmediato** (línea 5-6) — la prioridad actual del proyecto
- **🔄 Pendiente** (líneas 35-38) — tareas por hacer
- **🔧 Reglas para cambios futuros** (líneas 73-78) — restricciones a cumplir

Identificar en `TODO.md`:
- **🔄 En Progreso** (línea 3-4) — tarea activa
- **⏸️ Bloqueado / Suspendido** (líneas 6-8)
- **✅ Completado** (líneas 10-46) — histórico

Identificar en `CONTEXT.md`:
- **3. Frontend** — rutas (sección 3, tabla líneas 37-44)
- **4. Backend** — endpoints activos (sección 4, líneas 53-59)
- **5. Base de Datos** — esquema y RLS (sección 5, líneas 63-151)
- **7. Estado de Implementación** (sección 7, líneas 174-195)

### 3. Determinar el tipo de cambio

| Si el cambio... | Tipo |
|----------------|------|
| Implementa el "Próximo paso inmediato" de `AGENTS.md` (línea 6) | `feat` |
| Corrige algo que no funciona | `fix` |
| Agrega/mejora accesibilidad | `a11y` |
| Agrega/mejora SEO o meta tags | `seo` |
| Cambia HTML, CSS o UI sin alterar lógica | `style` |
| Refactoriza sin cambiar comportamiento | `refactor` |
| Actualiza AGENTS.md, CONTEXT.md, TODO.md o README | `docs` |
| Cambia build, dependencias, config | `chore` |

### 4. Generar el mensaje de commit

```
<tipo>: <título ≤ 50 caracteres>

<descripción obligatoria con qué y por qué>
```

### 5. Actualizar archivos de estado según reglas

Siguiendo **🔧 Reglas para cambios futuros** de `AGENTS.md` (líneas 73-78):

| # | Regla original | Acción |
|---|----------------|--------|
| 1 | DB changes → `database.sql` primero | Si hay cambios en DB, editar `vcs-store-database/database.sql` ANTES de aplicar en Supabase |
| 2 | No modificar DB sin `database.sql` | Verificar que el schema SQL esté actualizado y commitearlo junto al código |
| 3 | Endpoint nuevo → CONTEXT.md sección 4 | Agregar el endpoint a la lista de `Endpoints activos` en `CONTEXT.md` sección 4 (líneas 53-59) |
| 4 | Cambio esquema → CONTEXT.md sección 5 + AGENTS.md | Actualizar la sección 5 (`Base de Datos`) en `CONTEXT.md` y la sección `🗄️ Base de Datos` en `AGENTS.md` |
| 5 | Feature completada → TODO.md y AGENTS.md | Mover de "🔄 Pendiente" a "✅ Completado" en `AGENTS.md` (líneas 17-38) y de "🔄 En Progreso" a "✅ Completado" en `TODO.md` |

**Siempre al finalizar:**
- Mover items completados en `AGENTS.md` (secciones ✅ Completado / 🔄 Pendiente)
- Mover items completados en `TODO.md` (secciones 🔄 En Progreso / ✅ Completado)
- Actualizar `CONTEXT.md` sección 7 (Estado de Implementación) si aplica
- Actualizar `Última actualización` en `AGENTS.md` (línea 3)

---

## Ejemplos

### Feature nueva (Próximo paso inmediato)

```
feat: Unificar sesiones Google y Email

Vincular cuentas de Google y email/password en un mismo perfil
para que el usuario acceda con cualquier método.
Actualizar AGENTS.md y TODO.md moviendo la feature a Completado.
```

### Mejora transversal (SEO)

```
seo: Añadir meta tags y Open Graph

Agregar meta description y OG tags en index.html, crear servicio
SEO dinámico, añadir JSON-LD (Store, Product, Breadcrumb) e
incluir robots.txt y sitemap.xml.
```

### Accesibilidad

```
a11y: Mejorar navegación por teclado

Añadir skip link para saltar navegación, agregar aria-label a
botones de icono, implementar prefers-reduced-motion y convertir
login toggle a button semántico.
```

### Actualizar estado del proyecto

```
docs: Actualizar estado en AGENTS.md y TODO.md

Mover feature completada a "Completado" y reflejar cambios de
la sesión actual en ambos archivos.
```

### Fix simple

```
fix: Corregir contador de carrito al vaciar

El contador no se reiniciaba al vaciar el carrito porque la señal
no emitía el evento de limpieza. Forzar actualización manual.
```

---

## Verificación post-commit

```bash
git log --oneline -3
git diff --name-only HEAD~1
git log -1 --format="%B" | head -1 | Measure-Object -Character | Select-Object Characters
```

El último comando verifica que el título no exceda 50 caracteres.
