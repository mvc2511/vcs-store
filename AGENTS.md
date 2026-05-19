# Estado del Proyecto - VC'S Store

**Última actualización:** 2026-05-19

## 🎯 Próximo paso inmediato
Login combinado Google + Email (intercambio de sesiones).

## 📍 Contexto del Proyecto
- **Proyecto:** VC'S Store — E-commerce MVP de prendas de ropa
- **Frontend:** Angular 18 (Standalone, Signals, lazy loading, guards, responsive mobile-first)
- **Backend:** Python 3.11+ / FastAPI (Docker)
- **Infra:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Orquestación:** Docker Compose (backend + frontend)
- **Hosting:** Netlify (frontend) / Koyeb (backend) — aún no desplegado
- **Pagos:** Stripe suspendido → reemplazado por WhatsApp + Contra Entrega
- **Estado:** Funcional y en desarrollo activo

## ✅ Completado
- [x] Infraestructura Supabase (DB, Auth, Storage, RLS)
- [x] Trigger automático de perfiles al registrarse
- [x] Admin forzado: marianovc251@gmail.com
- [x] Catálogo público (grid + detalle producto)
- [x] Carrito con Signals + persistencia localStorage
- [x] Login con Google OAuth
- [x] Login con correo y contraseña (email/password)
- [x] Auth service con Signals
- [x] AuthGuard + AdminGuard funcionales
- [x] Rutas públicas: /, /producto/:id, /cart
- [x] Rutas protegidas hijas: /admin (productos, categorías)
- [x] CRUD de productos (endpoint FastAPI + componente Angular)
- [x] CRUD de categorías (endpoint FastAPI + componente Angular)
- [x] Upload de imágenes a Storage (FileReader → bucket)
- [x] WhatsApp: botón en carrito que genera mensaje con productos
- [x] Contra Entrega: endpoint POST /api/checkout/cod + botón + éxito dinámica
- [x] Admin full CRUD: productos (listar/crear/editar/eliminar) + categorías (listar/crear/editar/eliminar)
- [x] Admin Layout con sidebar + drawer mobile (hamburger flotante)
- [x] Admin tabla productos responsive → cards en mobile con data-labels
- [x] ProductoForm reutilizable para crear/editar según ruta :id
- [x] Edición inline de categorías (enter para guardar, escape para cancelar)
- [x] Confirmación modal al eliminar productos
- [x] Navbar: hamburger menu en mobile con animación
- [x] Navbar: menú deslizable con Catálogo, Admin, login/logout, avatar
- [x] Carrito responsive: items se envuelven en mobile (<500px)
- [x] Diseño homogéneo claro (admin y clientes mismo tema light)
- [x] Docker Compose: docker-compose.yml + docker-compose.override.yml
- [x] Frontend multi-stage Dockerfile (node build → nginx serve)
- [x] nginx.conf con SPA fallback
- [x] .dockerignore para frontend y backend
- [x] DOCKER-COMPOSE.md con guía completa y explicaciones

## 🔄 Pendiente
- [ ] Login combinado Google + Email (unificar la misma cuenta)
- [ ] Despliegue (Netlify + Koyeb)
- [ ] Panel admin de órdenes

## ⛔ Suspendido / No implementado
- **Stripe:** Código existe en checkout.py y webhooks.py pero las columnas no coinciden con el schema actual (usa `total_cents`/`status`/`product_name`/`price_cents` en vez de `total`/`estado`/`producto_id`/`precio_unitario`). Si se reactiva, corregir antes.

## 🗄️ Base de Datos (Supabase)
Schema completo re-ejecutable en: `vcs-store-database/database.sql`

**Tablas:**
- `perfiles` — id (UUID PK→auth.users), email, rol (ENUM: cliente/admin/moderador), created_at
- `categorias` — id (SERIAL PK), nombre (UNIQUE), creado_en
- `productos` — id (SERIAL PK), nombre, descripcion, precio (DECIMAL), imagen_url, stock, categoria_id (FK→categorias), creado_en
- `ordenes` — id (SERIAL PK), user_id (UUID), total (DECIMAL), estado (VARCHAR DEFAULT 'pendiente'), stripe_session_id (nullable), creado_en
- `detalles_orden` — id (SERIAL PK), orden_id (FK→ordenes CASCADE), producto_id (FK→productos SET NULL), cantidad (INT), precio_unitario (DECIMAL)

**Secuencias:** Service_role tiene USAGE en todas las secuencias SERIAL.

**RLS:**
- perfiles: SELECT público (anon + authenticated)
- categorias: SELECT público (anon)
- productos: SELECT público (anon)
- ordenes: SELECT solo propias (authenticated, auth.uid() = user_id)
- detalles_orden: protegido por RLS por defecto

**Trigger:** `on_auth_user_created` → `handle_new_user()` inserta en perfiles según metadata.

## 🏗️ Decisiones de Diseño
- Signals para estado reactivo (no RxJS tradicional)
- Backend stateless sin sesiones locales
- RLS en Supabase como capa de seguridad principal
- Procesamiento de imágenes 100% en cliente
- service_role aislado para escritura backend
- Stripe descartado → WhatsApp (cliente) + COD (backend+DB)
- Credenciales en variables de entorno (.env, environments.ts)
- Mobile-first: breakpoints 767px y 500px
- Docker Compose sobre docker run para orquestación
- Diseño homogéneo claro (sin tema oscuro separado para admin)

## 🔧 Reglas para cambios futuros
1. Todo cambio en la base de datos debe reflejarse PRIMERO en `database.sql` y LUEGO aplicarse en Supabase
2. No modificar manualmente la base de datos sin actualizar `database.sql`
3. Si se crea un endpoint nuevo, agregarlo a CONTEXT.md sección 4
4. Si se cambia el esquema, actualizar CONTEXT.md sección 5 y este AGENTS.md
5. Al completar una feature, pasar de "Pendiente" a "Completado" en TODO.md y AGENTS.md
6. Si se agrega un servicio nuevo a Docker Compose, actualizar DOCKER-COMPOSE.md

## 🛣️ Roadmap futuro — GitHub Ruleset (activar en orden)

Cuando el proyecto esté listo para producción, activar estas reglas en GitHub Settings → Rules → Ruleset (branch `main`):

**Fase 1 — Antes del deploy (prioridad)**
- [ ] Require status checks to pass (una vez que tengas CI: npm test + pytest)
- [ ] Require a pull request before merging (si trabajas con otro dev)

**Fase 2 — Producción activa**
- [ ] Require signed commits (opcional, seguridad criptográfica)
- [ ] Dismiss stale approvals (solo si usas PRs)
- [ ] Require conversation resolution (solo si usas PRs)

**No agregar (overkill para 1 dev + IA):**
- Code Owners (sin equipo no filtra nada)
- Require deployments (innecesario sin staging automático)

---

## 📦 Comandos útiles
- Frontend dev: `npm run start` (localhost:4200)
- Frontend build: `npm run build`
- Backend + Frontend (Docker Compose, ver `DOCKER-COMPOSE.md`):
  - `docker compose up -d` — Levantar todo
  - `docker compose up -d --build` — Reconstruir y levantar
  - `docker compose up -d backend` — Solo backend con hot reload
  - `docker compose down` — Bajar todo
  - `docker compose logs -f` — Logs en tiempo real
- Backend legacy (sin Compose): `docker build` + `docker run` en `vcs-store-backend/`
