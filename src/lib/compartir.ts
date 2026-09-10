import type { Partido } from './types'

/**
 * El mensaje y el link para pasar un partido por WhatsApp.
 *
 * Vive acá y no adentro de una pantalla porque se comparte desde dos lados:
 * el detalle del partido y el buscador de jugadores cuando está vacío —que
 * es justo el momento en que más falta hace.
 */
export function mensajeDelPartido(partido: Partido) {
  const url = `${window.location.origin}/p/${partido.token}`
  const fecha = new Date(partido.fecha_hora).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
  return { url, texto: `Jugamos en ${partido.cancha}, ${fecha}. Anotate acá: ${url}` }
}

export type ResultadoCompartir = 'compartido' | 'copiado' | 'whatsapp'

/**
 * Usa el menú de compartir del celular si existe; si no, copia al portapapeles;
 * y si tampoco, abre WhatsApp. Devuelve qué camino tomó para que la pantalla
 * pueda avisar lo correcto.
 */
export async function compartirPartido(partido: Partido): Promise<ResultadoCompartir> {
  const { texto } = mensajeDelPartido(partido)

  if (navigator.share) {
    try {
      await navigator.share({ text: texto })
      return 'compartido'
    } catch {
      // Lo canceló: seguimos al respaldo.
    }
  }
  try {
    await navigator.clipboard.writeText(texto)
    return 'copiado'
  } catch {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    return 'whatsapp'
  }
}
