-- ============================================
-- MIGRACIÓN 021: VeriFactu — configuración por usuario + registros encadenados
-- ============================================
-- Modelo opt-in: el usuario activa VeriFactu desde Perfil. Mientras `enabled=false`
-- la plataforma se comporta como hoy (sin XML, sin hash chain, sin QR).
-- v1: generación local del registro (modo "no_verificable"). v2: envío a AEAT.
--
-- Decisiones de seguridad:
--   - El password del certificado se guarda en supabase_vault (NUNCA en columna legible).
--     La tabla guarda solo el `secret_id` (uuid) que apunta a vault.secrets.
--   - El .pfx se sube al bucket privado `verifactu-certs`. Solo service_role accede.
--   - Las RLS de las dos tablas permiten al usuario SELECT su fila, pero NO INSERT/UPDATE
--     ni DELETE — toda escritura pasa por edge functions con service_role.
--   - `verifactu_registros` es inmutable por contrato (obligación legal de conservación).
-- ============================================

BEGIN;

-- ─── 1. Tabla user_verifactu_config (1:1 con auth.users) ─────────────────────
CREATE TABLE IF NOT EXISTS public.user_verifactu_config (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled                  BOOLEAN NOT NULL DEFAULT false,
  modo                     TEXT NOT NULL DEFAULT 'no_verificable'
                           CHECK (modo IN ('no_verificable','veri_factu')),
  entorno                  TEXT NOT NULL DEFAULT 'test'
                           CHECK (entorno IN ('test','produccion')),

  -- Certificado
  cert_storage_path        TEXT,                 -- ruta en bucket verifactu-certs
  cert_password_secret_id  UUID,                 -- referencia a vault.secrets (NO al valor)
  cert_serial              TEXT,                 -- nº de serie del cert
  cert_subject             TEXT,                 -- CN/Subject completo
  cert_issuer              TEXT,                 -- emisor (FNMT, AC Camerfirma, etc.)
  cert_expires_at          TIMESTAMPTZ,          -- para aviso de caducidad
  nif_titular              TEXT,                 -- NIF extraído del cert al configurar

  last_test_ok_at          TIMESTAMPTZ,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_verifactu_config ENABLE ROW LEVEL SECURITY;

-- El usuario puede LEER su config (el password queda fuera: es solo un secret_id opaco).
CREATE POLICY "user_verifactu_config_select_own"
  ON public.user_verifactu_config
  FOR SELECT
  USING (auth.uid() = user_id);

-- No hay policies de INSERT/UPDATE/DELETE para `authenticated`:
-- toda escritura pasa por edge functions con service_role (bypassa RLS).

CREATE TRIGGER user_verifactu_config_updated_at
  BEFORE UPDATE ON public.user_verifactu_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT                         ON public.user_verifactu_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_verifactu_config TO service_role;
-- anon: ningún acceso (es config sensible).


-- ─── 2. Tabla verifactu_registros (cadena de hashes por usuario) ─────────────
CREATE TABLE IF NOT EXISTS public.verifactu_registros (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factura_id        UUID REFERENCES public.facturas(id) ON DELETE SET NULL,

  tipo_registro     TEXT NOT NULL CHECK (tipo_registro IN ('alta','anulacion')),
  numero_factura    TEXT NOT NULL,
  fecha_expedicion  DATE NOT NULL,

  -- Cadena de hashes (encadenamiento por usuario)
  hash              TEXT NOT NULL,
  hash_anterior     TEXT,                       -- NULL en el primer registro del usuario
  huella            TEXT NOT NULL,              -- string normalizado pre-hash (auditoría)

  -- Payload generado
  xml               TEXT NOT NULL,
  qr_url            TEXT NOT NULL,

  -- v2: envío a AEAT
  enviado_aeat_at   TIMESTAMPTZ,
  respuesta_aeat    JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT verifactu_registros_unique_per_user
    UNIQUE (user_id, numero_factura, tipo_registro)
);

ALTER TABLE public.verifactu_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifactu_registros_select_own"
  ON public.verifactu_registros
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sin INSERT/UPDATE/DELETE para authenticated: registros inmutables vía service_role.

CREATE INDEX IF NOT EXISTS idx_verifactu_registros_user_created
  ON public.verifactu_registros (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verifactu_registros_factura
  ON public.verifactu_registros (factura_id)
  WHERE factura_id IS NOT NULL;

GRANT SELECT                         ON public.verifactu_registros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifactu_registros TO service_role;


-- ─── 3. Función para obtener el hash del último registro del usuario ─────────
-- Devuelve NULL si el usuario aún no tiene registros (será el primer eslabón).
-- Toma un FOR UPDATE sobre la fila para serializar la siguiente inserción.
-- Solo invocable por service_role (la edge function de emisión).
CREATE OR REPLACE FUNCTION public.verifactu_last_hash(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT hash
    INTO v_hash
    FROM public.verifactu_registros
   WHERE user_id = p_user_id
   ORDER BY created_at DESC, id DESC
   LIMIT 1
   FOR UPDATE;

  RETURN v_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.verifactu_last_hash(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verifactu_last_hash(UUID) TO service_role;


-- ─── 4. Bucket privado para certificados (.pfx) ──────────────────────────────
-- Privado: NO se añade ninguna policy en storage.objects para este bucket,
-- así solo service_role tiene acceso (bypass de RLS). El frontend nunca toca
-- los .pfx directamente — todo va por edge functions.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verifactu-certs',
  'verifactu-certs',
  false,
  524288,                              -- 512 KB es más que suficiente para un .pfx
  ARRAY[
    'application/x-pkcs12',
    'application/pkcs12',
    'application/octet-stream'         -- algunos browsers envían los .pfx así
  ]
)
ON CONFLICT (id) DO NOTHING;


COMMIT;

-- Recarga del cache de PostgREST (las tablas nuevas no son visibles hasta esto).
NOTIFY pgrst, 'reload schema';
