#!/usr/bin/env node
// Scaffolder de herramienta documental nueva.
// Uso: npm run new:doc-tool -- --name carta-despido --family legal [--prefix CDE]
//
// Genera:
//   - supabase/migrations/NNN_create_<tabla>.sql (desde plantilla)
//   - src/types/<name>.types.ts (stub)
//   - src/features/<name>/<Name>Page.tsx (stub)
//
// NO toca documentRegistry.ts ni DocumentoListado.tsx ni UserPage.tsx —
// imprime los snippets a pegar manualmente con instrucciones claras.

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ───── parse args ──────────────────────────────────────
const args = process.argv.slice(2)
const arg = (name) => {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 ? args[idx + 1] : null
}

const nameKebab = arg('name')
const family = arg('family')
let prefix = arg('prefix')

if (!nameKebab || !family) {
  console.error('Uso: npm run new:doc-tool -- --name <kebab-name> --family <legal|business> [--prefix XXX]')
  process.exit(1)
}
if (!/^[a-z][a-z0-9-]*$/.test(nameKebab)) {
  console.error('--name debe ser kebab-case (minúsculas, dígitos y guiones; empieza por letra)')
  process.exit(1)
}
if (!['legal', 'business'].includes(family)) {
  console.error('--family debe ser "legal" o "business"')
  process.exit(1)
}

// ───── derive names ────────────────────────────────────
const namePascal = nameKebab
  .split('-')
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join('')
const nameCamel = namePascal[0].toLowerCase() + namePascal.slice(1)
const tableSnake = nameKebab.replace(/-/g, '_')
const tableName = tableSnake.endsWith('s') ? tableSnake : tableSnake + 's'
if (!prefix) {
  prefix = nameKebab
    .split('-')
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 3)
}
const sequenceTipo = tableSnake.replace(/s$/, '')

// ───── existing migration index ────────────────────────
const migDir = join(ROOT, 'supabase/migrations')
const migs = await readdir(migDir)
const numbers = migs
  .map((f) => parseInt((f.match(/^(\d+)/) || [])[1] ?? '0', 10))
  .filter((n) => Number.isFinite(n) && n > 0)
const nextNum = String(Math.max(0, ...numbers) + 1).padStart(3, '0')

// ───── migration SQL ───────────────────────────────────
const tpl = await readFile(join(migDir, '_TEMPLATE_nueva_tabla_documental.sql'), 'utf8')
const migSql = tpl.replace(/<TABLA>/g, tableName)
const migPath = join(migDir, `${nextNum}_create_${tableName}.sql`)
await writeNoOverwrite(migPath, migSql)

// ───── types stub ──────────────────────────────────────
const typesContent = family === 'legal'
  ? `import type { ParteLegal, MetadatosLegal } from './legalDoc.types'

export interface ${namePascal}Doc {
  tipo: '${nameCamel}'
  metadatos: MetadatosLegal
  cliente: ParteLegal
  // TODO: añade los campos específicos de la herramienta
  notas?: string
}
`
  : `import type { DocumentoBase } from './document.types'

// Si la herramienta sigue el modelo factura/presupuesto/albarán (líneas + totales),
// puedes reusar DocumentoBase directamente. Si no, define una interfaz aquí.
export type ${namePascal}Doc = DocumentoBase
`
const typesPath = join(ROOT, `src/types/${nameCamel}.types.ts`)
await writeNoOverwrite(typesPath, typesContent)

// ───── page stub ───────────────────────────────────────
const pageDir = join(ROOT, `src/features/${nameKebab}`)
await mkdir(pageDir, { recursive: true })
const pageContent = `// Página editor para ${namePascal}.
// TODO: implementar con LegalDocEngine (legal) o DocumentEngine (business).
// Mira features/contrato/ContratoPage.tsx o features/factura/FacturaPage.tsx como referencia.

export interface ${namePascal}PageProps {
  embedded?: boolean
  onBack?: () => void
  // TODO: añadir las props que necesites (defaultValues, onSave, saving, etc.)
}

export function ${namePascal}Page(_props: ${namePascal}PageProps) {
  return <div>${namePascal}Page — TODO</div>
}
`
const pagePath = join(pageDir, `${namePascal}Page.tsx`)
await writeNoOverwrite(pagePath, pageContent)

