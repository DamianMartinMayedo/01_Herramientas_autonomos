# CSS Guide — Consulta rápida de clases

Inventario completo de `src/index.css` organizado por caso de uso.
Las reglas de cuándo usar inline vs clase están en `CLAUDE.md` (siempre activo).

---

## Botones

```tsx
<button className="btn btn-primary">Guardar</button>
<button className="btn btn-secondary">Cancelar</button>
<button className="btn btn-danger">Eliminar</button>
<button className="btn btn-success">Publicar</button>
<button className="btn btn-ghost">Ver más</button>

// Tamaños
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
   - Colores: `--color-{bg|surface|surface-2|surface-offset|divider|border|text|text-muted|text-faint}`
   - Paleta: `--color-{primary|success|copper|purple|teal|gold|error}` (con `-hover|-active|-highlight|-subtle`)
   - Espacio: `--space-{1|2|3|4|5|6|8|10|12|16|20|24}`
   - Texto: `--text-{xs|sm|base|lg|xl|2xl|3xl}`
   - Fuentes: `--font-{display|body|mono}`
   - Radio: `--radius-{sm|md|lg|xl|2xl|full}`
   - Ancho: `--content-{narrow|default|wide}`
