# TODO - VC'S Store

## 🔄 En Progreso
- [ ] Login combinado Google + Email (unificar la misma cuenta)

## ⏸️ Bloqueado / Suspendido
- **Stripe:** Código existente pero columnas incorrectas vs schema real. No priorizado.
- Despliegue en Netlify + Koyeb (pendiente de tener features core estables)

## ✅ Completado
### Infraestructura
- [x] Proyecto Supabase (PostgreSQL + Auth + Storage + RLS)
- [x] Schema DB: perfiles, categorias, productos, ordenes, detalles_orden
- [x] Trigger auto-creación de perfiles en auth.users
- [x] Admin forzado: marianovc251@gmail.com
- [x] Row Level Security configurado
- [x] Storage bucket `productos` con políticas de subida/lectura

### Frontend (Angular 18)
- [x] Arquitectura Standalone con Signals
- [x] Navbar con carrito, sesión y hamburger menu responsive
- [x] Home: grid de productos responsive
- [x] Product-detail: detalle responsive 1 columna en mobile
- [x] Cart: carrito responsive con stacking en mobile
- [x] WhatsApp: botón en carrito que abre wa.me con productos
- [x] Contra Entrega: botón en carrito que crea orden
- [x] Success: página dinámica (Stripe / COD)
- [x] Auth service con Signals
- [x] Login con Google OAuth
- [x] Login con correo y contraseña (email/password)
- [x] AuthGuard + AdminGuard
- [x] Admin Layout con sidebar + mobile drawer
- [x] Admin Productos: listar/editar/eliminar con tabla responsive → cards
- [x] Admin ProductoForm: crear/editar producto (reutilizable)
- [x] Admin Categorías: listar/crear/editar inline/eliminar
- [x] UploadImageComponent
- [x] Diseño mobile-first (breakpoints 767px y 500px)
- [x] Navbar hamburger menu con animación

### Backend (FastAPI)
- [x] CRUD completo productos: GET list, GET by id, POST, PUT, DELETE
- [x] CRUD completo categorías: GET, POST, PUT, DELETE
- [x] Endpoint checkout/cod
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