// ───── snippets to paste manually ──────────────────────
const registrySnippet = `
const ${nameCamel}Entry: DocumentRegistryEntry<${namePascal}Doc> = {
  table: '${tableName}',
  family: '${family}',
  sequenceTipo: '${sequenceTipo}',
  sequencePrefijo: '${prefix}',
  label: { singular: '${nameKebab.replace(/-/g, ' ')}', plural: '${namePascal}s' },
  routePath: '/${nameKebab}',
  estados: ['borrador', 'enviado'] as const,  // TODO: ajusta los estados
  estadoBorrador: 'borrador',
  estadoFinalizado: 'enviado',
  listado: {
    articuloFemenino: false,                  // TODO: ¿es femenino?
    campoTitulo: 'numero',
    campoSecundario: 'cliente_nombre',        // TODO: ajusta a la columna real
  },
  async assignNumero({ document, finalizar, userId, id }) {
    // TODO: política de numeración (ver patrón en contratosEntry / facturasEntry)
    if (id) return { numero: null, error: null }
    return getNextNumero(userId, '${sequenceTipo}', '${prefix}')
  },
  buildPayload({ document, numero, finalizar, userId, id }) {
    // TODO: devuelve el payload SQL (ver patrón en contratosEntry / facturasEntry)
    return {
      user_id: userId,
      numero,
      // …
      datos_json: { ...document },
    }
  },
}
`.trimStart()

const userPageSnippet = `
if (section === '${tableName}') {
  return (
    <${namePascal}Page
      key={editor.id ?? 'new-${nameKebab}'}
      embedded
      onBack={closeEditor}
      // TODO: pásale defaultValues, onSave, etc. siguiendo el patrón de los otros editores
    />
  )
}
`.trimStart()

console.log(`
✓ Generados:
  - ${relativize(migPath)}
  - ${relativize(typesPath)}
  - ${relativize(pagePath)}

📋 Próximos pasos manuales:

1. Añadir entrada al registry — pega esto en src/lib/documentRegistry.ts
   ANTES de la línea \`export const documentRegistry = {\`, y luego
   añade \`${tableName}: ${nameCamel}Entry,\` dentro del objeto:

${registrySnippet}

2. Añadir rama de editor en src/features/usuario/UserPage.tsx
   (importa la página al inicio del archivo y pega esto en el switch
   de \`renderEditor\`):

import { ${namePascal}Page } from '../${nameKebab}/${namePascal}Page'

${userPageSnippet}

3. Añadir render en src/features/usuario/DocumentoListado.tsx
   (los \`renderXRow\` y la rama del dropdown de acciones siguen el
   patrón table-específico — duplica el más parecido a tu caso).

4. Añadir ruta en el router (si quieres acceso público también).

5. Ejecutar la migración SQL en Supabase Dashboard:
   - Pega ${relativize(migPath)} en SQL Editor
   - Sustituye <TABLA> si quedó sin reemplazar (no debería)
   - Run

6. Regenerar tipos:
   $ npm run gen:types

7. Verificar:
   $ npm run test         # smoke test debe pasar para ${tableName}
   $ npm run build
`)

// ───── helpers ─────────────────────────────────────────
async function writeNoOverwrite(path, content) {
  try {
    await stat(path)
    console.error(`✗ Ya existe: ${relativize(path)} (no sobreescribo)`)
    process.exit(1)
  } catch {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  }
}

function relativize(p) {
  return p.startsWith(ROOT) ? p.slice(ROOT.length + 1) : p
}
