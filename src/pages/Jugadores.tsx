import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import InvitarBoton from '../components/InvitarBoton'
import type { Jugador, ValoracionPromedio } from '../lib/types'

export default function Jugadores() {
  const { jugador } = useAuth()
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [promedios, setPromedios] = useState<Record<string, ValoracionPromedio>>({})
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!jugador) return

      const { data: misParticipaciones } = await supabase
        .from('participantes')
        .select('partido_id')
        .eq('jugador_id', jugador.id)
      const misPartidoIds = (misParticipaciones ?? []).map((p) => p.partido_id)

      let compañeros: Jugador[] = []
      if (misPartidoIds.length > 0) {
        const { data: coParticipantes } = await supabase
          .from('participantes')
          .select('jugador_id')
          .in('partido_id', misPartidoIds)
          .neq('jugador_id', jugador.id)
        const idsUnicos = [...new Set((coParticipantes ?? []).map((c) => c.jugador_id))]
        if (idsUnicos.length > 0) {
          const { data: jugadoresData } = await supabase.from('jugadores').select('*').in('id', idsUnicos).order('nombre')
          compañeros = jugadoresData ?? []
        }
      }

      const { data: promediosData } = await supabase.rpc('valoraciones_promedio')
      const map: Record<string, ValoracionPromedio> = {}
      for (const p of promediosData ?? []) map[p.evaluado_id] = p

      setJugadores(compañeros)
      setPromedios(map)
      setLoading(false)
    }
    cargar()
  }, [jugador])

  const filtrados = jugadores.filter((j) => {
    const q = busqueda.toLowerCase()
    return j.nombre.toLowerCase().includes(q) || (j.apodo ?? '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          Jugadores
        </h1>
        <InvitarBoton />
      </div>

      {!loading && jugadores.length > 0 && (
        <input
          placeholder="Buscar por nombre o apodo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2"
          style={{ color: 'var(--pitch-900)' }}
        />
      )}

      {loading && (
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      )}

      {!loading && jugadores.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
          Todavía no jugaste ningún partido con nadie. En cuanto te sumes a uno, tus compañeros van a aparecer acá.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtrados.map((j, i) => {
          const prom = promedios[j.id]
          return (
            <Link
              key={j.id}
              to={`/jugadores/${j.id}`}
              className="glass anim-rise flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <Avatar nombre={j.nombre} avatar={j.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {j.nombre}{' '}
                  {j.apodo && <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{j.apodo}"</span>}
                </p>
                <p className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
                  {j.posicion ?? 'Sin posición'}
                </p>
              </div>
              {prom ? (
                <p className="shrink-0 text-sm font-semibold" style={{ color: 'var(--gold-500)' }}>
                  ★ {prom.promedio}
                </p>
              ) : (
                <p className="shrink-0 text-xs" style={{ color: 'var(--pitch-300)' }}>
                  Sin valorar
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
