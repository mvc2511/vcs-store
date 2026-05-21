# 🗺️ Contexto de Arquitectura y Estado del Proyecto: VC'S Store

Fuente única de verdad sobre el estado técnico, arquitectónico y operativo del proyecto **VC'S Store** (E-Commerce MVP de prendas de ropa). Diseñado para contextualizar a agentes de IA y desarrolladores.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Hosting | Justificación |
|------|-----------|---------|---------------|
| **Frontend** | Angular 18 (Standalone, Signals, Lazyloading) | Netlify | Estructura robusta, estado reactivo con Signals, lazy loading nativo |
| **Backend** | Python 3.11+ / FastAPI (Docker) | Render | Alto rendimiento asíncrono, validación Pydantic, autodocumentación Swagger |
| **BBDD & Auth** | PostgreSQL + Supabase Auth | Supabase | DB relacional, Auth listo, Storage para imágenes, RLS nativo |
| **Pagos** | ~~Stripe~~ (Suspendido permanentemente) → WhatsApp + Contra Entrega | N/A | Modelo de negocio definitivo sin pasarela |
| **Orquestación** | Docker Compose (dev + prod) | N/A | Un solo comando para backend + frontend |

---

## 2. Filosofía de Diseño

- **Código limpio y mantenible:** Separación de conceptos, componentes atómicos.
- **Backend stateless:** FastAPI asíncrono, procesamiento multimedia delegado al cliente.
- **Seguridad en base de datos:** Row Level Security (RLS) como escudo perimetral, RBAC vía trigger en `auth.users`.
- **Mínimo Privilegio:** Tres roles segmentados — `anon` (lectura pública), `authenticated` (lectura propia/escritura carrito), `service_role` (escritura backend).
- **Mobile-first:** Todos los componentes responsivos con breakpoints en 767px y 500px. Admin forms (variantes, opciones-ml) stack verticalmente en mobile.
- **Diseño homogéneo:** Mismo tema claro para clientes y admin.
- **Diseño visual:** Guiado por `VYRO-REDESIGN.md` (paleta monocromática + champagne, tipografía Space Grotesk + Inter, minimalismo urbano editorial).

---

## 3. Frontend (Angular 18)

- **Gestión de estado:** Signals en AuthService para propagar sesión y roles. Signals en CartService con modo híbrido (API si logueado, localStorage si no).
- **Carrito persistente:** Sincronizado con backend via `/api/carrito`. Merge modal al login si hay conflicto local vs servidor. Token de sesión se setea antes de señal isLoggedIn para evitar race condition. Timeout de polling aumentado a 3s.
- **Rutas protegidas:** `AdminGuard` + `AuthGuard` (CanActivateFn) para zonas administrativas y checkout.
- **Lazy loading:** Todas las rutas cargan asíncronamente.
- **Upload de imágenes:** Preview local con FileReader, subida a Storage diferida al submit del formulario (evita basura en bucket).
- **Consumo de APIs:** JWT de Supabase en header `Authorization: Bearer <token>`.
- **Responsive:** Navbar con hamburger menu en mobile (incluye búsqueda), tablas se convierten a cards, grids colapsan a 1 columna. Navbar desktop: sin barra de búsqueda (solo en home sticky), link "Mi Perfil" visible si logueado, avatar clickable a perfil.

