import type { NombreIcono } from '../components/Icono'

export interface Objetivo {
  id: string
  icono: NombreIcono
  titulo: string
  detalle: string
  meta: number
  color: string
}

// El progreso no se guarda en ningún lado: se calcula con lo que ya hay en la
// base (partidos, valoraciones, insignias, bajas). Así nunca queda desfasado.
export const OBJETIVOS: Objetivo[] = [
  {
    id: 'debut',
    icono: 'pelota',
    titulo: 'El debut',
    detalle: 'Jugá tu primer partido',
    meta: 1,
    color: '#9fc69a',
  },
  {
    id: 'habitue',
    icono: 'botin',
    titulo: 'Ya sos del grupo',
    detalle: 'Llegá a 10 partidos jugados',
    meta: 10,
    color: '#9fc69a',
  },
  {
    id: 'veterano',
    icono: 'corona',
    titulo: 'Veterano',
    detalle: 'Llegá a 25 partidos jugados',
    meta: 25,
    color: '#edc58d',
  },
  {
    id: 'primera_valoracion',
    icono: 'estrella',
    titulo: 'Te miraron jugar',
    detalle: 'Recibí tu primera valoración',
    meta: 1,
    color: '#9dccda',
  },
  {
    id: 'valorado',
    icono: 'diana',
    titulo: 'Con historial',
    detalle: 'Juntá 10 valoraciones recibidas',
    meta: 10,
    color: '#9dccda',
  },
  {
    id: 'primera_insignia',
    icono: 'muralla',
    titulo: 'Te pusieron un mote',
    detalle: 'Ganá tu primera insignia del grupo',
    meta: 1,
    color: '#a28abc',
  },
  {
    id: 'coleccionista',
    icono: 'fuego',
    titulo: 'Coleccionista',
    detalle: 'Juntá 5 insignias en total',
    meta: 5,
    color: '#a28abc',
  },
  {
    id: 'cumplidor',
    icono: 'cumplidor',
    titulo: 'Palabra es palabra',
    detalle: 'Jugá 5 partidos sin bajarte tarde de ninguno',
    meta: 5,
    color: '#dd977b',
  },
  {
    id: 'racha_4',
    icono: 'fuego',
    titulo: 'En llamas',
    detalle: 'Jugá 4 semanas seguidas',
    meta: 4,
    color: '#dd977b',
  },
  {
    id: 'racha_10',
    icono: 'rayo',
    titulo: 'Inoxidable',
    detalle: 'Jugá 10 semanas seguidas',
    meta: 10,
    color: '#edc58d',
  },
]

export interface ProgresoObjetivo {
  objetivo: Objetivo
  valor: number
  cumplido: boolean
  porcentaje: number
}

export interface DatosObjetivos {
  partidos_jugados: number
  valoraciones_recibidas: number
  insignias_recibidas: number
  partidos_sin_bajas: number
  mejor_racha: number
}

export function calcularProgreso(datos: DatosObjetivos): ProgresoObjetivo[] {
  const valores: Record<string, number> = {
    debut: datos.partidos_jugados,
    habitue: datos.partidos_jugados,
    veterano: datos.partidos_jugados,
    primera_valoracion: datos.valoraciones_recibidas,
    valorado: datos.valoraciones_recibidas,
    primera_insignia: datos.insignias_recibidas,
    coleccionista: datos.insignias_recibidas,
    cumplidor: datos.partidos_sin_bajas,
    racha_4: datos.mejor_racha,
    racha_10: datos.mejor_racha,
  }

  return OBJETIVOS.map((objetivo) => {
    const valor = Math.min(valores[objetivo.id] ?? 0, objetivo.meta)
    return {
      objetivo,
      valor,
      cumplido: valor >= objetivo.meta,
      porcentaje: Math.round((valor / objetivo.meta) * 100),
    }
  })
}
