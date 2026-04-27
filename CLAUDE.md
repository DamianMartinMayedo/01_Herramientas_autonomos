# HerramientasAutónomas — Contexto de proyecto

## Stack
React 19 · TypeScript · Vite · Supabase · React Router · CSS puro (sin Tailwind)

---

## Regla CSS — siempre activa

**Los estilos estáticos van en clases de `src/index.css`. Nunca `style={{}}` si ya existe una clase que lo cubra.**

### `style={{}}` permitido únicamente cuando:
- El valor se calcula en runtime: colores de estado (`estadoColor`), porcentajes (`width: ${pct}%`)
- CSS custom properties dinámicas pasadas como token: `--confirm-bg`, `--i`
- `fontVariantNumeric: 'tabular-nums'`
- Override de **una sola propiedad** sobre una clase base (ej. `marginTop: 2`)
- Componentes PDF — `DocumentEngine`, `LegalDocEngine`, `LegalDocPreview` están exentos

### Antes de escribir `style={{}}` pregúntate:
> ¿Este valor cambia entre renders? Si no → va en una clase CSS.

---

## Clases fundamentales del sistema

| Necesito… | Clase(s) |
|---|---|
| Botón principal | `btn btn-primary` |
| Botón secundario | `btn btn-secondary` |
| Botón peligro | `btn btn-danger` |
| Botón éxito | `btn btn-success` |
| Botón pequeño | añadir `btn-sm` |
| Icono de acción 32px | `icon-btn` |
| Icono con hover rojo | `icon-btn icon-btn--danger` |
| Icono con hover verde | `icon-btn icon-btn--success` |
| Icono con hover azul | `icon-btn icon-btn--primary` |
| Icono con hover dorado | `icon-btn icon-btn--gold` |
| Card base | `card` |
| Card con sombra | `card card-raised` |
| Card sin padding (tabla) | `card card-no-pad` |
| Card interactiva (hover lift) | añadir `card-interactive` |
| Card desactivada | añadir `card-disabled` |
| Card con acento de color | añadir `card-accent-{primary/success/copper/purple/teal/gold}` |
| Modal admin (borde brutal) | `overlay overlay-dark overlay-z200` + `admin-modal-box admin-modal-{sm/md/lg}` |
| Modal estándar (preview) | `overlay overlay-dark overlay-z60` + `modal-box modal-{sm/lg}` |
| Cerrar modal | `modal-close-btn` |
| Input | `input-group` > `input-label` + `input-v3` + `input-hint` |
| Input con error | añadir `is-error` + `input-error-msg` |
| Estado vacío | `empty-state` (o `empty-state--xl`) |
| Tabla de datos | `data-table` + `data-thead-row` + `data-th/td/tr` |
| Toggle activo/inactivo | `toggle-btn toggle-btn--active` / `toggle-btn--inactive` |
| Pill de filtro | `filter-pill` (`.active` cuando seleccionado) |
| Badge | `badge badge-{primary/success/muted/gold/error…}` |
| Spinner | `spinner spinner-md spinner-primary` |
| Link sin decoración | `link-block` |
| Fila de documento usuario | `doc-row` + `doc-row-title` + `doc-row-meta` + `doc-row-price` |

---

## Checklist antes de entregar código con estilos

- [ ] Cada `style={{}}` tiene justificación de valor dinámico
- [ ] Botones usan `.btn` con variante
- [ ] Iconos de acción usan `.icon-btn` con modificador de color
- [ ] Modales usan `.overlay` + `.admin-modal-box` o `.modal-box`
- [ ] Inputs usan `.input-group` + `.input-v3`
- [ ] Estados vacíos usan `.empty-state`
- [ ] Nuevas clases añadidas usan tokens `var(--color-*)`, `var(--space-*)`, nunca hex ni px hardcodeados

**Para consulta completa del inventario de clases → `/css-guide`**
