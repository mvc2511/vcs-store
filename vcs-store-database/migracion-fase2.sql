-- =============================================================================
-- MIGRACIÓN FASE 2 — Experiencia Cliente
-- VC'S Store / VYRO Boutique
-- Aplicar en Supabase SQL Editor (junto a database.sql o sobre DB existente)
-- =============================================================================

-- 1. Columna visible en productos (control admin de visibilidad en catálogo)
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- 2. Tabla favoritos (wishlist persistente, solo DB, sin localStorage)
CREATE TABLE IF NOT EXISTS public.favoritos (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favoritos_unique
    ON public.favoritos (user_id, producto_id);

-- 3. Tabla resenas (valoraciones con soporte anónimo)
CREATE TABLE IF NOT EXISTS public.resenas (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    puntuacion INT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    anonima BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (producto_id, user_id)
);

-- 4. Tabla cupones (códigos de descuento)
CREATE TABLE IF NOT EXISTS public.cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
    valor DECIMAL(10, 2) NOT NULL,
    minimo_compra DECIMAL(10, 2) DEFAULT 0,
    usos_maximos INT,
    usos_actuales INT DEFAULT 0,
    fecha_expiracion TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true,
    producto_id INT REFERENCES public.productos(id) ON DELETE SET NULL,
    categoria_id INT REFERENCES public.categorias(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla precios_mayoreo (precios por volumen)
CREATE TABLE IF NOT EXISTS public.precios_mayoreo (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES public.productos(id) ON DELETE CASCADE,
    categoria_id INT REFERENCES public.categorias(id) ON DELETE CASCADE,
    cantidad_minima INT NOT NULL CHECK (cantidad_minima >= 2),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_target CHECK (
        (producto_id IS NOT NULL AND categoria_id IS NULL)
        OR (producto_id IS NULL AND categoria_id IS NOT NULL)
    )
);

-- 6. Columnas nuevas en ordenes para descuentos
ALTER TABLE public.ordenes ADD COLUMN IF NOT EXISTS cupon_id INT REFERENCES public.cupones(id) ON DELETE SET NULL;
ALTER TABLE public.ordenes ADD COLUMN IF NOT EXISTS descuento DECIMAL(10, 2) DEFAULT 0;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_mayoreo ENABLE ROW LEVEL SECURITY;

-- Favoritos: aislamiento por usuario (como carrito)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios favoritos" ON public.favoritos;
CREATE POLICY "Usuarios pueden ver sus propios favoritos"
    ON public.favoritos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios favoritos" ON public.favoritos;
CREATE POLICY "Usuarios pueden insertar sus propios favoritos"
    ON public.favoritos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios favoritos" ON public.favoritos;
CREATE POLICY "Usuarios pueden eliminar sus propios favoritos"
    ON public.favoritos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reseñas: lectura pública, escritura solo propia
DROP POLICY IF EXISTS "Lectura publica de resenas" ON public.resenas;
CREATE POLICY "Lectura publica de resenas"
    ON public.resenas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias resenas" ON public.resenas;
CREATE POLICY "Usuarios pueden insertar sus propias resenas"
    ON public.resenas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias resenas" ON public.resenas;
CREATE POLICY "Usuarios pueden actualizar sus propias resenas"
    ON public.resenas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias resenas" ON public.resenas;
CREATE POLICY "Usuarios pueden eliminar sus propias resenas"
    ON public.resenas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Cupones: SELECT público para validación, CRUD solo via service_role
DROP POLICY IF EXISTS "Lectura publica de cupones para validacion" ON public.cupones;
CREATE POLICY "Lectura publica de cupones para validacion"
    ON public.cupones FOR SELECT TO anon USING (true);

-- Precios mayoreo: SELECT público
DROP POLICY IF EXISTS "Lectura publica de precios mayoreo" ON public.precios_mayoreo;
CREATE POLICY "Lectura publica de precios mayoreo"
    ON public.precios_mayoreo FOR SELECT TO anon USING (true);

-- =============================================================================
-- PRIVILEGIOS
-- =============================================================================

-- anon (navegación pública)
GRANT SELECT ON public.resenas TO anon;
GRANT SELECT ON public.cupones TO anon;
GRANT SELECT ON public.precios_mayoreo TO anon;

-- authenticated (usuario logueado)
GRANT SELECT, INSERT, DELETE ON public.favoritos TO authenticated;
GRANT USAGE ON SEQUENCE public.favoritos_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resenas TO authenticated;
GRANT USAGE ON SEQUENCE public.resenas_id_seq TO authenticated;

-- service_role (backend FastAPI)
GRANT SELECT, INSERT, DELETE ON public.favoritos TO service_role;
GRANT USAGE ON SEQUENCE public.favoritos_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resenas TO service_role;
GRANT USAGE ON SEQUENCE public.resenas_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupones TO service_role;
GRANT USAGE ON SEQUENCE public.cupones_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.precios_mayoreo TO service_role;
GRANT USAGE ON SEQUENCE public.precios_mayoreo_id_seq TO service_role;
