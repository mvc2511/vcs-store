-- =============================================================================
-- MIGRACIÓN — Columna genero en productos + storage DELETE policy
-- VC'S Store / VYRO Boutique
-- Aplicar en Supabase SQL Editor (QA y PRD)
-- =============================================================================

-- 1. Columna genero en productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS genero VARCHAR(20) DEFAULT NULL;
COMMENT ON COLUMN public.productos.genero IS 'Filtro por género: hombre, mujer, unisex o NULL para todos';

-- 2. DELETE policy para storage.objects (necesaria para que el frontend pueda eliminar imágenes)
CREATE POLICY "Eliminar imagenes de productos"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'productos');
