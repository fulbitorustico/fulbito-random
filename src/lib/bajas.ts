import { supabase } from './supabase'
import type { BajasTardias } from './types'

export async function registrarBaja(
  partidoId: string,
  jugadorId: string,
  fechaHoraPartido: string,
  eraCapitan = false,
) {
  const horasAntes = (new Date(fechaHoraPartido).getTime() - Date.now()) / 3_600_000
  await supabase.from('bajas').insert({
    partido_id: partidoId,
    jugador_id: jugadorId,
    horas_antes: horasAntes,
    // Bajarse de un partido que armaste vos no es lo mismo que bajarse de
    // uno ajeno: deja a diez personas colgadas. Se cuenta aparte.
    era_capitan: eraCapitan,
  })
}

// A la tercera, tarjeta amarilla. La sanción que funciona en el fulbito
// no es un puntaje escondido: es que se sepa.
export const ABANDONOS_PARA_AMARILLA = 3

export async function fetchAbandonosCapitanMap(): Promise<Record<string, number>> {
  const { data } = await supabase.rpc('abandonos_de_capitan')
  const map: Record<string, number> = {}
  for (const row of (data ?? []) as BajasTardias[]) map[row.jugador_id] = row.cantidad
  return map
}

export async function fetchBajasTardiasMap(): Promise<Record<string, number>> {
  const { data } = await supabase.rpc('bajas_tardias_por_jugador')
  const map: Record<string, number> = {}
  for (const row of (data ?? []) as BajasTardias[]) map[row.jugador_id] = row.cantidad
  return map
}
