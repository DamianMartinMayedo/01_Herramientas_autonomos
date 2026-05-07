import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// El cliente queda SIN tipar por ahora porque tipar con `<Database>` revela
// 29 errores TS latentes en código existente (uso de `userId` opcional contra
// columnas no-null, interfaces locales `Factura`/`Presupuesto` divergentes
// del schema, etc.). Esos no son bloqueantes hoy pero conviene irlos limpiando
// antes de activar el tipado completo. Cuando estés listo:
//   1. Cambia abajo a `createClient<Database>(...)`.
//   2. Corre `npx tsc -b --noEmit` y arregla los errores que aparezcan.
//   3. Beneficio: cualquier query nueva queda type-safe contra el schema real.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export del tipo `Database` para uso opt-in en código nuevo:
//   import { supabase } from './supabaseClient'
//   import type { Database } from '../types/database.types'
//   ;(supabase as SupabaseClient<Database>).from('facturas').select('total')
export type { Database }
