-- =============================================================================
-- MIGRACIÓN — Galería multi-imagen + imágenes por variante de color
-- VC'S Store / VYRO Boutique
-- Aplicar en Supabase SQL Editor (QA y PRD)
-- =============================================================================

-- 1. Nueva tabla para galería de imágenes de producto
CREATE TABLE IF NOT EXISTS public.producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INT DEFAULT 0,
    color_id INT REFERENCES public.colores(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto
    ON public.producto_imagenes(producto_id);

-- 2. RLS
ALTER TABLE public.producto_imagenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de producto_imagenes" ON public.producto_imagenes;
CREATE POLICY "Lectura publica de producto_imagenes"
    ON public.producto_imagenes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Lectura authenticated producto_imagenes" ON public.producto_imagenes;
CREATE POLICY "Lectura authenticated producto_imagenes"
    ON public.producto_imagenes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin puede insertar producto_imagenes" ON public.producto_imagenes;
CREATE POLICY "Admin puede insertar producto_imagenes"
    ON public.producto_imagenes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede actualizar producto_imagenes" ON public.producto_imagenes;
CREATE POLICY "Admin puede actualizar producto_imagenes"
    ON public.producto_imagenes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede eliminar producto_imagenes" ON public.producto_imagenes;
CREATE POLICY "Admin puede eliminar producto_imagenes"
    ON public.producto_imagenes FOR DELETE TO authenticated USING (true);

-- 3. Permisos
GRANT SELECT ON public.producto_imagenes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.producto_imagenes TO authenticated;
GRANT USAGE ON SEQUENCE public.producto_imagenes_id_seq TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.producto_imagenes TO service_role;
GRANT USAGE ON SEQUENCE public.producto_imagenes_id_seq TO service_role;

-- 4. Comentarios
COMMENT ON TABLE public.producto_imagenes IS 'Galería de imágenes por producto, con opción de asociar a un color';
COMMENT ON COLUMN public.producto_imagenes.color_id IS 'Si tiene valor, esta imagen se muestra solo cuando se selecciona ese color. NULL = imagen general.';
