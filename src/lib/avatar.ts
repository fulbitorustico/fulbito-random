export const AVATARES_DISPONIBLES = ['⚽', '🦁', '🐺', '🦅', '🐢', '🔥', '⭐', '🎯', '🥷', '🐉', '🦈', '🐐']

const COLORES = ['#2d6a4f', '#b9791f', '#245741', '#7c5b2e', '#3f8265', '#8a5a2b']

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
