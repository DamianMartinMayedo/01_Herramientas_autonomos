-- ============================================
-- MIGRACIÓN 004: Facturas (estado fiscal) + secuencias persistentes
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================

BEGIN;

-- 1) Normalizar estados existentes hacia el nuevo modelo
UPDATE public.facturas
SET estado = 'emitida'
WHERE estado IN ('enviada', 'enviado');

UPDATE public.facturas
SET estado = 'anulada'
WHERE estado IN ('cancelada', 'cancelado');

-- 2) Actualizar constraint de estado en facturas
ALTER TABLE public.facturas
  DROP CONSTRAINT IF EXISTS facturas_estado_check;

ALTER TABLE public.facturas
  ADD CONSTRAINT facturas_estado_check
  CHECK (estado IN ('borrador', 'emitida', 'cobrada', 'anulada'));

-- 3) Tabla de secuencias por usuario/tipo/año
CREATE TABLE IF NOT EXISTS public.document_sequences (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('factura', 'presupuesto', 'albaran')),
  anio          INT NOT NULL CHECK (anio >= 2000),
  last_value    INT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tipo, anio)
);

ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_sequences_own" ON public.document_sequences;
CREATE POLICY "document_sequences_own" ON public.document_sequences
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_document_sequences_lookup
  ON public.document_sequences(user_id, tipo, anio);

DROP TRIGGER IF EXISTS document_sequences_updated_at ON public.document_sequences;
CREATE TRIGGER document_sequences_updated_at
BEFORE UPDATE ON public.document_sequences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Función para reservar el siguiente número secuencial
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
  IF p_tipo NOT IN ('factura', 'presupuesto', 'albaran') THEN
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

-- 5) Seed de secuencias a partir de documentos existentes
INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
SELECT user_id, 'factura'::TEXT, split_part(numero, '-', 2)::INT AS anio, MAX(split_part(numero, '-', 3)::INT) AS last_value
FROM public.facturas
WHERE numero ~ '^FAC-[0-9]{4}-[0-9]+$'
GROUP BY user_id, split_part(numero, '-', 2)::INT
ON CONFLICT (user_id, tipo, anio)
DO UPDATE SET last_value = GREATEST(public.document_sequences.last_value, EXCLUDED.last_value);

INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
SELECT user_id, 'presupuesto'::TEXT, split_part(numero, '-', 2)::INT AS anio, MAX(split_part(numero, '-', 3)::INT) AS last_value
FROM public.presupuestos
WHERE numero ~ '^PRE-[0-9]{4}-[0-9]+$'
GROUP BY user_id, split_part(numero, '-', 2)::INT
ON CONFLICT (user_id, tipo, anio)
DO UPDATE SET last_value = GREATEST(public.document_sequences.last_value, EXCLUDED.last_value);

INSERT INTO public.document_sequences (user_id, tipo, anio, last_value)
SELECT user_id, 'albaran'::TEXT, split_part(numero, '-', 2)::INT AS anio, MAX(split_part(numero, '-', 3)::INT) AS last_value
FROM public.albaranes
WHERE numero ~ '^ALB-[0-9]{4}-[0-9]+$'
GROUP BY user_id, split_part(numero, '-', 2)::INT
ON CONFLICT (user_id, tipo, anio)
DO UPDATE SET last_value = GREATEST(public.document_sequences.last_value, EXCLUDED.last_value);

COMMIT;
