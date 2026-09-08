export type NivelConfiabilidad = 'confiable' | 'a_prueba' | 'poco_confiable'

export const UMBRAL_BAJA_TARDIA_HORAS = 0.75 // 45 minutos antes del partido

export function nivelDesdeBajasTardias(cantidad: number): NivelConfiabilidad {
  if (cantidad <= 1) return 'confiable'
  if (cantidad <= 3) return 'a_prueba'
  return 'poco_confiable'
}

export const CONFIABILIDAD_INFO: Record<NivelConfiabilidad, { emoji: string; label: string; color: string; bg: string }> = {
  confiable: { emoji: '🟢', label: 'Confiable', color: 'var(--acc-green)', bg: 'rgba(159,198,154,.16)' },
  a_prueba: { emoji: '🟡', label: 'A prueba', color: 'var(--gold-500)', bg: 'rgba(237,197,141,.16)' },
  poco_confiable: { emoji: '🔴', label: 'Poco confiable', color: 'var(--error)', bg: 'rgba(224,122,99,.14)' },
}
