# CSS Guide — Consulta rápida de clases

Inventario completo de `src/index.css` organizado por caso de uso.
Las reglas de cuándo usar inline vs clase están en `AGENTS.md` (lectura obligatoria para cualquier agente).

---

## Botones

```tsx
<button className="btn btn-primary">Guardar</button>
<button className="btn btn-secondary">Cancelar</button>
<button className="btn btn-danger">Eliminar</button>
<button className="btn btn-success">Publicar</button>
<button className="btn btn-warning">Avisar</button>
<button className="btn btn-copper">Acción cobre</button>
<button className="btn btn-ghost">Ver más</button>

// Sobre fondos de COLOR (hero azul, register-cta copper) — siempre blancos en ambos modos
<button className="btn btn-white">Crear cuenta gratis</button>
<button className="btn btn-white-copper">Registrarme ahora</button>

// Tamaños y modificadores
<button className="btn btn-primary btn-sm">Pequeño</button>
<button className="btn btn-primary btn-lg">Grande</button>
<button className="btn btn-primary btn-center">Centrado</button>

// Confirmación con color dinámico (ConfirmModal)
<button
  className="btn btn-sm btn-confirm"
  style={{ '--confirm-bg': v.background, '--confirm-hover-bg': v.hoverBg,
           '--confirm-border': v.borderColor, '--confirm-shadow': v.shadowColor,
           '--confirm-color': v.color } as React.CSSProperties}
>Confirmar</button>
```

---

## Iconos de acción (32×32)

```tsx
<button className="icon-btn"><Edit size={14} /></button>            {/* hover neutro */}
<button className="icon-btn icon-btn--danger"><Trash2 /></button>   {/* hover rojo */}
<button className="icon-btn icon-btn--success"><Check /></button>   {/* hover verde */}
<button className="icon-btn icon-btn--primary"><Send /></button>    {/* hover azul */}
<button className="icon-btn icon-btn--gold"><Undo /></button>       {/* hover dorado */}
```

---

## Cajas de icono (decorativas)

```tsx
<div className="icon-box icon-box-sm">…</div>   {/* 32×32 */}
<div className="icon-box icon-box-md">…</div>   {/* 36×36 */}
<div className="icon-box icon-box-lg">…</div>   {/* 48×48 */}
<div className="icon-box icon-box-circle">…</div>

// El color de fondo siempre inline (contextual por herramienta/sección)
<div className="icon-box icon-box-md" style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)' }}>
  <Mail size={18} />
</div>
```

---

## Cards

```tsx
// Base
<div className="card">…</div>
<div className="card card-raised">…</div>         {/* sombra 4px */}
<div className="card card-raised-sm">…</div>      {/* sombra 3px */}
<div className="card card-sm">…</div>             {/* padding menor */}
<div className="card card-no-pad">…</div>         {/* para tablas dentro */}
<div className="card card-flex">…</div>           {/* flex-col gap */}

// Herramientas con acento de color
<div className="card tool-card-inner card-accent-primary card-interactive">…</div>
<div className="card tool-card-inner card-accent-success card-disabled">…</div>
// Acentos: card-accent-{primary|success|copper|purple|teal|gold}

// Textos dentro de card
<h3 className="card-title">Título</h3>
<p className="card-body">Descripción</p>
```

---

## Modales

### Admin (borde brutal offset)
```tsx
<div className="overlay overlay-dark overlay-z200" onClick={onCancel}>
  <div className="admin-modal-box admin-modal-md" onClick={e => e.stopPropagation()}>
    <div className="admin-modal-header">
      <Icon size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
      <h2 className="admin-modal-title">Título</h2>
      <button className="modal-close-btn" onClick={onCancel}><X size={16} /></button>
    </div>
    <div className="admin-modal-body">          {/* gap space-4 */}
      {/* o admin-modal-body--gap5 para más espacio */}
    </div>
    <div className="admin-modal-footer">
      <button className="btn btn-secondary btn-sm">Cancelar</button>
      <button className="btn btn-primary btn-sm">Confirmar</button>
    </div>
  </div>
</div>
// Tamaños: admin-modal-sm (400px) | admin-modal-md (480px) | admin-modal-lg (720px)
```

