import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Traduce lo que devuelve la base a algo que entienda una persona.
 *
 * Hace falta porque las políticas de permisos rechazan sin explicar: cuando
 * la base dice que no, devuelve "new row violates row-level security policy",
 * que no le dice nada a nadie. Y como la app endureció esas políticas —cupo,
 * grupo, solo confiables, fecha— ahora rechaza seguido y con razón.
 *
 * La regla al agregar casos: el mensaje tiene que decir **qué pasó y qué
 * hacer**, nunca cómo se llama la restricción que falló.
 */
export function mensajeDeError(error: PostgrestError | null, contexto?: string): string | null {
  if (!error) return null

  const texto = `${error.message} ${error.details ?? ''}`.toLowerCase()

  // Los mensajes de los disparadores vienen escritos para una persona:
  // se muestran tal cual.
  if (error.code === 'P0001') return error.message

  if (texto.includes('row-level security') || error.code === '42501') {
    if (contexto === 'sumarse') {
      return 'No pudimos anotarte. Puede que el partido se haya llenado, que sea de un grupo del que no sos parte, o que sea solo para jugadores confiables.'
    }
    if (contexto === 'crear-partido') {
      return 'No pudimos crear el partido. Revisá que la fecha sea de acá en adelante.'
    }
    if (contexto === 'grupo') {
      return 'No pudimos sumarte al grupo. Puede que necesite la aprobación de quien lo creó.'
    }
    return 'La app no te dejó hacer eso. Si creés que es un error, mandanos una sugerencia desde el botón de abajo.'
  }

  if (error.code === '23505') return 'Eso ya estaba hecho.'

  if (error.code === '23514') {
    if (texto.includes('cupo')) return 'El cupo tiene que estar entre 2 y 30 jugadores.'
    if (texto.includes('valor')) return 'El valor de la cancha no puede ser negativo.'
    if (texto.includes('comentario')) return 'El comentario es muy largo o tiene links, y los links no se permiten.'
    if (texto.includes('mapa_url')) return 'Ese link no parece de Google Maps.'
    if (texto.includes('texto')) return 'Ese texto es muy largo.'
    return 'Alguno de los datos no es válido. Revisalo y probá de nuevo.'
  }

  if (texto.includes('fetch') || texto.includes('network')) {
    return 'No pudimos conectarnos. Fijate si tenés señal y probá de nuevo.'
  }

  return error.message
}
