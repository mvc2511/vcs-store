-- =============================================================================
-- MIGRACIÓN — Perfumes Sobre Pedido
-- VC'S Store / VYRO Boutique
-- Aplicar en Supabase SQL Editor (QA y PRD)
-- =============================================================================

-- 1. Columnas para productos sobre pedido
ALTER TABLE public.productos
    ADD COLUMN IF NOT EXISTS es_sobre_pedido BOOLEAN DEFAULT false;

ALTER TABLE public.productos
    ADD COLUMN IF NOT EXISTS dias_entrega INT DEFAULT 5;

-- 2. Comentarios para documentación del esquema
COMMENT ON COLUMN public.productos.es_sobre_pedido IS 'True = producto sobre pedido (no en stock), se consigue bajo pedido';
COMMENT ON COLUMN public.productos.dias_entrega IS 'Días hábiles estimados de entrega para productos sobre pedido';
