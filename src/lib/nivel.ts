export interface Nivel {
  nombre: string
  color: string
  desde: number
}

// El nivel se gana jugando. El color del marco de la card es el del nivel,
// usando los mismos 5 colores del logo.
export const NIVELES: Nivel[] = [
  { nombre: 'Debutante', color: 'rgba(242,239,233,.3)', desde: 0 },
  { nombre: 'Habitué', color: '#9fc69a', desde: 5 },
  { nombre: 'Fijo', color: '#9dccda', desde: 15 },
  { nombre: 'Referente', color: '#a28abc', desde: 30 },
  { nombre: 'Leyenda', color: '#edc58d', desde: 60 },
]

export function nivelPorPartidos(partidos: number): Nivel {
  let actual = NIVELES[0]
  for (const n of NIVELES) if (partidos >= n.desde) actual = n
  return actual
}

export function progresoNivel(partidos: number): {
  actual: Nivel
  siguiente: Nivel | null
  faltan: number
  porcentaje: number
} {
  const actual = nivelPorPartidos(partidos)
  const siguiente = NIVELES[NIVELES.indexOf(actual) + 1] ?? null
  if (!siguiente) return { actual, siguiente: null, faltan: 0, porcentaje: 100 }

  const tramo = siguiente.desde - actual.desde
  const avance = partidos - actual.desde
  return {
    actual,
    siguiente,
    faltan: siguiente.desde - partidos,
    porcentaje: Math.round((avance / tramo) * 100),
  }
}
