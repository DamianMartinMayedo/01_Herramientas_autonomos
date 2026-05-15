export type VerifactuModo = 'no_verificable' | 'veri_factu'
export type VerifactuEntorno = 'test' | 'produccion'

export interface VerifactuConfig {
  user_id: string
  enabled: boolean
  modo: VerifactuModo
  entorno: VerifactuEntorno
  cert_storage_path: string | null
  cert_password_secret_id: string | null
  cert_serial: string | null
  cert_subject: string | null
  cert_issuer: string | null
  cert_expires_at: string | null
  nif_titular: string | null
  last_test_ok_at: string | null
  created_at: string
  updated_at: string
}

export interface VerifactuCertMetadata {
  cert_serial: string
  cert_subject: string
  cert_issuer: string
  cert_expires_at: string
  nif_titular: string
}

export interface VerifactuValidateInput {
  cert_file: File
  cert_password: string
  nif_empresa: string
}

export interface VerifactuValidateResult {
  ok: boolean
  metadata?: VerifactuCertMetadata
  error?: string
}

export interface VerifactuSaveInput {
  cert_file: File
  cert_password: string
  modo: VerifactuModo
  entorno: VerifactuEntorno
}
