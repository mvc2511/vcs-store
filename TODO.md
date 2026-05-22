# TODO - VC'S Store

## 🔄 Pendiente — Plan de Implementación por Fases

### Fase 1.5 — Mejoras Modelo de Datos Variantes ✅ COMPLETADA
- [x] **1.5.1** Renombrar `talla` → `nombre_variante` en variantes_producto, backend y frontend
- [x] **1.5.2** Agregar `tipo_variante` ('talla'|'volumen'|'color_solo') para semántica clara
- [x] **1.5.3** Crear tabla `opciones_ml` con FK a categorías + CRUD admin (backend + frontend)
- [x] **1.5.4** Eliminar hardcode de ml en frontend (antes: PERFUME_CAT_ID=5, DECANT_CAT_ID=6 hardcoded)
- [x] **1.5.5** API dinámica: ml options se cargan desde GET /api/opciones-ml?categoria_id=X
- [x] **1.5.6** Auto-detección tipo_variante: backend detecta Perfume/Decant por categoría
- [x] **1.5.7** Corregir crash maybe_single() en _resolver_talla_id/_resolver_color_id (variantes 500)

### Fase 1 — MVP Production ✅ COMPLETADA
- [x] **1.1 Notificaciones Email** — SendGrid backend service + integración en checkout, admin, mis_ordenes
- [x] **1.2 Variantes de Producto (Talla, Color)** — Variantes_producto table, CRUD backend, selector product-detail, carrito con variante_id, checkout con variante_id, admin inline editor
- [x] **1.2 Extra: Estandarización Tallas/Colores** — Lookup tables `tallas` y `colores` con valores predefinidos, FK desde variantes_producto, CRUD admin, selectores en formulario
- [x] **1.2 Extra: Corrección doble stock** — Stock de producto readonly cuando hay variantes; checkout solo decrementa variante.stock si variante_id existe
- [x] **1.2 Extra: Modelo de datos mejorado** — Renombrar talla→nombre_variante, tipo_variante, tabla opciones_ml, api dinámica, auto-detección por categoría
- [x] **1.3 Paginación Catálogo** — Backend con LIMIT/OFFSET + sort + filtro por categoría, frontend con ProductService, "Ver más" button
- [x] **1.4 Stock Agotado Visual** — Badge "Agotado" en pills de variantes sin stock (ProductDetail), badge en items de carrito, botones checkout deshabilitados con advertencia

### Fase 2 — Experiencia Cliente ✅ COMPLETADA
- [x] **2.1 Reseñas y Valoraciones** — Tabla `resenas`, CRUD backend con verificación de compra, estrellas frontend, soporte anónimo, sección en product-detail
- [x] **2.2 Wishlist / Favoritos** — Tabla `favoritos`, solo DB (sin localStorage), WishlistService con Signals, corazón en cards/detalle, página `/favoritos`, link navbar
- [x] **2.3 Cupones / Descuentos + Mayoreo** — Sistema dual: cupones con código (porcentaje/fijo, filtro producto/categoría) + precios por volumen (mayoreo). Input cupón en carrito, precios mayoreo automáticos. CRUD admin para ambos.
- [x] **2.4 Alertas Stock Bajo (Admin)** — Endpoint backend `GET /api/admin/stock-bajo?umbral=10`. Badge rojo sidebar admin con count. Actualización automática cada 60s.

### Infraestructura y Base de Datos
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema completo re-ejecutable en database.sql
- [x] Tablas: perfiles, categorias, productos, tallas, colores, ordenes, detalles_orden, puntos_entrega, variantes_producto, carrito
- [x] Tabla carrito persistente con RLS (cada usuario ve/edita su propio carrito)
- [x] Columnas user_email, fecha_entrega, hora_entrega en ordenes
- [x] ENUM orden_estado (pendiente, confirmado, preparando, enviado, entregado, cancelado)
- [x] Trigger auto-creación de perfiles en auth.users
- [x] Admin forzado: marianovc251@gmail.com
- [x] Row Level Security configurado (3 roles: anon, authenticated, service_role)
- [x] Storage bucket productos con políticas de subida/lectura
- [x] Migraciones idempotentes (puntos-entrega, carrito-entrega, variantes, tallas-colores)

### Frontend — Navegación y Layout
- [x] Arquitectura Standalone con Signals
- [x] Navbar responsive con hamburger menu animado + auth section desktop
- [x] Navbar: links Mis Pedidos + Mi Perfil para usuarios logueados
- [x] Navbar: avatar clickable a perfil
- [x] Navbar: search eliminado de desktop (solo sticky home search)
- [x] Home: grid de productos responsive + sticky bar (search + chips + sort) + paginación
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
- [x] Admin full CRUD: productos + categorías + puntos de entrega + tallas + colores
- [x] ProductoForm reutilizable para crear/editar según ruta :id
- [x] ProductoForm: selects de tallas/colores desde lookup tables, stock readonly cuando hay variantes
- [x] Edición inline de categorías, tallas, colores, puntos de entrega
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
- [x] Rediseño Cart VYRO (editorial grid, payment methods, summary sidebar, stock warnings)
- [x] Rediseño Login/Signup VYRO (password strength, Google OAuth, alerts)
- [x] Sistema de diseño VYRO completo: _variables.scss, _typography.scss, _components.scss, _mixins.scss, _animations.scss
- [x] SCSS consistente en todos los componentes con paleta VYRO
- [x] Toast Service + Container: Signal + Observable, 4 tipos, SVG icons, slideIn animation, responsive

### Backend (FastAPI)
- [x] Servicio de email con SendGrid (services/email.py): 3 templates HTML (orden creada, cambio estado, cancelación)
- [x] Email integrado en checkout.py (notificar al crear orden COD)
- [x] Email integrado en admin_ordenes.py (notificar al cambiar estado)
- [x] Email integrado en mis_ordenes.py (notificar al cancelar orden)
- [x] CRUD completo productos (GET list con paginación, búsqueda, filtro categoría, sort; GET by id, POST, PUT, DELETE)
- [x] CRUD completo categorías (GET, POST, PUT, DELETE)
- [x] CRUD completo tallas (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo colores (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo puntos-entrega (GET público, POST/PUT/DELETE admin)
- [x] CRUD completo carrito (GET/POST/PUT/DELETE autenticado)
- [x] Variantes: auto-resuelve talla_id/color_id desde texto
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
- [x] database.sql — schema limpio y re-ejecutable (incluye tallas y colores)
- [x] VYRO-REDESIGN.md — guía de diseño visual (paleta, tipografía, principios)
