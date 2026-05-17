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

### Clases fundamentales del sistema

| Necesito… | Clase(s) |
|---|---|
| Botón principal | `btn btn-primary` |
| Botón secundario | `btn btn-secondary` |
| Botón peligro | `btn btn-danger` |
| Botón éxito | `btn btn-success` |
| Botón aviso (gold) | `btn btn-warning` |
| Botón cobre | `btn btn-copper` |
| Botón fantasma (texto + hover sutil) | `btn btn-ghost` |
| Botón blanco sobre fondo azul | `btn btn-white` |
| Botón blanco sobre fondo cobre | `btn btn-white-copper` |
| Botón confirmación (color dinámico) | `btn btn-confirm` (con `--confirm-bg`, `--confirm-border`, `--confirm-color`, `--confirm-shadow`, `--confirm-hover-bg`) |
| Botón pequeño | añadir `btn-sm` |
| Botón grande | añadir `btn-lg` |
| Botón centrado | añadir `btn-center` |
| Icono de acción 32px | `icon-btn` |
| Icono con hover rojo | `icon-btn icon-btn--danger` |
| Icono con hover verde | `icon-btn icon-btn--success` |
| Icono con hover azul | `icon-btn icon-btn--primary` |
| Icono con hover dorado | `icon-btn icon-btn--gold` |
| Card base | `card` |
| Card con sombra (4px) | `card card-raised` |
| Card con sombra ligera (3px) | `card card-raised-sm` |
| Card con padding reducido | `card card-sm` |
| Card sin padding (tabla) | `card card-no-pad` |
| Card en flex-col con gap | `card card-flex` |
| Card interactiva (hover lift) | añadir `card-interactive` |
| Card desactivada | añadir `card-disabled` |
| Card con acento de color | añadir `card-accent-{primary/success/copper/purple/teal/gold}` |
| Modal admin (borde brutal) | `overlay overlay-dark overlay-z200` + `admin-modal-box admin-modal-{sm/md/lg}` |
| Modal estándar (preview) | `overlay overlay-dark overlay-z60` + `modal-box modal-{sm/lg}` |
| Cerrar modal | `modal-close-btn` |
| Dropdown de acciones (wrapper + caja) | `dropdown-wrap` + `dropdown-menu` (portal + `position:fixed`) |
| Item del dropdown | `dropdown-item` (+ `dropdown-item--danger` para destructivo) |
| Separador entre grupos del dropdown | `dropdown-divider` |
| Input | `input-group` > `input-label` + `input-v3` + `input-hint` |
| Input con error | añadir `is-error` + `input-error-msg` |
| Estado vacío | `empty-state` (o `empty-state--xl`) |
| Tabla de datos | `data-table` + `data-thead-row` + `data-th/td/tr` |
| Toggle activo/inactivo | `toggle-btn toggle-btn--active` / `toggle-btn--inactive` |
| Pill de filtro | `filter-pill` (`.active` cuando seleccionado) |
| Badge | `badge badge-{primary/success/muted/gold/error…}` |
| Pill de estado (color custom) | `status-pill` + `status-pill--{gold/error}` (color custom: `style={{ '--pill-color': X } as React.CSSProperties}`) |
| Spinner | `spinner spinner-md spinner-primary` |
| Link sin decoración | `link-block` |
| Fila de documento usuario | `doc-row` + `doc-row-title` + `doc-row-meta` + `doc-row-price` |
| Calculadora | `calc-card-pad`, `calc-grid` + `calc-grid--{2/3/2-min0}`, `calc-result--{copper/teal/purple}`, `tool-icon-box--{copper/teal/purple}` |
| Listado de docs | `filter-row`, `list-empty-msg`, `pagination-row`, `status-cell`, `data-td--meta`, `data-td-right--strong` |

Tokens en `src/index.css`: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, `--transition`.

> **Inventario exhaustivo de clases con ejemplos JSX → [CSS-GUIDE.md](CSS-GUIDE.md)** (lectura obligatoria antes de escribir nuevas clases o tocar componentes con estilos no triviales).

### Checklist antes de entregar código con estilos

- [ ] Cada `style={{}}` tiene justificación de valor dinámico
- [ ] Botones usan `.btn` con variante
- [ ] Iconos de acción usan `.icon-btn` con modificador de color
- [ ] Modales usan `.overlay` + `.admin-modal-box` o `.modal-box`
- [ ] Dropdowns de acciones usan `.dropdown-menu`/`.dropdown-item` portalizados a `document.body` con `position: fixed` (nunca dropdowns inline con `position: absolute`)
- [ ] Inputs usan `.input-group` + `.input-v3`
- [ ] Estados vacíos usan `.empty-state`
- [ ] Nuevas clases añadidas usan tokens `var(--color-*)`, `var(--space-*)`, nunca hex ni px hardcodeados
- [ ] Si toco un componente que se ve sobre fondo oscuro, verifiqué en dark mode que iconos, sombras y bordes son visibles

