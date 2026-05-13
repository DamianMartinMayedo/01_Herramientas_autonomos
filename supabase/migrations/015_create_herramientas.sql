-- ============================================
-- Migración 015 — tabla global `herramientas`
-- ============================================
-- Mueve el inventario de herramientas de Zustand+localStorage a Supabase.
-- Es una tabla global (sin user_id): la admin la mantiene, el Home la lee.
-- Lectura libre (anon); escritura sólo desde edge function con service_role.

BEGIN;

CREATE TABLE IF NOT EXISTS public.herramientas (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  ruta            TEXT NOT NULL,
  descripcion     TEXT NOT NULL DEFAULT '',
  categoria       TEXT NOT NULL CHECK (categoria IN ('documentos','contratos','calculadoras')),
  activa          BOOLEAN NOT NULL DEFAULT false,
  visible         BOOLEAN NOT NULL DEFAULT true,
  proximamente    BOOLEAN NOT NULL DEFAULT false,
  mantenimiento   BOOLEAN NOT NULL DEFAULT false,
  plan_required   TEXT NOT NULL DEFAULT 'free' CHECK (plan_required IN ('free','premium')),
  anon_available  BOOLEAN NOT NULL DEFAULT false,
  orden           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.herramientas ENABLE ROW LEVEL SECURITY;

-- Lectura abierta: el Home público necesita listarlas sin login.
CREATE POLICY "herramientas_public_read" ON public.herramientas
  FOR SELECT USING (true);

-- Sin políticas de escritura: sólo service_role (vía edge function) podrá escribir.

GRANT SELECT                         ON public.herramientas TO anon;
GRANT SELECT                         ON public.herramientas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.herramientas TO service_role;

CREATE TRIGGER herramientas_updated_at
  BEFORE UPDATE ON public.herramientas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed inicial: 9 herramientas (idéntico al HERRAMIENTAS_DEFAULT de adminStore).
-- anon_available=true para las free; los contratos arrancan premium+sin-anon.
INSERT INTO public.herramientas (id, nombre, ruta, descripcion, categoria, activa, proximamente, plan_required, anon_available, orden) VALUES
  ('factura',          'Generador de facturas',     '/factura',          'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.',         'documentos',   true,  false, 'free',    true,  1),
  ('presupuesto',      'Generador de presupuestos', '/presupuesto',      'Envía presupuestos profesionales a tus clientes en minutos.',            'documentos',   true,  false, 'free',    true,  2),
  ('albaran',          'Generador de albarán',      '/albaran',          'Genera albaranes de entrega vinculados a tus presupuestos y facturas.',  'documentos',   false, true,  'free',    true,  3),
  ('contrato',         'Generador de contratos',    '/contrato',         'Contratos de prestación de servicios listos para firmar.',               'contratos',    false, true,  'premium', false, 4),
  ('nda',              'Generador de NDA',          '/nda',              'Acuerdos de confidencialidad bilaterales y unilaterales.',               'contratos',    false, true,  'premium', false, 5),
  ('reclamacion',      'Reclamación de pago',       '/reclamacion-pago', 'Carta formal para reclamar facturas impagadas.',                         'contratos',    false, true,  'premium', false, 6),
  ('cuota-autonomos',  'Cuota de autónomos',        '/cuota-autonomos',  'Calcula tu cuota mensual de autónomo según ingresos.',                   'calculadoras', false, true,  'free',    true,  7),
  ('precio-hora',      'Precio por hora',           '/precio-hora',      'Calcula cuánto cobrar por hora según tus gastos y objetivo.',            'calculadoras', false, true,  'free',    true,  8),
  ('iva-irpf',         'IVA / IRPF',                '/iva-irpf',         'Calcula los impuestos asociados a tus facturas.',                        'calculadoras', false, true,  'free',    true,  9);

COMMIT;

NOTIFY pgrst, 'reload schema';
