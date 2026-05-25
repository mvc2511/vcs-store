# Estado del Proyecto - VC'S Store

**Última actualización:** 2026-05-25 (9)

## 🎯 Próximo paso inmediato
Aplicar migraciones en Supabase QA y PRD (`migracion-perfumes-encargo.sql` + `migracion-producto-imagenes.sql` + `migracion-horarios-entrega.sql` + `migracion-variante-precio-propio.sql`).

## 🐛 Hotfix (2026-05-22)
- `maybe_single()` → `.limit(1)` en endpoints reseñas (causaba 500 /can-review)
- Supabase getProductById no incluía `es_encargo`/`dias_entrega` → product detail no ocultaba carrito ni cantidad en encargo
- Hero reemplazado por sección Perfumes por Encargo como nueva hero

## 📍 Contexto del Proyecto
- **Proyecto:** VYRO — E-commerce de ropa, perfumes y accesorios (mayoreo/granel)
- **Frontend:** Angular 18 (Standalone, Signals, lazy loading, guards, responsive mobile-first)
- **Backend:** Python 3.11+ / FastAPI (Docker)
- **Infra:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Orquestación:** Docker Compose (backend + frontend)
- **Hosting:** Netlify (frontend) / Render (backend) — desplegado
- **Supabase QA:** uruewqhwfyqhdhvfbsvj — Google OAuth con credenciales propias
- **Supabase Prod:** yprfitraqcitwuqllvzz — pendiente Google OAuth
- **Pagos:** Stripe suspendido → reemplazado por WhatsApp + Contra Entrega
- **Estado:** Funcional y en desarrollo activo

## ✅ Completado

### Infraestructura y Base de Datos
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema completo re-ejecutable en database.sql
- [x] Tablas: perfiles, categorias, productos, variantes_producto, ordenes, detalles_orden, puntos_entrega, carrito
- [x] Tabla carrito persistente con RLS (cada usuario ve/edita su propio carrito)
- [x] Columnas user_email, fecha_entrega, hora_entrega en ordenes
- [x] ENUM orden_estado (pendiente/confirmado/preparando/enviado/entregado/cancelado)
- [x] Trigger on_auth_user_created → handle_new_user() crea perfil
- [x] Admin forzado: marianovc251@gmail.com
- [x] Row Level Security configurado (3 roles: anon, authenticated, service_role)
- [x] Storage bucket productos con políticas de subida/lectura
- [x] Migraciones idempotentes (puntos-entrega, carrito-entrega, variantes, tallas-colores, opciones-ml, rename talla→nombre_variante)
- [x] Tabla `favoritos` + RLS (per-user isolation, como carrito)
- [x] Tabla `resenas` + RLS (lectura pública, escritura propia)
- [x] Tabla `cupones` + RLS (lectura pública, CRUD admin)
- [x] Tabla `precios_mayoreo` + RLS (lectura pública, CRUD admin)
- [x] Columna `visible` en productos (control admin de visibilidad en catálogo)
- [x] Columna `cupon_id` + `descuento` en ordenes
- [x] Columna `anonima` en resenas
- [x] Tabla `producto_imagenes` + RLS (lectura pública, CRUD admin, asociación a color)

