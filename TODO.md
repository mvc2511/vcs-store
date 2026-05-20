# TODO - VC'S Store

## 🔄 Pendiente — Plan de Implementación por Fases

### Fase 1 — MVP Production (~2 semanas)
- [x] **1.1 Notificaciones Email** — SendGrid backend service + integración en checkout, admin, mis_ordenes
- [ ] **1.2 Variantes de Producto (Talla, Color)** — Nueva tabla variantes_producto, UI en product-detail, carrito, checkout
- [ ] **1.3 Paginación Catálogo** — Backend LIMIT/OFFSET, reemplazar filtrado client-side
- [ ] **1.4 Stock Agotado Visual** — Badge, botón disabled, warning en carrito

### Fase 2 — Experiencia Cliente (~2 semanas)
- [ ] **2.1 Reseñas y Valoraciones** — Tabla resenas, CRUD backend, frontend estrellas (solo compradores)
- [ ] **2.2 Wishlist / Favoritos** — Tabla favoritos, corazón en cards/detalle, página /favoritos
- [ ] **2.3 Cupones / Descuentos** — Tabla cupones, validación backend, input en carrito, CRUD admin
- [ ] **2.4 Alertas Stock Bajo (Admin)** — Endpoint backend, tarjeta dashboard admin, badge

### Fase 3 — Validaciones Críticas (~1 semana)
- [ ] **3.1 Backend:** race condition stock, restaurar stock al cancelar, Idempotency-Key COD, transiciones DAG, stock≥0, precio>0, teléfono regex
- [ ] **3.2 Frontend:** 401 Interceptor, refresh token Supabase, producto eliminado en carrito, stock agotado checkout, alert()→Toast, refresh precios

### Fase 4 — Estandarización Responsive + Accordion (~1 semana)
- [ ] **4.1** Mixins mobile-first (min-width), migrar cart.component.scss, reemplazar raw @media en 6 componentes
- [ ] **4.2** Mis Pedidos: convertir detalles inline en accordion expandible por orden

### Fase 5 — Funcionalidades Medias (~2-3 semanas)
- [ ] **5.1** Filtros combinados, productos relacionados, dashboard analíticas (Chart.js), carrito abandonado (email), notas del cliente, galería múltiple imágenes

### Fase 6 — Mejoras Bajas (~1-2 semanas)
- [ ] **6.1** Términos/Privacidad, multi-idioma (i18n), blog, comparación productos, compartir en redes

## ✅ Completado

### Infraestructura y Base de Datos
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema completo re-ejecutable en database.sql
- [x] Tablas: perfiles, categorias, productos, ordenes, detalles_orden, puntos_entrega, carrito
- [x] Tabla carrito persistente con RLS (cada usuario ve/edita su propio carrito)
- [x] Columnas user_email, fecha_entrega, hora_entrega en ordenes
- [x] ENUM orden_estado (pendiente, confirmado, preparando, enviado, entregado, cancelado)
- [x] Trigger auto-creación de perfiles en auth.users
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
- [x] Login con Google OAuth + Email/Password + returnUrl post-auth
- [x] Login combinado Google + Email (intercambio entre sesiones)
- [x] Rediseño Login VYRO: password strength, Google OAuth, alerts, responsive
- [x] Signup completo: nombre, confirmar contraseña, términos y condiciones
- [x] Columna nombre en perfiles + trigger handle_new_user actualizado
- [x] Página /perfil: editar nombre, cambiar contraseña, email readonly, avatar upload

### Frontend — Carrito y Checkout
- [x] CartService híbrido: API cuando logueado, localStorage cuando no
- [x] Cart merge modal: al login pregunta usuario si conservar servidor/local/fusionar
- [x] Carrito DB persistente: race condition corregida (sessionToken antes que isLoggedIn)
- [x] Carrito responsive: login gate, selector punto entrega, input teléfono, selector fecha/hora entrega
- [x] WhatsApp: botón en carrito que genera mensaje con productos
- [x] Contra Entrega: flujo completo (punto entrega + teléfono + fecha/hora + stock validation + decrement + user_email)
- [x] Success page con resumen completo (productos, total, punto entrega, fecha/hora)
- [x] Subida de imagen diferida al submit (UploadImage en ProductoForm)

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
- [x] Email integrado en checkout.py (notificar al crear orden COD)
- [x] Email integrado en admin_ordenes.py (notificar al cambiar estado)
- [x] Email integrado en mis_ordenes.py (notificar al cancelar orden)
- [x] CRUD completo productos (GET list con search, GET by id, POST, PUT, DELETE)
- [x] CRUD completo categorías (GET, POST, PUT, DELETE)
- [x] CRUD completo puntos-entrega (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo carrito (GET/POST/PUT/DELETE autenticado)
- [x] POST /api/checkout/cod (crear orden COD con punto entrega + teléfono + fecha/hora + stock validation + user_email)
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

### Documentación
- [x] CONTEXT.md — arquitectura general actualizada
- [x] AGENTS.md — estado para agentes de IA
- [x] TODO.md — tracking de tareas
- [x] database.sql — schema limpio y re-ejecutable
- [x] VYRO-REDESIGN.md — guía de diseño visual (paleta, tipografía, principios)
