import type { Jugador, Partido } from './types'

/**
 * Quién puede hacer qué. **Este archivo es la única fuente de verdad de la
 * pantalla**, y cada función anota al lado la política de la base que le
 * corresponde.
 *
 * Por qué existe: la autorización estaba escrita dos veces, a mano — una en
 * cada pantalla y otra en cada política — y se desincronizaron. El botón
 * "Generar equipos" se le mostraba al subcapitán y la base lo rechazaba en
 * silencio, sin error y sin explicación.
 *
 * La regla al tocar esto: **si cambia una función de acá, se revisa la
 * política de la base que está nombrada al lado, y al revés.** La pantalla
 * nunca es la que autoriza; la pantalla decide qué mostrar. Quien autoriza
 * es la base, siempre.
 */

export const DURACION_PARTIDO_HORAS = 2
export const VENTANA_VALORAR_HORAS = 24
export const CONFIRMAR_DESDE_HORAS = 24
export const LIBERAR_A_LAS_HORAS = 12

function horasDesdeInicio(partido: Partido) {
  return (Date.now() - new Date(partido.fecha_hora).getTime()) / 3_600_000
}

export function horasParaEmpezar(partido: Partido) {
  return -horasDesdeInicio(partido)
}

/** Política: `partidos → UPDATE · editar partido propio` */
export function esCapitan(partido: Partido, jugador: Jugador | null) {
  return !!jugador && jugador.id === partido.admin_id
}

/** Política: `partidos → UPDATE · subcapitan edita el partido` */
export function esSubcapitan(partido: Partido, jugador: Jugador | null) {
  return !!jugador && jugador.id === partido.subcapitan_id
}

/**
 * Manda el partido: editar, cancelar, invitar y armar los equipos.
 * Políticas: `participantes → UPDATE · asignar equipo` e
 * `invitaciones → INSERT · invitar a mi partido`, que contemplan a los dos.
 */
export function puedeAdministrar(partido: Partido, jugador: Jugador | null) {
  return esCapitan(partido, jugador) || esSubcapitan(partido, jugador)
}

/**
 * Valorar: hay que haber jugado y estar dentro de la ventana.
 * Políticas: las de `valoraciones`, `insignias_otorgadas` y `mvp_votos`,
 * que exigen ser participante y respetar las 24hs.
 */
export function puedeValorar(partido: Partido, estoyAnotado: boolean) {
  const horas = horasDesdeInicio(partido)
  return (
    estoyAnotado &&
    partido.estado !== 'cancelado' &&
    horas > DURACION_PARTIDO_HORAS &&
    horas <= VENTANA_VALORAR_HORAS
  )
}

/**
 * La franja en la que se pide confirmar asistencia.
 * Ver `liberar_lugares_sin_confirmar()`, que hace la cuenta de verdad.
 */
export function enVentanaDeConfirmar(partido: Partido) {
  const faltan = horasParaEmpezar(partido)
  return partido.estado === 'abierto' && faltan > 0 && faltan <= CONFIRMAR_DESDE_HORAS
}

/**
 * El capitán no puede irse dejando el partido sin dueño: si hay a quién,
 * primero elige sucesor. No hay política que lo obligue —la base no puede
 * saber la intención— así que acá la pantalla sí decide, y por eso está
 * anotado como excepción.
 */
export function debePasarLaCapitania(partido: Partido, jugador: Jugador | null, cantidadAnotados: number) {
  return esCapitan(partido, jugador) && cantidadAnotados > 1
}
