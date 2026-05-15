-- ============================================
-- MIGRACIÓN 024: features (array de bullets) en planes
-- ============================================
-- Permite al admin definir la lista de ventajas que se muestran al usuario
-- en el modal de upgrade. Cada elemento es una línea con check.

BEGIN;

ALTER TABLE public.planes
  ADD COLUMN IF NOT EXISTS features TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Seed del plan Premium con un set inicial de features
UPDATE public.planes
SET features = ARRAY[
  'Acceso a todas las herramientas (presentes y futuras)',
  'Documentos legales avanzados (contratos, NDAs, reclamaciones)',
  'Sin límite de documentos generados',
  'Verifactu y obligaciones fiscales incluidas',
  'Soporte prioritario por email'
]
WHERE id = 'premium' AND (features IS NULL OR cardinality(features) = 0);

COMMIT;

NOTIFY pgrst, 'reload schema';
