import type { NombreIcono } from '../components/Icono'

export interface AspectoCancha {
  id: 'cesped' | 'iluminacion' | 'vestuarios' | 'estacionamiento' | 'personal'
  label: string
  pregunta: string
  icono: NombreIcono
}

export const ASPECTOS_CANCHA: AspectoCancha[] = [
  { id: 'cesped', label: 'Césped', pregunta: '¿Cómo estaba el piso?', icono: 'pelota' },
  { id: 'iluminacion', label: 'Iluminación', pregunta: '¿Se veía bien?', icono: 'rayo' },
  { id: 'vestuarios', label: 'Vestuarios', pregunta: '¿Y los vestuarios?', icono: 'guante' },
  { id: 'estacionamiento', label: 'Estacionamiento', pregunta: '¿Pudiste dejar el auto?', icono: 'pin' },
  { id: 'personal', label: 'Atención', pregunta: '¿Cómo te trataron?', icono: 'personas' },
]

export interface ResumenCancha {
  cesped: number | null
  iluminacion: number | null
  vestuarios: number | null
  estacionamiento: number | null
  personal: number | null
  general: number | null
  valoraciones: number
  partidos_jugados: number
}

export interface CanchaConUso {
  id: string
  nombre: string
  zona: string | null
  tipo: string | null
  lat: number | null
  lng: number | null
  partidos: number
  general: number | null
  valoraciones: number
}

export interface LogroCancha {
  id: string
  label: string
  detalle: string
  icono: NombreIcono
  color: string
  logrado: boolean
}

const MINIMO_PARA_CHAPA = 3

// Los logros de la cancha se calculan igual que los de los jugadores: con lo
// que ya está en la base, sin guardar progreso en ningún lado.
export function logrosDeCancha(resumen: ResumenCancha): LogroCancha[] {
  const suficientes = resumen.valoraciones >= MINIMO_PARA_CHAPA
  const bueno = (valor: number | null) => suficientes && valor != null && valor >= 4.3

  return [
    {
      id: 'estrenada',
      label: 'Estrenada',
      detalle: 'Se jugó un partido acá',
      icono: 'pelota',
      color: '#9fc69a',
      logrado: resumen.partidos_jugados >= 1,
    },
    {
      id: 'habitual',
      label: 'Cancha habitual',
      detalle: '10 partidos jugados',
      icono: 'botin',
      color: '#9dccda',
      logrado: resumen.partidos_jugados >= 10,
    },
    {
      id: 'templo',
      label: 'Templo',
      detalle: '50 partidos jugados',
      icono: 'corona',
      color: '#edc58d',
      logrado: resumen.partidos_jugados >= 50,
    },
    {
      id: 'alfombra',
      label: 'Alfombra',
      detalle: 'Césped impecable según los jugadores',
      icono: 'estrella',
      color: '#9fc69a',
      logrado: bueno(resumen.cesped),
    },
    {
      id: 'de_noche',
      label: 'Se ve todo',
      detalle: 'Buena iluminación',
      icono: 'rayo',
      color: '#edc58d',
      logrado: bueno(resumen.iluminacion),
    },
    {
      id: 'vestuarios_ok',
      label: 'Vestuarios de primera',
      detalle: 'Te podés bañar tranquilo',
      icono: 'guante',
      color: '#9dccda',
      logrado: bueno(resumen.vestuarios),
    },
    {
      id: 'estacionar',
      label: 'Dejás el auto',
      detalle: 'Estacionamiento sin drama',
      icono: 'pin',
      color: '#a28abc',
      logrado: bueno(resumen.estacionamiento),
    },
    {
      id: 'buena_onda',
      label: 'Buena onda',
      detalle: 'El personal atiende bien',
      icono: 'cumplidor',
      color: '#dd977b',
      logrado: bueno(resumen.personal),
    },
  ]
}
