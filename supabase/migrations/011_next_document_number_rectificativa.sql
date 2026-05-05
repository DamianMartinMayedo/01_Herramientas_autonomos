-- ============================================
-- MIGRACIÓN 011: next_document_number debe aceptar 'rectificativa'
--
-- La migración 008 actualizó el CHECK constraint de document_sequences
-- para aceptar 'rectificativa', pero la función next_document_number
-- (definida en 004 y actualizada en 010) seguía rechazando ese valor.
-- Resultado: emitir o crear una factura rectificativa devuelve 400.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

BEGIN;

-- 1) Asegurar que el CHECK de la tabla document_sequences incluye
--    'rectificativa' Y 'contrato' (idempotente — si ya está, no pasa nada).
ALTER TABLE public.document_sequences
  DROP CONSTRAINT IF EXISTS document_sequences_tipo_check;

ALTER TABLE public.document_sequences
  ADD CONSTRAINT document_sequences_tipo_check
  CHECK (tipo IN ('factura', 'presupuesto', 'albaran', 'contrato', 'rectificativa'));

-- 2) Recrear la función con 'rectificativa' en la lista válida.
CREATE OR REPLACE FUNCTION public.next_document_number(
  p_tipo TEXT,
  p_prefijo TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (secuencia INT, numero TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_anio INT := EXTRACT(YEAR FROM p_fecha)::INT;
  v_seq INT;
BEGIN
  IF p_tipo NOT IN ('factura', 'presupuesto', 'albaran', 'contrato', 'rectificativa') THEN
    RAISE EXCEPTION 'Tipo no válido: %', p_tipo;
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario autenticado para generar numeración';
  END IF;

  INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
  VALUES (p_user_id, p_tipo, v_anio, 1)
  ON CONFLICT (user_id, tipo, anio)
  DO UPDATE SET last_value = public.document_sequences.last_value + 1
  RETURNING last_value INTO v_seq;

  RETURN QUERY
  SELECT
    v_seq,
    p_prefijo || '-' || v_anio::TEXT || '-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$;

-- 3) Seed de secuencia de rectificativas a partir de facturas existentes
--    cuyo numero coincide con el patrón R-YYYY-NNN.
INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
SELECT
  user_id,
  'rectificativa'::TEXT,
  split_part(numero, '-', 2)::INT AS anio,
  MAX(split_part(numero, '-', 3)::INT) AS last_value
FROM public.facturas
WHERE numero ~ '^R-[0-9]{4}-[0-9]+$'
GROUP BY user_id, split_part(numero, '-', 2)::INT
ON CONFLICT (user_id, tipo, anio)
DO UPDATE SET last_value = GREATEST(public.document_sequences.last_value, EXCLUDED.last_value);

COMMIT;