### Rutas actuales

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | HomeComponent | - |
| `/producto/:id` | ProductDetailComponent | - |
| `/cart` | CartComponent (fecha/hora entrega) | - |
| `/login` | LoginComponent (soporta ?returnUrl) | - |
| `/mis-pedidos` | MisPedidosComponent (historial + cancelar + fecha/hora + barra progreso) | AuthGuard |
| `/success` | SuccessComponent (resumen completo con productos y entrega) | AuthGuard |
| `/perfil` | PerfilComponent (editar nombre, cambiar contraseña, avatar) | AuthGuard |
| `/admin` | AdminLayoutComponent → redirect a /admin/productos | AdminGuard |
| `/admin/productos` | AdminProductosComponent (lista con editar/eliminar) | AdminGuard |
| `/admin/productos/nuevo` | ProductoFormComponent (crear) | AdminGuard |
| `/admin/productos/:id/editar` | ProductoFormComponent (editar) | AdminGuard |
| `/admin/ordenes` | AdminOrdenesComponent (dashboard + estado + editar fecha/hora) | AdminGuard |
| `/admin/categorias` | CategoriasComponent (CRUD con edición inline) | AdminGuard |
| `/admin/puntos-entrega` | PuntosEntregaComponent (CRUD con edición inline) | AdminGuard |
| `/admin/tallas` | TallasComponent (CRUD con edición inline) | AdminGuard |
| `/admin/colores` | ColoresComponent (CRUD con edición inline) | AdminGuard |

---

## 4. Backend (FastAPI)

- **Seguridad:** `verificar_admin()` decodifica JWT, consulta `perfiles.rol` con `service_role`, rechaza con 403 si no es admin.
- **Validación:** Esquemas Pydantic (`ProductoCreate`, `CODRequest`, `CarritoAddItem`, etc.).
- **Persistencia:** Cliente Supabase con `service_role` para escritura aislada del frontend. El carrito usa `authenticated` + RLS para que el frontend pueda hacer CRUD directo.
- **Variantes:** Tabla `variantes_producto` con nombre_variante, tipo_variante, color, talla_id (FK→tallas), color_id (FK→colores), stock, precio_adicional. CRUD completo en `routes/variantes.py`. Auto-resuelve talla_id/color_id desde texto. Auto-detecta tipo_variante por categoría (volumen para Perfume/Decant). GET /api/productos/{id} incluye variantes. Carrito y checkout con soporte de variante_id.
- **Opciones de ml:** Tabla `opciones_ml` con FK a categorías, ml configurables desde admin CRUD. Reemplaza hardcode anterior de PERFUME_CAT_ID/DECANT_CAT_ID.
- **Email:** Servicio Resend (migrado desde SendGrid por bloqueo de cuenta Twilio) en `services/email.py` con 3 templates HTML inline (orden creada, cambio estado, cancelación). Integrado en checkout.py, admin_ordenes.py, mis_ordenes.py.
- **Estandarización:** Lookup tables `tallas` y `colores` con CRUD admin. Selectores en formularios de producto.
- **Endpoints activos:**
  - `GET /api/productos?search=&categoria_id=&sort_by=&sort_order=&limit=&offset=` — Listar productos paginados
  - `GET /api/productos/{id}` — Obtener producto por ID (incluye variantes)
  - `POST /api/productos` — Crear producto (admin)
  - `PUT /api/productos/{id}` — Actualizar producto (admin)
  - `DELETE /api/productos/{id}` — Eliminar producto (admin)
  - `GET /api/categorias` — Listar categorías
  - `POST /api/categorias` — Crear categoría (admin)
  - `PUT /api/categorias/{id}` — Actualizar categoría (admin)
  - `DELETE /api/categorias/{id}` — Eliminar categoría (admin)
  - `GET /api/puntos-entrega` — Listar puntos de entrega (público)
  - `POST /api/puntos-entrega` — Crear punto de entrega (admin)
  - `PUT /api/puntos-entrega/{id}` — Actualizar punto de entrega (admin)
  - `DELETE /api/puntos-entrega/{id}` — Eliminar punto de entrega (admin)
  - `GET /api/carrito` — Listar items del carrito (autenticado)
  - `POST /api/carrito` — Agregar/incrementar item (autenticado)
  - `PUT /api/carrito/{id}` — Cambiar cantidad (autenticado)
  - `DELETE /api/carrito/{id}` — Eliminar item (autenticado)
  - `DELETE /api/carrito` — Vaciar carrito (autenticado)
  - `POST /api/checkout/cod` — Crear orden COD (requiere punto_entrega_id + telefono_contacto + fecha_entrega/hora_entrega opcionales, valida y descuenta stock, guarda user_email)
  - `GET /api/admin/ordenes?estado=:filtro` — Listar órdenes (admin) con user_email, fecha_entrega, hora_entrega
  - `GET /api/admin/ordenes/{id}` — Detalle de orden (admin)
  - `PUT /api/admin/ordenes/{id}/estado` — Cambiar estado de orden (admin)
  - `PUT /api/admin/ordenes/{id}` — Editar fecha/hora entrega (admin)
  - `GET /api/mis-ordenes` — Órdenes del usuario autenticado
  - `PUT /api/mis-ordenes/{id}/cancelar` — Cancelar orden si pendiente
  - `GET /api/variantes/producto/{id}` — Listar variantes (público)
  - `POST /api/variantes` — Crear variante (admin)
  - `PUT /api/variantes/{id}` — Actualizar variante (admin)
  - `DELETE /api/variantes/{id}` — Eliminar variante (admin)
  - `POST /api/variantes/generate` — Generar combinaciones talla×color (admin)
  - `GET /api/tallas` — Listar tallas (público, ordenado por `orden`)
  - `POST /api/tallas` — Crear talla (admin)
  - `PUT /api/tallas/{id}` — Actualizar talla (admin)
  - `DELETE /api/tallas/{id}` — Eliminar talla (admin)
  - `GET /api/colores` — Listar colores (público)
  - `POST /api/colores` — Crear color (admin)
  - `PUT /api/colores/{id}` — Actualizar color (admin)
  - `DELETE /api/colores/{id}` — Eliminar color (admin)
  - `GET /api/opciones-ml?categoria_id=:id` — Listar opciones de ml (público, con filtro opcional)
  - `GET /api/opciones-ml/{categoria_id}` — Opciones de ml por categoría (público)
  - `POST /api/opciones-ml` — Crear opción de ml (admin)
  - `PUT /api/opciones-ml/{id}` — Actualizar opción de ml (admin)
  - `DELETE /api/opciones-ml/{id}` — Eliminar opción de ml (admin)
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

