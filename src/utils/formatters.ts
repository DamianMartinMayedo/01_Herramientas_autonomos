export const formatEuro = (valor: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(valor)

export const formatFecha = (isoDate: string): string => {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export const fechaHoy = (): string => new Date().toISOString().split('T')[0]
