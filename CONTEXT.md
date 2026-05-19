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
| **Orquestación** | Docker Compose (dev + prod) | N/A | Un solo comando para backend + frontend |

---

## 2. Filosofía de Diseño

- **Código limpio y mantenible:** Separación de conceptos, componentes atómicos.
- **Backend stateless:** FastAPI asíncrono, procesamiento multimedia delegado al cliente.
- **Seguridad en base de datos:** Row Level Security (RLS) como escudo perimetral, RBAC vía trigger en `auth.users`.
- **Mínimo Privilegio:** Tres roles segmentados — `anon` (lectura pública), `authenticated` (lectura propia), `service_role` (escritura backend).
- **Mobile-first:** Todos los componentes responsivos con breakpoints en 767px y 500px.
- **Diseño homogéneo:** Mismo tema claro para clientes y admin.

---

## 3. Frontend (Angular 18)

- **Gestión de estado:** Signals en AuthService para propagar sesión y roles.
- **Rutas protegidas:** `AdminGuard` + `AuthGuard` (CanActivateFn) para zonas administrativas y checkout.
- **Lazy loading:** Todas las rutas cargan asíncronamente.
- **Upload de imágenes:** Procesamiento local con FileReader → spinner → subida a Storage → URL inyectada en formulario.
- **Consumo de APIs:** JWT de Supabase en header `Authorization: Bearer <token>`.
- **Responsive:** Navbar con hamburger menu en mobile, tablas se convierten a cards, grids colapsan a 1 columna.

### Rutas actuales

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | HomeComponent | - |
| `/producto/:id` | ProductDetailComponent | - |
| `/cart` | CartComponent | - |
| `/login` | LoginComponent (soporta ?returnUrl) | - |
| `/mis-pedidos` | MisPedidosComponent (historial + cancelar) | AuthGuard |
| `/success` | SuccessComponent | AuthGuard |
| `/admin` | AdminLayoutComponent → redirect a /admin/productos | AdminGuard |
| `/admin/productos` | AdminProductosComponent (lista con editar/eliminar) | AdminGuard |
| `/admin/productos/nuevo` | ProductoFormComponent (crear) | AdminGuard |
| `/admin/productos/:id/editar` | ProductoFormComponent (editar) | AdminGuard |
| `/admin/ordenes` | AdminOrdenesComponent (dashboard + estado) | AdminGuard |
| `/admin/categorias` | CategoriasComponent (CRUD con edición inline) | AdminGuard |

---

## 4. Backend (FastAPI)

- **Seguridad:** `verificar_admin()` decodifica JWT, consulta `perfiles.rol` con `service_role`, rechaza con 403 si no es admin.
- **Validación:** Esquemas Pydantic (`ProductoCreate`, `ProductoUpdate`, `CODRequest`, etc.).
- **Persistencia:** Cliente Supabase con `service_role` para escritura aislada del frontend.
- **Endpoints activos:**
  - `GET /api/productos?search=:query` — Listar productos (búsqueda por nombre)
  - `GET /api/productos/{id}` — Obtener producto por ID
  - `POST /api/productos` — Crear producto (admin)
  - `PUT /api/productos/{id}` — Actualizar producto (admin)
  - `DELETE /api/productos/{id}` — Eliminar producto (admin)
  - `GET /api/categorias` — Listar categorías
  - `POST /api/categorias` — Crear categoría (admin)
  - `PUT /api/categorias/{id}` — Actualizar categoría (admin)
  - `DELETE /api/categorias/{id}` — Eliminar categoría (admin)
  - `GET /api/puntos-entrega` — Listar puntos de entrega (público)
  - `POST /api/checkout/cod` — Crear orden COD (requiere punto_entrega_id + telefono_contacto, valida y descuenta stock)
  - `GET /api/admin/ordenes?estado=:filtro` — Listar órdenes (admin)
  - `GET /api/admin/ordenes/{id}` — Detalle de orden (admin)
  - `PUT /api/admin/ordenes/{id}/estado` — Cambiar estado de orden (admin)
  - `GET /api/mis-ordenes` — Órdenes del usuario autenticado
  - `PUT /api/mis-ordenes/{id}/cancelar` — Cancelar orden si pendiente
  - `GET /` y `GET /health` — Health check

---

## 5. Docker Compose

Orquestación definida en `docker-compose.yml` (raíz del proyecto).

### Servicios

| Servicio | Dockerfile | Puerto | Descripción |
|----------|-----------|--------|-------------|
| `backend` | `vcs-store-backend/Dockerfile` | `8000:8000` | FastAPI con uvicorn |
| `frontend` | `vcs-store-frontend/Dockerfile` | `4200:80` | Angular build → nginx |

### Override (desarrollo)

`docker-compose.override.yml` agrega automáticamente:
- `command: --reload` para hot reload en backend
- `volumes: ./vcs-store-backend:/app` para reflejar cambios al instante

### Comandos principales

```bash
docker compose up -d            # Levantar todo
docker compose up -d --build    # Reconstruir y levantar
docker compose up -d backend    # Solo backend (hot reload)
docker compose down             # Bajar todo
docker compose logs -f          # Logs en tiempo real
```

Ver `DOCKER-COMPOSE.md` para guía completa.

---

## 6. Base de Datos (Supabase/PostgreSQL)

