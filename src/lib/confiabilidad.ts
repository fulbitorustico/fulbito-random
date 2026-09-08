export type NivelConfiabilidad = 'confiable' | 'a_prueba' | 'poco_confiable'

export const UMBRAL_BAJA_TARDIA_HORAS = 0.75 // 45 minutos antes del partido

export function nivelDesdeBajasTardias(cantidad: number): NivelConfiabilidad {
  if (cantidad <= 1) return 'confiable'
  if (cantidad <= 3) return 'a_prueba'
  return 'poco_confiable'
}

export const CONFIABILIDAD_INFO: Record<NivelConfiabilidad, { emoji: string; label: string; color: string; bg: string }> = {
  confiable: { emoji: '🟢', label: 'Confiable', color: 'var(--pitch-500)', bg: 'rgba(45,106,79,.12)' },
  a_prueba: { emoji: '🟡', label: 'A prueba', color: 'var(--gold-500)', bg: 'rgba(185,121,31,.14)' },
  poco_confiable: { emoji: '🔴', label: 'Poco confiable', color: '#b3432f', bg: 'rgba(179,67,47,.1)' },
}
