-- ============================================
-- MIGRACIÓN 002: Tablas de documentos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- ─── FACTURAS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facturas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_nif   TEXT,
  cliente_email TEXT,
  cliente_direccion TEXT,
  concepto      TEXT,
  base_imponible NUMERIC(12,2) NOT NULL DEFAULT 0,
  tipo_iva      NUMERIC(5,2) NOT NULL DEFAULT 21,
  tipo_irpf     NUMERIC(5,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado        TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','cobrada','cancelada')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facturas_own" ON public.facturas
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_facturas_user ON public.facturas(user_id);

-- ─── PRESUPUESTOS ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  validez_dias  INT NOT NULL DEFAULT 30,
  cliente_nombre TEXT NOT NULL,
  cliente_nif   TEXT,
  cliente_email TEXT,
  cliente_direccion TEXT,
  concepto      TEXT,
  base_imponible NUMERIC(12,2) NOT NULL DEFAULT 0,
  tipo_iva      NUMERIC(5,2) NOT NULL DEFAULT 21,
  tipo_irpf     NUMERIC(5,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado        TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','aceptado','rechazado','caducado')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presupuestos_own" ON public.presupuestos
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_presupuestos_user ON public.presupuestos(user_id);

-- ─── ALBARANES ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.albaranes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_nif   TEXT,
  cliente_email TEXT,
  cliente_direccion TEXT,
  descripcion   TEXT,
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','entregado','firmado')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albaranes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albaranes_own" ON public.albaranes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_albaranes_user ON public.albaranes(user_id);

-- ─── CONTRATOS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contratos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_nif   TEXT,
  cliente_email TEXT,
  tipo          TEXT NOT NULL DEFAULT 'servicios' CHECK (tipo IN ('servicios','obra','confidencialidad','otro')),
  estado        TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','firmado','finalizado')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_own" ON public.contratos
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contratos_user ON public.contratos(user_id);

-- ─── NDAs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ndas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  otra_parte_nombre TEXT NOT NULL,
  otra_parte_nif TEXT,
  otra_parte_email TEXT,
  estado        TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','firmado')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ndas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ndas_own" ON public.ndas
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ndas_user ON public.ndas(user_id);

-- ─── RECLAMACIONES ───────────────────────────
CREATE TABLE IF NOT EXISTS public.reclamaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  deudor_nombre TEXT NOT NULL,
  deudor_nif    TEXT,
  deudor_email  TEXT,
  importe       NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado        TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','resuelta')),
  notas         TEXT,
  datos_json    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reclamaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reclamaciones_own" ON public.reclamaciones
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reclamaciones_user ON public.reclamaciones(user_id);

-- ─── Trigger updated_at para todas las tablas ─
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['facturas','presupuestos','albaranes','contratos','ndas','reclamaciones']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END; $$;