### Estándar (preview de documento)
```tsx
<div className="overlay overlay-dark overlay-z60" onClick={onClose}>
  <div className="modal-box modal-lg">
    <div className="modal-header">
      <div>
        <p className="modal-header-title">Título</p>
        <p className="modal-header-sub">Subtítulo</p>
      </div>
      <button className="modal-close-btn"><X size={16} /></button>
    </div>
    <div className="modal-body-scroll">…</div>
    <div className="modal-footer justify-end">
      <button className="btn btn-secondary btn-sm">Cerrar</button>
    </div>
  </div>
</div>
// Tamaños: modal-sm (28rem) | modal-lg (48rem)
// z-index: overlay-z60 | overlay-z100 | overlay-z200
```

---

## Dropdowns de acciones

**Patrón único de toda la plataforma** (admin y usuario): portal a `document.body` + `position: fixed`, anclado a la derecha del botón disparador, con detección de borde inferior (si no cabe abajo, abre hacia arriba).

```tsx
import { useDropdownPosition } from '../../hooks/useDropdownPosition'
import { createPortal } from 'react-dom'

const dd = useDropdownPosition()

<div className="dropdown-wrap">
  <button ref={dd.buttonRef} className="icon-btn" onClick={dd.toggle}>
    <MoreVertical size={14} />
  </button>
  {dd.open && dd.position && createPortal(
    <div ref={dd.menuRef} className="dropdown-menu" style={dd.menuStyle}>
      <button className="dropdown-item">
        <Pencil size={13} /> Editar
      </button>
      <div className="dropdown-divider" />
      <button className="dropdown-item dropdown-item--danger">
        <Trash2 size={13} /> Eliminar
      </button>
    </div>,
    document.body,
  )}
</div>
```

### Clases

| Clase | Uso |
|---|---|
| `dropdown-wrap` | Wrapper relativo del botón disparador. |
| `dropdown-menu` | Caja del menú: borde brutal 1.5px + sombra sólida 4px. Anclar siempre con `style={dd.menuStyle}` cuando se portaliza. |
| `dropdown-item` | Botón de acción dentro del menú. |
| `dropdown-item--danger` | Modificador rojo para acciones destructivas. |
| `dropdown-divider` | Línea horizontal entre grupos de items (rescatada del estilo antiguo). |

### Reglas

- **Siempre** portalizar a `document.body` para evitar clipping por overflow de la tabla/contenedor.
- **Siempre** `position: fixed` con coordenadas calculadas vía `getBoundingClientRect` del botón. El hook `useDropdownPosition` lo hace.
- **Nunca** usar `.dropdown-overlay` (eliminado): el cierre por click-outside se hace con `mousedown` listener; el botón disparador debe ignorarse vía `data-dropdown-trigger` o ref.
- Para listas con N dropdowns (uno por fila) con un único abierto, usar estado local `(openId, position)` + `useLayoutEffect` para overflow (ver `DocumentoListado.tsx`, `BlogSection.tsx`). El hook `useDropdownPosition` es para componentes con UN solo dropdown.
- Separar grupos lógicos de items (acciones primarias / envío / destructivas) con `<div className="dropdown-divider" />`.

### Comportamiento

- Click fuera, scroll, resize → cierran el menú.
- Si el menú se sale por la parte inferior del viewport y hay espacio arriba, conmuta a anclaje inferior (abre hacia arriba) sin parpadeo (`useLayoutEffect`).
- z-index: 500 (definido en la clase, no overridear).

---

## Inputs y formularios

