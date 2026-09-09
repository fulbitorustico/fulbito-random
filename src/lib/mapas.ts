// Cómo ubicamos una cancha sin pagarle a nadie.
//
// El buscador por nombre falla seguido porque OpenStreetMap tiene la
// geometría de las canchas pero casi ninguna con nombre. Así que hay dos
// puertas más, y las dos son gratis:
//
//   1. La dirección a mano (calle, altura, localidad). OpenStreetMap es malo
//      buscando "la cancha de Pepe" pero es bueno buscando "Av. Rivadavia
//      5400, Caballito": las direcciones sí están cargadas.
//
//   2. El link de Google Maps, pegado por el usuario. Google tiene los datos
//      que nos faltan; en vez de pedirle su API —que exige tarjeta y deja la
//      clave a la vista en una app que corre en el navegador— le pedimos al
//      usuario el link, que es gratis y no tiene límite.

export interface Coordenadas {
  lat: number
  lng: number
}

/**
 * Saca las coordenadas de un link de Google Maps.
 *
 * Los links largos las llevan adentro y se pueden leer sin llamar a nadie.
 * Los cortos (maps.app.goo.gl), que son los que da el botón "Compartir" del
 * celular, no: son un redireccionamiento y habría que seguirlo desde un
 * servidor. Para esos devolvemos null, y el link se guarda igual — sirve
 * para "Cómo llegar" aunque no sepamos dónde queda.
 */
export function coordenadasDesdeLinkDeMapas(url: string): Coordenadas | null {
  const patrones = [
    // El marcador del lugar. Es el más preciso: apunta al local, no a la
    // vista del mapa.
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    // El centro de la vista. Aproximado pero suele estar encima del lugar.
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Links armados a mano con coordenadas.
    /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  ]

  for (const patron of patrones) {
    const m = url.match(patron)
    if (!m) continue
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }
  return null
}

export function pareceLinkDeMapas(url: string): boolean {
  const t = url.trim().toLowerCase()
  return (
    t.startsWith('http') &&
    (t.includes('google.com/maps') ||
      t.includes('goo.gl/maps') ||
      t.includes('maps.app.goo.gl') ||
      t.includes('maps.google'))
  )
}

/**
 * Busca las coordenadas de una dirección escrita a mano. Acá OpenStreetMap
 * sí sirve: las calles y alturas de Argentina están bien cargadas, a
 * diferencia de los nombres de fantasía de las canchas.
 */
export async function geocodificarDireccion(
  calle: string,
  altura: string,
  localidad: string,
): Promise<Coordenadas | null> {
  const texto = [`${calle} ${altura}`.trim(), localidad, 'Argentina'].filter(Boolean).join(', ')
  if (texto.length < 8) return null

  const params = new URLSearchParams({
    q: texto,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ar',
    'accept-language': 'es',
  })

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
    if (!res.ok) return null
    const datos = (await res.json()) as { lat: string; lon: string }[]
    if (datos.length === 0) return null
    return { lat: Number(datos[0].lat), lng: Number(datos[0].lon) }
  } catch {
    return null
  }
}

/**
 * El link para llegar a la cancha, en orden de preferencia: el que pegó el
 * que armó el partido, después las coordenadas, y si no hay nada, una
 * búsqueda por nombre. Siempre devuelve algo abrible.
 */
export function linkComoLlegar(partido: {
  cancha: string
  lat: number | null
  lng: number | null
  mapa_url?: string | null
}): string {
  if (partido.mapa_url) return partido.mapa_url
  if (partido.lat != null && partido.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${partido.lat},${partido.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partido.cancha)}`
}
