-- ============================================
-- PLANTILLA: nueva tabla documental
-- ============================================
-- ESTE ARCHIVO NO SE EJECUTA. El prefijo "_" lo excluye del orden de migraciones.
--
-- USO (ver checklist completo en AGENTS.md → Regla #10):
--   1. Copiar este archivo como NNN_create_<tabla>.sql (NNN = siguiente número libre).
--   2. Sustituir TODAS las apariciones de <TABLA> por el nombre real (ej. presupuestos_pro).
--   3. Ajustar los valores del CHECK de `estado` para esta herramienta.
--   4. Para cada campo NUEVO de tu herramienta, decidir:
--      → ¿Solo se usa dentro del documento? → NO crees columna. Va dentro de `datos_json`.
--      → ¿Aparece en listados, filtros, orden, EmailModal? → SÍ crea columna desnormalizada
--        (en el bloque "Específicas de esta herramienta" más abajo) Y luego añádela al
--        payload de la `save*Document` correspondiente (ver Regla #10, paso 6).
--      Default: si dudas, va solo en `datos_json`. Cero migración y cero payload.
--   5. Añadir el nombre de la tabla a `UserDocumentTable` en src/lib/userDocuments.ts.
--   6. Construir/extender la función de guardado en userDocuments.ts (Regla #10, paso 6).
--   7. Ejecutar `npm run test` — el smoke test (userDocuments.smoke.test.ts) valida que la tabla
--      tenga las columnas requeridas antes del deploy.
--
-- ¿POR QUÉ ESTA PLANTILLA?
--   `writeRowWithRetry` (src/lib/userDocuments.ts) elimina silenciosamente del payload las columnas
--   que PostgREST reporta como inexistentes (excepto `datos_json`, que rechaza el guardado).
--   Si la tabla nace sin `numero`/`notas`/`estado`, el documento se guarda incompleto y nadie lo nota.
--   Esta plantilla incluye TODAS las columnas que `userDocuments.ts` espera, eliminando esa puerta.
--
--   Además, `NOTIFY pgrst, 'reload schema'` al final fuerza a PostgREST a recargar su caché de
--   schema, evitando el bug histórico de "la columna existe en Postgres pero PostgREST no la ve".
-- ============================================

BEGIN;

-- ─── TABLA <TABLA> ────────────────────────────
CREATE TABLE IF NOT EXISTS public.<TABLA> (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Numeración / metadatos (REQUERIDOS por userDocuments.ts)
  numero            TEXT,
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  estado            TEXT NOT NULL DEFAULT 'borrador'
                    CHECK (estado IN ('borrador','enviado','finalizado')), -- ajustar valores
  notas             TEXT,
  datos_json        JSONB, -- ← CRÍTICA. Almacena el documento completo serializado.

  -- Cliente / contraparte (REQUERIDAS por listados y EmailModal)
  cliente_nombre    TEXT,
  cliente_nif       TEXT,
  cliente_email     TEXT,
  cliente_direccion TEXT,

  -- Específicas de esta herramienta — añadir SOLO columnas que se usan en listados,
  -- filtros, orden o EmailModal. Si el campo es interno al documento, déjalo en datos_json.
  -- Ejemplos:
  --   titulo         TEXT,                          -- mostrado en lista
  --   importe        NUMERIC(12,2) NOT NULL DEFAULT 0, -- filtrable/ordenable
  --   tipo           TEXT CHECK (tipo IN ('a','b')),  -- filtrable

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────
ALTER TABLE public.<TABLA> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<TABLA>_own" ON public.<TABLA>
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_<TABLA>_user ON public.<TABLA>(user_id);

-- ─── GRANTs (requerido desde Supabase Mayo 2026) ──────────
GRANT SELECT                             ON public.<TABLA> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<TABLA> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<TABLA> TO service_role;

-- ─── Trigger updated_at ───────────────────────
-- La función public.set_updated_at() ya existe (definida en 002_create_documentos.sql).
-- Si por alguna razón no existe en este entorno, descomenta el bloque siguiente:
--
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
-- RETURNS TRIGGER LANGUAGE plpgsql AS $$
-- BEGIN NEW.updated_at = now(); RETURN NEW; END;
-- $$;

CREATE TRIGGER <TABLA>_updated_at
  BEFORE UPDATE ON public.<TABLA>
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Numeración consecutiva (opcional) ────────
-- Si la herramienta requiere numeración tipo "PREFIJO-AAAA-NNN":
--
-- 1) Añadir el tipo al CHECK de document_sequences:
-- ALTER TABLE public.document_sequences DROP CONSTRAINT IF EXISTS document_sequences_tipo_check;
-- ALTER TABLE public.document_sequences ADD CONSTRAINT document_sequences_tipo_check
--   CHECK (tipo IN ('factura','presupuesto','albaran','contrato','rectificativa','nda','reclamacion','<TIPO_NUEVO>'));
--
-- 2) Actualizar la función next_document_number para aceptar el nuevo tipo (ver 012_nda_numero.sql).
--
-- 3) Añadir el wrapper en src/lib/userDocuments.ts:
--    const getNext<TABLA>Numero = (uid) => getNextNumero(uid, '<tipo>', '<PREFIJO>')

COMMIT;

-- ─── CRÍTICO: recargar el caché de schema de PostgREST ────
-- Sin esto, PostgREST sigue con la caché vieja y `writeRowWithRetry` detecta las columnas
-- como inexistentes aunque ya existan. Causa raíz del bug histórico de corrupción de datos_json.
NOTIFY pgrst, 'reload schema';