### Frontend — Navegación y Layout
- [x] Arquitectura Standalone con Signals
- [x] Navbar responsive con hamburger menu animado + auth section desktop
- [x] Navbar: links Mis Pedidos + Mi Perfil para usuarios logueados
- [x] Navbar: avatar clickable a perfil
- [x] Navbar: search eliminado de desktop (solo sticky home search)
- [x] Home: grid de productos responsive + sticky bar (search + chips + sort) + paginación server-side
- [x] Ordenar productos por precio (menor→mayor, mayor→menor)
- [x] Auth service con Signals
- [x] AuthGuard + AdminGuard funcionales
- [x] Rutas públicas: /, /producto/:id, /cart, /login, /privacidad, /terminos
- [x] Rutas protegidas: /success, /mis-pedidos, /perfil, /admin/*
- [x] Diseño mobile-first (breakpoints 767px y 500px)
- [x] Diseño homogéneo claro (admin y clientes mismo tema light)
- [x] Footer responsive con datos de contacto, entregas locales y links legales
- [x] Páginas legales: /privacidad (Aviso de Privacidad) y /terminos (Términos y Condiciones)

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
- [x] Carrito con variantes: clave única (producto_id + variante_id), merge modal compatible
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
- [x] Admin full CRUD: productos + categorías + tallas + colores + órdenes + puntos de entrega
- [x] ProductoForm reutilizable para crear/editar según ruta :id
- [x] Variantes inline: tabla editable, agregar individual, generación automática talla×color
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
- [x] Rediseño ProductDetail VYRO (2-columnas desktop, stock bar, specs grid, editorial spacing)
- [x] Rediseño Cart VYRO (editorial grid, payment methods, summary sidebar)
- [x] Rediseño Login/Signup VYRO (password strength, Google OAuth, alerts)
- [x] Sistema de diseño VYRO completo: _variables.scss, _typography.scss, _components.scss, _mixins.scss, _animations.scss
- [x] SCSS consistente en todos los componentes con paleta VYRO
- [x] Toast Service + Container: Signal + Observable, 4 tipos, SVG icons, slideIn animation, responsive
- [x] SEO completo: JSON-LD LocalBusiness, Open Graph, Twitter Cards, canonical URLs, sitemap, robots.txt
- [x] Footer responsive con datos de contacto, entregas locales y links legales
- [x] Páginas legales: /privacidad (Aviso de Privacidad) y /terminos (Términos y Condiciones)

### Accesibilidad (WCAG 2.2 AA)
- [x] Audit completa de 27+ templates HTML, SCSS y TypeScript
- [x] Alt text dinámico en preview de producto (producto-form)
- [x] Labels con `visually-hidden` en 41 controles de formulario (admin CRUD, carrito, reseñas)
- [x] `aria-label` en 29 botones icon-only (editar, eliminar, guardar, cancelar)
- [x] `aria-hidden="true"` en 30+ SVGs decorativos
- [x] `:focus-visible` con outline champagne en todos los componentes
- [x] Navegación por teclado: Escape → cerrar menú, Enter/Space → upload
- [x] Skip link con animación smooth
- [x] `prefers-reduced-motion` y `prefers-contrast: more`
- [x] Rating stars con `role="radio"`, `aria-checked`, `tabindex`

### Infraestructura
- [x] bash-defensive-patterns: entrypoint.sh hardening (strict mode, trap, logging, validación)
- [x] Dockerfile: limpieza de sed innecesario en entrypoint

### Galería Multi-Imagen (2026-05-23)
- [x] Migración SQL `migracion-producto-imagenes.sql` — tabla `producto_imagenes` con color_id opcional
- [x] Backend: CRUD completo de imágenes por producto (POST/PUT/DELETE/reordenar)
- [x] Backend: GET /api/productos/{id} incluye array `imagenes`
- [x] Frontend ProductoForm: galería con upload multiple, ↑/↓ reordenar, dropdown de color, eliminar
- [x] Frontend ProductDetail: thumbs + imagen grande + filtrado por color seleccionado

### Mejoras Filtros Home (2026-05-25)
- [x] Home: modal de filtros (drawer) con género, categoría y orden
- [x] Home: filtro género (hombre/mujer/unisex) + backend `genero` query param
- [x] Home: categorías como dropdown con solo categorías con productos (`?con_productos=true`)
- [x] Admin: filter bar sticky + dropdowns de categoría con solo productos con stock
- [x] Sección encargo: limitada a 5 productos + tarjeta "Ver más" → /sobre-pedido

### Horarios de Entrega CRUD (2026-05-25)
- [x] Migración SQL `migracion-horarios-entrega.sql` — RLS + sequence grant
- [x] Backend: GET /api/horarios-entrega público, POST/PUT/DELETE admin (horarios_entrega.py)
- [x] Frontend: Admin HorariosEntregaComponent CRUD (dia_semana, hora_inicio, hora_fin, activo)
- [x] Ruta /admin/horarios-entrega + nav item
- [x] Carrito + admin-ordenes: dropdowns estilizados desde API, minWeekend local

### Precio Absoluto en Variantes (2026-05-25)
- [x] Migración SQL `migracion-variante-precio-propio.sql` — ADD COLUMN `precio` + migración datos
- [x] Backend: schema `precio` reemplaza `precio_adicional`, generate usa `precio_default`
- [x] Backend checkout: calcula `precio_total` desde `v.precio` o fallback a `prod["precio"]`
- [x] Frontend: ProductDetail `precioActual` usa `v.precio ?? p.precio`, 0 si hay variantes sin seleccionar
- [x] Frontend: ProductCard muestra "Desde $X" con `min_precio_variante` si tiene variantes
- [x] Frontend: Admin ProductoForm precio opcional + hint "solo aplica sin variantes"

### Infraestructura — Entornos
- [x] environment.prod.ts con Supabase producción y anon key real
- [x] environment.qa.ts con apiUrl de QA
- [x] WhatsApp number corregido en todos los entornos (525522988741)
- [x] Config backend (config.py + .env.example) actualizado a VYRO

### Backend (FastAPI)
- [x] Servicio de email con SendGrid (services/email.py): 3 templates HTML (orden creada, cambio estado, cancelación)
- [x] Email en checkout.py: notificación al crear orden COD
- [x] Email en admin_ordenes.py: notificación al cambiar estado de orden
- [x] Email en mis_ordenes.py: notificación al cancelar orden
- [x] CRUD completo productos (GET list con paginación, búsqueda, filtro categoría, sort; GET by id, POST, PUT, DELETE)
- [x] CRUD completo categorías (GET, POST, PUT, DELETE)
- [x] CRUD completo puntos-entrega (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo tallas (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo colores (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo carrito (GET/POST/PUT/DELETE autenticado)
- [x] Variantes auto-resuelve talla_id/color_id desde texto
- [x] Variantes: corregir crash maybe_single() → execute() en _resolver_talla_id/_resolver_color_id
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

### Sección Nueva — Perfumes por Encargo
- [x] **N.1** Agregar columna `es_encargo` y `dias_entrega` a `productos` + database.sql
- [x] **N.2** Backend: filtro `por_encargo` en GET /api/productos + schemas actualizados
- [x] **N.3** Home: nueva sección "Perfumes por Encargo" con grid/carrusel
- [x] **N.4** ProductCard: variante visual para productos por encargo (badge, WhatsApp CTA)
- [x] **N.5** ProductDetail: layout alternativo sin stock ni carrito, solo WhatsApp + info
- [x] **N.6** Admin ProductoForm: toggle "es encargo" + campo días entrega
- [ ] **Pendiente:** Aplicar migración en Supabase QA (ver migracion-perfumes-encargo.sql)
- [ ] **Pendiente:** Aplicar migración en Supabase PRD (ver migracion-perfumes-encargo.sql)

### Fase 3 — Validaciones Críticas (~1 semana)
- [ ] **3.1 Backend (7):** Race condition stock (UPDATE atómico), restaurar stock al cancelar, Idempotency-Key COD, transiciones DAG, stock≥0, precio>0, teléfono regex.
- [ ] **3.2 Frontend (6):** 401 Interceptor → redirect login + toast, refresh token Supabase, producto eliminado en carrito, stock agotado checkout, alert()→Toast, refresh precios al abrir carrito.

### Fase 4 — Estandarización Responsive + Accordion (~1 semana)
- [ ] **4.1** Mixins mobile-first (min-width), migrar cart.component.scss, reemplazar raw @media en 6 componentes.
- [ ] **4.2** Mis Pedidos: convertir detalles inline en accordion expandible por orden.

### Fase 5 — Funcionalidades Medias (~2-3 semanas)
- [ ] **5.1** Filtros combinados (rango precio, stock, sort server-side), productos relacionados, dashboard analíticas (Chart.js), carrito abandonado (email), notas del cliente.
- [x] **5.1g** Galería múltiple imágenes + imágenes por variante de color.

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
- `tallas` — id (SERIAL PK), nombre (UNIQUE), orden (INT), creado_en
- `colores` — id (SERIAL PK), nombre (UNIQUE), hex (VARCHAR), creado_en
- `variantes_producto` — id (SERIAL PK), producto_id (FK→productos CASCADE), nombre_variante (VARCHAR, renamed from talla), tipo_variante (VARCHAR, 'talla'|'volumen'|'color_solo'), color (VARCHAR), talla_id (FK→tallas), color_id (FK→colores), stock, precio (DECIMAL, nullable), imagen_url, creado_en (UNIQUE INDEX on producto_id + COALESCE(nombre_variante,'') + COALESCE(color,''))
- `opciones_ml` — id (SERIAL PK), categoria_id (FK→categorias), ml (INT), orden (INT), creado_en
- `opciones_ml` — id (SERIAL PK), categoria_id (FK→categorias), ml (INT), orden (INT), creado_en
- `ordenes` — id (SERIAL PK), user_id (UUID), user_email, total (DECIMAL), estado (orden_estado), punto_entrega_id (FK), telefono_contacto, fecha_entrega (DATE), hora_entrega (VARCHAR), stripe_session_id (nullable), creado_en, updated_at
- `detalles_orden` — id (SERIAL PK), orden_id (FK→ordenes CASCADE), producto_id (FK→productos SET NULL), variante_id (FK→variantes_producto SET NULL), cantidad (INT), precio_unitario (DECIMAL)
- `carrito` — id (SERIAL PK), user_id (UUID), producto_id (FK→productos CASCADE), variante_id (FK→variantes_producto CASCADE), cantidad (INT CHECK >0), created_at, updated_at
- `favoritos` — id (SERIAL PK), user_id (UUID), producto_id (FK→productos CASCADE), created_at (UNIQUE user_id+producto_id)
- `resenas` — id (SERIAL PK), producto_id (FK→productos CASCADE), user_id (UUID), puntuacion (INT 1-5), comentario (TEXT), anonima (BOOLEAN), created_at (UNIQUE producto_id+user_id)
- `cupones` — id (SERIAL PK), codigo (UNIQUE), tipo (porcentaje/fijo), valor, minimo_compra, usos_maximos, usos_actuales, fecha_expiracion, activo, producto_id (FK), categoria_id (FK)
- `precios_mayoreo` — id (SERIAL PK), producto_id (FK), categoria_id (FK), cantidad_minima (INT >=2), precio_unitario (DECIMAL) — validación: exactamente uno de producto_id/categoria_id
- `horarios_entrega` — id (SERIAL PK), dia_semana (INT 6 o 7), hora_inicio (TIME), hora_fin (TIME), activo (BOOLEAN), creado_en

**Secuencias:** Service_role tiene USAGE en todas las secuencias SERIAL.

**RLS:**
- perfiles: SELECT público (anon + authenticated)
- categorias: SELECT público (anon)
- productos: SELECT público (anon)
- tallas: SELECT público (anon)
- colores: SELECT público (anon)
- opciones_ml: SELECT público (anon)
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
