-- ============================================
-- MIGRACIÓN 013: Reclamaciones — numeración consecutiva
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

BEGIN;

-- 1) Añadir columna numero a reclamaciones (nullable para compatibilidad con existentes)
ALTER TABLE public.reclamaciones
  ADD COLUMN IF NOT EXISTS numero TEXT;

-- 2) Ampliar la tabla de secuencias para incluir 'reclamacion'
ALTER TABLE public.document_sequences
  DROP CONSTRAINT IF EXISTS document_sequences_tipo_check;

ALTER TABLE public.document_sequences
  ADD CONSTRAINT document_sequences_tipo_check
  CHECK (tipo IN ('factura', 'presupuesto', 'albaran', 'contrato', 'rectificativa', 'nda', 'reclamacion'));

-- 3) Actualizar la función next_document_number para aceptar 'reclamacion'
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
  IF p_tipo NOT IN ('factura', 'presupuesto', 'albaran', 'contrato', 'rectificativa', 'nda', 'reclamacion') THEN
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

-- 4) Seed de secuencias a partir de reclamaciones existentes
INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
SELECT user_id, 'reclamacion'::TEXT, split_part(numero, '-', 2)::INT AS anio, MAX(split_part(numero, '-', 3)::INT) AS last_value
FROM public.reclamaciones
WHERE numero ~ '^REC-[0-9]{4}-[0-9]+$'
GROUP BY user_id, split_part(numero, '-', 2)::INT
ON CONFLICT (user_id, tipo, anio)
DO UPDATE SET last_value = GREATEST(public.document_sequences.last_value, EXCLUDED.last_value);

COMMIT;
