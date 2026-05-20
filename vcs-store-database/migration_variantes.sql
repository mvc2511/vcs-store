-- Migration: Variantes de Producto (Talla/Color)
-- Ejecutar en Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS)

-- 1. Crear tabla variantes_producto
CREATE TABLE IF NOT EXISTS public.variantes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    talla VARCHAR(10),
    color VARCHAR(50),
    stock INT NOT NULL DEFAULT 0,
    precio_adicional DECIMAL(10, 2) NOT NULL DEFAULT 0,
    imagen_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variante_unica
    ON public.variantes_producto (producto_id, COALESCE(talla, ''), COALESCE(color, ''));

-- 2. Agregar variante_id a tablas existentes
ALTER TABLE public.detalles_orden ADD COLUMN IF NOT EXISTS variante_id INT
    REFERENCES public.variantes_producto(id) ON DELETE SET NULL;

ALTER TABLE public.carrito ADD COLUMN IF NOT EXISTS variante_id INT
    REFERENCES public.variantes_producto(id) ON DELETE CASCADE;

-- 3. RLS
ALTER TABLE public.variantes_producto ENABLE ROW LEVEL SECURITY;

-- Policy: lectura pública
DROP POLICY IF EXISTS "Lectura pública de variantes" ON public.variantes_producto;
CREATE POLICY "Lectura pública de variantes"
    ON public.variantes_producto FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Lectura pública de variantes authenticated" ON public.variantes_producto;
CREATE POLICY "Lectura pública de variantes authenticated"
    ON public.variantes_producto FOR SELECT TO authenticated USING (true);

-- 4. Grants
GRANT SELECT ON public.variantes_producto TO anon;
GRANT SELECT ON public.variantes_producto TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variantes_producto TO service_role;
GRANT USAGE ON SEQUENCE public.variantes_producto_id_seq TO service_role;
