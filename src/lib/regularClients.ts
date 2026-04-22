import { supabase } from './supabaseClient'
import type { RegularClient, RegularClientInput } from '../types/regularClient.types'

export async function listRegularClients(userId: string) {
  const { data, error } = await supabase
    .from('clientes_frecuentes')
    .select('*')
    .eq('user_id', userId)
    .order('nombre', { ascending: true })

  return { data: (data ?? []) as RegularClient[], error }
}

export async function createRegularClient(userId: string, payload: RegularClientInput) {
  const { data, error } = await supabase
    .from('clientes_frecuentes')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()

  return { data: data as RegularClient | null, error }
}

export async function updateRegularClient(id: string, payload: RegularClientInput) {
  const { data, error } = await supabase
    .from('clientes_frecuentes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  return { data: data as RegularClient | null, error }
}

export async function deleteRegularClient(id: string) {
  const { error } = await supabase
    .from('clientes_frecuentes')
    .delete()
    .eq('id', id)

  return { error }
}
