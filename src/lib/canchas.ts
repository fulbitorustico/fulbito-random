// Búsqueda de canchas con OpenStreetMap (Nominatim). Es gratis, no pide
// tarjeta ni clave, a diferencia de Google Maps. El único requisito es no
// abusar: por eso se busca recién cuando el usuario deja de escribir.

export interface CanchaEncontrada {
  nombre: string
  detalle: string
  lat: number
  lng: number
}

export async function buscarCanchas(texto: string, cerca?: { lat: number; lng: number }): Promise<CanchaEncontrada[]> {
  if (texto.trim().length < 3) return []

  const params = new URLSearchParams({
    q: texto,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'ar',
    'accept-language': 'es',
  })

  // Si sabemos dónde está, priorizamos resultados de su zona.
  if (cerca) {
    const d = 0.5
    params.set('viewbox', `${cerca.lng - d},${cerca.lat + d},${cerca.lng + d},${cerca.lat - d}`)
    params.set('bounded', '0')
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
    if (!res.ok) return []
    const datos = (await res.json()) as {
      name?: string
      display_name: string
      lat: string
      lon: string
      address?: Record<string, string>
    }[]

    return datos.map((d) => {
      const dir = d.address ?? {}
      const partes = [dir.road, dir.suburb ?? dir.neighbourhood, dir.city ?? dir.town ?? dir.village].filter(Boolean)
      return {
        nombre: d.name || d.display_name.split(',')[0],
        detalle: partes.join(', ') || d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }
    })
  } catch {
    return []
  }
}
