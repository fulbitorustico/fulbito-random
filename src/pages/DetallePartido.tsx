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

  if (loading) return <p className="px-4 py-6 text-sm text-slate-500">Cargando...</p>
  if (!partido) return <p className="px-4 py-6 text-sm text-slate-500">Este partido no existe.</p>

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
    <div className="mx-auto max-w-sm px-4 py-6">
      <Link to="/partidos" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver a partidos
      </Link>

      {partido.estado === 'cancelado' && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">Este partido fue cancelado.</p>
      )}

      {!editando ? (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{partido.cancha}</h1>
              <p className="text-sm text-slate-500">
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
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                abierto ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {partido.estado === 'cancelado' ? 'Cancelado' : lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
            </span>
          </div>

          {partido.estado !== 'cancelado' && (
            <button
              onClick={toggleAnotarse}
              disabled={!abierto && !yoAnotado}
              className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                yoAnotado
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {yoAnotado ? 'Bajarme' : 'Sumarme'}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={guardarEdicion} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
          <input
            required
            value={cancha}
            onChange={(e) => setCancha(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
          <div className="flex gap-3">
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
            />
            <select
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
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
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      {esAdmin && partido.estado !== 'cancelado' && !editando && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditando(true)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Editar partido
          </button>
          <button
            onClick={cancelarPartido}
            className="flex-1 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Cancelar partido
          </button>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Anotados ({anotados.length}/{partido.cupo_total})
        </h2>
        <div className="flex flex-col gap-2">
          {anotados.length === 0 && <p className="text-sm text-slate-400">Todavía nadie se anotó.</p>}
          {anotados.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 shadow-sm">
              <p className="text-sm font-medium text-slate-900">
                {a.nombre} {a.apodo && <span className="font-normal text-slate-400">"{a.apodo}"</span>}
              </p>
              <p className="text-xs text-slate-400">{a.posicion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
