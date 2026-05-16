-- ============================================
-- MIGRACIÓN 022: Helpers de Vault para passwords de certificados VeriFactu
-- ============================================
-- Wrappers SECURITY DEFINER alrededor de supabase_vault para que la edge function
-- (que corre como service_role) pueda crear / leer / eliminar la contraseña del
-- certificado .pfx de cada usuario sin tocar el schema `vault` directamente.
-- ============================================

BEGIN;

-- Crear secret para la password del cert. Devuelve el uuid del secret en vault.
CREATE OR REPLACE FUNCTION public.verifactu_create_password_secret(
  p_user_id  UUID,
  p_password TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  v_secret_id := vault.create_secret(
    p_password,
    'verifactu_cert_pwd_' || p_user_id::text,
    'Password del .pfx VeriFactu del usuario ' || p_user_id::text
  );
  RETURN v_secret_id;
END;
$$;

-- Leer la password descifrada (solo service_role). Necesaria para la fase B
-- (emit-registro), no se usa en config. La dejo lista.
CREATE OR REPLACE FUNCTION public.verifactu_get_password_secret(
  p_secret_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_password TEXT;
BEGIN
  SELECT decrypted_secret
    INTO v_password
    FROM vault.decrypted_secrets
   WHERE id = p_secret_id;
  RETURN v_password;
END;
$$;

-- Borrar secret existente (al reemplazar certificado).
CREATE OR REPLACE FUNCTION public.verifactu_delete_password_secret(
  p_secret_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE id = p_secret_id;
  RETURN FOUND;
END;
$$;

-- Lockdown: solo service_role puede ejecutar estas funciones.
REVOKE ALL ON FUNCTION public.verifactu_create_password_secret(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verifactu_create_password_secret(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.verifactu_create_password_secret(UUID, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.verifactu_create_password_secret(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.verifactu_get_password_secret(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verifactu_get_password_secret(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.verifactu_get_password_secret(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.verifactu_get_password_secret(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.verifactu_delete_password_secret(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verifactu_delete_password_secret(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.verifactu_delete_password_secret(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.verifactu_delete_password_secret(UUID) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
