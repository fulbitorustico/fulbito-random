export const DIAS_DISPONIBILIDAD = [
  { id: 'lun_mie', label: 'Lunes a miércoles' },
  { id: 'jue_vie', label: 'Jueves y viernes' },
  { id: 'sab', label: 'Sábados' },
  { id: 'dom', label: 'Domingos' },
  { id: 'manana', label: 'A la mañana' },
  { id: 'tarde', label: 'A la tarde' },
  { id: 'noche', label: 'A la noche' },
]

export function formatDisponibilidad(ids: string[] | null | undefined): string {
  if (!ids || ids.length === 0) return 'Cualquier día'
  return ids.map((id) => DIAS_DISPONIBILIDAD.find((d) => d.id === id)?.label ?? id).join(' · ')
}
