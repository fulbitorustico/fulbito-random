export const POSICIONES = [
  'Arquero',
  'Defensor central',
  'Lateral derecho',
  'Lateral izquierdo',
  'Volante defensivo',
  'Volante central',
  'Volante ofensivo',
  'Extremo derecho',
  'Extremo izquierdo',
  'Segundo delantero',
  'Delantero centro',
] as const

export const MAX_POSICIONES = 2

export function formatPosiciones(posiciones: string[] | null | undefined): string {
  if (!posiciones || posiciones.length === 0) return 'Sin posición'
  return posiciones.join(' / ')
}
