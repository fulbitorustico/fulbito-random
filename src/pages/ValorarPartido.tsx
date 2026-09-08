import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import type { Jugador, Partido } from '../lib/types'

const VENTANA_HORAS = 24

export default function ValorarPartido() {
  const { id } = useParams<{ id: string }>()
  const { jugador } = useAuth()
  const navigate = useNavigate()

  const [partido, setPartido] = useState<Partido | null>(null)
  const [pendientes, setPendientes] = useState<Jugador[]>([])
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [estrellasPorJugador, setEstrellasPorJugador] = useState<Record<string, number>>({})
  const [comentarioPorJugador, setComentarioPorJugador] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!id || !jugador) return
    setLoading(true)

    const { data: partidoData } = await supabase.from('partidos').select('*').eq('id', id).maybeSingle()
    setPartido(partidoData)

    const { data: participantesData } = await supabase
      .from('participantes')
      .select('jugador_id')
      .eq('partido_id', id)
    const idsCoequipers = (participantesData ?? []).map((p) => p.jugador_id).filter((jid) => jid !== jugador.id)

    const { data: yaValorados } = await supabase
      .from('valoraciones')
      .select('evaluado_id')
      .eq('partido_id', id)
      .eq('evaluador_id', jugador.id)
    const idsYaValorados = new Set((yaValorados ?? []).map((v) => v.evaluado_id))

    if (idsCoequipers.length > 0) {
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').in('id', idsCoequipers)
      setPendientes(jugadoresData ?? [])
    } else {
      setPendientes([])
    }
    setEnviados(idsYaValorados)
    setLoading(false)
  }, [id, jugador])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function enviarValoracion(evaluadoId: string) {
    if (!jugador || !id) return
    const estrellas = estrellasPorJugador[evaluadoId]
    if (!estrellas) return
    setEnviando(evaluadoId)
    const { error } = await supabase.from('valoraciones').insert({
      partido_id: id,
      evaluador_id: jugador.id,
      evaluado_id: evaluadoId,
      estrellas,
      comentario: comentarioPorJugador[evaluadoId] || null,
    })
    setEnviando(null)
    if (!error) setEnviados((prev) => new Set(prev).add(evaluadoId))
  }

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </p>
    )
  if (!partido)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Este partido no existe.
      </p>
    )

  const horasDesde = (Date.now() - new Date(partido.fecha_hora).getTime()) / 3_600_000
  const fueJugado = horasDesde > 0
  const dentroDeVentana = horasDesde <= VENTANA_HORAS

  if (!fueJugado) {
    return (
      <div>
        <BotonVolver id={id!} />
        <div className="glass rounded-2xl p-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
          Todavía no se jugó este partido — vas a poder valorar a tus compañeros después.
        </div>
      </div>
    )
  }

  if (!dentroDeVentana) {
    return (
      <div>
        <BotonVolver id={id!} />
        <div className="glass rounded-2xl p-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
          La ventana para valorar este partido ya cerró (dura {VENTANA_HORAS}hs después de jugado).
        </div>
      </div>
    )
  }

  const faltan = pendientes.filter((p) => !enviados.has(p.id))

  return (
    <div>
      <BotonVolver id={id!} />
      <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Valorá a tus compañeros
      </h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--pitch-300)' }}>
        {partido.cancha} · anónimo, solo se muestra el promedio
      </p>

      {pendientes.length === 0 && (
        <div className="glass rounded-2xl p-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
          No había otros jugadores anotados en este partido.
        </div>
      )}

      {pendientes.length > 0 && faltan.length === 0 && (
        <div className="glass rounded-2xl p-6 text-sm" style={{ color: 'var(--pitch-500)' }}>
          Ya valoraste a todos ✓
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pendientes
          .filter((p) => !enviados.has(p.id))
          .map((p) => (
            <div key={p.id} className="glass-strong anim-rise rounded-[24px] p-5">
              <div className="mb-3 flex items-center gap-3">
                <Avatar nombre={p.nombre} avatar={p.avatar} size="sm" />
                <p className="font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {p.nombre} {p.apodo && <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{p.apodo}"</span>}
                </p>
              </div>

              <div className="mb-3 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEstrellasPorJugador((s) => ({ ...s, [p.id]: n }))}
                    className="tap"
                  >
                    <svg width="30" height="30" viewBox="0 0 20 20">
                      <path
                        d="M10 1.5 12.5 7 18.5 7.8 14 11.9 15.3 18 10 14.8 4.7 18 6 11.9 1.5 7.8 7.5 7Z"
                        fill={(estrellasPorJugador[p.id] ?? 0) >= n ? 'var(--gold-500)' : 'rgba(18,38,28,.12)'}
                      />
                    </svg>
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Comentario (opcional)"
                value={comentarioPorJugador[p.id] ?? ''}
                onChange={(e) => setComentarioPorJugador((c) => ({ ...c, [p.id]: e.target.value }))}
                className="mb-3 w-full resize-none rounded-2xl border-0 bg-white/70 px-4 py-3 text-sm outline-none ring-1 ring-black/5 transition focus:ring-2"
                style={{ color: 'var(--pitch-900)' }}
                rows={2}
              />

              <button
                type="button"
                onClick={() => enviarValoracion(p.id)}
                disabled={!estrellasPorJugador[p.id] || enviando === p.id}
                className="tap w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
                style={{ background: 'var(--pitch-500)' }}
              >
                {enviando === p.id ? 'Enviando...' : 'Valorar'}
              </button>
            </div>
          ))}
      </div>

      {pendientes.length > 0 && faltan.length === 0 && (
        <button
          onClick={() => navigate(`/partidos/${id}`)}
          className="tap glass mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ color: 'var(--pitch-700)' }}
        >
          Volver al partido
        </button>
      )}
    </div>
  )
}

function BotonVolver({ id }: { id: string }) {
  return (
    <Link to={`/partidos/${id}`} className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--pitch-500)' }}>
      ← Volver al partido
    </Link>
  )
}