tallas (
    id SERIAL PK,
    nombre VARCHAR(20) UNIQUE NOT NULL,
    orden INT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW()
)

colores (
    id SERIAL PK,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    hex VARCHAR(7),
    creado_en TIMESTAMPTZ DEFAULT NOW()
)

variantes_producto (
    id SERIAL PK,
    producto_id INT → productos(id) ON DELETE CASCADE,
    nombre_variante VARCHAR(50),  -- Renamed from talla; stores "S", "50ml", etc.
    tipo_variante VARCHAR(20) DEFAULT 'talla',  -- 'talla', 'volumen', 'color_solo'
    color VARCHAR(50),
    talla_id INT → tallas(id) ON DELETE SET NULL,
    color_id INT → colores(id) ON DELETE SET NULL,
    stock INT DEFAULT 0,
    precio_adicional DECIMAL(10,2) DEFAULT 0,
    imagen_url TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE INDEX ON (producto_id, COALESCE(nombre_variante,''), COALESCE(color,''))
)

opciones_ml (
    id SERIAL PK,
    categoria_id INT → categorias(id) ON DELETE CASCADE,
    ml INT NOT NULL,
    orden INT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    INDEX ON (categoria_id)
)

ordenes (
    id SERIAL PK,
    user_id UUID NOT NULL,
    user_email VARCHAR(255),       -- email del usuario al crear la orden
    total DECIMAL(10,2) NOT NULL,
    estado orden_estado DEFAULT 'pendiente',
    punto_entrega_id INT → puntos_entrega(id) ON DELETE SET NULL,
    telefono_contacto VARCHAR(20),
    fecha_entrega DATE,            -- fecha seleccionada por el cliente
    hora_entrega VARCHAR(50),      -- franja horaria (ej: "Mañana 9:00-12:00")
    stripe_session_id VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)

detalles_orden (
    id SERIAL PK,
    orden_id INT → ordenes(id) ON DELETE CASCADE,
    producto_id INT → productos(id) ON DELETE SET NULL,
    variante_id INT → variantes_producto(id) ON DELETE SET NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL
)

