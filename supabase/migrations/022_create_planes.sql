-- ============================================
-- MIGRACIÓN 022: Tabla planes
-- Configuración de planes y precios de la plataforma.
-- Editable desde el panel de administración (/admin → Planes).
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.planes (
  id                    TEXT PRIMARY KEY,
  nombre                TEXT NOT NULL,
  precio_mensual        NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento_mensual_pct INTEGER DEFAULT 0,
  precio_anual          NUMERIC(10,2),
  descuento_anual_pct   INTEGER DEFAULT 0,
  dias_prueba           INTEGER DEFAULT 0,
  descripcion           TEXT,
  activo                BOOLEAN NOT NULL DEFAULT true
);

-- RLS
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer planes (precios y features son públicos)
CREATE POLICY "planes_select_public" ON public.planes
  FOR SELECT USING (true);

-- Solo service_role puede modificar
CREATE POLICY "planes_insert_service" ON public.planes
  FOR INSERT WITH CHECK ((SELECT auth.role() = 'service_role'));

CREATE POLICY "planes_update_service" ON public.planes
  FOR UPDATE USING ((SELECT auth.role() = 'service_role'))
  WITH CHECK ((SELECT auth.role() = 'service_role'));

CREATE POLICY "planes_delete_service" ON public.planes
  FOR DELETE USING ((SELECT auth.role() = 'service_role'));

-- GRANTs
GRANT SELECT ON public.planes TO anon;
GRANT SELECT ON public.planes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planes TO service_role;

-- Seed
INSERT INTO public.planes (id, nombre, precio_mensual, descuento_mensual_pct, precio_anual, descuento_anual_pct, dias_prueba, descripcion, activo)
VALUES
  ('free',    'Gratuito', 0,    0, NULL, 0,  0,  'Herramientas básicas: facturas, presupuestos y albaranes.', true),
  ('premium', 'Premium',  4.99, 0, 49.90, 17, 14, 'Todas las herramientas: facturas, presupuestos, albaranes, contratos, NDAs y reclamaciones de pago.', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Recargar caché de schema de PostgREST
NOTIFY pgrst, 'reload schema';
