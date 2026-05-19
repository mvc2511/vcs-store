# TODO - VC'S Store

## 🔄 En Progreso
- [ ] Login combinado Google + Email (unificar la misma cuenta)

## ⏸️ Bloqueado / Suspendido
- **Stripe:** Código existente pero columnas incorrectas vs schema real. No priorizado.
- Despliegue en Netlify + Koyeb (pendiente de tener features core estables)

## ✅ Completado
### Infraestructura
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema DB: perfiles, categorias, productos, ordenes, detalles_orden, puntos_entrega
- [x] Tabla `puntos_entrega` con 6 puntos de entrega (seed)
- [x] Columna `punto_entrega_id` y `telefono_contacto` en ordenes
- [x] ENUM `orden_estado` (pendiente, confirmado, preparando, enviado, entregado, cancelado)
- [x] Trigger auto-creación de perfiles en auth.users
- [x] Admin forzado: marianovc251@gmail.com
- [x] Row Level Security configurado (incl. admin access a ordenes)
- [x] Storage bucket `productos` con políticas de subida/lectura
- [x] Service_role: UPDATE en productos (stock) y ordenes

### Frontend (Angular 18)
- [x] Arquitectura Standalone con Signals
- [x] Navbar con carrito, sesión, hamburger menu + desktop auth section
- [x] Navbar: "Mis Pedidos" link para usuarios logueados
- [x] Home: grid de productos responsive + búsqueda por nombre/descripcion
- [x] Product-detail: detalle responsive 1 columna en mobile
- [x] Cart: carrito responsive con login gate + selector punto entrega + teléfono
- [x] Cart: COD button deshabilitado hasta seleccionar punto + teléfono
- [x] WhatsApp: botón en carrito que abre wa.me con productos
- [x] Contra Entrega: flujo completo con punto de entrega y teléfono
- [x] Success: muestra punto de entrega en COD
- [x] Auth service con Signals
- [x] Login con Google OAuth + Email/Password
- [x] Login: redirect a returnUrl después de login
- [x] AuthGuard + AdminGuard
- [x] Admin Layout con sidebar + mobile drawer + nav Órdenes
- [x] Admin Productos: listar/editar/eliminar con tabla responsive → cards
- [x] Admin ProductoForm: crear/editar producto (reutilizable)
- [x] Admin Categorías: listar/crear/editar inline/eliminar
- [x] Admin Órdenes: dashboard con lista, filtro por estado, cambio de estado
- [x] Mis Pedidos: historial del cliente con cancelación
- [x] UploadImageComponent
- [x] Diseño mobile-first (breakpoints 767px y 500px)
- [x] Navbar hamburger menu con animación

### Backend (FastAPI)
- [x] CRUD completo productos: GET list (con search), GET by id, POST, PUT, DELETE
- [x] CRUD completo categorías: GET, POST, PUT, DELETE
- [x] GET /api/puntos-entrega — lista pública de puntos de entrega
- [x] POST /api/checkout/cod — crear orden con punto entrega + teléfono + stock validation + decrement
- [x] GET /api/admin/ordenes — listar órdenes (admin) con filtro por estado
- [x] GET /api/admin/ordenes/{id} — detalle de orden (admin)
- [x] PUT /api/admin/ordenes/{id}/estado — cambiar estado (admin)
- [x] GET /api/mis-ordenes — órdenes del usuario autenticado
- [x] PUT /api/mis-ordenes/{id}/cancelar — cancelar si pendiente
- [x] Seguridad: verificar_admin + verificar_usuario_google
- [x] Validación Pydantic
- [x] Cliente Supabase (anon + admin)

### Docker
- [x] docker-compose.yml: backend + frontend orquestados
- [x] docker-compose.override.yml: hot reload para desarrollo
- [x] Frontend multi-stage Dockerfile (node build → nginx serve)
- [x] nginx.conf con SPA fallback
- [x] .dockerignore para frontend y backend
- [x] DOCKER-COMPOSE.md: guía completa con explicaciones

### Documentación
- [x] CONTEXT.md — arquitectura general actualizada
- [x] AGENTS.md — estado para agentes de IA
- [x] TODO.md — tracking de tareas
- [x] database.sql — schema limpio y re-ejecutable
