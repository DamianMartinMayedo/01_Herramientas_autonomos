-- ============================================
-- MIGRACIÓN 006: Añadir cliente_exterior a clientes_frecuentes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================
ALTER TABLE public.clientes_frecuentes
  ADD COLUMN IF NOT EXISTS cliente_exterior BOOLEAN NOT NULL DEFAULT false;