### Modo oscuro — comportamiento

El toggle dark/light vive en Zustand (`src/store/themeStore.ts`); `App.tsx` aplica clase `.dark` y atributo `data-theme="dark"` en `<html>`. Casi todo el CSS funciona automáticamente porque los tokens cambian de valor entre `:root, [data-theme="light"]` y `.dark, [data-theme="dark"]`.

Reglas que importan al escribir CSS:

- **Hovers de botón en dark NO cambian background.** El efecto "lift" lo da `box-shadow` (3px → 5px) + `transform: translate(-2px, -2px)`. Si tu botón nuevo define `:hover { background: ... }` para light, en dark queda neutralizado por overrides genéricos en `index.css`.
- **`color-scheme: light/dark`** se aplica al `<html>` automáticamente. Iconos nativos del navegador (calendario en `<input type="date">`, time pickers) se invierten solos en dark.
- **Tokens nuevos disponibles:** `--color-error-hover`, `--color-error-active`, `--color-error-subtle` (en ambos modos).
- **Tokens que NO existen** y suelen causar iconos negros: `--color-blue`, `--color-warning`, `--color-orange`. Usar paleta principal (`--color-primary`, `--color-gold`, `--color-copper`).

Cuándo añadir override explícito `[data-theme="dark"] .mi-clase`:

- SVG en data-URI con stroke/fill hardcoded (chevron de `.select-v3`).
- Sombras `rgba(0,0,0,...)` que se pierden sobre fondo oscuro (`.modal-box`, `.tooltip-content`, `.doc-flash`) — añadir ring blanco tenue + sombra negra profunda.
- Background sólido cuyo token claro pierde fuerza como botón (`.btn-danger` usa rojo saturado `#DA3D3D` en dark).
- Botones blancos sobre fondos de COLOR (`.btn-white`, `.btn-white-copper`) deben mantenerse `#FFFFFF` siempre — no usar `var(--color-white)` que en dark se oscurece.

### Tablas Supabase — GRANTs obligatorios (regla activa desde mayo 2026)

Toda tabla nueva en `public` **debe incluir GRANTs explícitos** o PostgREST devuelve error `42501`. La plantilla `supabase/migrations/_TEMPLATE_nueva_tabla_documental.sql` ya los incluye. No omitirlos al copiar la plantilla.

```sql
GRANT SELECT                             ON public.<tabla> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<tabla> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<tabla> TO service_role;
```

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

