/**
 * scripts/seed-blog-posts.mjs
 * Lee /tmp/old_blogStore.ts (extraído del git), evalúa los seeds y los sube
 * a Supabase via la edge function admin-blog-posts/import (upsert por slug).
 *
 * Uso:
 *   node scripts/seed-blog-posts.mjs
 *
 * Requiere VITE_SUPABASE_URL y ADMIN_CREATE_USER_SECRET en el entorno (o .env.local).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar .env.local si existe (sin librería externa)
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/)
    if (!m) continue
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* sin .env.local */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ADMIN_SECRET = process.env.VITE_ADMIN_CREATE_SECRET ?? process.env.ADMIN_CREATE_USER_SECRET

if (!SUPABASE_URL || !ADMIN_SECRET) {
  console.error('Faltan VITE_SUPABASE_URL y/o VITE_ADMIN_CREATE_SECRET en el entorno.')
  process.exit(1)
}

// Leer el blogStore antiguo, aislar SEED_POST y SEO_POSTS y evaluarlos.
const src = readFileSync('/tmp/old_blogStore.ts', 'utf8')

function extractBlock(label) {
  // Encuentra `const LABEL = ...` hasta el cierre del array/objeto principal.
  const startIdx = src.indexOf(`const ${label}`)
  if (startIdx === -1) throw new Error(`No se encontró ${label}`)
  // Saltar hasta el primer "=" y luego al primer "{" o "["
  const equalIdx = src.indexOf('=', startIdx)
  const bodyStart = (() => {
    for (let i = equalIdx + 1; i < src.length; i++) {
      const c = src[i]
      if (c === '{' || c === '[') return i
    }
    return -1
  })()
  if (bodyStart === -1) throw new Error(`Cuerpo no localizable para ${label}`)
  // Avanzar hasta el cierre con balance.
  const open = src[bodyStart]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  let strChar = ''
  for (let i = bodyStart; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === strChar) inStr = false
      continue
    }
    if (c === '`' || c === "'" || c === '"') { inStr = true; strChar = c; continue }
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return src.slice(bodyStart, i + 1)
    }
  }
  throw new Error(`No se cerró el bloque ${label}`)
}

const seedPostSrc = extractBlock('SEED_POST')
const seoPostsSrc = extractBlock('SEO_POSTS')

// Evaluar como JS (los template strings y tipos TS son tolerables por eval).
// Strip type annotations would be needed for stricter TS; aquí basta porque los
// bloques son objetos/arrays puros.
const SEED_POST = eval('(' + seedPostSrc + ')')
const SEO_POSTS = eval('(' + seoPostsSrc + ')')

const all = [SEED_POST, ...SEO_POSTS]

const payload = all.map(p => ({
  titulo:        p.titulo,
  slug:          p.slug,
  extracto:      p.extracto,
  contenido:     p.contenido,
  tags:          Array.isArray(p.tags) ? p.tags : [],
  status:        p.status ?? 'published',
  published_at:  p.publishedAt ?? new Date().toISOString(),
}))

console.log(`Subiendo ${payload.length} artículos a Supabase…`)

const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-blog-posts/import`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
  },
  body: JSON.stringify({ posts: payload }),
})
const json = await res.json()
if (!res.ok) {
  console.error('Error:', json)
  process.exit(1)
}
console.log(`✓ Importados ${json.imported} artículos (idempotente por slug).`)
