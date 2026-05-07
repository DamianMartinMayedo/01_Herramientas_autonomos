#!/usr/bin/env node
// Genera src/types/database.types.ts desde el schema de Supabase.
//
// Usa la Management API directamente (en lugar del binario `supabase` CLI),
// porque el binario se cuelga en algunos entornos (sandbox, redes restringidas).
//
// Requisitos en .env.local:
//   SUPABASE_PROJECT_ID
//   SUPABASE_ACCESS_TOKEN  (Personal Access Token desde
//     https://supabase.com/dashboard/account/tokens)

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Cargar .env.local manualmente (sin dependencias externas)
try {
  const env = await readFile(join(ROOT, '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {
  // .env.local opcional si las vars vienen del entorno
}

const projectId = process.env.SUPABASE_PROJECT_ID
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!projectId) {
  console.error('✗ Falta SUPABASE_PROJECT_ID en .env.local')
  process.exit(1)
}
if (!token) {
  console.error('✗ Falta SUPABASE_ACCESS_TOKEN en .env.local')
  console.error('  Genéralo en https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const url = `https://api.supabase.com/v1/projects/${projectId}/types/typescript`
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
})

if (!res.ok) {
  console.error(`✗ HTTP ${res.status} ${res.statusText}`)
  console.error(await res.text())
  process.exit(1)
}

const json = await res.json()
const outPath = join(ROOT, 'src/types/database.types.ts')
await writeFile(outPath, json.types)

const lines = json.types.split('\n').length
console.log(`✓ Tipos regenerados en src/types/database.types.ts (${lines} líneas)`)
