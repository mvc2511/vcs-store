-- =============================================================================
-- MIGRACIÓN — Perfumes por Encargo
-- VC'S Store / VYRO Boutique
-- Aplicar en Supabase SQL Editor (QA y PRD)
-- =============================================================================

-- 1. Columnas para productos por encargo
ALTER TABLE public.productos
    ADD COLUMN IF NOT EXISTS es_encargo BOOLEAN DEFAULT false;

ALTER TABLE public.productos
    ADD COLUMN IF NOT EXISTS dias_entrega INT DEFAULT 5;

-- 2. Comentarios para documentación del esquema
COMMENT ON COLUMN public.productos.es_encargo IS 'True = producto bajo pedido (no en stock), se consigue por encargo';
COMMENT ON COLUMN public.productos.dias_entrega IS 'Días hábiles estimados de entrega para productos por encargo';
