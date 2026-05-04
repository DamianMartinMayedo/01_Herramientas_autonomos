# AGENTS.md — HerramientasAutónomos

## Stack
React 19 · TypeScript ~6 · Vite · Supabase (Auth + Postgres + RLS) · React Router 7 · Zustand · react-hook-form 7 · Pure CSS (BEM-ish) · lucide-react

## Estructura
```
src/
├── components/
│   ├── document/      # DocumentEngine (facturas/presupuestos/albaranes)
│   ├── legalDoc/      # LegalDocEngine (contratos/NDAs/reclamaciones)
│   ├── shared/        # EmailModal, AlertModal, ConfirmModal
│   └── ui/           # Button, FormField, Select, Toggle, Spinner, Badge
├── features/
│   ├── {factura,presupuesto,albaran,contrato,nda,reclamacion}/
│   ├── usuario/       # UserPage, DocumentoListado, PerfilPage
│   ├── auth/          # AuthModal, LoginForm, RegisterForm
│   ├── calculadoras/   # CuotaAutónomos, PrecioHora, IvaIrpf
│   └── home/
├── hooks/             # useAuth, useDocumentEngine, useProfile
├── lib/              # supabaseClient, userDocuments, empresa, regularClients
├── store/            # authStore, documentStore, themeStore (Zustand)
├── types/            # document.types, legalDoc.types, auth.types
└── utils/            # formatters, calculos, cn, validarNif, exportPdf
```

## CSS — Regla dorada
**`style={{}}` SOLO para valores runtime** (colores de estado, porcentajes, `--token`). Todo estático → clases CSS.

| Elemento | Clase(s) |
|---|---|
| Botón | `.btn` + `.btn-{primary/secondary/ghost/danger/success}` + `.btn-sm` |
| Card | `.card` + `.card-raised/.no-pad/.interactive` + `.card-accent-{primary/success/copper/purple/teal/gold}` |
| Input | `.input-group` → `.input-label` + `.input-v3` + `.input-hint` |
| Modal admin | `.overlay.overlay-dark.overlay-z200` + `.admin-modal-box.admin-modal-{sm/md/lg}` |
| Modal estándar | `.overlay.overlay-dark.overlay-z60` + `.modal-box.modal-{sm/lg}` |
| Badge | `.badge` + `.badge-{primary/success/copper/purple/teal/gold/error/muted}` |
| Empty state | `.empty-state` + `.empty-state--xl` |

Tokens en `src/index.css`: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, `--transition`

## Guests vs Registrados
- **Guest**: rutas públicas (`/factura`, `/presupuesto`, `/albaran`, `/contrato`, `/nda`, `/reclamacion-pago`). Sin numeración consecutive — número fijo pre-rellenado editable.
- **Registrado**: `/usuario` (ProtectedRoute). Numeración via RPC `next_document_number`. Acceso a empresa, clientes frecuentes, secuencias.

## Motor de documentos
- **DocumentEngine**: facturas/presupuestos/albaranes — `defaultValues`, `onSave`, `onEmail*`, `viewOnlyActions`
- **LegalDocEngine**: contratos/NDAs/reclamaciones — `defaultValues`, `onSave`, `renderForm(props)`, `buildDoc`

**Remount forzado**: cuando se cambia de un documento a otro en el editor de usuario, usar `key={editorId ?? 'new-tipo'}` para forzar desmontaje/remontaje.

## Base de datos
Todas las tablas: `id (UUID PK)`, `user_id (FK auth.users)`, `created_at`, `updated_at`, `datos_json (JSONB)`, RLS: `auth.uid() = user_id`

| Tabla | Numeración |
|---|---|
| facturas | FAC-AAAA-NNN |
| presupuestos | PRE-AAAA-NNN |
| albaranes | ALB-AAAA-NNN |
| contratos | CON-AAAA-NNN |

RPC `next_document_number(p_tipo, p_prefijo, p_user_id, p_fecha)` → `{PREFIJO}-{AAAA}-{NNN}`

## Crear nueva herramienta

**1. Documento formal**: tabla Supabase + `types/*.types.ts` + `features/{tool}/{Tool}Page.tsx` (usa `DocumentEngine` o `LegalDocEngine`) + ruta en router

**2. Calculadora**: `features/calculadoras/` — estado local, sin Supabase, sin auth

```tsx
// Patrón página documento
<DocumentEngine
  tipo="factura"
  defaultValues={...}
  onSave={isGuest ? undefined : async (doc) => { await saveDocument(user.id, doc) }}
  clienteDefault={isGuest ? { nombre: '', email: '' } : undefined}
/>
```

## EmailModal
Siempre precargar `emailCliente` desde `documento.cliente?.email`. En listados, usar fallback:
```ts
function getClienteEmail(row: DocRow): string | undefined {
  return row.cliente_email || row.datos_json?.cliente?.email
}
```

## Comandos
```bash
npm run dev      # Dev
npm run build    # tsc -b && vite build
npm run lint     # eslint .
```

## Reglas
1. NO comentarios salvo que se pidan
2. NO `style={{}}` para estilos estáticos
3. NO commits主动性 — esperar que el usuario lo pida
4. Verificar `tsc --noEmit` antes de entregar cambios de tipos

## Reglas críticas (NUNCA cambiar sin entender el impacto)

Estas reglas, si se cambian, **rompen la app**:

### 1. `select('*')` en listados — `DocumentoListado.tsx:142`
```tsx
.from(tipo).select('*')
```
Las 6 tablas tienen esquemas distintos con columnas desnormalizadas. `*` funciona sin mantener 6 listas de columnas.

### 2. `DocRow = Record<string, any>` — `DocumentoListado.tsx:32`
```tsx
type DocRow = Record<string, any>
```
El `any` es **intencional y contenido**. `unknown` generaría 20+ errores de tipo en accesos como `row.numero`, `row.estado`.

### 3. `key={editorId ?? 'new-tipo'}` en editores — `UserPage.tsx:427,458,498,527,552,566`
```tsx
<FacturaPage key={editorId ?? 'new-factura'} ... />
```
Fuerza remount del formulario al cambiar documento. Sin esto, el form conserva valores anteriores.

### 4. Patrón `active` flag en useEffect async — `DocumentoListado.tsx:136`
```tsx
let active = true
async function fetch() {
  const { data } = await supabase...
  if (!active) return  // Previene setState en componente desmontado
  setRows(data)
}
```
Evita memory leaks cuando el componente se desmonta antes de que termine el async.

### 5. `reset(defaultValues)` en LegalDocEngine — `LegalDocEngine.tsx:113`
```tsx
useEffect(() => { reset(defaultValues) }, [defaultValues, reset])
```
Sincroniza el form cuando `defaultValues` cambia al navegar entre documentos.

### 6. `setEmisorGuardado` actualiza localStorage + store atómico — `documentStore.ts:47`
```tsx
setEmisorGuardado: (emisor) => {
  localStorage.setItem(EMISOR_KEY, JSON.stringify(emisor))
  set({ emisorGuardado: emisor })
}
```
Si se desincronizan, los datos del emisor se pierden.

### 7. RPC `next_document_number` para numeración — `userDocuments.ts`
Todas las funciones de numeración usan este RPC para manejar concurrencia de forma segura.

### 8. `datos_json` JSONB como estructura completa — todas las tablas
Los documentos almacenan la estructura completa en `datos_json` mientras mantienen columnas desnormalizadas (`cliente_nombre`, etc.) para listados.
