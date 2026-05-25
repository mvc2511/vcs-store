-- MIGRACIÓN: RLS y políticas para horarios_entrega
-- La tabla ya existe con este schema:
--   id SERIAL PK, dia_semana INT (6=sáb, 7=dom) CHECK, hora_inicio TIME, hora_fin TIME,
--   activo BOOL DEFAULT true, creado_en TIMESTAMPTZ DEFAULT now()

-- 1. Asegurar RLS habilitado
ALTER TABLE public.horarios_entrega ENABLE ROW LEVEL SECURITY;

-- 2. Política de lectura pública (anon + authenticated)
DROP POLICY IF EXISTS "Lectura pública horarios_entrega" ON public.horarios_entrega;
CREATE POLICY "Lectura pública horarios_entrega" ON public.horarios_entrega
    FOR SELECT USING (true);

-- 3. Política CRUD solo admin
DROP POLICY IF EXISTS "Admin CRUD horarios_entrega" ON public.horarios_entrega;
CREATE POLICY "Admin CRUD horarios_entrega" ON public.horarios_entrega
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
    );

-- 4. Service_role permissions
GRANT USAGE, SELECT ON SEQUENCE public.horarios_entrega_id_seq TO service_role;
