-- ============================================
-- MIGRACIÓN 021b: lockdown de grants en tablas VeriFactu
-- ============================================
-- Supabase concede por defecto privilegios "ALL" a anon/authenticated sobre las
-- tablas nuevas en public (default privileges del rol postgres). Las RLS de la
-- 021 ya bloquean en la práctica (no hay policies de INSERT/UPDATE/DELETE), pero
-- por defensa en profundidad revocamos lo que no necesitan.
-- ============================================

BEGIN;

-- anon: ningún acceso a VeriFactu (es config sensible / registros fiscales).
REVOKE ALL ON public.user_verifactu_config FROM anon;
REVOKE ALL ON public.verifactu_registros   FROM anon;

-- authenticated: solo SELECT. Las escrituras pasan por edge functions con service_role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.user_verifactu_config FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.verifactu_registros   FROM authenticated;

GRANT SELECT ON public.user_verifactu_config TO authenticated;
GRANT SELECT ON public.verifactu_registros   TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
