import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import { formatPosiciones } from '../lib/posiciones'
import { fetchBajasTardiasMap } from '../lib/bajas'
import type { Jugador, ValoracionPromedio } from '../lib/types'

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const { jugador: yo } = useAuth()
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [promedio, setPromedio] = useState<ValoracionPromedio | null>(null)
  const [partidosJuntos, setPartidosJuntos] = useState(0)
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

      const bajasMap = await fetchBajasTardiasMap()
      setBajasTardias(bajasMap[id] ?? 0)

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

        <div className="mt-5">
          <Estrellas promedio={promedio?.promedio ?? null} cantidad={promedio?.cantidad ?? 0} size={20} />
        </div>

        <div className="mt-3">
          <BadgeConfiabilidad bajasTardias={bajasTardias} />
        </div>

        {yo && yo.id !== id && partidosJuntos > 0 && (
          <p className="mt-4 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: 'rgba(45,106,79,.1)', color: 'var(--pitch-700)' }}>
            Jugaron juntos {partidosJuntos} {partidosJuntos === 1 ? 'vez' : 'veces'}
          </p>
        )}
      </div>
    </div>
  )
}
