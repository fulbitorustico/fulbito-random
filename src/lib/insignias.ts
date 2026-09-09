import type { NombreIcono } from '../components/Icono'

export interface Insignia {
  id: string
  icono: NombreIcono
  label: string
}

export const INSIGNIAS: Insignia[] = [
  { id: 'rayo', icono: 'rayo', label: 'Rayo' },
  { id: 'killer', icono: 'diana', label: 'Killer' },
  { id: 'el_10', icono: 'pase', label: 'El 10' },
  { id: 'paredon', icono: 'muralla', label: 'Paredón' },
  { id: 'gambeta', icono: 'gambeta', label: 'Gambeta' },
  { id: 'cumplidor', icono: 'cumplidor', label: 'Cumplidor' },
  { id: 'motor', icono: 'motor', label: 'Motor' },
]

const POR_ID: Record<string, Insignia> = Object.fromEntries(INSIGNIAS.map((i) => [i.id, i]))

export function insigniaPorId(id: string): Insignia | undefined {
  return POR_ID[id]
}
