export const AVATARES_DISPONIBLES = ['⚽', '🦁', '🐺', '🦅', '🐢', '🔥', '⭐', '🎯', '🥷', '🐉', '🦈', '🐐']

// Los 5 colores del logo: el avatar es el lugar donde más se los ve.
const COLORES = ['#dd977b', '#a28abc', '#9dccda', '#9fc69a', '#edc58d']

export function colorParaNombre(nombre: string): string {
  let hash = 0
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
  return COLORES[Math.abs(hash) % COLORES.length]
}

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
