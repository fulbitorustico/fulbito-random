import type { EstadoPartido } from './types'

export interface Coords {
  lat: number
  lng: number
}

export type EstadoTiempoPartido = 'programado' | 'en_juego' | 'terminado' | 'cancelado'

const DURACION_PARTIDO_MS = 2 * 60 * 60 * 1000

export function calcularEstadoPartido(fechaHoraISO: string, estado: EstadoPartido): EstadoTiempoPartido {
  if (estado === 'cancelado') return 'cancelado'
  const diffMs = Date.now() - new Date(fechaHoraISO).getTime()
  if (diffMs < 0) return 'programado'
  if (diffMs < DURACION_PARTIDO_MS) return 'en_juego'
  return 'terminado'
}

export function distanciaKm(a: Coords, b: Coords): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function formatDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatCuentaRegresiva(fechaHoraISO: string): string {
  const diffMs = new Date(fechaHoraISO).getTime() - Date.now()

  if (diffMs > 0) {
    const minutos = Math.round(diffMs / 60000)
    if (minutos < 60) return `en ${minutos} min`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) {
      const restoMin = minutos % 60
      return restoMin > 0 ? `en ${horas} h ${restoMin} min` : `en ${horas} h`
    }
    const dias = Math.floor(horas / 24)
    return `en ${dias} ${dias === 1 ? 'día' : 'días'}`
  }

  const pasadoMs = -diffMs
  if (pasadoMs < DURACION_PARTIDO_MS) return 'en juego'
  const horas = Math.floor(pasadoMs / 3600000)
  if (horas < 24) return `terminó hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `terminó hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function pedirUbicacion(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  })
}
