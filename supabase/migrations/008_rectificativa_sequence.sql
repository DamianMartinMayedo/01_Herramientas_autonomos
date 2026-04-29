-- ============================================
-- MIGRACIÓN 008: Serie de numeración para facturas rectificativas
-- Las rectificativas usan la serie R-YYYY-NNN, separada de FAC-YYYY-NNN
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================
ALTER TABLE public.document_sequences
  DROP CONSTRAINT IF EXISTS document_sequences_tipo_check;

ALTER TABLE public.document_sequences
  ADD CONSTRAINT document_sequences_tipo_check
    CHECK (tipo IN ('factura', 'presupuesto', 'albaran', 'rectificativa'));
