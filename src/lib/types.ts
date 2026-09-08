export interface Jugador {
  id: string
  user_id: string
  nombre: string
  apodo: string | null
  posicion: string | null
  posiciones: string[] | null
  foto_url: string | null
  avatar: string | null
  created_at: string
}

export type EstadoPartido = 'abierto' | 'cerrado' | 'cancelado'

export interface Partido {
  id: string
  cancha: string
  fecha_hora: string
  cupo_total: number
  admin_id: string
  estado: EstadoPartido
  created_at: string
  lat: number | null
  lng: number | null
  valor_cancha: number | null
}

export interface Participante {
  id: string
  partido_id: string
  jugador_id: string
  created_at: string
}

export interface Valoracion {
  id: string
  partido_id: string
  evaluador_id: string
  evaluado_id: string
  estrellas: number
  comentario: string | null
  created_at: string
}

export interface ValoracionPromedio {
  evaluado_id: string
  promedio: number
  cantidad: number
}
