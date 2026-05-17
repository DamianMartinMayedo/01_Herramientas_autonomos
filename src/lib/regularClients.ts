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

/**
 * Comprueba si ya existe un cliente con el mismo NIF para este usuario.
 * Si `excludeId` se pasa, se ignora ese registro (útil al hacer update).
 * Devuelve el registro existente o null. NIF vacío nunca dispara duplicado
 * (muchos clientes pueden no tener NIF asignado).
 */
async function findClientByNif(userId: string, nif: string, excludeId?: string) {
  const trimmed = nif.trim()
  if (!trimmed) return null
  let query = supabase
    .from('clientes_frecuentes')
    .select('*')
    .eq('user_id', userId)
    .eq('nif', trimmed)
    .limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return ((data ?? [])[0] as RegularClient | undefined) ?? null
}

export async function createRegularClient(userId: string, payload: RegularClientInput) {
  // Defensiva: chequear duplicado por NIF para mismo usuario (no hay UNIQUE
  // en la migración 003). Sin esto, se acumulan clientes idénticos en el
  // dropdown y rompen la lógica de "cliente frecuente".
  const existing = await findClientByNif(userId, payload.nif ?? '')
  if (existing) {
    return {
      data: null as RegularClient | null,
      error: { message: `Ya existe un cliente con el NIF ${payload.nif}: ${existing.nombre}` } as { message: string },
      duplicate: existing,
    }
  }

  const { data, error } = await supabase
    .from('clientes_frecuentes')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()

  return { data: data as RegularClient | null, error, duplicate: null }
}

export async function updateRegularClient(id: string, payload: RegularClientInput, userId?: string) {
  // Si nos pasan userId, chequear que el nuevo NIF no choque con OTRO cliente
  // del mismo usuario. Sin userId mantenemos compat hacia atrás (no valida).
  if (userId) {
    const existing = await findClientByNif(userId, payload.nif ?? '', id)
    if (existing) {
      return {
        data: null as RegularClient | null,
        error: { message: `Ya existe otro cliente con el NIF ${payload.nif}: ${existing.nombre}` } as { message: string },
        duplicate: existing,
      }
    }
  }

  const { data, error } = await supabase
    .from('clientes_frecuentes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  return { data: data as RegularClient | null, error, duplicate: null }
}

export async function deleteRegularClient(id: string) {
  const { error } = await supabase
    .from('clientes_frecuentes')
    .delete()
    .eq('id', id)

  return { error }
}