```tsx
// Campo estándar
<div className="input-group">
  <label className="input-label">Nombre del campo</label>
  <input className="input-v3" placeholder="…" />
  <p className="input-hint">Texto de ayuda.</p>
</div>

// Con error
<input className="input-v3 is-error" />
<p className="input-error-msg">El campo es obligatorio.</p>

// Variantes de input
<select className="select-v3">…</select>
<textarea className="textarea-v3" />

// Filas de formulario
<div className="form-row">…</div>        {/* 2 columnas */}
<div className="form-row-1-2">…</div>   {/* 1fr 2fr */}

// Fieldset
<fieldset className="fieldset-v3">
  <legend className="fieldset-legend">Sección</legend>
  <p className="fieldset-v3-title">Título</p>
  <p className="fieldset-v3-desc">Descripción</p>
  <div className="fieldset-v3-body">…</div>
</fieldset>

// Toggle checkbox
<label className="input-toggle">
  <input type="checkbox" />
  <span>Activar opción</span>
</label>
```

---

## Layout y páginas públicas

```tsx
// Página pública (home, blog)
<div className="page-root">
  <SiteHeader />
  <main className="page-main section-pb">…</main>
  <SiteFooter />
</div>

// Panel admin/usuario
<div className="layout-root">
  <aside className="sidebar admin-sidebar">…</aside>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div className="admin-topbar">…</div>
    <main>…</main>
  </div>
</div>

// Herramienta (calculadora, formulario)
<div className="page-root">
  <SiteHeader />
  <main className="page-main section-pb">
    <div className="tool-page-inner">
      <div className="tool-page-header">
        <div className="icon-box icon-box-lg" style={{ background: '…', color: '…' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="tool-title">Nombre herramienta</h1>
          <p className="tool-sub">Descripción breve.</p>
        </div>
      </div>
      {/* contenido */}
    </div>
  </main>
  <SiteFooter />
</div>
```

---

## Tipografía y secciones

```tsx
// Labels de sección
<p className="section-label">Herramientas disponibles</p>       {/* uppercase, faint */}
<p className="section-block-label">Documentos</p>               {/* uppercase, faint, mb menor */}

// Títulos
<h1 className="section-title">Título de panel</h1>             {/* display xl 800 */}
<p className="section-sub">Descripción del panel</p>

// Hero de página (blog, herramienta)
<h1 className="hero-heading--page">Título de página</h1>
<p className="hero-sub--page">Subtítulo de página</p>

// Hero de inicio (sobre fondo primario)
<h1 className="hero-heading">Todo lo que necesitas<br />
  <span className="hero-heading-accent">sin complicaciones.</span>
</h1>
<p className="hero-sub">Subtítulo sobre azul.</p>

// Estadísticas
<p className="stat-label">Facturas emitidas</p>
<p className="stat-value">12</p>
<p className="stat-sub">Este mes</p>
```

---

## Estados vacíos

```tsx
// Estándar
<div className="empty-state">
  <p className="empty-state-title">Sin registros</p>
  <p className="empty-state-text">Crea el primero desde aquí.</p>
</div>

// Grande con icono
<div className="empty-state empty-state--xl">
  <div className="icon-box icon-box-lg mx-auto"
       style={{ background: 'var(--color-surface-offset)', marginBottom: 'var(--space-4)' }}>
    <FileText size={24} style={{ color: 'var(--color-text-faint)' }} />
  </div>
  <p className="empty-state-title">Sin documentos</p>
  <p className="empty-state-text">Crea el primero con el generador.</p>
  <button className="btn btn-primary btn-sm">Crear</button>
</div>
```

---

## Tablas de datos

```tsx
<div className="card card-no-pad">
  <table className="data-table">
    <thead>
      <tr className="data-thead-row">
        <th className="data-th">Nombre</th>
        <th className="data-th-right">Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr className="data-tr">
        <td className="data-td">Valor</td>
        <td className="data-td-right">100 €</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Sidebar y navegación

```tsx
// Botón de nav (sidebar)
<button className={`sidebar-nav-btn${active ? ' active' : ''}`}>
  <Icon size={15} /> Sección
