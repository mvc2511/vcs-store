# 🗺️ Contexto de Arquitectura y Estado del Proyecto: VC'S Store

Fuente única de verdad sobre el estado técnico, arquitectónico y operativo del proyecto **VC'S Store** (E-Commerce MVP de prendas de ropa). Diseñado para contextualizar a agentes de IA y desarrolladores.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Hosting | Justificación |
|------|-----------|---------|---------------|
| **Frontend** | Angular 18 (Standalone, Signals, Lazyloading) | Netlify | Estructura robusta, estado reactivo con Signals, lazy loading nativo |
| **Backend** | Python 3.11+ / FastAPI (Docker) | Koyeb | Alto rendimiento asíncrono, validación Pydantic, autodocumentación Swagger |
| **BBDD & Auth** | PostgreSQL + Supabase Auth | Supabase | DB relacional, Auth listo, Storage para imágenes, RLS nativo |
| **Pagos** | ~~Stripe~~ (Suspendido) → WhatsApp + Contra Entrega | N/A | Modelo de negocio alternativo sin pasarela |

---

## 2. Filosofía de Diseño

- **Código limpio y mantenible:** Separación de conceptos, componentes atómicos.
- **Backend stateless:** FastAPI asíncrono, procesamiento multimedia delegado al cliente.
- **Seguridad en base de datos:** Row Level Security (RLS) como escudo perimetral, RBAC vía trigger en `auth.users`.
- **Mínimo Privilegio:** Tres roles segmentados — `anon` (lectura pública), `authenticated` (lectura propia), `service_role` (escritura backend).

---

## 3. Frontend (Angular 18)

- **Gestión de estado:** Signals en AuthService para propagar sesión y roles.
- **Rutas protegidas:** `AdminGuard` + `AuthGuard` (CanActivateFn) para zonas administrativas y checkout.
- **Lazy loading:** Todas las rutas cargan asíncronamente.
- **Upload de imágenes:** Procesamiento local con FileReader → spinner → subida a Storage → URL inyectada en formulario.
- **Consumo de APIs:** JWT de Supabase en header `Authorization: Bearer <token>`.

### Rutas actuales

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | HomeComponent | - |
| `/producto/:id` | ProductDetailComponent | - |
| `/cart` | CartComponent | - |
| `/success` | SuccessComponent | AuthGuard |
| `/admin/productos/nuevo` | NuevoProductoComponent | AdminGuard |
| `/admin/categorias` | CategoriasComponent | AdminGuard |

---

## 4. Backend (FastAPI)

- **Seguridad:** `verificar_admin()` decodifica JWT, consulta `perfiles.rol` con `service_role`, rechaza con 403 si no es admin.
- **Validación:** Esquemas Pydantic (`ProductoCreate`, `CODRequest`, etc.).
- **Persistencia:** Cliente Supabase con `service_role` para escritura aislada del frontend.
- **Endpoints activos:**
  - `POST /api/productos` — Crear producto (admin)
  - `GET /api/categorias` — Listar categorías
  - `POST /api/categorias` — Crear categoría (admin)
  - `DELETE /api/categorias/{id}` — Eliminar categoría (admin)
  - `POST /api/checkout/cod` — Crear orden contra entrega (autenticado)
  - `GET /` y `GET /health` — Health check

---

## 5. Base de Datos (Supabase/PostgreSQL)

Schema completo y re-ejecutable en `vcs-store-database/database.sql`.

### 5.1. Tablas

```sql
usuario_rol ENUM ('cliente', 'admin', 'moderador')

perfiles (
    id UUID PK → auth.users(id),
    email TEXT NOT NULL,
    rol usuario_rol DEFAULT 'cliente',
    created_at TIMESTAMPTZ DEFAULT NOW()
)

categorias (
    id SERIAL PK,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
)

productos (
    id SERIAL PK,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    stock INT DEFAULT 0,
    categoria_id INT → categorias(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
)

ordenes (
    id SERIAL PK,
    user_id UUID NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    stripe_session_id VARCHAR(255),  -- nullable, solo usado si se reactiva Stripe
    creado_en TIMESTAMPTZ DEFAULT NOW()
)

detalles_orden (
    id SERIAL PK,
    orden_id INT → ordenes(id) ON DELETE CASCADE,
    producto_id INT → productos(id) ON DELETE SET NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL
)
```

### 5.2. Automatización (Trigger)

```sql
on_auth_user_created AFTER INSERT ON auth.users
→ handle_new_user() crea perfil con rol 'cliente' (o 'admin' si metadata.rol = 'admin')
→ Admin forzado: marianovc251@gmail.com
```

### 5.3. Row Level Security (RLS)

| Tabla | Política | Rol |
|-------|---------|-----|
| `perfiles` | SELECT libre (necesario para AuthService) | anon, authenticated |
| `categorias` | SELECT libre | anon |
| `productos` | SELECT libre | anon |
| `ordenes` | SELECT solo propias (`auth.uid() = user_id`) | authenticated |
| `detalles_orden` | (Sin política explícita, protegida por RLS por defecto) | - |

### 5.4. Matriz de Privilegios

**service_role** (Backend FastAPI):
- SELECT en perfiles (verificar admin)
- SELECT, INSERT, DELETE en categorias + secuencia
- SELECT, INSERT en productos + secuencia
- SELECT, INSERT en ordenes + secuencia
- SELECT, INSERT en detalles_orden + secuencia

**anon** (Frontend - navegación pública):
- SELECT en categorias, productos, perfiles

**authenticated** (Frontend - sesión activa):
- SELECT en perfiles

### 5.5. Storage (Bucket `productos`)

- **INSERT:** Usuarios autenticados, solo en bucket `productos`
- **SELECT:** Público (CDN)

---

## 6. Flujo de Datos Actual

```
[Usuario / Angular (Netlify)]
      │
      ├── (Lectura de productos) ──────────────> Supabase DB / Storage
      │
      ├── (Autenticación) ─────────────────────> Supabase Auth
      │
      ├── (WhatsApp) ──────────────────────────> Cliente abre wa.me
      │
      └── (Contra Entrega) ────────────────────> FastAPI (Koyeb)
                                                       │
                                                       └── (Insertar orden) ──> Supabase DB
```

**Stripe queda suspendido** — el código existe en `checkout.py` y `webhooks.py` pero con columnas que no corresponden al schema actual. Si se reactiva, requiere corregir nombres de columnas.

---

## 7. Estado de Implementación

| Feature | Estado |
|---------|--------|
| Infraestructura Supabase (DB, Auth, Storage, RLS) | ✅ |
| Trigger auto-creación de perfiles | ✅ |
| Admin por defecto | ✅ |
| Catálogo público (grid + detalle) | ✅ |
| Carrito con Signals + localStorage | ✅ |
| Login con Google OAuth | ✅ |
| Guards de autenticación y admin | ✅ |
| CRUD de productos (admin) | ✅ |
| CRUD de categorías (admin) | ✅ |
| Upload de imágenes a Storage | ✅ |
| WhatsApp: generar pedido | ✅ |
| Contra Entrega: endpoint COD + UI | ✅ |
| Página de éxito dinámica | ✅ |
| Login con correo y contraseña | ❌ Pendiente |
| Login Google + Email combinado | ❌ Pendiente |
| Stripe (Checkout + Webhooks) | ❌ Suspendido |
| Panel admin de órdenes | ❌ Futuro |
| Despliegue (Netlify + Koyeb) | ❌ Futuro |
