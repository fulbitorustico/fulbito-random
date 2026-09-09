// Búsqueda de canchas en dos fuentes, en este orden:
//
//   1. El catálogo propio de la app. Es la fuente que importa: se arma sola
//      con cada partido que se crea, y a diferencia de OpenStreetMap tiene
//      justo las canchas donde esta gente juega.
//   2. OpenStreetMap (Nominatim), como respaldo.
//
// Por qué no Google Maps, que tiene muchísimos más datos: pide una cuenta de
// Google Cloud con tarjeta cargada aunque el uso entre en el tramo gratis, y
// en una app que corre en el navegador la clave queda a la vista de
// cualquiera salvo que se la esconda detrás de un servidor propio.
//
// Y por qué OSM solo no alcanza: tiene la geometría de las canchas pero casi
// ninguna con nombre. En 4 km alrededor del Obelisco hay 40 canchas mapeadas
// y 5 tienen nombre. Sirve para ubicar, no para buscar por nombre.

import { supabase } from './supabase'

export interface CanchaEncontrada {
  nombre: string
  detalle: string
  lat: number
  lng: number
  // Las del catálogo propio se marcan para poder mostrarlas distinto: son
  // canchas donde ya se jugó, no un punto en un mapa.
  propia?: boolean
  canchaId?: string
}

async function buscarEnCatalogoPropio(texto: string): Promise<CanchaEncontrada[]> {
  const { data } = await supabase
    .from('canchas')
    .select('id, nombre, zona, lat, lng')
    .ilike('nombre', `%${texto.trim()}%`)
    .limit(5)

  return ((data ?? []) as { id: string; nombre: string; zona: string | null; lat: number | null; lng: number | null }[])
    .map((c) => ({
      nombre: c.nombre,
      detalle: c.zona ?? 'Ya se jugó acá',
      lat: Number(c.lat ?? 0),
      lng: Number(c.lng ?? 0),
      propia: true,
      canchaId: c.id,
    }))
}

export async function buscarCanchas(texto: string, cerca?: { lat: number; lng: number }): Promise<CanchaEncontrada[]> {
  if (texto.trim().length < 3) return []

  const propias = await buscarEnCatalogoPropio(texto)

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
    if (!res.ok) return propias
    const datos = (await res.json()) as {
      name?: string
      display_name: string
      lat: string
      lon: string
      address?: Record<string, string>
    }[]

    const deOsm = datos.map((d) => {
      const dir = d.address ?? {}
      const partes = [dir.road, dir.suburb ?? dir.neighbourhood, dir.city ?? dir.town ?? dir.village].filter(Boolean)
      return {
        nombre: d.name || d.display_name.split(',')[0],
        detalle: partes.join(', ') || d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }
    })

    // Si una cancha ya está en el catálogo propio, no se repite abajo.
    const yaEstan = new Set(propias.map((c) => c.nombre.toLowerCase()))
    return [...propias, ...deOsm.filter((c) => !yaEstan.has(c.nombre.toLowerCase()))]
  } catch {
    return propias
  }
}
