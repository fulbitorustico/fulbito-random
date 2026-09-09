import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { INSIGNIAS } from '../lib/insignias'
import Icono from '../components/Icono'
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
  const [insigniaPorJugador, setInsigniaPorJugador] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<string | null>(null)
  const [mvpVotado, setMvpVotado] = useState<string | null>(null)
  const [votandoMvp, setVotandoMvp] = useState(false)

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
    const { data: miVoto } = await supabase
      .from('mvp_votos')
      .select('votado_id')
      .eq('partido_id', id)
      .eq('votante_id', jugador.id)
      .maybeSingle()
    setMvpVotado(miVoto?.votado_id ?? null)

    setEnviados(idsYaValorados)
    setLoading(false)
  }, [id, jugador])

  async function votarMvp(votadoId: string) {
    if (!jugador || !id || mvpVotado) return
    setVotandoMvp(true)
    const { error } = await supabase
      .from('mvp_votos')
      .insert({ partido_id: id, votante_id: jugador.id, votado_id: votadoId })
    setVotandoMvp(false)
    if (!error) setMvpVotado(votadoId)
  }

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
    const insignia = insigniaPorJugador[evaluadoId]
    if (!error && insignia) {
      await supabase.from('insignias_otorgadas').insert({
        partido_id: id,
        otorgado_por_id: jugador.id,
        jugador_id: evaluadoId,
        insignia,
      })
    }
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
        <div className="glass flex items-center gap-2 rounded-2xl p-6 text-sm" style={{ color: 'var(--acc-green)' }}>
          <Icono name="cumplidor" size={17} /> Ya valoraste a todos
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="glass-strong mt-4 rounded-[24px] p-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            ¿Quién fue el MVP de la fecha?
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--pitch-300)' }}>
            {mvpVotado ? 'Ya votaste. Se muestra solo el más votado.' : 'Un voto por partido, anónimo.'}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {pendientes.map((p) => {
              const elegido = mvpVotado === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => votarMvp(p.id)}
                  disabled={!!mvpVotado || votandoMvp}
                  className="tap flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left disabled:cursor-not-allowed"
                  style={{
                    background: elegido ? 'rgba(237,197,141,.18)' : 'rgba(242,239,233,.06)',
                    opacity: mvpVotado && !elegido ? 0.45 : 1,
                  }}
                >
                  <Avatar nombre={p.nombre} avatar={p.avatar} fotoUrl={p.foto_url} size="sm" />
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                    {p.nombre}
                  </span>
                  {elegido && (
                    <span
                      className="flex items-center gap-1 text-xs font-bold"
                      style={{ color: 'var(--gold-500)' }}
                    >
                      <Icono name="corona" size={14} /> Tu voto
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pendientes
          .filter((p) => !enviados.has(p.id))
          .map((p) => (
            <div key={p.id} className="glass-strong anim-rise rounded-[24px] p-5">
              <div className="mb-3 flex items-center gap-3">
                <Avatar nombre={p.nombre} avatar={p.avatar} fotoUrl={p.foto_url} size="sm" />
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
                        fill={(estrellasPorJugador[p.id] ?? 0) >= n ? 'var(--gold-500)' : 'rgba(242,239,233,.14)'}
                      />
                    </svg>
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Comentario (opcional)"
                value={comentarioPorJugador[p.id] ?? ''}
                onChange={(e) => setComentarioPorJugador((c) => ({ ...c, [p.id]: e.target.value }))}
                className="mb-3 w-full resize-none rounded-2xl border-0 bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 transition focus:ring-2"
                style={{ color: 'var(--pitch-900)' }}
                rows={2}
              />

              <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--pitch-300)' }}>
                Insignia (opcional)
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {INSIGNIAS.map((ins) => {
                  const activa = insigniaPorJugador[p.id] === ins.id
                  return (
                    <button
                      key={ins.id}
                      type="button"
                      onClick={() =>
                        setInsigniaPorJugador((s) => ({ ...s, [p.id]: activa ? '' : ins.id }))
                      }
                      className="tap flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold"
                      style={{
                        background: activa ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                        color: activa ? 'var(--ink-900)' : 'var(--pitch-700)',
                      }}
                    >
                      <Icono name={ins.icono} size={13} />
                      {ins.label}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => enviarValoracion(p.id)}
                disabled={!estrellasPorJugador[p.id] || enviando === p.id}
                className="tap w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-40"
                style={{ background: 'var(--paper)' }}
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
    <Link to={`/partidos/${id}`} className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--acc-green)' }}>
      ← Volver al partido
    </Link>
  )
}