</button>

// Etiqueta de grupo
<p className="nav-group-label">Documentos</p>

// Footer de sidebar
<div className="sidebar-footer">
  <button className="sidebar-footer-btn">
    <Settings size={14} /> Configuración
  </button>
  <button className="sidebar-footer-btn sidebar-footer-btn--danger">
    <LogOut size={14} /> Cerrar sesión
  </button>
</div>
```

---

## Componentes de admin

```tsx
// Card de herramienta (HerramientasSection)
<div className={`h-card${!activa ? ' h-card--inactive' : ''}`}>…</div>

// Toggle activo/inactivo
<button className={`toggle-btn ${activa ? 'toggle-btn--active' : 'toggle-btn--inactive'}`}>
  {activa ? <Eye size={13} /> : <EyeOff size={13} />}
  {activa ? 'Activo' : 'Inactivo'}
</button>

// Filtros tipo pill
<button className={`filter-pill${filtro === f ? ' active' : ''}`}>{f}</button>

// Badge
<span className="badge badge-muted badge-xs"><Clock size={10} /> Próximamente</span>
// Variantes: badge-{primary|success|copper|purple|teal|gold|error|muted}

// Paso numerado en guía
<span className="step-badge">1</span>

// Etiqueta mini en listas
<span className="tag-tiny">borrador</span>

// Bloque de código con botón copiar
<div className="code-box">
  <pre>{codigo}</pre>
  <button className="code-box-copy">Copiar</button>
</div>
```

---

## Calculadoras

```tsx
<div className="card" style={{ padding: 'var(--space-6)' }}>
  {/* inputs */}
  <div className="calc-divider" />
  <div className="calc-precompute">
    <p className="calc-precompute-label">Resultado previo:</p>
    <p className="calc-precompute-value">1.234,56 €</p>
  </div>
  <div className="calc-summary">
    <h3 className="calc-summary-title">Tu resultado</h3>
    <div className="calc-result" style={{ background: 'var(--color-purple-highlight)', border: '2px solid var(--color-purple)' }}>
      <span className="calc-result-value">42,00</span>
      <span className="calc-result-unit" style={{ color: 'var(--color-purple)' }}>€ / hora</span>
    </div>
    <div className="calc-row">
      <span style={{ color: 'var(--color-text-muted)' }}>Concepto:</span>
      <span style={{ fontWeight: 600 }}>valor</span>
    </div>
    <p className="calc-result-note">Nota aclaratoria.</p>
  </div>
</div>
```

---

## Listado de documentos de usuario

```tsx
<div className="doc-listado-wrap">
  {flash && <div className="doc-flash">{flash}</div>}
  <div className="doc-listado-header">
    <div>
      <h1 className="section-title">Facturas</h1>
      <p className="section-sub">3 facturas</p>
    </div>
    <button className="btn btn-primary"><Plus size={15} /> Nueva factura</button>
  </div>
  {loading && (
    <div className="doc-list">
      {[1,2,3].map(i => <div key={i} className="doc-skeleton" />)}
    </div>
  )}
  <div className="doc-list">
    <div className="doc-row">
      <div className="icon-box icon-box-md" style={{ background: 'var(--color-surface-offset)' }}>
        <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="doc-row-title">FAC-001</span>
        {/* badge de estado: color dinámico → inline obligatorio */}
        <span style={{ color: estadoColor, … }}>{estadoLabel}</span>
        <p className="doc-row-meta">Cliente · 15 ene 2025</p>
      </div>
      <span className="doc-row-price">1.250,00 €</span>
      <div className="flex gap-2 shrink-0">
        <button className="icon-btn icon-btn--danger"><Trash2 size={13} /></button>
      </div>
    </div>
  </div>
