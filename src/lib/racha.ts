// La racha se mide en semanas seguidas jugando, no en partidos seguidos.
//
// Es a propósito: "partidos seguidos" no significa nada mientras los partidos
// que se repiten no estén enlazados entre sí (no hay forma de saber que el
// jueves de esta semana es el mismo partido que el de la anterior). La semana,
// en cambio, se puede contar hoy y es como la gente lo cuenta igual: "hace
// seis semanas que no me pierdo uno".

export interface Racha {
  actual: number
  mejor: number
}

// Semana ISO: se identifica por el lunes que la abre. Se usa el jueves como
// pivote para no equivocarse en los cambios de año.
function lunesDeLaSemana(fecha: Date): number {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  // getUTCDay(): domingo es 0. Lo llevamos a lunes = 0.
  const diaDesdeLunes = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - diaDesdeLunes)
  return d.getTime()
}

const UNA_SEMANA = 7 * 24 * 3_600_000

/**
 * Recibe las fechas de los partidos jugados (en cualquier orden) y devuelve
 * la racha actual y la mejor de la historia.
 *
 * La racha actual solo cuenta si venís jugando: si la última semana con
 * partido no es esta ni la pasada, la racha está cortada y vale 0. La semana
 * en curso no rompe nada mientras todavía no termine.
 */
export function calcularRacha(fechas: string[]): Racha {
  const semanas = [...new Set(fechas.map((f) => lunesDeLaSemana(new Date(f))))].sort((a, b) => a - b)
  if (semanas.length === 0) return { actual: 0, mejor: 0 }

  let mejor = 1
  let corriendo = 1
  for (let i = 1; i < semanas.length; i++) {
    corriendo = semanas[i] - semanas[i - 1] === UNA_SEMANA ? corriendo + 1 : 1
    if (corriendo > mejor) mejor = corriendo
  }

  const estaSemana = lunesDeLaSemana(new Date())
  const ultima = semanas[semanas.length - 1]
  const vigente = ultima === estaSemana || ultima === estaSemana - UNA_SEMANA

  return { actual: vigente ? corriendo : 0, mejor }
}

export function textoRacha(racha: number): string {
  if (racha <= 1) return ''
  return `${racha} semanas seguidas`
}
