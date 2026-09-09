import type { Partido } from './types'

// Un fútbol 5 no dura más que esto. Es la misma duración que usa
// calcularEstadoPartido para decidir si el partido todavía está en juego.
const DURACION_HORAS = 2

// El aviso llega el día anterior: es el último momento en el que todavía
// se consigue reemplazo si te caés.
const AVISO_HORAS_ANTES = 24

function aFormatoUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function finDelPartido(partido: Partido) {
  return new Date(new Date(partido.fecha_hora).getTime() + DURACION_HORAS * 3_600_000)
}

function titulo(partido: Partido) {
  return `Fulbito en ${partido.cancha}`
}

function detalle(partido: Partido) {
  return `Partido de Fulbito Random. Si no vas a poder ir, bajate desde la app así entra otro: ${window.location.origin}/partidos/${partido.id}`
}

/**
 * Link que abre Google Calendar con el partido ya cargado. No necesita
 * conectar ninguna cuenta: es una URL armada.
 *
 * Ojo: Google no deja fijar el recordatorio desde el link, usa el que cada
 * uno tenga por defecto. Por eso el camino principal es el archivo .ics,
 * que sí lleva el aviso de 24hs adentro.
 */
export function linkGoogleCalendar(partido: Partido) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo(partido),
    dates: `${aFormatoUtc(new Date(partido.fecha_hora))}/${aFormatoUtc(finDelPartido(partido))}`,
    details: detalle(partido),
    location: partido.cancha,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Archivo de calendario con el aviso de 24hs adentro. Lo entienden el
 * calendario del iPhone, el de Android y Google Calendar.
 */
export function descargarIcs(partido: Partido) {
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fulbito Random//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${partido.id}@fulbitorandom`,
    `DTSTAMP:${aFormatoUtc(new Date())}`,
    `DTSTART:${aFormatoUtc(new Date(partido.fecha_hora))}`,
    `DTEND:${aFormatoUtc(finDelPartido(partido))}`,
    `SUMMARY:${titulo(partido)}`,
    `LOCATION:${partido.cancha.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${detalle(partido).replace(/,/g, '\\,')}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${AVISO_HORAS_ANTES}H`,
    'ACTION:DISPLAY',
    `DESCRIPTION:Mañana jugás en ${partido.cancha}. Si no vas a poder\\, bajate ahora así entra otro.`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fulbito-${partido.cancha.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export type Frecuencia = 'semanal' | 'quincenal' | 'mensual'

export const FRECUENCIAS: { valor: Frecuencia; label: string }[] = [
  { valor: 'semanal', label: 'Semanal' },
  { valor: 'quincenal', label: 'Quincenal' },
  { valor: 'mensual', label: 'Mensual' },
]

/**
 * La próxima fecha de un partido que se repite. Si el partido que estás
 * repitiendo ya es viejo, sigue saltando hasta caer en el futuro: la base
 * rechaza los partidos con fecha pasada.
 *
 * Mensual salta de mes manteniendo el día del mes; los otros dos suman días,
 * así que el partido cae siempre en el mismo día de la semana.
 */
export function proximaFecha(desde: string, frecuencia: Frecuencia): Date {
  const fecha = new Date(desde)
  const saltar = () => {
    if (frecuencia === 'mensual') fecha.setMonth(fecha.getMonth() + 1)
    else fecha.setDate(fecha.getDate() + (frecuencia === 'quincenal' ? 14 : 7))
  }
  saltar()
  while (fecha.getTime() <= Date.now()) saltar()
  return fecha
}
