-- =============================================================================
-- PROYECTO: VC'S Store (E-Commerce MVP)
-- PROPÓSITO: Inicialización completa de esquema, seguridad, automatizaciones y datos
-- MOTOR: PostgreSQL (Supabase)
-- =============================================================================

-- =============================================================================
-- 1. LIMPIEZA DE ENTORNO (Script 100% re-ejecutable)
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Permitir lectura publica de puntos de entrega" ON public.puntos_entrega;
DROP POLICY IF EXISTS "Permitir lectura publica de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir lectura publica de productos" ON public.productos;
DROP POLICY IF EXISTS "Usuarios pueden ver solo sus propias ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Admins pueden ver todas las ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio carrito" ON public.carrito;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio carrito" ON public.carrito;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio carrito" ON public.carrito;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio carrito" ON public.carrito;

DROP POLICY IF EXISTS "Subir imagenes a productos" ON storage.objects;
DROP POLICY IF EXISTS "Leer imagenes de productos" ON storage.objects;

DROP TABLE IF EXISTS public.variantes_producto CASCADE;
DROP TABLE IF EXISTS public.detalles_orden;
DROP TABLE IF EXISTS public.ordenes;
DROP TABLE IF EXISTS public.carrito;
DROP TABLE IF EXISTS public.puntos_entrega;
DROP TABLE IF EXISTS public.carrito;
DROP TABLE IF EXISTS public.productos;
DROP TABLE IF EXISTS public.categorias;
DROP TABLE IF EXISTS public.perfiles;

DROP TYPE IF EXISTS usuario_rol;
DROP TYPE IF EXISTS orden_estado;

-- =============================================================================
-- 2. TIPOS PERSONALIZADOS (Enums)
-- =============================================================================
CREATE TYPE usuario_rol AS ENUM ('cliente', 'admin', 'moderador');
CREATE TYPE orden_estado AS ENUM ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado');

-- =============================================================================
-- 3. TABLAS DEL SISTEMA
-- =============================================================================

-- perfiles: Extensión de auth.users para RBAC corporativo
CREATE TABLE public.perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    nombre TEXT,
    rol usuario_rol DEFAULT 'cliente' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- puntos_entrega: Lugares disponibles para recoger pedidos (Contra Entrega)
