import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { EmisorInfo } from '../types/document.types'

const STORE_KEY = 'ha-document-store'
const LEGACY_KEY = 'ha_emisor'

const sampleEmisor: EmisorInfo = {
  nombre: 'Juan Autónomo',
  nif: '12345678Z',
  direccion: 'Calle Mayor 1',
  ciudad: 'Madrid',
  cp: '28001',
  provincia: 'Madrid',
  email: 'juan@ejemplo.com',
  telefono: '600000000',
}

async function loadFreshStore() {
  vi.resetModules()
  const mod = await import('./documentStore')
  return mod.useDocumentStore
}

beforeEach(() => {
  localStorage.clear()
})

describe('documentStore — estado inicial', () => {
  it('emisorGuardado es null cuando localStorage está vacío', async () => {
    const useDocumentStore = await loadFreshStore()
    expect(useDocumentStore.getState().emisorGuardado).toBeNull()
    expect(useDocumentStore.getState().presupuestoPendiente).toBeNull()
  })
})

describe('documentStore — setEmisorGuardado', () => {
  it('actualiza el estado en memoria', async () => {
    const useDocumentStore = await loadFreshStore()
    useDocumentStore.getState().setEmisorGuardado(sampleEmisor)
    expect(useDocumentStore.getState().emisorGuardado).toEqual(sampleEmisor)
  })

  it('persiste en localStorage bajo la nueva clave ha-document-store', async () => {
    const useDocumentStore = await loadFreshStore()
    useDocumentStore.getState().setEmisorGuardado(sampleEmisor)

    const raw = localStorage.getItem(STORE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { state: { emisorGuardado: EmisorInfo } }
    expect(parsed.state.emisorGuardado).toEqual(sampleEmisor)
  })

  it('no guarda presupuestoPendiente en localStorage (partialize)', async () => {
    const useDocumentStore = await loadFreshStore()
    useDocumentStore.getState().setEmisorGuardado(sampleEmisor)
    useDocumentStore.getState().setPresupuestoPendiente({
      cliente: { nombre: 'X', nif: 'Y' },
      lineas: [],
    })

    const raw = localStorage.getItem(STORE_KEY)
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state.emisorGuardado).toEqual(sampleEmisor)
    expect(parsed.state.presupuestoPendiente).toBeUndefined()
  })
})

describe('documentStore — migración legacy ha_emisor', () => {
  it('migra los datos del key antiguo al nuevo formato', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(sampleEmisor))

    const useDocumentStore = await loadFreshStore()
    expect(useDocumentStore.getState().emisorGuardado).toEqual(sampleEmisor)
  })

  it('borra la clave legacy tras migrar', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(sampleEmisor))

    await loadFreshStore()

    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('si el legacy contiene JSON inválido, no rompe y deja emisor en null', async () => {
    localStorage.setItem(LEGACY_KEY, '{esto no es json}')

    const useDocumentStore = await loadFreshStore()
    expect(useDocumentStore.getState().emisorGuardado).toBeNull()
  })

  it('no sobrescribe los datos del nuevo store si ya existen', async () => {
    const reciente: EmisorInfo = { ...sampleEmisor, nombre: 'Reciente' }
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ state: { emisorGuardado: reciente }, version: 0 }),
    )
    localStorage.setItem(LEGACY_KEY, JSON.stringify(sampleEmisor))

    const useDocumentStore = await loadFreshStore()
    expect(useDocumentStore.getState().emisorGuardado).toEqual(reciente)
  })
})

describe('documentStore — presupuestoPendiente', () => {
  it('set/limpiar funcionan en memoria', async () => {
    const useDocumentStore = await loadFreshStore()
    const datos = {
      cliente: { nombre: 'Acme', nif: 'B12345674' },
      lineas: [],
      notas: 'algo',
      mostrarIrpf: false,
    }
    useDocumentStore.getState().setPresupuestoPendiente(datos)
    expect(useDocumentStore.getState().presupuestoPendiente).toEqual(datos)

    useDocumentStore.getState().limpiarPresupuestoPendiente()
    expect(useDocumentStore.getState().presupuestoPendiente).toBeNull()
  })
})