</div>
```

---

## Blog

```tsx
// Card de artículo
<Link to={`/blog/${slug}`} className="link-block">
  <article className="blog-card">
    <div className="blog-card-tags">
      <span className="blog-tag">Fiscalidad</span>
    </div>
    <h2 className="blog-card-title">Título del artículo</h2>
    <p className="blog-card-excerpt">Extracto…</p>
    <div className="blog-card-footer">
      <div className="blog-card-date"><Calendar size={11} /> 15 ene 2025</div>
      <div className="blog-card-read">Leer <ArrowRight size={12} /></div>
    </div>
  </article>
</Link>

// Contenido renderizado (dangerouslySetInnerHTML)
<div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
```

---

## Utilidades frecuentes

```tsx
// Flex
className="flex items-center gap-4"
className="flex items-center justify-between gap-3"
className="flex flex-col gap-4"
className="flex-1 min-w-0"   // elemento que ocupa el espacio disponible
className="shrink-0"          // elemento que no se encoge
className="ml-auto"           // empujar a la derecha

// Spacing
className="mt-4 mb-6"

// Texto
className="text-center"
className="font-bold"
className="font-mono"
className="font-display"

// Links sin decoración
className="link-block"    // display:block, no text-decoration (para Link wrapper)

// Overlay de carga centrado
<div className="page-root page-loading">
  <div className="spinner spinner-md spinner-primary" />
  <p>Cargando…</p>
</div>
```

---

## Modo oscuro

### Cómo se activa

Toggle vía Zustand `useThemeStore` (`src/store/themeStore.ts`). `App.tsx` aplica clase `.dark` y atributo `data-theme="dark"` en `<html>`. Los tokens cambian automáticamente entre `:root, [data-theme="light"]` y `.dark, [data-theme="dark"]` — casi todo el CSS funciona sin overrides.

### Comportamiento de hovers

**En dark, los botones NO cambian background al hover.** El efecto "lift" lo da:
- `box-shadow: 3px 3px 0 → 5px 5px 0`
- `transform: translate(-2px, -2px)`

Si tu botón nuevo define `:hover { background: ... }` para light, en dark queda neutralizado por overrides genéricos en `index.css`. No hace falta hacer nada extra.

### `color-scheme`

Se aplica `color-scheme: light` por defecto y `color-scheme: dark` en `html.dark`. Esto hace que iconos nativos del navegador (calendario en `<input type="date">`, time pickers, scrollbars) se inviertan automáticamente en dark.

### Tokens nuevos (post-redesign)

`--color-error-hover`, `--color-error-active`, `--color-error-subtle` — disponibles en ambos modos.

### Cuándo añadir un override explícito `[data-theme="dark"] .clase`

Solo cuando los tokens no bastan:

- **SVG hardcoded en data-URI** que no responde a tokens (ver `.select-v3` chevron).
- **Sombras `rgba(0,0,0,...)`** que se pierden sobre fondo oscuro: añadir ring blanco tenue + sombra negra profunda.
  ```css
  [data-theme="dark"] .mi-modal {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.04),
      0 20px 60px rgba(0, 0, 0, 0.6);
  }
  ```
- **Background sólido** cuyo token claro pierde fuerza como botón (`.btn-danger` usa rojo saturado `#DA3D3D` en dark, no el `--color-error` claro).
- **Botones blancos sobre fondos de color** (`.btn-white`, `.btn-white-copper`): `#FFFFFF` literal, no `var(--color-white)` (que en dark se oscurece).

### Tokens que NO existen

⚠ Si ves `var(--color-blue)`, `var(--color-warning)`, `var(--color-orange)` en código — son **bugs**: en runtime se descartan y los SVGs caen a negro. Usar paleta principal (`--color-primary`, `--color-gold`, `--color-copper`, etc.).

---

## Añadir clases nuevas

Si ninguna clase existente cubre el caso:

