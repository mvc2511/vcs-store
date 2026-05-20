# Estado del Proyecto - VC'S Store

**Última actualización:** 2026-05-19

## 🎯 Próximo paso inmediato
Fase 1.2 — Variantes de Producto (Talla, Color).

## 📍 Contexto del Proyecto
- **Proyecto:** VC'S Store — E-commerce MVP de prendas de ropa
- **Frontend:** Angular 18 (Standalone, Signals, lazy loading, guards, responsive mobile-first)
- **Backend:** Python 3.11+ / FastAPI (Docker)
- **Infra:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Orquestación:** Docker Compose (backend + frontend)
- **Hosting:** Netlify (frontend) / Render (backend) — desplegado
- **Pagos:** Stripe suspendido → reemplazado por WhatsApp + Contra Entrega
- **Estado:** Funcional y en desarrollo activo

## ✅ Completado

### Infraestructura y Base de Datos
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema completo re-ejecutable en database.sql
- [x] Tablas: perfiles, categorias, productos, ordenes, detalles_orden, puntos_entrega, carrito
- [x] Tabla carrito persistente con RLS (cada usuario ve/edita su propio carrito)
- [x] Columnas user_email, fecha_entrega, hora_entrega en ordenes
- [x] ENUM orden_estado (pendiente/confirmado/preparando/enviado/entregado/cancelado)
- [x] Trigger on_auth_user_created → handle_new_user() crea perfil
- [x] Admin forzado: marianovc251@gmail.com
- [x] Row Level Security configurado (3 roles: anon, authenticated, service_role)
- [x] Storage bucket productos con políticas de subida/lectura
- [x] Migraciones idempotentes (puntos-entrega, carrito-entrega)

