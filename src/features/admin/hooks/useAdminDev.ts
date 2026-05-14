/**
 * useAdminDev — flag para activar acciones admin destructivas o sólo-dev
 * (borrar facturas individuales, eliminar usuarios…). Se activa con
 * `VITE_ADMIN_DEV_ACTIONS=true` en `.env.local`; en producción queda en false.
 */
export function useAdminDev(): boolean {
  return import.meta.env.VITE_ADMIN_DEV_ACTIONS === 'true'
}