Schema completo y re-ejecutable en `vcs-store-database/database.sql`.

### 6.1. Tablas

```sql
usuario_rol ENUM ('cliente', 'admin', 'moderador')
orden_estado ENUM ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')

perfiles (
    id UUID PK → auth.users(id),
    email TEXT NOT NULL,
    rol usuario_rol DEFAULT 'cliente',
    created_at TIMESTAMPTZ DEFAULT NOW()
)

puntos_entrega (
    id SERIAL PK,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
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
    estado orden_estado DEFAULT 'pendiente',
    punto_entrega_id INT → puntos_entrega(id) ON DELETE SET NULL,
    telefono_contacto VARCHAR(20),
    stripe_session_id VARCHAR(255),  -- nullable, solo usado si se reactiva Stripe
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)

detalles_orden (
    id SERIAL PK,
    orden_id INT → ordenes(id) ON DELETE CASCADE,
    producto_id INT → productos(id) ON DELETE SET NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL
)
```

### 6.2. Automatización (Trigger)

```sql
on_auth_user_created AFTER INSERT ON auth.users
→ handle_new_user() crea perfil con rol 'cliente' (o 'admin' si metadata.rol = 'admin')
→ Admin forzado: marianovc251@gmail.com
```

### 6.3. Row Level Security (RLS)

| Tabla | Política | Rol |
|-------|---------|-----|
| `perfiles` | SELECT libre (necesario para AuthService) | anon, authenticated |
| `categorias` | SELECT libre | anon |
| `productos` | SELECT libre | anon |
| `puntos_entrega` | SELECT libre | anon |
| `ordenes` | SELECT solo propias (`auth.uid() = user_id`) | authenticated |
| `ordenes` | SELECT todas (para service_role) | service_role |
| `detalles_orden` | (Sin política explícita, protegida por RLS por defecto) | - |

### 6.4. Matriz de Privilegios

**service_role** (Backend FastAPI):
- SELECT en perfiles (verificar admin)
- SELECT, INSERT, DELETE en categorias + secuencia
- SELECT, INSERT, UPDATE en productos + secuencia
- SELECT, INSERT, UPDATE en ordenes + secuencia
- SELECT, INSERT en detalles_orden + secuencia
- SELECT en puntos_entrega + secuencia

**anon** (Frontend - navegación pública):
- SELECT en categorias, productos, perfiles, puntos_entrega

**authenticated** (Frontend - sesión activa):
- SELECT en perfiles, puntos_entrega

### 6.5. Storage (Bucket `productos`)

- **INSERT:** Usuarios autenticados, solo en bucket `productos`
- **SELECT:** Público (CDN)

---

## 7. Flujo de Datos Actual

```
[Usuario / Angular (Netlify)]
      │
      ├── (Lectura de productos) ──────────────> Supabase DB / Storage
      │
      ├── (Autenticación) ─────────────────────> Supabase Auth
      │
      ├── (WhatsApp) ──────────────────────────> Cliente abre wa.me
      │
      └── (Contra Entrega / Admin CRUD) ───────> FastAPI (Koyeb)
                                                       │
                                                       └── (CRUD) ──> Supabase DB
```

**Stripe queda suspendido** — el código existe en `checkout.py` y `webhooks.py` pero con columnas que no corresponden al schema actual. Si se reactiva, requiere corregir nombres de columnas.

---

## 8. Estado de Implementación

| Feature | Estado |
|---------|--------|
| Infraestructura Supabase (DB, Auth, Storage, RLS) | ✅ |
| Tabla puntos_entrega + seed 6 puntos | ✅ |
| ENUM orden_estado (6 estados) | ✅ |
| Trigger auto-creación de perfiles | ✅ |
| Admin por defecto | ✅ |
| Catálogo público (grid + detalle + búsqueda) | ✅ |
| Carrito con Signals + localStorage | ✅ |
| Login con Google OAuth | ✅ |
| Login con correo y contraseña | ✅ |
| Login: returnUrl post-auth | ✅ |
| Guards de autenticación y admin | ✅ |
| Admin CRUD productos (listar/crear/editar/eliminar) | ✅ |
| Admin CRUD categorías (listar/crear/editar/eliminar) | ✅ |
| Admin Layout con sidebar + mobile drawer | ✅ |
| Edición inline de categorías | ✅ |
| Confirmación modal al eliminar productos | ✅ |
| Upload de imágenes a Storage | ✅ |
| WhatsApp: generar pedido | ✅ |
| Contra Entrega: flujo completo (punto entrega + teléfono + stock) | ✅ |
| Stock validation + decrement en COD | ✅ |
| Página de éxito dinámica con punto de entrega | ✅ |
| Navbar responsive con hamburger menu + desktop auth | ✅ |
| Diseño mobile-first (breakpoints 767px, 500px) | ✅ |
| Admin dashboard de órdenes (listar, filtrar, cambiar estado) | ✅ |
| Historial de pedidos del cliente + cancelación | ✅ |
| Búsqueda de productos (client-side) | ✅ |
| Docker Compose (backend + frontend) | ✅ |
| Frontend multi-stage Dockerfile (node → nginx) | ✅ |
| Login Google + Email combinado | ❌ Pendiente |
| Stripe (Checkout + Webhooks) | ❌ Suspendido |
| Despliegue (Netlify + Koyeb) | ❌ Futuro |