### Frontend — Navegación y Layout
- [x] Arquitectura Standalone con Signals
- [x] Navbar responsive con hamburger menu animado + auth section desktop
- [x] Navbar: links Mis Pedidos + Mi Perfil para usuarios logueados
- [x] Navbar: avatar clickable a perfil
- [x] Navbar: search eliminado de desktop (solo sticky home search)
- [x] Home: grid de productos responsive + sticky bar (search + chips + sort)
- [x] Ordenar productos por precio (menor→mayor, mayor→menor)
- [x] Auth service con Signals
- [x] AuthGuard + AdminGuard funcionales
- [x] Rutas públicas: /, /producto/:id, /cart, /login
- [x] Rutas protegidas: /success, /mis-pedidos, /perfil, /admin/*
- [x] Diseño mobile-first (breakpoints 767px y 500px)
- [x] Diseño homogéneo claro (admin y clientes mismo tema light)

### Frontend — Auth y Perfil
- [x] Login con Google OAuth + Email/Password
- [x] Login: redirect a returnUrl post-auth
- [x] Login combinado Google + Email (intercambio entre sesiones)
- [x] Rediseño Login VYRO: password strength, Google OAuth, alerts, responsive
- [x] Signup completo: nombre, confirmar contraseña, términos y condiciones
- [x] Columna `nombre` en `perfiles` + trigger handle_new_user actualizado
- [x] Página `/perfil`: editar nombre, cambiar contraseña, email readonly, avatar upload

### Frontend — Carrito y Checkout
- [x] Carrito híbrido: API cuando logueado, localStorage cuando no
- [x] Cart merge modal: al login pregunta usuario si conservar servidor/local/fusionar
- [x] Carrito DB persistente: race condition corregida (sessionToken antes que isLoggedIn), timeout 3s
- [x] Carrito responsive: login gate, selector punto entrega, input teléfono, selector fecha/hora entrega
- [x] WhatsApp: botón en carrito que genera mensaje con productos
- [x] Contra Entrega: flujo completo (punto entrega + teléfono + fecha/hora + stock validation + decrement + user_email)
- [x] Success page con resumen completo (productos, total, punto entrega, fecha/hora)
- [x] Subida de imagen diferida al submit (UploadImage en ProductoForm.onSubmit)

### Frontend — Admin
- [x] Admin Layout con sidebar + drawer mobile (hamburger flotante) + nav items
- [x] Admin dashboard órdenes con expansión, cambio de estado, edición fecha/hora entrega
- [x] Admin full CRUD: productos + categorías + órdenes + puntos de entrega
- [x] ProductoForm reutilizable para crear/editar según ruta :id
- [x] Edición inline de categorías y puntos de entrega (enter guardar, escape cancelar)
- [x] Confirmación modal al eliminar productos

### Frontend — Mis Pedidos
- [x] Historial de pedidos del cliente + cancelación + muestra fecha/hora entrega
- [x] Tracking visual de orden con barra de progreso (pendiente→confirmado→preparando→enviado→entregado)
- [x] Rediseño Mis Pedidos VYRO: progress tracker animado, badges estados suaves
- [x] Detalles de orden siempre visibles inline (accordion pendiente — ver Fase 4)

### Frontend — Rediseño VYRO
- [x] Rediseño Navbar VYRO (logo, animaciones, focus rings champagne)
- [x] Rediseño Home VYRO (hero editorial, skeleton shimmer, stagger animations)
- [x] Rediseño ProductCard VYRO (aspect-ratio 4/5, hover overlay, SVG plus icon)
- [x] Rediseño ProductDetail VYRO (compacto 1000px, fonts reducidos ~30%)
- [x] Rediseño Cart VYRO (editorial grid, payment methods, summary sidebar)
- [x] Rediseño Login/Signup VYRO (password strength, Google OAuth, alerts)
- [x] Sistema de diseño VYRO completo: _variables.scss, _typography.scss, _components.scss, _mixins.scss, _animations.scss
- [x] SCSS consistente en todos los componentes con paleta VYRO
- [x] Toast Service + Container: Signal + Observable, 4 tipos, SVG icons, slideIn animation, responsive

### Backend (FastAPI)
- [x] Servicio de email con SendGrid (services/email.py): 3 templates HTML (orden creada, cambio estado, cancelación)
- [x] Email en checkout.py: notificación al crear orden COD
- [x] Email en admin_ordenes.py: notificación al cambiar estado de orden
- [x] Email en mis_ordenes.py: notificación al cancelar orden
- [x] CRUD completo productos (GET list con search, GET by id, POST, PUT, DELETE)
- [x] CRUD completo categorías (GET, POST, PUT, DELETE)
- [x] CRUD completo puntos-entrega (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo carrito (GET/POST/PUT/DELETE autenticado)
- [x] POST /api/checkout/cod (crear orden COD: punto entrega + teléfono + fecha/hora + stock validation + user_email)
- [x] GET /api/admin/ordenes (listar con filtro estado — incluye user_email, fecha/hora)
- [x] GET /api/admin/ordenes/{id} (detalle orden admin)
- [x] PUT /api/admin/ordenes/{id}/estado (cambiar estado admin)
- [x] PUT /api/admin/ordenes/{id} (editar fecha/hora entrega admin)
- [x] GET /api/mis-ordenes (órdenes del usuario autenticado)
- [x] PUT /api/mis-ordenes/{id}/cancelar (cancelar si pendiente)
- [x] Seguridad: verificar_admin + verificar_usuario_google
- [x] Validación Pydantic en todos los schemas
- [x] Cliente Supabase con service_role para escritura backend

### Docker
- [x] docker-compose.yml (backend + frontend orquestados)
- [x] docker-compose.override.yml (hot reload desarrollo)
- [x] Frontend multi-stage Dockerfile (node build → nginx serve)
- [x] nginx.conf con SPA fallback
- [x] .dockerignore para frontend y backend
- [x] DOCKER-COMPOSE.md con guía completa

### Despliegue
- [x] Frontend en Netlify (build automático)
- [x] Backend en Render (Docker Compose)
- [x] Cron-job keep-alive activo

## 🔄 Pendiente — Plan de Implementación por Fases

### Fase 1 — MVP Production (~2 semanas)
- [x] **1.1 Notificaciones Email** — SendGrid. Eventos: orden creada, cambio estado, cancelación. Servicio: `services/email.py` con 3 templates HTML inline. Integrado en checkout.py, admin_ordenes.py, mis_ordenes.py.
- [ ] **1.2 Variantes de Producto (Talla, Color)** — Nueva tabla variantes_producto, selector en product-detail, flujo carrito/checkout. 3-5 días.
- [ ] **1.3 Paginación Catálogo** — Backend con LIMIT/OFFSET, frontend reemplazar filtrado client-side. 0.5-1 día.
- [ ] **1.4 Stock Agotado Visual** — Badge, botón disabled, warning carrito. 0.5-1 día.

### Fase 2 — Experiencia Cliente (~2 semanas)
- [ ] **2.1 Reseñas y Valoraciones** — Tabla resenas, CRUD backend, estrellas frontend (solo compradores). 2-3 días.
- [ ] **2.2 Wishlist / Favoritos** — Tabla favoritos, corazón cards/detalle, página /favoritos. 1-2 días.
- [ ] **2.3 Cupones / Descuentos** — Tabla cupones, validación backend, input carrito, CRUD admin. 2-3 días.
- [ ] **2.4 Alertas Stock Bajo (Admin)** — Endpoint backend, tarjeta dashboard, badge admin. 1 día.

### Fase 3 — Validaciones Críticas (~1 semana)
- [ ] **3.1 Backend (7):** Race condition stock (UPDATE atómico), restaurar stock al cancelar, Idempotency-Key COD, transiciones DAG, stock≥0, precio>0, teléfono regex.
- [ ] **3.2 Frontend (6):** 401 Interceptor → redirect login + toast, refresh token Supabase, producto eliminado en carrito, stock agotado checkout, alert()→Toast, refresh precios al abrir carrito.

### Fase 4 — Estandarización Responsive + Accordion (~1 semana)
- [ ] **4.1** Mixins mobile-first (min-width), migrar cart.component.scss, reemplazar raw @media en 6 componentes.
- [ ] **4.2** Mis Pedidos: convertir detalles inline en accordion expandible por orden.

### Fase 5 — Funcionalidades Medias (~2-3 semanas)
- [ ] **5.1** Filtros combinados (rango precio, stock, sort server-side), productos relacionados, dashboard analíticas (Chart.js), carrito abandonado (email), notas del cliente, galería múltiple imágenes.

### Fase 6 — Mejoras Bajas (~1-2 semanas)
- [ ] **6.1** Términos/Privacidad (rutas + footer), multi-idioma (Angular i18n, español/inglés), blog (CRUD admin), comparación productos, compartir en redes.

## ⛔ Suspendido / No implementado
- **Stripe (Suspendido permanentemente):** Código existe en checkout.py y webhooks.py pero las columnas no coinciden con el schema actual (usa `total_cents`/`status`/`product_name`/`price_cents` en vez de `total`/`estado`/`producto_id`/`precio_unitario`). Stripe en requirements.txt para evitar error de import. WhatsApp + Contra Entrega es el modelo definitivo, no hay planes de reactivarlo.

## 🗄️ Base de Datos (Supabase)
Schema completo re-ejecutable en: `vcs-store-database/database.sql`

**Tablas:**
- `perfiles` — id (UUID PK→auth.users), email, rol (ENUM: cliente/admin/moderador), created_at
- `categorias` — id (SERIAL PK), nombre (UNIQUE), creado_en
- `productos` — id (SERIAL PK), nombre, descripcion, precio (DECIMAL), imagen_url, stock, categoria_id (FK→categorias), creado_en
- `ordenes` — id (SERIAL PK), user_id (UUID), user_email, total (DECIMAL), estado (orden_estado), punto_entrega_id (FK), telefono_contacto, fecha_entrega (DATE), hora_entrega (VARCHAR), stripe_session_id (nullable), creado_en, updated_at
- `detalles_orden` — id (SERIAL PK), orden_id (FK→ordenes CASCADE), producto_id (FK→productos SET NULL), cantidad (INT), precio_unitario (DECIMAL)
- `carrito` — id (SERIAL PK), user_id (UUID), producto_id (FK→productos CASCADE), cantidad (INT CHECK >0), created_at, updated_at

**Secuencias:** Service_role tiene USAGE en todas las secuencias SERIAL.

**RLS:**
- perfiles: SELECT público (anon + authenticated)
- categorias: SELECT público (anon)
- productos: SELECT público (anon)
- puntos_entrega: SELECT público (anon)
- ordenes: SELECT solo propias (authenticated, auth.uid() = user_id)
- detalles_orden: protegido por RLS por defecto
- carrito: SELECT/INSERT/UPDATE/DELETE solo propias (authenticated, auth.uid() = user_id)

**Trigger:** `on_auth_user_created` → `handle_new_user()` inserta en perfiles según metadata.

## 🏗️ Decisiones de Diseño
- Signals para estado reactivo (no RxJS tradicional)
- Backend stateless sin sesiones locales
- RLS en Supabase como capa de seguridad principal
- Carrito híbrido: API (logueado) + localStorage (no logueado)
- Merge modal al login si hay conflicto local vs servidor
- Procesamiento de imágenes 100% en cliente
- service_role aislado para escritura backend
- authenticated con permisos directos para carrito (RLS aisla por user_id)
- Stripe descartado → WhatsApp (cliente) + COD (backend+DB)
- Credenciales en variables de entorno (.env, environments.ts)
- Mobile-first: breakpoints 767px y 500px
- Docker Compose sobre docker run para orquestación
- Diseño homogéneo claro (sin tema oscuro separado para admin)
- Diseño visual guiado por `VYRO-REDESIGN.md` (paleta, tipografía, principios de diseño)

## 🔧 Reglas para cambios futuros
0. **ANTES DE CADA COMMIT** revisar y actualizar los 4 archivos de documentación si corresponde: `TODO.md`, `CONTEXT.md`, `AGENTS.md`, `DOCKER-COMPOSE.md`
1. Todo cambio en la base de datos debe reflejarse PRIMERO en `database.sql` y LUEGO aplicarse en Supabase
2. No modificar manualmente la base de datos sin actualizar `database.sql`
3. Si se crea un endpoint nuevo, agregarlo a CONTEXT.md sección 4
4. Si se cambia el esquema, actualizar CONTEXT.md sección 5 y este AGENTS.md
5. Al completar una feature, pasar de "Pendiente" a "Completado" en TODO.md y AGENTS.md
6. Si se modifica el flujo de Docker Compose (servicios nuevos, cambios en Dockerfile, nginx, override, .dockerignore), actualizar `DOCKER-COMPOSE.md`

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