CREATE TABLE public.puntos_entrega (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- categorias: Agrupadores lógicos del catálogo
CREATE TABLE public.categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- productos: Inventario general de prendas
CREATE TABLE public.productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    imagen_url TEXT,
    stock INT DEFAULT 0,
    categoria_id INT REFERENCES public.categorias(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ordenes: Cabecera transaccional de compras
CREATE TABLE public.ordenes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email VARCHAR(255),
    total DECIMAL(10, 2) NOT NULL,
    estado orden_estado DEFAULT 'pendiente',
    punto_entrega_id INT REFERENCES public.puntos_entrega(id) ON DELETE SET NULL,
    telefono_contacto VARCHAR(20),
    fecha_entrega DATE,
    hora_entrega VARCHAR(50),
    stripe_session_id VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- detalles_orden: Desglose de artículos por orden
CREATE TABLE public.detalles_orden (
    id SERIAL PRIMARY KEY,
    orden_id INT REFERENCES public.ordenes(id) ON DELETE CASCADE,
    producto_id INT REFERENCES public.productos(id) ON DELETE SET NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL
);

-- variantes_producto: Tallas, colores y presentaciones por producto
DROP TABLE IF EXISTS public.variantes_producto CASCADE;
CREATE TABLE public.variantes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    talla VARCHAR(10),
    color VARCHAR(50),
    stock INT DEFAULT 0,
    precio_adicional DECIMAL(10, 2) DEFAULT 0,
    imagen_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX unique_producto_variante
    ON public.variantes_producto (producto_id, COALESCE(talla, ''), COALESCE(color, ''));

ALTER TABLE public.detalles_orden ADD COLUMN IF NOT EXISTS variante_id INT REFERENCES public.variantes_producto(id) ON DELETE SET NULL;

-- carrito: Carro de compras persistente por usuario
CREATE TABLE public.carrito (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    variante_id INT REFERENCES public.variantes_producto(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migración idempotente: agregar columna nombre a perfiles
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre TEXT;

-- =============================================================================
-- 4. AUTOMATIZACIONES (Trigger + Función PL/pgSQL)
-- =============================================================================

-- Crea un perfil automáticamente al registrarse (Google OAuth o email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    rol_texto TEXT;
    nombre_texto TEXT;
BEGIN
    rol_texto := COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente');
    nombre_texto := COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', '');
    INSERT INTO public.perfiles (id, email, nombre, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        nombre_texto,
        CASE
            WHEN rol_texto = 'admin' THEN 'admin'::public.usuario_rol
            WHEN rol_texto = 'moderador' THEN 'moderador'::public.usuario_rol
            ELSE 'cliente'::public.usuario_rol
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puntos_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrito ENABLE ROW LEVEL SECURITY;

-- Lectura pública de perfiles (necesario para AuthService.cargarPerfil())
CREATE POLICY "Permitir lectura publica de perfiles"
    ON public.perfiles FOR SELECT USING (true);

-- Los usuarios pueden actualizar su propio perfil (nombre, etc.)
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.perfiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Lectura pública de puntos de entrega
CREATE POLICY "Permitir lectura publica de puntos de entrega"
    ON public.puntos_entrega FOR SELECT TO anon USING (true);

-- Lectura pública de catálogo (rol anónimo)
CREATE POLICY "Permitir lectura publica de categorias"
    ON public.categorias FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir lectura publica de productos"
    ON public.productos FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir lectura publica de variantes"
    ON public.variantes_producto FOR SELECT TO anon USING (true);

-- Aislamiento: cada usuario ve solo sus órdenes
CREATE POLICY "Usuarios pueden ver solo sus propias ordenes"
    ON public.ordenes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins pueden ver todas las órdenes (gestionado via backend con service_role)
CREATE POLICY "Admins pueden ver todas las ordenes"
    ON public.ordenes FOR SELECT TO service_role USING (true);

-- Aislamiento de carrito: cada usuario ve, inserta, actualiza y elimina solo su propio carrito
CREATE POLICY "Usuarios pueden ver su propio carrito"
    ON public.carrito FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su propio carrito"
    ON public.carrito FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio carrito"
    ON public.carrito FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propio carrito"
    ON public.carrito FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================================================
-- 6. PRIVILEGIOS (Principio de Mínimo Privilegio)
-- =============================================================================

-- anon (frontend - navegación pública)
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT ON public.productos TO anon;
GRANT SELECT ON public.perfiles TO anon;
GRANT SELECT ON public.puntos_entrega TO anon;
GRANT SELECT ON public.variantes_producto TO anon;

-- authenticated (frontend - usuario logueado)
GRANT SELECT, UPDATE ON public.perfiles TO authenticated;
GRANT SELECT ON public.puntos_entrega TO authenticated;
GRANT SELECT ON public.variantes_producto TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrito TO authenticated;
GRANT USAGE ON SEQUENCE public.carrito_id_seq TO authenticated;

-- service_role (backend FastAPI - supabase_admin)
GRANT SELECT, UPDATE ON public.perfiles TO service_role;
GRANT SELECT, INSERT, DELETE ON public.categorias TO service_role;
GRANT USAGE ON SEQUENCE public.categorias_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.productos TO service_role;
GRANT USAGE ON SEQUENCE public.productos_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variantes_producto TO service_role;
GRANT USAGE ON SEQUENCE public.variantes_producto_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ordenes TO service_role;
GRANT USAGE ON SEQUENCE public.ordenes_id_seq TO service_role;
GRANT SELECT, INSERT ON public.detalles_orden TO service_role;
GRANT USAGE ON SEQUENCE public.detalles_orden_id_seq TO service_role;
GRANT SELECT ON public.puntos_entrega TO service_role;
GRANT USAGE ON SEQUENCE public.puntos_entrega_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrito TO service_role;
GRANT USAGE ON SEQUENCE public.carrito_id_seq TO service_role;

-- =============================================================================
-- 7. CATÁLOGO SEMILLA (Datos dummy para desarrollo)
-- =============================================================================
INSERT INTO public.categorias (nombre) VALUES
('Camisas y Playeras'),
('Pantalones y Jeans'),
('Chamarras y Abrigos'),
('Accesorios');

-- Puntos de entrega para Contra Entrega
INSERT INTO public.puntos_entrega (nombre) VALUES
('Crucero de Dongu'),
('Deportivo Dongu'),
('Centro San Felipe'),
('Crucero de San Juan'),
('Centro de San Juan'),
('Pickup en local de San Antonio');

INSERT INTO public.productos (nombre, descripcion, precio, imagen_url, stock, categoria_id) VALUES
('Playera Oversize Algodón', 'Playera de corte oversize hecha 100% de algodón grueso. Color gris minimalista, ideal para un estilo streetwear.', 29.99, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80', 50, (SELECT id FROM categorias WHERE nombre = 'Camisas y Playeras')),
('Camisa de Lino Casual', 'Camisa de lino transpirable de manga larga, perfecta para climas cálidos. Color blanco roto con botones de madera.', 45.50, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80', 30, (SELECT id FROM categorias WHERE nombre = 'Camisas y Playeras')),
('Jeans Slim Fit Denim', 'Pantalón de mezclilla clásico con lavado medio y corte slim fit. Flexibilidad cómoda para el uso diario.', 59.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80', 40, (SELECT id FROM categorias WHERE nombre = 'Pantalones y Jeans')),
('Pantalón Cargo Negro', 'Pantalón tipo cargo con bolsillos laterales utilitarios. Ajuste elástico en tobillos, tela resistente al desgaste.', 54.00, 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=500&q=80', 25, (SELECT id FROM categorias WHERE nombre = 'Pantalones y Jeans')),
('Chamarra de Mezclilla Vintage', 'Chamarra de mezclilla azul claro con sutiles detalles de desgaste. Un clásico atemporal para cualquier outfit.', 79.99, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80', 15, (SELECT id FROM categorias WHERE nombre = 'Chamarras y Abrigos')),
('Chamarra Rompevientos Impermeable', 'Rompevientos ligero con tecnología impermeable y gorro ajustable. Ideal para días lluviosos o actividades al aire libre.', 65.00, 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&q=80', 20, (SELECT id FROM categorias WHERE nombre = 'Chamarras y Abrigos')),
('Gorra Minimalista "VC"', 'Gorra de visera curva con broche metálico ajustable. Color negro con bordado sutil de alta calidad.', 22.50, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80', 100, (SELECT id FROM categorias WHERE nombre = 'Accesorios')),
('Mochila Ejecutiva Impermeable', 'Mochila con compartimento acolchado para laptop de hasta 15.6 pulgadas. Puerto de carga USB externo y tela impermeable.', 49.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 35, (SELECT id FROM categorias WHERE nombre = 'Accesorios'));

-- =============================================================================
-- 8. ADMIN POR DEFECTO (Usuario desarrollador)
-- =============================================================================
INSERT INTO public.perfiles (id, email, rol)
SELECT id, email, 'admin'::usuario_rol
FROM auth.users
WHERE email = 'marianovc251@gmail.com'
ON CONFLICT (id) DO UPDATE SET rol = 'admin'::usuario_rol;

-- =============================================================================
-- 9. STORAGE POLICIES (Bucket: productos)
-- =============================================================================
CREATE POLICY "Subir imagenes a productos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'productos');

CREATE POLICY "Leer imagenes de productos"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'productos');
