export interface Jugador {
  id: string
  user_id: string | null
  nombre: string
  apodo: string | null
  posicion: string | null
  posiciones: string[] | null
  foto_url: string | null
  avatar: string | null
  cambios_posiciones: number
  cambios_nombre: number
  avisos_mail: AvisosMail | null
  buscando: boolean
  zona: string | null
  bio: string | null
  disponibilidad: string[] | null
  es_demo: boolean | null
  es_admin: boolean | null
  created_at: string
}

export interface JugadorDisponible {
  jugador_id: string
  nombre: string
  apodo: string | null
  avatar: string | null
  foto_url: string | null
  posiciones: string[] | null
  zona: string | null
  bio: string | null
  disponibilidad: string[] | null
  promedio: number | null
  cantidad: number
  distancia_km: number | null
}

export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'rechazada'

export interface Invitacion {
  id: string
  partido_id: string
  invitado_id: string
  invitado_por_id: string
  estado: EstadoInvitacion
  created_at: string
}

export const MAX_CAMBIOS_POSICIONES = 2

export interface AvisosMail {
  se_suman: boolean
  completo: boolean
  invitacion: boolean
  aprobado_grupo: boolean
}

export type EstadoPartido = 'abierto' | 'cerrado' | 'cancelado'
export type AperturaPartido = 'abierto' | 'solo_confiables'

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
  apertura: AperturaPartido
  grupo_id: string | null
  usa_equipos: boolean
  subcapitan_id: string | null
  cancha_id: string | null
  mapa_url: string | null
}

export interface BajasTardias {
  jugador_id: string
  cantidad: number
}

export interface Participante {
  id: string
  partido_id: string
  jugador_id: string
  equipo: 'A' | 'B' | null
  confirmado_at: string | null
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

export interface DistribucionValoracion {
  estrellas: number
  cantidad: number
}

export interface InsigniaConteo {
  insignia: string
  cantidad: number
}

export interface MvpDelPartido {
  jugador_id: string
  nombre: string
  apodo: string | null
  avatar: string | null
  foto_url: string | null
  votos: number
}

export interface Grupo {
  id: string
  nombre: string
  creador_id: string
  requiere_aprobacion: boolean
  created_at: string
}

export interface GrupoMiembro {
  id: string
  grupo_id: string
  jugador_id: string
  created_at: string
}

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudGrupo {
  id: string
  grupo_id: string
  jugador_id: string
  estado: EstadoSolicitud
  created_at: string
}
