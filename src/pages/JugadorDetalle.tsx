import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CardJugador from '../components/CardJugador'
import Objetivos from '../components/Objetivos'
import { fetchBajasTardiasMap } from '../lib/bajas'
import type { DistribucionValoracion, InsigniaConteo, Jugador, ValoracionPromedio } from '../lib/types'

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const { jugador: yo } = useAuth()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [promedio, setPromedio] = useState<ValoracionPromedio | null>(null)
  const [distribucion, setDistribucion] = useState<DistribucionValoracion[]>([])
  const [insignias, setInsignias] = useState<InsigniaConteo[]>([])
  const [reclutas, setReclutas] = useState(0)
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

      const { data: reclutasData } = await supabase.rpc('reclutas_por_jugador', { p_jugador_id: id })
      setReclutas(reclutasData ?? 0)

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
      <Link to="/jugadores" className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--acc-green)' }}>
        ← Volver a jugadores
      </Link>

      <CardJugador
        jugador={jugador}
        promedio={promedio?.promedio ?? null}
        cantidad={promedio?.cantidad ?? 0}
        distribucion={distribucion}
        insignias={insignias}
        bajasTardias={bajasTardias}
        partidosJugados={partidosJugados}
        reclutas={reclutas}
      >
        {yo && yo.id !== id && partidosJuntos > 0 && (
          <p
            className="mt-5 rounded-full px-3 py-1.5 text-center text-xs font-medium"
            style={{ background: 'rgba(159,198,154,.14)', color: 'var(--pitch-700)' }}
          >
            Jugaron juntos {partidosJuntos} {partidosJuntos === 1 ? 'vez' : 'veces'}
          </p>
        )}
      </CardJugador>

      <div className="mt-4">
        <Objetivos
          datos={{
            partidos_jugados: partidosJugados,
            valoraciones_recibidas: promedio?.cantidad ?? 0,
            insignias_recibidas: insignias.reduce((t, i) => t + i.cantidad, 0),
            partidos_sin_bajas: bajasTardias === 0 ? partidosJugados : 0,
          }}
        />
      </div>

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
