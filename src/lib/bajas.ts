import { supabase } from './supabase'
import type { BajasTardias } from './types'

export async function registrarBaja(
  partidoId: string,
  jugadorId: string,
  fechaHoraPartido: string,
  eraCapitan = false,
) {
  const horasAntes = (new Date(fechaHoraPartido).getTime() - Date.now()) / 3_600_000

  // Si el partido ya arrancó, esto no es una baja: es alguien corrigiendo la
  // lista después. Registrarlo contaría como baja tardía —las horas dan
  // negativas y todo lo negativo está por debajo del umbral— y le arruinaría
  // la confiabilidad a alguien que no hizo nada malo.
  if (horasAntes < 0) return

  await supabase.from('bajas').insert({
    partido_id: partidoId,
    jugador_id: jugadorId,
    horas_antes: horasAntes,
    // Bajarse de un partido que armaste vos no es lo mismo que bajarse de
    // uno ajeno: deja a diez personas colgadas. Se cuenta aparte.
    era_capitan: eraCapitan,
  })
}

export async function fetchBajasTardiasMap(): Promise<Record<string, number>> {
  const { data } = await supabase.rpc('bajas_tardias_por_jugador')
  const map: Record<string, number> = {}
  for (const row of (data ?? []) as BajasTardias[]) map[row.jugador_id] = row.cantidad
  return map
}
