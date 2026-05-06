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
├── hooks/             # useAuth, useProfile, useDocumentEngine, useClienteExteriorRules
├── lib/              # supabaseClient, userDocuments, empresa, regularClients
├── store/            # documentStore (persist), themeStore (persist), authStore (wrappers supabase)
├── types/            # document.types, legalDoc.types, profile, docRow.types
└── utils/            # formatters, calculos, cn, validarNif, exportPdf
```

## CSS — Regla dorada

**Estilos estáticos → clases CSS. `style={{}}` sólo cuando el valor lo justifica.**

`style={{}}` permitido únicamente cuando:
- El valor se calcula en runtime: colores de estado (`estadoColor`), porcentajes (`width: ${pct}%`), posición de un dropdown.
- CSS custom property dinámica como token: `--pill-color: estadoColor`, `--i: index`, `--confirm-bg`.
- `fontVariantNumeric: 'tabular-nums'` (excepción explícita).
- Override de **una sola propiedad** sobre una clase base (ej. `marginTop: 2`, `color: meta.ctaColor`).
- Componentes PDF — `DocumentEngine`, `LegalDocEngine`, `LegalDocPreview` están exentos del scrutiny normal porque su salida debe ser visualmente fija (papel) e independiente del tema.

Antes de escribir `style={{}}` pregúntate: *¿este valor cambia entre renders?* Si no → va en una clase CSS.

| Elemento | Clase(s) |
|---|---|
| Botón | `.btn` + `.btn-{primary/secondary/ghost/danger/success}` + `.btn-sm` |
| Card | `.card` + `.card-raised/.no-pad/.interactive` + `.card-accent-{primary/success/copper/purple/teal/gold}` |
| Input | `.input-group` → `.input-label` + `.input-v3` + `.input-hint` |
| Modal admin | `.overlay.overlay-dark.overlay-z200` + `.admin-modal-box.admin-modal-{sm/md/lg}` |
| Modal estándar | `.overlay.overlay-dark.overlay-z60` + `.modal-box.modal-{sm/lg}` |
| Badge | `.badge` + `.badge-{primary/success/copper/purple/teal/gold/error/muted}` |
| Pill de estado | `.status-pill` + `.status-pill--{gold/error}` (color custom: `style={{ '--pill-color': X } as React.CSSProperties}`) |
| Empty state | `.empty-state` + `.empty-state--xl` |
| Calculadora | `.calc-card-pad`, `.calc-grid` + `.calc-grid--{2/3/2-min0}`, `.calc-result--{copper/teal/purple}`, `.tool-icon-box--{copper/teal/purple}` |
| Listado de docs | `.filter-row`, `.list-empty-msg`, `.pagination-row`, `.status-cell`, `.data-td--meta`, `.data-td-right--strong` |

Tokens en `src/index.css`: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, `--transition`. Para inventario completo de clases → `/css-guide`.

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

### 1. `select('*')` en listados — `DocumentoListado.tsx:141`
```tsx
.from(tipo).select('*')
```
Las 6 tablas tienen esquemas distintos con columnas desnormalizadas. `*` funciona sin mantener 6 listas de columnas.

### 2. `DocRow = Record<string, any>` — `types/docRow.types.ts:6`
```tsx
export type DocRow = Record<string, any>
```
El `any` es **intencional y contenido** (con `eslint-disable` justificado). `unknown` generaría 20+ errores de tipo en accesos como `row.numero`, `row.estado`. `DocumentoListado` lo importa desde `types/`.

### 3. `key={editorId ?? 'new-tipo'}` en editores — `UserPage.tsx:447,478,519,...`
```tsx
<FacturaPage key={editorId ?? 'new-factura'} ... />
```
Fuerza remount del formulario al cambiar documento. Sin esto, el form conserva valores anteriores.

### 4. Patrón `active` flag en useEffect async — `DocumentoListado.tsx:135`
```tsx
let active = true
async function fetch() {
  const { data } = await supabase...
  if (!active) return  // Previene setState en componente desmontado
  setRows(data)
}
```
Evita memory leaks cuando el componente se desmonta antes de que termine el async.

### 5. `reset(defaultValues)` en LegalDocEngine — `LegalDocEngine.tsx:121-123`
```tsx
useEffect(() => { reset(defaultValues as DefaultValues<T>) }, [defaultValues, reset])
```
Sincroniza el form cuando `defaultValues` cambia al navegar entre documentos.

### 6. `documentStore.emisorGuardado` persistido vía `persist` middleware — `documentStore.ts`
Zustand `persist` con `partialize` restringe la persistencia a `emisorGuardado`. `onRehydrateStorage` migra la clave legacy `ha_emisor` (versión previa con `localStorage` manual) a la nueva `ha-document-store` y la borra. Tests cubren esa migración en `documentStore.test.ts`.

### 7. RPC `next_document_number` + factory `getNextNumero` — `userDocuments.ts:70-89`
```tsx
async function getNextNumero(userId, tipo, prefijo) { /* RPC */ }
const getNextPresupuestoNumero = (uid) => getNextNumero(uid, 'presupuesto', 'PRE')
// + 4 wrappers más (factura, albaran, rectificativa, contrato)
```
La RPC garantiza concurrencia segura. La factory evita duplicación entre los 5 tipos.

### 8. `datos_json` JSONB como estructura completa — todas las tablas
Los documentos almacenan la estructura completa en `datos_json` mientras mantienen columnas desnormalizadas (`cliente_nombre`, etc.) para listados.

### 9. `useAuth` vs `useProfile` — separación de responsabilidades
- `useAuth()` expone sólo `{ user, isAuthenticated, loading }` (sesión Supabase).
- `useProfile()` carga la fila de `profiles` y expone `{ profile, plan, isPremium, ... }`.
- No leas `profile/plan/isPremium` desde `useAuth`. No están ahí.

### 10. Migraciones de reparacion al añadir columnas — `writeRowWithRetry`
`writeRowWithRetry` (`userDocuments.ts:44`) maneja columnas faltantes en la BD. Para columnas secundarias (`numero`, `notas`, etc.) las elimina del payload y reintenta (con `console.warn`). Pero **`datos_json` es una columna crítica**: si falta, el guardado se **rechaza** (devuelve error) para evitar corromper datos irreversiblemente.

**Al añadir una columna nueva a una tabla existente, crear SIEMPRE una migracion de reparacion** (`NNNb_reparar_{tabla}.sql`) que ejecute `ALTER TABLE ADD COLUMN IF NOT EXISTS` para cada columna que pueda faltar. Patron: `010b_reparar_contratos.sql`, `012b_reparar_ndas.sql`.

Si ves `console.warn('[writeRowWithRetry] Columna...')` en consola, la tabla no tiene la estructura esperada: crear migracion de reparacion.
