-- =============================================================================
-- MIGRACIÓN: Puntos de entrega + nuevos campos en ordenes
-- FECHA: 2026-05-18
-- INSTRUCCIONES: Copiar y pegar completo en SQL Editor de Supabase
-- =============================================================================

-- 1. Crear ENUM orden_estado (si no existe)
DO $$ BEGIN
    CREATE TYPE orden_estado AS ENUM ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Crear tabla puntos_entrega
CREATE TABLE IF NOT EXISTS public.puntos_entrega (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.puntos_entrega ENABLE ROW LEVEL SECURITY;

-- 3. Agregar columnas a ordenes (solo si no existen)
ALTER TABLE public.ordenes
    ADD COLUMN IF NOT EXISTS punto_entrega_id INT REFERENCES public.puntos_entrega(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(20),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Cambiar estado de VARCHAR a ENUM
--    (la columna ya existe como VARCHAR, necesitamos cambiar el tipo)
--    Nota: esto requiere que todos los valores actuales sean válidos en el ENUM
ALTER TABLE public.ordenes
    ALTER COLUMN estado TYPE orden_estado
    USING estado::orden_estado;

ALTER TABLE public.ordenes
    ALTER COLUMN estado SET DEFAULT 'pendiente'::orden_estado;

-- 5. RLS: política de lectura pública para puntos_entrega
DROP POLICY IF EXISTS "Permitir lectura publica de puntos de entrega" ON public.puntos_entrega;
CREATE POLICY "Permitir lectura publica de puntos de entrega"
    ON public.puntos_entrega FOR SELECT TO anon USING (true);

-- 6. Service_role: permisos para las nuevas tablas/columnas
GRANT SELECT ON public.puntos_entrega TO anon;
GRANT SELECT ON public.puntos_entrega TO authenticated;
GRANT SELECT ON public.puntos_entrega TO service_role;
GRANT USAGE ON SEQUENCE public.puntos_entrega_id_seq TO service_role;

-- Service_role: UPDATE en ordenes y productos
GRANT UPDATE ON public.ordenes TO service_role;
GRANT UPDATE ON public.productos TO service_role;

-- 7. Seed: insertar los 6 puntos de entrega (solo si están vacíos)
INSERT INTO public.puntos_entrega (nombre)
SELECT nombre FROM (VALUES
    ('Crucero de Dongu'),
    ('Deportivo Dongu'),
    ('Centro San Felipe'),
    ('Crucero de San Juan'),
    ('Centro de San Juan'),
    ('Pickup en local de San Antonio')
) AS data(nombre)
WHERE NOT EXISTS (SELECT 1 FROM public.puntos_entrega);