1. Añadir al final de `src/index.css` con cabecera de sección:
```css
/* ══════════════════════════════════════════════════════════════════════════
   NOMBRE DE SECCIÓN
══════════════════════════════════════════════════════════════════════════ */
.mi-clase {
  color: var(--color-text);           /* nunca hex */
  padding: var(--space-4);            /* nunca px hardcodeado */
  border-radius: var(--radius-md);    /* nunca valor fijo */
}
```

2. Nomenclatura: `.bloque`, `.bloque-elemento`, `.bloque--modificador`

3. Tokens disponibles:
   - **Superficies:** `--color-bg`, `--color-surface`, `--color-surface-2`,
     `--color-surface-offset`, `--color-surface-offset-2`, `--color-surface-dynamic`
   - **Bordes:** `--color-divider`, `--color-border`
   - **Texto:** `--color-text`, `--color-text-muted`, `--color-text-faint`,
     `--color-text-inverse`
   - **Blanco contextual:** `--color-white` (en dark se oscurece a un gris cálido;
     usar `#FFFFFF` literal solo en botones que vivan sobre fondos de color)
   - **Paleta principal** (cada uno con `-hover|-active|-highlight|-subtle`):
     `--color-primary`, `--color-success`, `--color-copper`, `--color-purple`,
     `--color-teal`, `--color-gold`, `--color-error`
   - **Variantes específicas de primary:** `--color-primary-mid`, `--color-primary-light`
     (no tienen sub-variantes -hover/-active)
   - **Espacio:** `--space-{1|2|3|4|5|6|8|10|12|16|20|24}`
   - **Texto:** `--text-{xs|sm|base|lg|xl|2xl|3xl}` (fluid clamps)
   - **Fuentes:** `--font-{display|body|mono}`
   - **Radio:** `--radius-{sm|md|lg|xl|2xl|full}`
   - **Ancho:** `--content-{narrow|default|wide}`
   - **Transiciones:** `--transition`, `--transition-slow`

   ⚠ Tokens que NO existen — no usar: `--color-blue`, `--color-warning`,
   `--color-orange`. Usa la paleta principal (`--color-primary`, `--color-gold`, etc.).

---

## Responsive y mobile

Los estilos responsive viven en `src/styles/responsive/*.css`, organizados por dominio (`tables.css`, `forms.css`, `modals.css`, etc.). Las reglas obligatorias para cualquier herramienta nueva están en [AGENTS.md](AGENTS.md) → sección "Responsive". Aquí van los ejemplos JSX de cada patrón.

### Breakpoints

```css
:root {
  --bp-mobile:  480px;
  --bp-tablet:  768px;
  --bp-desktop: 1024px;
  --bp-wide:    1280px;
}
```

Excepción: las tablas → cards se activan a 640px (entre mobile y tablet). Es el único punto fuera de los cuatro tokens y solo aparece en `tables.css`.

### Tabla → cards apiladas (≤640px)

Vive en [src/styles/responsive/tables.css](src/styles/responsive/tables.css). Patrón zero-JS: añadir `data-table--responsive` y `data-label` a cada `<td>`.

