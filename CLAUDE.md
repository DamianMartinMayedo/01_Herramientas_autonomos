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
| Botón aviso (gold) | `btn btn-warning` |
| Botón cobre | `btn btn-copper` |
| Botón blanco sobre fondo azul | `btn btn-white` |
| Botón blanco sobre fondo cobre | `btn btn-white-copper` |
| Botón confirmación (color dinámico) | `btn btn-confirm` (con `--confirm-bg`, `--confirm-border`, `--confirm-color`, `--confirm-shadow`, `--confirm-hover-bg`) |
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
| Spinner | `spinner spinner-md spinner-primary` |
| Link sin decoración | `link-block` |
| Fila de documento usuario | `doc-row` + `doc-row-title` + `doc-row-meta` + `doc-row-price` |

---

## Checklist antes de entregar código con estilos

- [ ] Cada `style={{}}` tiene justificación de valor dinámico
- [ ] Botones usan `.btn` con variante
- [ ] Iconos de acción usan `.icon-btn` con modificador de color
- [ ] Modales usan `.overlay` + `.admin-modal-box` o `.modal-box`
- [ ] Dropdowns de acciones usan `.dropdown-menu`/`.dropdown-item` portalizados a `document.body` con `position: fixed` (nunca dropdowns inline con `position: absolute`)
- [ ] Inputs usan `.input-group` + `.input-v3`
- [ ] Estados vacíos usan `.empty-state`
- [ ] Nuevas clases añadidas usan tokens `var(--color-*)`, `var(--space-*)`, nunca hex ni px hardcodeados
- [ ] Si toco un componente que se ve sobre fondo oscuro, verifiqué en dark mode que iconos, sombras y bordes son visibles

---

## Modo oscuro — comportamiento

El toggle dark/light vive en Zustand (`src/store/themeStore.ts`); `App.tsx` aplica clase `.dark` y atributo `data-theme="dark"` en `<html>`. Casi todo el CSS funciona automáticamente porque los tokens cambian de valor entre `:root, [data-theme="light"]` y `.dark, [data-theme="dark"]`.

### Reglas que importan al escribir CSS

- **Hovers de botón en dark NO cambian background.** El efecto "lift" lo da el `box-shadow` (3px → 5px) + `transform: translate(-2px, -2px)`. Si tu botón nuevo define `:hover { background: ... }` para light, en dark queda neutralizado por overrides genéricos en `index.css`.
- **`color-scheme: light/dark`** se aplica al `<html>` automáticamente. Iconos nativos del navegador (calendario en `<input type="date">`, time pickers) se invierten solos en dark.
- **Tokens nuevos disponibles:** `--color-error-hover`, `--color-error-active`, `--color-error-subtle` (en ambos modos).
- **Tokens que NO existen** y suelen causar iconos negros: `--color-blue`, `--color-warning`, `--color-orange`. Usar paleta principal (`--color-primary`, `--color-gold`, `--color-copper`).

### Cuándo añadir override explícito `[data-theme="dark"] .mi-clase`

- SVG en data-URI con stroke/fill hardcoded (chevron de `.select-v3`).
- Sombras `rgba(0,0,0,...)` que se pierden sobre fondo oscuro (`.modal-box`, `.tooltip-content`, `.doc-flash`) — añadir ring blanco tenue + sombra negra profunda.
- Background sólido cuyo token claro pierde fuerza como botón (`.btn-danger` usa rojo saturado `#DA3D3D` en dark).
- Botones blancos sobre fondos de COLOR (`.btn-white`, `.btn-white-copper`) deben mantenerse `#FFFFFF` siempre — no usar `var(--color-white)` que en dark se oscurece.

---

**Para consulta completa del inventario de clases → `/css-guide`**

---

## Tablas Supabase — regla de GRANTs (activa desde Mayo 2026)

Toda tabla nueva en `public` **debe incluir GRANTs explícitos** o PostgREST devuelve error `42501`.
La plantilla `_TEMPLATE_nueva_tabla_documental.sql` ya los incluye. No omitirlos al copiar la plantilla.

```sql
GRANT SELECT                             ON public.<tabla> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<tabla> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.<tabla> TO service_role;
```
