import type { ClienteInfo } from './document.types'
import type { ParteLegal } from './legalDoc.types'

export interface RegularClient {
  id: string
  user_id: string
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email?: string
  telefono?: string
  pais?: string
  notas?: string
  cliente_exterior: boolean
  created_at: string
  updated_at: string
}

export interface RegularClientInput {
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email?: string
  telefono?: string
  pais?: string
  notas?: string
  cliente_exterior?: boolean
}

export function regularClientToClienteInfo(client: RegularClient): ClienteInfo {
  return {
    nombre: client.nombre,
    nif: client.nif,
    direccion: client.direccion,
    ciudad: client.ciudad,
    cp: client.cp,
    provincia: client.provincia,
    email: client.email,
    pais: client.pais,
    clienteExterior: client.cliente_exterior ?? Boolean(client.pais && client.pais.trim()),
  }
}

export function regularClientToParteLegal(client: RegularClient): ParteLegal {
  return {
    nombre: client.nombre,
    nif: client.nif,
    direccion: client.direccion,
    ciudad: client.ciudad,
    cp: client.cp,
    provincia: client.provincia,
    email: client.email,
    telefono: client.telefono,
    representante: '',
    cargo: '',
  }
}
