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
- [x] Navbar con carrito y sesión
- [x] Home: grid de productos
- [x] Product-detail: detalle con imagen y descripción
- [x] Cart: carrito con Signals + localStorage
- [x] WhatsApp: botón en carrito que abre wa.me con productos
- [x] Contra Entrega: botón en carrito que crea orden
- [x] Success: página dinámica (Stripe / COD)
- [x] Auth service con Signals
- [x] Login con Google OAuth
- [x] Login con correo y contraseña (email/password)
- [x] AuthGuard + AdminGuard
- [x] NuevoProductoComponent (formulario con upload)
- [x] CategoriasComponent (listar, crear, eliminar)
- [x] UploadImageComponent

### Backend (FastAPI)
- [x] Endpoints: productos, categorias, checkout/cod
- [x] Seguridad: verificar_admin + verificar_usuario_google
- [x] Validación Pydantic
- [x] Cliente Supabase (anon + admin)

### Documentación
- [x] CONTEXT.md — arquitectura general actualizada
- [x] AGENT.md — estado para agentes de IA
- [x] TODO.md — tracking de tareas
- [x] database.sql — schema limpio y re-ejecutable
