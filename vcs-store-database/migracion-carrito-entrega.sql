-- =============================================================================
-- MIGRACIÓN: Carrito persistente | email en órdenes | fecha/hora entrega
-- FECHA: 2026-05-19
-- INSTRUCCIONES: Copiar y pegar completo en SQL Editor de Supabase
-- NOTA: Requiere migracion-puntos-entrega.sql ejecutada primero
-- =============================================================================

-- 1. Crear tabla carrito (persistente por usuario)
CREATE TABLE IF NOT EXISTS public.carrito (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.carrito ENABLE ROW LEVEL SECURITY;

-- 2. Agregar columnas a ordenes (solo si no existen)
ALTER TABLE public.ordenes
    ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fecha_entrega DATE,
    ADD COLUMN IF NOT EXISTS hora_entrega VARCHAR(50);

-- 3. RLS: políticas de aislamiento para carrito
DROP POLICY IF EXISTS "Usuarios pueden ver su propio carrito" ON public.carrito;
CREATE POLICY "Usuarios pueden ver su propio carrito"
    ON public.carrito FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio carrito" ON public.carrito;
CREATE POLICY "Usuarios pueden insertar su propio carrito"
    ON public.carrito FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio carrito" ON public.carrito;
CREATE POLICY "Usuarios pueden actualizar su propio carrito"
    ON public.carrito FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio carrito" ON public.carrito;
CREATE POLICY "Usuarios pueden eliminar su propio carrito"
    ON public.carrito FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Privilegios (authenticated: el frontend maneja carrito directamente)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrito TO authenticated;
GRANT USAGE ON SEQUENCE public.carrito_id_seq TO authenticated;

-- service_role (backend puede también gestionar carrito si es necesario)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrito TO service_role;
GRANT USAGE ON SEQUENCE public.carrito_id_seq TO service_role;

-- 5. Actualizar UPDATE grant en ordenes (ya existe, verificar)
-- Nota: service_role ya tiene GRANT UPDATE ON public.ordenes del migration anterior
