import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import { formatPosiciones } from '../lib/posiciones'
import { fetchBajasTardiasMap } from '../lib/bajas'
import { insigniaPorId } from '../lib/insignias'
import type { DistribucionValoracion, InsigniaConteo, Jugador, ValoracionPromedio } from '../lib/types'

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const { jugador: yo } = useAuth()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [promedio, setPromedio] = useState<ValoracionPromedio | null>(null)
  const [distribucion, setDistribucion] = useState<DistribucionValoracion[]>([])
  const [insignias, setInsignias] = useState<InsigniaConteo[]>([])
  const [partidosJuntos, setPartidosJuntos] = useState(0)
  const [partidosJugados, setPartidosJugados] = useState(0)
  const [comentarios, setComentarios] = useState<{ comentario: string; created_at: string }[]>([])
  const [bajasTardias, setBajasTardias] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!id) return
      const { data: jugadorData } = await supabase.from('jugadores').select('*').eq('id', id).maybeSingle()
      setJugador(jugadorData)

      const { data: promediosData } = await supabase.rpc('valoraciones_promedio')
      const mio = (promediosData ?? []).find((p: ValoracionPromedio) => p.evaluado_id === id)
      setPromedio(mio ?? null)

      const { data: distribucionData } = await supabase.rpc('distribucion_valoraciones', { p_evaluado_id: id })
      setDistribucion(distribucionData ?? [])

      const { data: insigniasData } = await supabase.rpc('insignias_por_jugador', { p_jugador_id: id })
      setInsignias(insigniasData ?? [])

      const bajasMap = await fetchBajasTardiasMap()
      setBajasTardias(bajasMap[id] ?? 0)

      const { count: jugadosCount } = await supabase
        .from('participantes')
        .select('*', { count: 'exact', head: true })
        .eq('jugador_id', id)
      setPartidosJugados(jugadosCount ?? 0)

      const { data: comentariosData } = await supabase.rpc('comentarios_recibidos', { p_evaluado_id: id })
      setComentarios(comentariosData ?? [])

      if (yo && yo.id !== id) {
        const { data: misPartidos } = await supabase.from('participantes').select('partido_id').eq('jugador_id', yo.id)
        const misIds = (misPartidos ?? []).map((p) => p.partido_id)
        if (misIds.length > 0) {
          const { count } = await supabase
            .from('participantes')
            .select('*', { count: 'exact', head: true })
            .eq('jugador_id', id)
            .in('partido_id', misIds)
          setPartidosJuntos(count ?? 0)
        }
      }
      setLoading(false)
    }
    cargar()
  }, [id, yo])

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </p>
    )
  if (!jugador)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Este jugador no existe.
      </p>
    )

  return (
    <div>
      <Link to="/jugadores" className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--pitch-500)' }}>
        ← Volver a jugadores
      </Link>

      <div className="glass-strong anim-pop flex flex-col items-center rounded-[28px] p-8 text-center">
        <Avatar nombre={jugador.nombre} avatar={jugador.avatar} size="lg" />
        <h1 className="mt-4 text-xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          {jugador.nombre}
        </h1>
        {jugador.apodo && (
          <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
            "{jugador.apodo}"
          </p>
        )}
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--pitch-500)' }}>
          {formatPosiciones(jugador.posiciones)}
        </p>

        <div className="mt-5 w-full">
          <Estrellas
            promedio={promedio?.promedio ?? null}
            cantidad={promedio?.cantidad ?? 0}
            variant="completo"
            distribucion={distribucion}
          />
        </div>

        <div className="mt-3">
          <BadgeConfiabilidad bajasTardias={bajasTardias} />
        </div>

        <div className="mt-5 flex gap-6">
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--pitch-900)' }}>
              {partidosJugados}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--pitch-300)' }}>
              Partidos jugados
            </p>
          </div>
        </div>

        {yo && yo.id !== id && partidosJuntos > 0 && (
          <p className="mt-4 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: 'rgba(45,106,79,.1)', color: 'var(--pitch-700)' }}>
            Jugaron juntos {partidosJuntos} {partidosJuntos === 1 ? 'vez' : 'veces'}
          </p>
        )}
      </div>

      {insignias.length > 0 && (
        <div className="glass-strong mt-4 rounded-[28px] p-5">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Medallero
          </h2>
          <div className="flex flex-wrap gap-2">
            {insignias.map((i) => {
              const info = insigniaPorId(i.insignia)
              if (!info) return null
              return (
                <div
                  key={i.insignia}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold"
                  style={{ background: 'rgba(185,121,31,.14)', color: 'var(--gold-500)' }}
                >
                  <span>{info.emoji}</span>
                  {info.label}
                  <span style={{ color: 'var(--pitch-300)' }}>×{i.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {comentarios.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Comentarios recibidos
          </h2>
          <div className="flex flex-col gap-2">
            {comentarios.map((c, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3 text-sm" style={{ color: 'var(--pitch-700)' }}>
                "{c.comentario}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