carrito (
    id SERIAL PK,
    user_id UUID NOT NULL,
    producto_id INT → productos(id) ON DELETE CASCADE,
    variante_id INT → variantes_producto(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
| `variantes_producto` | SELECT libre | anon |
| `puntos_entrega` | SELECT libre | anon |
| `ordenes` | SELECT solo propias (`auth.uid() = user_id`) | authenticated |
| `ordenes` | SELECT todas (para service_role) | service_role |
| `detalles_orden` | (Sin política explícita, protegida por RLS por defecto) | - |
| `carrito` | SELECT/INSERT/UPDATE/DELETE solo propias (`auth.uid() = user_id`) | authenticated |

### 6.4. Matriz de Privilegios

**service_role** (Backend FastAPI):
- SELECT en perfiles (verificar admin)
- SELECT, INSERT, DELETE en categorias + secuencia
- SELECT, INSERT, UPDATE en productos + secuencia
- SELECT, INSERT, UPDATE, DELETE en variantes_producto + secuencia
- SELECT, INSERT, UPDATE en ordenes + secuencia
- SELECT, INSERT en detalles_orden + secuencia
- SELECT, INSERT, UPDATE, DELETE en puntos_entrega + secuencia
- SELECT, INSERT, UPDATE, DELETE en carrito + secuencia

**anon** (Frontend - navegación pública):
- SELECT en categorias, productos, variantes_producto, perfiles, puntos_entrega

**authenticated** (Frontend - sesión activa):
- SELECT en perfiles, puntos_entrega, variantes_producto
- SELECT, INSERT, UPDATE, DELETE en carrito + secuencia

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
      ├── (Carrito - no logueado) ─────────────> localStorage
      │
      ├── (Carrito - logueado) ────────────────> FastAPI /api/carrito → Supabase DB
      │
      ├── (WhatsApp) ──────────────────────────> Cliente abre wa.me
      │
      ├── (Opciones ml dinámicas) ──────────────> FastAPI /api/opciones-ml → Supabase DB
      │
      └── (Contra Entrega / Admin CRUD) ───────> FastAPI (Render)
                                                       │
                                                       └── (CRUD) ──> Supabase DB
```

**Stripe queda suspendido permanentemente** — el código existe en `checkout.py` y `webhooks.py` pero con columnas que no corresponden al schema actual. WhatsApp + Contra Entrega es el modelo de pago definitivo, no hay planes de reactivarlo.

---

## 8. Estado de Implementación

| Feature | Estado |
|---------|--------|
| Infraestructura Supabase (DB, Auth, Storage, RLS) | ✅ |
| Tabla puntos_entrega + seed 6 puntos | ✅ |
| Tablas tallas (7) + colores (15) + seed | ✅ |
| Tabla carrito con RLS | ✅ |
| Columnas user_email, fecha_entrega, hora_entrega en ordenes | ✅ |
| ENUM orden_estado (6 estados) | ✅ |
| Trigger auto-creación de perfiles | ✅ |
| Admin por defecto | ✅ |
| Catálogo público (grid + detalle + búsqueda) | ✅ |
| Carrito híbrido (API + localStorage) con Signals | ✅ |
| Cart merge modal (local vs servidor al login) | ✅ |
| Login con Google OAuth + Email/Password | ✅ |
| Login: returnUrl post-auth | ✅ |
| Perfil con avatar upload + cambiar contraseña | ✅ |
| Guards de autenticación y admin | ✅ |
| Admin CRUD productos (listar/crear/editar/eliminar) | ✅ |
| Admin CRUD categorías (listar/crear/editar/eliminar) | ✅ |
| Admin CRUD puntos de entrega (listar/crear/editar/eliminar) | ✅ |
| Admin Layout con sidebar + mobile drawer + nav completo | ✅ |
| Edición inline de categorías y puntos de entrega | ✅ |
| Confirmación modal al eliminar productos | ✅ |
| Upload de imágenes a Storage | ✅ |
| WhatsApp: generar pedido | ✅ |
| Contra Entrega: flujo completo (punto entrega + teléfono + fecha/hora + stock) | ✅ |
| Stock validation + decrement en COD | ✅ |
| Página de éxito dinámica con punto de entrega | ✅ |
| Navbar responsive con hamburger menu + desktop auth | ✅ |
| Diseño mobile-first (breakpoints 767px, 500px) | ✅ |
| Admin dashboard de órdenes (listar, filtrar, cambiar estado, editar fecha/hora) | ✅ |
| Admin órdenes: muestra user_email + fecha/hora entrega | ✅ |
| Historial de pedidos del cliente + cancelación + fecha/hora entrega | ✅ |
| Búsqueda de productos (client-side) | ✅ |
| Servicio de email Resend (services/email.py) — migrado desde SendGrid | ✅ |
| Email: notificación orden creada en checkout.py | ✅ |
| Email: notificación cambio estado en admin_ordenes.py | ✅ |
| Email: notificación cancelación en mis_ordenes.py | ✅ |
| Docker Compose (backend + frontend) | ✅ |
| Frontend multi-stage Dockerfile (node → nginx) | ✅ |
| Migraciones idempotentes (puntos-entrega, carrito-entrega) | ✅ |
| Login Google + Email combinado | ✅ |
| Stripe (Checkout + Webhooks) | ⛔ Suspendido permanentemente (WhatsApp + COD es modelo definitivo) |
| Despliegue (Netlify + Render) | ✅ Completado |
| Navbar search duplicado eliminado (solo queda sticky home search) | ✅ |
| Product-detail compacto (max-width 1000px, fuentes reducidas) | ✅ |
| Product-cards compactos (4/5 aspect, grid minmax 240px, padding reducido) | ✅ |
| Carrito DB persistente (race condition token corregida, timeout 3s) | ✅ |
| Rediseño Login VYRO (password strength, Google OAuth, alerts) | ✅ |
| Rediseño Mis Pedidos VYRO (progress tracker animado, badges) | ✅ |
| Rediseño Cart VYRO (editorial grid, payment methods hierarchy) | ✅ |
| Variantes de producto (tabla variantes_producto + CRUD backend) | ✅ |
| Variantes: selector en product-detail (talla pills + color pills) | ✅ |
| Variantes: carrito con clave compuesta (producto_id + variante_id) | ✅ |
| Variantes: checkout con variante_id (stock validation + precio) | ✅ |
| Variantes: admin inline editor (agregar, generar combinaciones) | ✅ |
| Toast Service + Container (4 tipos, SVG icons, slideIn animation) | ✅ |
| Animaciones globales (_animations.scss: fadeIn, slideUp, stagger, shimmer) | ✅ |
| Sistema de diseño VYRO (_variables, _typography, _components, _mixins) | ✅ |
| Search bar + chips layout fijo sticky en home | ✅ |
| Signup completo (nombre, confirmar contraseña, términos) | ✅ |
| Columna `nombre` en perfiles + trigger actualizado | ✅ |
| Navbar: link Mi Perfil + avatar clickable | ✅ |
| Subida de imagen diferida al submit (UploadImage) | ✅ |
| Ordenar productos por precio (menor→mayor, mayor→menor) | ✅ |
| Diseño homogéneo claro (admin y clientes mismo tema light) | ✅ |
| Admin edición inline categorías/puntos de entrega | ✅ |
| Admin confirmación modal al eliminar productos | ✅ |
| WhatsApp botón generador de mensaje en carrito | ✅ |
| Renombrar talla → nombre_variante (DB + backend + frontend) | ✅ |
| Agregar tipo_variante ('talla'|'volumen'|'color_solo') | ✅ |
| Tabla opciones_ml con CRUD admin | ✅ |
| API dinámica de ml options (no hardcode) | ✅ |
| Auto-detección tipo_variante por categoría | ✅ |
| Admin CRUD opciones-ml (nuevo componente) | ✅ |
| Variant form mobile-first responsive | ✅ |
