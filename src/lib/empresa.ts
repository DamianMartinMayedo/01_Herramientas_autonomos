import { supabase } from './supabaseClient'
import type { Empresa } from '../types/empresa.types'

export async function getEmpresa(userId: string): Promise<{ data: Empresa | null; error: unknown }> {
  const { data, error } = await supabase
    .from('empresa')
    .select('nombre, nif, email, direccion, cp, ciudad, provincia, telefono')
    .eq('id', userId)
    .single()

  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return { data: null, error: null }
    return { data: null, error }
  }

  return { data: data as Empresa, error: null }
}

export async function saveEmpresa(userId: string, empresa: Empresa): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('empresa')
    .upsert({ id: userId, ...empresa }, { onConflict: 'id' })

  return { error }
}

export async function hasEmpresa(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('empresa')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  return data !== null
}
