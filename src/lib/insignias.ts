export interface Insignia {
  id: string
  emoji: string
  label: string
}

export const INSIGNIAS: Insignia[] = [
  { id: 'rayo', emoji: '⚡', label: 'Rayo' },
  { id: 'killer', emoji: '🎯', label: 'Killer' },
  { id: 'el_10', emoji: '🧠', label: 'El 10' },
  { id: 'paredon', emoji: '🧱', label: 'Paredón' },
  { id: 'gambeta', emoji: '🌀', label: 'Gambeta' },
  { id: 'cumplidor', emoji: '✅', label: 'Cumplidor' },
  { id: 'motor', emoji: '🔋', label: 'Motor' },
]

const POR_ID: Record<string, Insignia> = Object.fromEntries(INSIGNIAS.map((i) => [i.id, i]))

export function insigniaPorId(id: string): Insignia | undefined {
  return POR_ID[id]
}
