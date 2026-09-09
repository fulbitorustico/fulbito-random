import { supabase } from './supabase'

// Bajarse de un partido que armaste vos es una amarilla. Dos amarillas en
// dos meses son roja, y la roja te deja dos fechas sin poder armar partidos.
//
// La suspensión se cumple jugando, no esperando: jugás dos partidos y volvés.
// Es a propósito — esperar sentado no repara nada, y el que se borra de la
// app dos meses no debería volver con la ficha limpia.

export interface SancionCapitan {
  amarillas: number
  roja: boolean
  partidosParaVolver: number
}

export const SIN_SANCION: SancionCapitan = { amarillas: 0, roja: false, partidosParaVolver: 0 }

export async function fetchSancionCapitan(jugadorId: string): Promise<SancionCapitan> {
  const { data } = await supabase.rpc('sanciones_de_capitan', { p_jugador_id: jugadorId })
  const fila = ((data ?? []) as { amarillas: number; roja: boolean; partidos_para_volver: number }[])[0]
  if (!fila) return SIN_SANCION
  return {
    amarillas: Number(fila.amarillas),
    roja: fila.roja,
    partidosParaVolver: fila.partidos_para_volver,
  }
}

export function textoSancion(s: SancionCapitan): string | null {
  if (s.roja) {
    return s.partidosParaVolver === 1
      ? 'Roja: te falta jugar un partido para volver a armar partidos.'
      : `Roja: te faltan ${s.partidosParaVolver} partidos para volver a armar partidos.`
  }
  if (s.amarillas === 1) return 'Una amarilla: dejaste un partido propio sin capitán.'
  if (s.amarillas >= 2) return `${s.amarillas} amarillas por dejar partidos propios sin capitán.`
  return null
}
