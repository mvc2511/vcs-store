-- =============================================================================
-- MIGRACIÓN: Estandarización de Tallas y Colores (Lookup Tables)
-- =============================================================================

-- 1. Crear lookup tables (idempotente)
CREATE TABLE IF NOT EXISTS public.tallas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    orden INT DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.colores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    hex VARCHAR(7),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar FK columns a variantes_producto (idempotente)
ALTER TABLE public.variantes_producto
    ADD COLUMN IF NOT EXISTS talla_id INT REFERENCES public.tallas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS color_id INT REFERENCES public.colores(id) ON DELETE SET NULL;

-- 3. RLS
ALTER TABLE public.tallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de tallas" ON public.tallas;
CREATE POLICY "Permitir lectura publica de tallas"
    ON public.tallas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica de colores" ON public.colores;
CREATE POLICY "Permitir lectura publica de colores"
    ON public.colores FOR SELECT TO anon USING (true);

-- 4. Privilegios
GRANT SELECT ON public.tallas TO anon;
GRANT SELECT ON public.colores TO anon;
GRANT SELECT ON public.tallas TO authenticated;
GRANT SELECT ON public.colores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tallas TO service_role;
GRANT USAGE ON SEQUENCE public.tallas_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colores TO service_role;
GRANT USAGE ON SEQUENCE public.colores_id_seq TO service_role;

-- 5. Seed data (idempotente)
INSERT INTO public.tallas (nombre, orden) VALUES
    ('XS', 1),
    ('S', 2),
    ('M', 3),
    ('L', 4),
    ('XL', 5),
    ('2XL', 6),
    ('3XL', 7)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.colores (nombre, hex) VALUES
    ('Negro', '#000000'),
    ('Blanco', '#FFFFFF'),
    ('Gris', '#808080'),
    ('Rojo', '#FF0000'),
    ('Azul', '#0000FF'),
    ('Verde', '#008000'),
    ('Beige', '#F5F5DC'),
    ('Rosa', '#FFC0CB'),
    ('Morado', '#800080'),
    ('Naranja', '#FFA500'),
    ('Amarillo', '#FFFF00'),
    ('Militar', '#4B5320'),
    ('Champagne', '#F7E7CE'),
    ('Plateado', '#C0C0C0'),
    ('Dorado', '#FFD700')
ON CONFLICT (nombre) DO NOTHING;