```tsx
<table className="data-table data-table--responsive">
  <thead>
    <tr className="data-thead-row">
      <th className="data-th">Número</th>
      <th className="data-th">Cliente</th>
      <th className="data-th">Fecha</th>
      <th className="data-th-right">Total</th>
      <th className="data-th-right">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {rows.map(row => (
      <tr key={row.id} className="data-tr">
        <td className="data-td" data-label="Número">{row.numero}</td>
        <td className="data-td" data-label="Cliente">{row.cliente}</td>
        <td className="data-td" data-label="Fecha" data-hide-mobile>{row.fecha}</td>
        <td className="data-td-right" data-label="Total">{row.total} €</td>
        <td className="data-td-right" data-actions>
          <DropdownActions />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

| Atributo | Efecto en ≤640px |
|---|---|
| `data-table--responsive` | Activa la transformación tabla → cards. Sin esta clase, la tabla mantiene scroll horizontal como fallback. |
| `data-label="…"` | Texto en mayúsculas que aparece como mini-header arriba del valor. |
| `data-hide-mobile` | Oculta la celda completa (la columna no aparece). |
| `data-actions` | Coloca la celda en la columna derecha de la card, alineada arriba. Para dropdown de acciones. |

### CTA icono-only en móvil (≤480px)

Vive en [src/styles/responsive/buttons.css](src/styles/responsive/buttons.css).

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

A ≤480px el `<span className="btn-text">` se oculta y el padding del botón se reduce. **`aria-label` es obligatorio**: sin él el botón queda sin texto accesible.

### Barra de acciones del documento — `<DocActionsBar>` (≤1024px colapsa a dropdown)

Vive en [src/components/document/DocActionsBar.tsx](src/components/document/DocActionsBar.tsx). En desktop renderiza los botones inline; en móvil/tablet (≤1024px) los agrupa todos en un único botón "Opciones ⋯" con dropdown portalizado. Patrón obligatorio cuando un header de documento tiene 3 o más acciones.

```tsx
import { DocActionsBar, type DocAction } from '../document/DocActionsBar'
import { Save, Mail, Download, CheckCircle2 } from 'lucide-react'

const actions: DocAction[] = [
  { id: 'guardar',   label: 'Guardar',   Icon: Save,          onClick: handleSave },
  { id: 'enviar',    label: 'Enviar',    Icon: Mail,          onClick: handleEmail },
  { id: 'cobrada',   label: 'Cobrada',   Icon: CheckCircle2,  onClick: handleMarcarCobrada },
  { id: 'descargar', label: 'Descargar', Icon: Download,      variant: 'primary', onClick: handleDownload },
]

<DocActionsBar actions={actions} />
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Único por item. Sirve como `key`. |
| `label` | string | Texto del botón / item. |
| `Icon` | `LucideIcon` | Opcional. Tamaño 14 (inline) / 13 (dropdown). |
| `onClick` | `() => void` | Handler. |
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger'` | Default `'secondary'`. En el dropdown, `danger` aplica `dropdown-item--danger`. |
| `disabled` | boolean | Aplica a inline y dropdown. |
| `loading` + `loadingLabel` | boolean + string | Sustituye `label` durante una acción async. |
| `hidden` | boolean | Excluye el item de ambas vistas. |

Las clases CSS que controlan el cambio están en [src/styles/responsive/buttons.css](src/styles/responsive/buttons.css): `.doc-actions-inline` (visible >1024px) y `.doc-actions-mobile` (visible ≤1024px). **No** las uses directamente: siempre pasa por `<DocActionsBar>`.

### Filter pills con scroll horizontal (≤640px)

Vive en [src/styles/responsive/filter-pills.css](src/styles/responsive/filter-pills.css). No requiere clases nuevas — basta con usar `.filter-row` y `.filter-pill` como ya hace el proyecto.

```tsx
<div className="filter-row">
  <button className={`filter-pill${filtro === 'todos' ? ' active' : ''}`}>Todos</button>
  <button className={`filter-pill${filtro === 'borrador' ? ' active' : ''}`}>Borrador</button>
  <button className={`filter-pill${filtro === 'enviado' ? ' active' : ''}`}>Enviado</button>
  <button className={`filter-pill${filtro === 'cobrado' ? ' active' : ''}`}>Cobrado</button>
</div>
```

A ≤640px, `.filter-row` cambia a `overflow-x: auto` con `scroll-snap-type: x mandatory`. Los pills no se parten, se scrollean horizontalmente con snap.

### Modal fullscreen en móvil (≤480px)

Vive en [src/styles/responsive/modals.css](src/styles/responsive/modals.css). **No hay clases nuevas**: cualquier modal con `.admin-modal-box` o `.modal-box` recibe el override automáticamente.

