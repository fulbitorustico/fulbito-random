import { supabase } from './supabase'
import type { BajasTardias } from './types'

export async function registrarBaja(partidoId: string, jugadorId: string, fechaHoraPartido: string) {
  const horasAntes = (new Date(fechaHoraPartido).getTime() - Date.now()) / 3_600_000
  await supabase.from('bajas').insert({
    partido_id: partidoId,
    jugador_id: jugadorId,
    horas_antes: horasAntes,
  })
}

export async function fetchBajasTardiasMap(): Promise<Record<string, number>> {
  const { data } = await supabase.rpc('bajas_tardias_por_jugador')
  const map: Record<string, number> = {}
  for (const row of (data ?? []) as BajasTardias[]) map[row.jugador_id] = row.cantidad
  return map
}
