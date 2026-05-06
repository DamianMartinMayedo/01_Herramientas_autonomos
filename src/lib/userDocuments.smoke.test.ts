import { describe, it, expect } from 'vitest'
import { supabase } from './supabaseClient'
import type { UserDocumentTable } from './userDocuments'

const TABLES: UserDocumentTable[] = [
  'facturas',
  'presupuestos',
  'albaranes',
  'contratos',
  'ndas',
  'reclamaciones',
]

const REQUIRED_COLUMNS = ['id', 'user_id', 'datos_json', 'numero', 'notas', 'estado']

const hasSupabaseEnv =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.length > 0

describe.skipIf(!hasSupabaseEnv)('schema smoke — tablas documentales', () => {
  it.each(TABLES)('%s tiene todas las columnas requeridas por userDocuments.ts', async (tabla) => {
    const { error } = await supabase
      .from(tabla)
      .select(REQUIRED_COLUMNS.join(','))
      .limit(0)

    if (error) {
      throw new Error(
        `[schema-smoke] '${tabla}' rechaza columnas requeridas: ${error.message}. ` +
          `Crear migración de reparación: ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS <col> ...; ` +
          `NOTIFY pgrst, 'reload schema';`,
      )
    }
    expect(error).toBeNull()
  })
})
