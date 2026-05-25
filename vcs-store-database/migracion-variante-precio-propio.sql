-- MIGRACIÓN: Variantes con precio propio (precio absoluto, no diferencia)
-- 1. Agregar columna precio
ALTER TABLE public.variantes_producto ADD COLUMN IF NOT EXISTS precio DECIMAL(10, 2);

-- 2. Migrar datos existentes: precio = producto.precio + precio_adicional
UPDATE public.variantes_producto vp
SET precio = (SELECT precio FROM public.productos WHERE id = vp.producto_id) + COALESCE(vp.precio_adicional, 0)
WHERE vp.precio IS NULL;

-- 3. Service_role permissions (solo si no existe)
GRANT USAGE, SELECT ON SEQUENCE public.variantes_producto_id_seq TO service_role;
