import { supabase } from './supabase'

export async function registrarBaja(partidoId: string, jugadorId: string, fechaHoraPartido: string) {
  const horasAntes = (new Date(fechaHoraPartido).getTime() - Date.now()) / 3_600_000
  await supabase.from('bajas').insert({
    partido_id: partidoId,
    jugador_id: jugadorId,
    horas_antes: horasAntes,
  })
}
