# Base de datos: corrupción silenciosa de `datos_json` por `writeRowWithRetry`

## El problema

Al añadir la columna `numero` a la tabla `ndas` mediante la migración `012`, `writeRowWithRetry` encontraba que la columna **`datos_json` no existía** en la tabla (al igual que le pasó antes a `contratos`, motivo por el cual existe `010b_reparar_contratos.sql`).

El mecanismo de la función era:

1. Intentar `INSERT`/`UPDATE` con todas las columnas del payload
2. PostgREST devolvía `400`: *"Could not find the 'datos_json' column"*
3. `writeRowWithRetry` **eliminaba** `datos_json` del payload y reintentaba
4. El guardado **aparentaba éxito** ("NDA guardado"), pero la fila quedaba **sin** `datos_json`
5. Al abrir el documento (Editar/Ver/Descargar), `datos_json === null` → fallo

Este mecanismo era **silencioso y destructivo**: corrompía el documento sin que el desarrollador lo supiera, y los datos del JSON se perdían para siempre.

---

## Lo que se hizo

### 1. Hardening de `writeRowWithRetry` (`src/lib/userDocuments.ts:60-64`)

Se añadió un set `CRITICAL_COLUMNS = ['datos_json']`. Si la columna que falta es crítica, la función **rechaza** el guardado devolviendo error, en vez de eliminarla y seguir. Para columnas secundarias (`numero`, `notas`, etc.) el comportamiento anterior se mantiene (`console.warn` + `delete` + `retry`).

```ts
const CRITICAL_COLUMNS = new Set(['datos_json'])
if (CRITICAL_COLUMNS.has(missing)) {
  return { data: null, error }  // ← rechaza, no corrompe
}
```

Esto garantiza que **nunca más**, en ninguna tabla (presente o futura), se guarde un documento sin `datos_json`.

### 2. `console.warn` para columnas secundarias (`userDocuments.ts:71`)

Ahora imprime explícitamente qué columna falta y pide ejecutar una migración de reparación:

```
[writeRowWithRetry] Columna 'numero' no existe en 'ndas', eliminando del payload.
Ejecuta una migración de reparación.
```

### 3. Regla #10 en `AGENTS.md`

Documenta el mecanismo completo, la distinción entre columnas críticas y secundarias, y exige crear migraciones `NNNb_reparar_{tabla}.sql` al añadir columnas nuevas.

### 4. Migraciones de reparación

- `010b_reparar_contratos.sql` — Reañade `datos_json`, `notas`, `numero` en contratos
- `012b_reparar_ndas.sql` — Reañade `datos_json`, `notas`, `numero` en ndas
- `013b_reparar_reclamaciones.sql` — Reañade `datos_json`, `notas`, `numero` en reclamaciones

Todas usan `ALTER TABLE ADD COLUMN IF NOT EXISTS` (inofensivo si ya existen).

---

## Por qué no volverá a ocurrir

| Escenario | Antes | Ahora |
|---|---|---|
| Falta `datos_json` al guardar | Elimina columna → guarda corrupto silencioso | **Rechaza guardado** → error visible → migración obligatoria |
| Falta `numero` al guardar | Elimina columna → guarda OK | Igual, pero con `console.warn` visible |
| Nueva herramienta futura | Mismo riesgo de corrupción | `datos_json` nunca se elimina del payload, en ninguna tabla |