A ≤480px el modal ocupa `calc(100% - var(--space-4))` de ancho, hasta `calc(100dvh - var(--space-6))` de alto, con scroll interno si el contenido excede el viewport. El footer de modal hace `flex-wrap: wrap` y los botones se reparten el ancho. **No añadir overrides custom** — el patrón funciona para los tres tamaños (sm/md/lg).

### Grids colapsables (forms.css)

```tsx
// 2 columnas en desktop, 1 en ≤480px
<div className="calc-grid calc-grid--2">…</div>

// 3 columnas → 2 en ≤768px → 1 en ≤480px
<div className="calc-grid calc-grid--3">…</div>

// 1fr 2fr (label + campo) → 1 columna en ≤768px
<div className="form-row-1-2">…</div>

// Layout de clientes (lista + detalle) → 1 columna en ≤768px
<div className="clientes-layout">…</div>
```

No requiere media queries propias en tu componente — los colapsos están en `forms.css`.

### Tipografía fluid (typography.css)

Las siguientes clases ya escalan con `clamp()`:

- `.hero-heading` → `clamp(1.75rem, 4vw + 1rem, 3.5rem)`
- `.hero-heading--page` → `clamp(1.5rem, 3vw + 1rem, 2.75rem)`
- `.section-title` → `clamp(1.5rem, 2vw + 1rem, 2.25rem)`
- `.tool-title` → `clamp(1.5rem, 2vw + 1rem, 2.25rem)`
- `.calc-result-value` → `clamp(2rem, 5vw, 3rem)`

Si creas una clase de tipografía grande nueva, usa `clamp()` con el mismo patrón. **No** uses `rem` ni `px` fijos para títulos grandes.

### Drawer (sidebar admin/usuario)

Patrón del proyecto (usa las clases existentes, no inventes otras):

```tsx
<div className="layout-root">
  {/* Sidebar visible solo a ≥1024px */}
  <div className="show-lg">
    <MiSidebar … />
  </div>

  {/* Drawer mobile — se renderiza si mobileOpen */}
  {mobileOpen && (
    <div className="mobile-drawer" onClick={() => setMobileOpen(false)}>
      <div className="admin-mobile-drawer-panel" onClick={e => e.stopPropagation()}>
        <MiSidebar … onClose={() => setMobileOpen(false)} />
      </div>
      <div className="mobile-drawer-backdrop" />
    </div>
  )}

  {/* Contenido + topbar con burger visible solo <1024px */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
    <div className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="hide-lg admin-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
      </div>
      <div className="flex items-center justify-end shrink-0">
        <ThemeToggle />
      </div>
    </div>
    <main>{children}</main>
  </div>
</div>
```

Clases clave (todas ya definidas en `src/index.css`):
- `.show-lg` → `display: none` por defecto, visible a ≥1024px.
- `.hide-lg` → visible por defecto, `display: none` a ≥1024px.
- `.mobile-drawer` → overlay con flex.
- `.admin-mobile-drawer-panel` → panel deslizante de 280px.
- `.mobile-drawer-backdrop` → fondo oscuro tras el panel.
- `.admin-menu-btn` → botón burger estilado.

### Motor de documentos en móvil

`DocumentEngine` y `LegalDocEngine` muestran form + preview en grid con `gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))'`. El preview lado a lado solo aparece a ≥1280px (clase `.show-xl` en el contenedor del preview). En resoluciones menores se accede al preview con un botón que abre `PreviewModal`. **No añadir tabs form/preview**: el patrón actual ya cubre el caso responsive.

### Checklist al crear una nueva herramienta

Aplica el checklist completo de [AGENTS.md → Responsive — reglas obligatorias](AGENTS.md). Resumen mnemotécnico:

> Tablas → `data-label`. CTAs → `btn-responsive`. Grids → ya colapsan. Modales → ya colapsan. Filtros → `.filter-row`. Sidebars → `show-lg/hide-lg`. Tipografía grande → `clamp()`.
