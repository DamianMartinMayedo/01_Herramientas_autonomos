import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EmisorInfo, LineaDocumento } from '../types/document.types'

const LEGACY_EMISOR_KEY = 'ha_emisor'

export interface PresupuestoPendiente {
  cliente: {
    nombre: string
    nif: string
    direccion?: string
    ciudad?: string
    cp?: string
    provincia?: string
    email?: string
  }
  lineas: LineaDocumento[]
  notas?: string
  mostrarIrpf?: boolean
}

interface DocumentStore {
  emisorGuardado: EmisorInfo | null
  setEmisorGuardado: (emisor: EmisorInfo) => void

  presupuestoPendiente: PresupuestoPendiente | null
  setPresupuestoPendiente: (datos: PresupuestoPendiente) => void
  limpiarPresupuestoPendiente: () => void
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      emisorGuardado: null,
      setEmisorGuardado: (emisor) => set({ emisorGuardado: emisor }),

      presupuestoPendiente: null,
      setPresupuestoPendiente: (datos) => set({ presupuestoPendiente: datos }),
      limpiarPresupuestoPendiente: () => set({ presupuestoPendiente: null }),
    }),
    {
      name: 'ha-document-store',
      partialize: (state) => ({ emisorGuardado: state.emisorGuardado }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.emisorGuardado) {
          try {
            const legacy = localStorage.getItem(LEGACY_EMISOR_KEY)
            if (legacy) {
              state.emisorGuardado = JSON.parse(legacy) as EmisorInfo
              localStorage.removeItem(LEGACY_EMISOR_KEY)
            }
          } catch {
            // ignorar formato inválido
          }
        }
      },
    },
  ),
)
