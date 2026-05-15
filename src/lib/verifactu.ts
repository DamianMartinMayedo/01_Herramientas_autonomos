import { supabase } from './supabaseClient'
import type {
  VerifactuConfig,
  VerifactuSaveInput,
  VerifactuValidateInput,
  VerifactuValidateResult,
} from '../types/verifactu.types'

// La edge function `verifactu-config` aún no está desplegada. Mientras tanto, el wizard
// usa un backend simulado para que la UI sea probable en local. Cambiar a false cuando
// la function exista (acción `validate` / `save` / `disable`).
const MOCK_BACKEND = true

export async function getVerifactuConfig(
  userId: string,
): Promise<{ data: VerifactuConfig | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_verifactu_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return {
    data: (data as VerifactuConfig | null) ?? null,
    error: error ? new Error(error.message) : null,
  }
}

export async function validateCertificate(
  input: VerifactuValidateInput,
): Promise<VerifactuValidateResult> {
  if (MOCK_BACKEND) {
    await new Promise((r) => setTimeout(r, 600))
    if (!input.cert_password) {
      return { ok: false, error: 'La contraseña del certificado no puede estar vacía.' }
    }
    if (input.cert_file.size === 0) {
      return { ok: false, error: 'El archivo del certificado está vacío.' }
    }
    return {
      ok: true,
      metadata: {
        cert_serial: 'MOCK-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
        cert_subject: `CN=Titular Demo, SERIALNUMBER=${input.nif_empresa}`,
        cert_issuer: 'CN=AC FNMT Usuarios, OU=Ceres, O=FNMT-RCM, C=ES',
        cert_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        nif_titular: input.nif_empresa,
      },
    }
  }
  throw new Error('verifactu-config edge function aún no desplegada')
}

export async function saveVerifactuConfig(
  input: VerifactuSaveInput,
): Promise<{ ok: boolean; error?: string }> {
  if (MOCK_BACKEND) {
    await new Promise((r) => setTimeout(r, 700))
    void input
    return { ok: true }
  }
  throw new Error('verifactu-config edge function aún no desplegada')
}

export async function disableVerifactu(): Promise<{ ok: boolean; error?: string }> {
  if (MOCK_BACKEND) {
    await new Promise((r) => setTimeout(r, 300))
    return { ok: true }
  }
  throw new Error('verifactu-config edge function aún no desplegada')
}