> **Si la herramienta es documental con tabla propia**: ver Regla #10 abajo para el checklist completo. Resumen: copiar `supabase/migrations/_TEMPLATE_nueva_tabla_documental.sql` + dejar `NOTIFY pgrst, 'reload schema';` al final + añadir la tabla a `UserDocumentTable` en `userDocuments.ts` + correr `npm run test`.

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
npm run dev        # Dev
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run test       # vitest (incluye smoke test contra Supabase real)
npm run gen:types  # regenera src/types/database.types.ts desde el schema de Supabase
```

### Tipos de Supabase generados

El tipo `Database` vive en `src/types/database.types.ts` y se **regenera** desde el schema real de la BD con `npm run gen:types`. El script (`scripts/gen-types.mjs`) llama directamente a la Management API de Supabase (no al binario CLI, que se cuelga en algunos entornos sandbox).

**Setup inicial (una vez por máquina)**:
1. Generar Personal Access Token en https://supabase.com/dashboard/account/tokens (recomendado: 90 días).
2. Añadir a `.env.local`:
   ```
   SUPABASE_PROJECT_ID=<project-id>
   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx
   ```
3. `npm run gen:types`

**Después de cada migración** (añadir columna, crear tabla, modificar RPC): correr `npm run gen:types` y commitear el archivo regenerado.

**Estado actual del tipado del cliente**: `supabase` está SIN tipar (`createClient(...)` sin `<Database>`). La razón está documentada en [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts): tipar el cliente revela ~29 errores TS latentes en código existente (uso de `userId` opcional, interfaces locales divergentes del schema). Cuando se limpien, cambiar a `createClient<Database>(...)` para ganar type safety completo. Mientras tanto, código nuevo puede opt-in casteando: `(supabase as SupabaseClient<Database>).from('tabla')`.

## Reglas
1. NO comentarios salvo que se pidan
2. NO `style={{}}` para estilos estáticos
3. NO commits主动性 — esperar que el usuario lo pida
4. Verificar `tsc --noEmit` antes de entregar cambios de tipos

## Responsive — reglas obligatorias para cualquier herramienta nueva

Toda página, formulario, tabla o modal nuevo DEBE pasar este checklist antes de entregarse. **Ningún componente que rompa este checklist se considera completo**, da igual lo bien que se vea en desktop.

### Breakpoints estándar (NO inventar otros valores)

| Token (en `breakpoints.css`) | Valor | Uso típico |
|---|---|---|
| `--bp-mobile` | 480px | Phones. Botones colapsan a icono, modales fullscreen. |
| (excepción) | 640px | Tablas → cards apiladas, filter-pills con scroll horizontal. |
| `--bp-tablet` | 768px | Tablet portrait. Grids 2/3-col → 1-col. |
| `--bp-desktop` | 1024px | Tablet landscape / desktop. Sidebars cambian de fijo a drawer. |
| `--bp-wide` | 1280px | Desktop wide. Preview del motor de documentos lado a lado. |

CSS no soporta `var()` dentro de `@media` en navegadores actuales, así que los breakpoints son **tokens documentales**: úsalos siempre como referencia y escribe los números reales en `@media (max-width: 480px)` etc. **NO usar otros valores** (ej. 500px, 720px, 850px).

### Arquitectura CSS

Los estilos responsive viven en `src/styles/responsive/`, con un archivo por dominio:

```
src/styles/responsive/
├── _index.css         ← punto de entrada (importado desde src/index.css)
├── breakpoints.css    ← tokens --bp-*
├── typography.css     ← clamp() para hero, section-title, calc-result-value
├── layout.css         ← refuerzos de shell público
├── headers.css        ← site-header, doc-listado-header, footer 4→2→1 col
├── tables.css         ← patrón data-table → cards
├── forms.css          ← calc-grid--2/3, form-row-1-2, clientes-layout
├── modals.css         ← admin-modal-box y modal-box fullscreen ≤480px
├── filter-pills.css   ← scroll horizontal con scroll-snap
└── buttons.css        ← btn-responsive (icono-only ≤480px)
```

Reglas para añadir nuevos estilos responsive:
- Si el dominio existe → añadir al archivo correspondiente.
- Si es un dominio nuevo → crear `src/styles/responsive/<dominio>.css` y referenciarlo en `_index.css`.
- **Nunca** añadir media queries directamente en `src/index.css`.

### Checklist obligatorio

- [ ] Probado a **360px** (móvil pequeño), **768px** (tablet portrait) y **1280px** (desktop).
- [ ] Ningún elemento desborda horizontalmente. `body` siempre con `overflow-x: hidden`.
- [ ] Las **tablas** usan `<table className="data-table data-table--responsive">` y cada `<td>` lleva `data-label="…"`. Columnas no esenciales en móvil → `data-hide-mobile`. La celda con dropdown/acciones → `data-actions`.
- [ ] Los **formularios** usan `form-row`, `form-row-1-2`, `calc-grid--2`, `calc-grid--3`. Colapsan a 1 columna automáticamente: no añadas media queries propias para esto.
- [ ] Los **CTAs principales** (Nuevo, Crear, Guardar) usan `btn btn-primary btn-responsive` con `<span className="btn-text">…</span>` y `aria-label`. El texto se oculta a ≤640px, queda solo el icono.
- [ ] Las **barras de acciones** de una vista de detalle (Rectificar, Cobrada, Enviar, Duplicar, Descargar…) usan el componente `<DocActionsBar actions={[…]} />` ([src/components/document/DocActionsBar.tsx](src/components/document/DocActionsBar.tsx)). En desktop renderiza inline; en ≤1024px colapsa a un único botón "Opciones" con dropdown. **Nunca** dejar 3+ botones inline en el header de un documento.
- [ ] Los botones **Descargar** y **Enviar por correo** de cualquier documento NO factura (presupuesto, albarán, contrato, NDA, reclamación) deben llamar `ensureSavedThen('descargando' | 'enviando', after)` ([DocumentEngine.tsx](src/components/document/DocumentEngine.tsx) y [LegalDocEngine.tsx](src/components/legalDoc/LegalDocEngine.tsx)). Este helper auto-guarda el documento, asigna número vía `next_document_number` y propaga el número al form con `setValue` antes de ejecutar la acción. El `onSave` debe respetar el contrato `(doc, …, keepOpen?) => Promise<SaveResult | void>` y, cuando `keepOpen=true`, NO debe cerrar el editor (ver `saveBusiness` / `saveLegal` en [UserPage.tsx](src/features/usuario/UserPage.tsx) propagando `skipClose`). **Las facturas quedan fuera de este patrón**: siguen el flujo estricto Guardar borrador → Finalizar.
- [ ] Los **modales** usan `.admin-modal-box` o `.modal-box`. NO definir anchos fijos custom — el override móvil ya está en `modals.css`.
- [ ] Si la página tiene **filtros**, el contenedor usa `.filter-row`. Scroll horizontal automático en ≤640px.
- [ ] Si la página vive dentro del **panel admin o usuario**, NO ocultes el sidebar manualmente. El patrón es: envolver el sidebar desktop en `<div className="show-lg">` y el botón burger en `.hide-lg.admin-menu-btn`. El drawer (`.mobile-drawer` + `.mobile-drawer-backdrop` + `.admin-mobile-drawer-panel`) ya está estilado.
- [ ] **Tipografías grandes** (hero, resultado de calculadora, títulos de panel) usan `clamp()`, nunca `rem` fijos. Las clases `hero-heading`, `section-title`, `tool-title`, `calc-result-value` ya lo aplican; si creas una nueva, sigue el patrón.
- [ ] El **motor de documentos** (DocumentEngine, LegalDocEngine) NO necesita tabs form/preview: el preview lado a lado solo aparece ≥1280px (`.show-xl`); en resoluciones menores se usa el botón → `PreviewModal`.

### Patrón tabla → cards (≤640px)

```tsx
<table className="data-table data-table--responsive">
  <thead>
    <tr className="data-thead-row">
      <th className="data-th">Cliente</th>
      <th className="data-th">Fecha</th>
      <th className="data-th-right">Total</th>
      <th className="data-th-right">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {rows.map(row => (
      <tr key={row.id} className="data-tr">
        <td className="data-td" data-label="Cliente">{row.cliente}</td>
        <td className="data-td" data-label="Fecha" data-hide-mobile>{row.fecha}</td>
        <td className="data-td-right" data-label="Total">{row.total} €</td>
        <td className="data-td-right" data-actions>
          <DropdownActions row={row} />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

A ≤640px: el `<thead>` se oculta, cada `<tr>` se convierte en una card con dos columnas (contenido | acciones), y cada `<td>` muestra su `data-label` como mini-header arriba del valor. `data-hide-mobile` oculta la columna entera. **Zero JS, solo CSS.**

### Patrón CTA icono-only en móvil (≤480px)

```tsx
<button
  className="btn btn-primary btn-responsive"
  onClick={onCreate}
  aria-label="Nueva factura"
>
  <Plus size={15} />
  <span className="btn-text">Nueva factura</span>
</button>
```

El texto se oculta automáticamente en ≤480px, queda solo el icono. El `aria-label` es obligatorio para que el botón siga siendo accesible.

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

### 10. Crear tabla documental nueva — checklist anti-corrupción

**Causa raíz del bug histórico**: cuando se añadía una columna a una tabla y `writeRowWithRetry` (`userDocuments.ts:45-77`) recibía `400 Could not find the '<col>' column` de PostgREST, eliminaba la columna del payload y reintentaba. Resultado: documentos guardados sin `datos_json`, `numero` o `notas`, silenciosamente. El error real era doble: (a) la tabla nacía sin esas columnas, y (b) PostgREST cacheaba el schema y no veía las columnas aunque ya existieran en Postgres.

**Toda tabla documental nueva DEBE seguir este checklist, sin excepciones**:

1. **Copiar la plantilla**: `supabase/migrations/_TEMPLATE_nueva_tabla_documental.sql` → `NNN_create_<tabla>.sql`. La plantilla ya incluye TODAS las columnas que `userDocuments.ts` espera (`datos_json`, `numero`, `notas`, `estado`, `cliente_*`, `fecha`) + RLS + trigger `updated_at`. **Imposible olvidar `datos_json` porque ya está en la plantilla.**
2. **Toda migración con DDL termina con** `NOTIFY pgrst, 'reload schema';`. Sin esta línea, PostgREST sigue con la caché vieja y `writeRowWithRetry` detecta la columna como inexistente — el bug histórico vuelve. La plantilla ya la incluye.
3. **Añadir la tabla** al union type `UserDocumentTable` en `src/lib/userDocuments.ts:7-13`.
4. **Ejecutar** `npm run test`. El smoke test (`src/lib/userDocuments.smoke.test.ts`) verifica vía PostgREST que la tabla tenga `id`, `user_id`, `datos_json`, `numero`, `notas`, `estado`. Si falla, la migración no es válida y NO se sube a producción.
5. **Decidir para cada campo nuevo: ¿columna desnormalizada o solo en `datos_json`?**
   - **Solo en `datos_json` (default)** → si el campo NO se usa para listar, filtrar, ordenar, ni mostrar en columnas de tabla. Cero coste: no toca SQL ni payload.
   - **Columna desnormalizada + `datos_json`** → si el campo aparece en `DocumentoListado.tsx` (columna visible), se filtra/ordena en BD, o lo lee `EmailModal` directamente (`cliente_email`, `cliente_nombre`). Añadir la columna en el bloque "Específicas de esta herramienta" de la plantilla SQL **y** incluirla en el payload del paso 6. La fuente de verdad sigue siendo `datos_json`; la columna es solo un espejo para queries.
6. **Añadir una entrada en `src/lib/documentRegistry.ts`** con todos los metadatos y los dos callbacks (`assignNumero`, `buildPayload`). Este es el ÚNICO sitio donde se declara la lógica de guardado de la herramienta:
   ```ts
   const miHerramientaEntry: DocumentRegistryEntry<MiTipoDoc> = {
     table: 'mi_tabla',
     family: 'legal',                     // o 'business'
     sequenceTipo: 'mi_tipo',             // alta en next_document_number
     sequencePrefijo: 'MIT',              // p.ej. CON, NDA, FAC
     label: { singular: 'mi herramienta', plural: 'Mis Herramientas' },
     routePath: '/mi-herramienta',
     estados: ['borrador', 'enviado'] as const,
     estadoBorrador: 'borrador',
     estadoFinalizado: 'enviado',
     listado: {
       articuloFemenino: false,
       campoTitulo: 'numero',
       campoSecundario: 'cliente_nombre', // columna desnormalizada para la lista
     },
     async assignNumero({ document, finalizar, userId, id }) { /* … */ },
     buildPayload({ document, numero, finalizar, userId, id }) { /* devuelve {} */ },
   }
   ```
   `saveBusinessDocument` y `saveLegalDocument` ya delegan al registry vía `documentRegistry[table]`, así que NO hay que tocarlas. **Nunca** invocar `supabase.from(...).insert(...)` directamente — perderías las defensas de `CRITICAL_COLUMNS`.
7. **Añadir un render por tipo** en `src/features/usuario/DocumentoListado.tsx` (los `renderXRow` por tabla y la rama del dropdown de acciones). Hoy no hay forma elegante de generarlos automáticamente porque la UI por tipo varía bastante.
8. **Añadir una rama del editor** en `src/features/usuario/UserPage.tsx` (`if (section === 'mi_tabla') return <MiHerramientaPage ... />`). Las APIs de las páginas-editor son intencionalmente divergentes; este punto se mantiene manual.

> **Atajo (recomendado)**: en lugar de los pasos 1-3+6-8, ejecuta `npm run new:doc-tool -- --name mi-herramienta --family legal`. El scaffolder genera la migración SQL, el types stub, el page stub, la entrada del registry, y deja TODOs claros en `DocumentoListado.tsx` y `UserPage.tsx`.

**Si añades una columna a una tabla EXISTENTE** (no es una tabla nueva): escribir `NNNb_reparar_<tabla>.sql` con `ALTER TABLE ADD COLUMN IF NOT EXISTS` para cada columna nueva, terminando con `NOTIFY pgrst, 'reload schema';`. Patrón existente: `010b_reparar_contratos.sql`, `012b_reparar_ndas.sql`. Y actualizar el payload en la `save*Document` correspondiente (paso 6).

**Defensas activas** en `writeRowWithRetry`:
- `CRITICAL_COLUMNS = new Set(['datos_json'])` → si falta, **rechaza** el guardado con error. Nunca corrompe.
- `EXPECTED_DOC_COLUMNS = new Set(['numero', 'notas', 'estado'])` → si falta, sigue eliminando+retrying (no rompe el flujo) pero loguea con `console.error` con el SQL listo para copiar. **Si ves un `[writeRowWithRetry]` rojo en consola, hay una migración que falta.**
- Cualquier otra columna no listada → `console.warn` y elimina del payload (compatibilidad con tablas legacy).
