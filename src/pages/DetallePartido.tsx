import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Jugador, Partido } from '../lib/types'

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const inputClass =
  'rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2'

function aFechaHora(iso: string) {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('sv-SE')
  const hora = d.toTimeString().slice(0, 5)
  return { fecha, hora }
}

export default function DetallePartido() {
  const { id } = useParams<{ id: string }>()
  const { jugador } = useAuth()
  const navigate = useNavigate()

  const [partido, setPartido] = useState<Partido | null>(null)
  const [anotados, setAnotados] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cancha, setCancha] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cupo, setCupo] = useState(10)

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: partidoData } = await supabase.from('partidos').select('*').eq('id', id).maybeSingle()
    const { data: participantesData } = await supabase
      .from('participantes')
      .select('jugador_id')
      .eq('partido_id', id)

    if (partidoData) {
      setPartido(partidoData)
      const { fecha, hora } = aFechaHora(partidoData.fecha_hora)
      setCancha(partidoData.cancha)
      setFecha(fecha)
      setHora(hora)
      setCupo(partidoData.cupo_total)
    }

    const ids = (participantesData ?? []).map((p) => p.jugador_id)
    if (ids.length > 0) {
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').in('id', ids)
      setAnotados(jugadoresData ?? [])
    } else {
      setAnotados([])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

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

  const esAdmin = jugador?.id === partido.admin_id
  const yoAnotado = anotados.some((a) => a.id === jugador?.id)
  const lugares = partido.cupo_total - anotados.length
  const abierto = partido.estado === 'abierto' && lugares > 0

  async function toggleAnotarse() {
    if (!jugador || !partido) return
    if (yoAnotado) {
      await supabase.from('participantes').delete().eq('partido_id', partido.id).eq('jugador_id', jugador.id)
    } else {
      await supabase.from('participantes').insert({ partido_id: partido.id, jugador_id: jugador.id })
    }
    await cargar()
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault()
    if (!partido) return
    setGuardando(true)
    setError(null)
    const fecha_hora = new Date(`${fecha}T${hora}`).toISOString()
    const { error } = await supabase
      .from('partidos')
      .update({ cancha, fecha_hora, cupo_total: cupo })
      .eq('id', partido.id)
    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditando(false)
    await cargar()
  }

  async function cancelarPartido() {
    if (!partido) return
    if (!confirm('¿Cancelar este partido? Los anotados van a dejar de verlo en la lista.')) return
    await supabase.from('partidos').update({ estado: 'cancelado' }).eq('id', partido.id)
    navigate('/partidos')
  }

  return (
    <div>
      <Link
        to="/partidos"
        className="mb-4 inline-block text-sm font-medium"
        style={{ color: 'var(--pitch-500)' }}
      >
        ← Volver a partidos
      </Link>

      {partido.estado === 'cancelado' && (
        <p
          className="mb-4 rounded-2xl p-3 text-sm"
          style={{ background: 'rgba(179,67,47,.1)', color: '#b3432f' }}
        >
          Este partido fue cancelado.
        </p>
      )}

      {!editando ? (
        <div className="glass-strong anim-rise rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--pitch-900)' }}>
                {partido.cancha}
              </h1>
              <p className="text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
                {new Date(partido.fecha_hora).toLocaleString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={
                abierto
                  ? { background: 'rgba(185,121,31,.16)', color: 'var(--gold-500)' }
                  : { background: 'rgba(18,38,28,.06)', color: 'var(--pitch-300)' }
              }
            >
              {partido.estado === 'cancelado' ? 'Cancelado' : lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
            </span>
          </div>

          {partido.estado !== 'cancelado' && (
            <button
              onClick={toggleAnotarse}
              disabled={!abierto && !yoAnotado}
              className="tap mt-4 w-full rounded-2xl px-4 py-3 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={
                yoAnotado
                  ? { background: 'rgba(18,38,28,.07)', color: 'var(--pitch-700)' }
                  : { background: 'var(--pitch-500)', color: '#fff' }
              }
            >
              {yoAnotado ? 'Bajarme' : 'Sumarme'}
            </button>
          )}
        </div>
      ) : (
        <form
          onSubmit={guardarEdicion}
          className="glass-strong anim-rise flex flex-col gap-3 rounded-[28px] p-6"
        >
          <input
            required
            value={cancha}
            onChange={(e) => setCancha(e.target.value)}
            className={inputClass}
            style={{ color: 'var(--pitch-900)' }}
          />
          <div className="flex gap-3">
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`flex-1 ${inputClass}`}
              style={{ color: 'var(--pitch-900)' }}
            />
            <select
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={`flex-1 ${inputClass}`}
              style={{ color: 'var(--pitch-900)' }}
            >
              {HORARIOS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <input
            required
            type="number"
            min={anotados.length || 2}
            max={30}
            value={cupo}
            onChange={(e) => setCupo(Number(e.target.value))}
            className={inputClass}
            style={{ color: 'var(--pitch-900)' }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="tap flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--pitch-500)' }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="tap rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: 'rgba(18,38,28,.06)', color: 'var(--pitch-700)' }}
            >
              Cancelar
            </button>
          </div>
          {error && (
            <p className="text-sm" style={{ color: '#b3432f' }}>
              {error}
            </p>
          )}
        </form>
      )}

      {esAdmin && partido.estado !== 'cancelado' && !editando && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditando(true)}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: 'var(--pitch-700)' }}
          >
            Editar partido
          </button>
          <button
            onClick={cancelarPartido}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: '#b3432f' }}
          >
            Cancelar partido
          </button>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
          Anotados ({anotados.length}/{partido.cupo_total})
        </h2>
        <div className="flex flex-col gap-2">
          {anotados.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
              Todavía nadie se anotó.
            </p>
          )}
          {anotados.map((a) => (
            <div key={a.id} className="glass flex items-center justify-between rounded-2xl px-4 py-2.5">
              <p className="text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                {a.nombre} {a.apodo && <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{a.apodo}"</span>}
              </p>
              <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
                {a.posicion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
