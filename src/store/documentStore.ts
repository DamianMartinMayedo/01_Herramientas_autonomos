import { create } from 'zustand'
import type { EmisorInfo } from '../types/document.types'

// Clave para persistir emisor en localStorage
const EMISOR_KEY = 'ha_emisor'

function cargarEmisor(): EmisorInfo | null {
  try {
    const raw = localStorage.getItem(EMISOR_KEY)
    return raw ? (JSON.parse(raw) as EmisorInfo) : null
  } catch {
    return null
  }
}

interface DocumentStore {
  // Datos del autónomo (emisor) persistidos entre herramientas
  emisorGuardado: EmisorInfo | null
  setEmisorGuardado: (emisor: EmisorInfo) => void

  // Contadores de secuencia para numeración automática
  secuencias: Record<string, number>
  incrementarSecuencia: (tipo: string) => number
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  emisorGuardado: cargarEmisor(),

  setEmisorGuardado: (emisor) => {
    localStorage.setItem(EMISOR_KEY, JSON.stringify(emisor))
    set({ emisorGuardado: emisor })
  },

  secuencias: {},
  incrementarSecuencia: (tipo) => {
    const actual = get().secuencias[tipo] ?? 0
    const nueva = actual + 1
    set((s) => ({ secuencias: { ...s.secuencias, [tipo]: nueva } }))
    return nueva
  },
}))
