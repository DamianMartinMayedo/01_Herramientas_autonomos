import { supabase } from './supabaseClient'
import type {
  VerifactuConfig,
  VerifactuSaveInput,
  VerifactuValidateInput,
  VerifactuValidateResult,
} from '../types/verifactu.types'

// ─── Helpers de presentación ────────────────────────────────────────────────

function parseDN(dn: string): Record<string, string> {
  // Parser simple por comas. Funciona para FNMT/ACCV (sin comas dentro de valores).
  const out: Record<string, string> = {}
  for (const part of dn.split(',')) {
    const idx = part.indexOf('=')
    if (idx < 1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k && !(k in out)) out[k] = v
  }
  return out
}

// "C=ES, serialNumber=IDCES-X, givenName=DAMIAN, surname=MARTIN MAYEDO, CN=MARTIN MAYEDO DAMIAN - X"
//   → "DAMIAN MARTIN MAYEDO"
export function nombreTitularFromSubject(subject: string | null | undefined): string {
  if (!subject) return '—'
  const f = parseDN(subject)
  if (f.givenName || f.surname) {
    return [f.givenName, f.surname].filter(Boolean).join(' ').trim() || subject
  }
  if (f.CN) {
    // Quita el sufijo " - NIF" típico del CN de FNMT
    return f.CN.replace(/\s*-\s*[A-Z0-9]+\s*$/i, '').trim() || f.CN
  }
  if (f.O) return f.O
  return subject
}

// "C=ES, O=FNMT-RCM, OU=Ceres, CN=AC FNMT Usuarios" → "AC FNMT Usuarios"
export function autoridadFromIssuer(issuer: string | null | undefined): string {
  if (!issuer) return '—'
  const f = parseDN(issuer)
  return f.CN || f.O || issuer
}

export function formatFechaCaducidad(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── API ────────────────────────────────────────────────────────────────────

// Lee un File como base64 (sin el prefijo "data:...;base64,").
async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el archivo'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Error leyendo el archivo'))
    reader.readAsDataURL(file)
  })
}

async function invokeVerifactuConfig(body: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke('verifactu-config', { body })
  if (error) return { data: null, error: new Error(error.message) }
  return { data, error: null }
}

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
  let cert_base64: string
  try {
    cert_base64 = await fileToBase64(input.cert_file)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo leer el archivo' }
  }

  const { data, error } = await invokeVerifactuConfig({
    action: 'validate',
    cert_base64,
    cert_password: input.cert_password,
  })
  if (error) return { ok: false, error: error.message }

  const res = data as VerifactuValidateResult
  return res ?? { ok: false, error: 'Respuesta vacía del servidor' }
}

export async function saveVerifactuConfig(
  input: VerifactuSaveInput,
): Promise<{ ok: boolean; error?: string }> {
  let cert_base64: string
  try {
    cert_base64 = await fileToBase64(input.cert_file)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo leer el archivo' }
  }

  const { data, error } = await invokeVerifactuConfig({
    action: 'save',
    cert_base64,
    cert_password: input.cert_password,
    modo: input.modo,
    entorno: input.entorno,
  })
  if (error) return { ok: false, error: error.message }

  const res = data as { ok?: boolean; error?: string }
  if (!res?.ok) return { ok: false, error: res?.error ?? 'No se pudo activar VeriFactu' }
  return { ok: true }
}

export async function disableVerifactu(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await invokeVerifactuConfig({ action: 'disable' })
  if (error) return { ok: false, error: error.message }

  const res = data as { ok?: boolean; error?: string }
  if (!res?.ok) return { ok: false, error: res?.error ?? 'No se pudo desactivar VeriFactu' }
  return { ok: true }
}

export async function enableVerifactu(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await invokeVerifactuConfig({ action: 'enable' })
  if (error) return { ok: false, error: error.message }

  const res = data as { ok?: boolean; error?: string }
  if (!res?.ok) return { ok: false, error: res?.error ?? 'No se pudo activar VeriFactu' }
  return { ok: true }
}

export interface EmitirRegistroResult {
  ok: boolean
  alreadyRegistered?: boolean
  registro?: { id: string; hash: string; qr_url: string }
  error?: string
}

export async function emitirRegistroFactura(facturaId: string): Promise<EmitirRegistroResult> {
  const { data, error } = await supabase.functions.invoke('verifactu-emit-registro', {
    body: { factura_id: facturaId },
  })
  if (error) return { ok: false, error: error.message }
  return data as EmitirRegistroResult
}
