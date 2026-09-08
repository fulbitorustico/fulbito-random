import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatCuentaRegresiva } from '../lib/geo'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import { fetchBajasTardiasMap } from '../lib/bajas'
import type { Grupo, Jugador, Partido, SolicitudGrupo } from '../lib/types'

export default function GrupoDetalle() {
  const { id } = useParams<{ id: string }>()
  const { jugador } = useAuth()

  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [miembros, setMiembros] = useState<Jugador[]>([])
  const [bajasTardiasMap, setBajasTardiasMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [linkReclamo, setLinkReclamo] = useState<{ nombre: string; url: string } | null>(null)
  const [solicitudes, setSolicitudes] = useState<(SolicitudGrupo & { jugador: Jugador })[]>([])

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: grupoData } = await supabase.from('grupos').select('*').eq('id', id).maybeSingle()
    setGrupo(grupoData)

    const { data: partidosData } = await supabase
      .from('partidos')
      .select('*')
      .eq('grupo_id', id)
      .neq('estado', 'cancelado')
      .order('fecha_hora', { ascending: true })
    setPartidos(partidosData ?? [])

    const { data: miembrosData } = await supabase.from('grupo_miembros').select('jugador_id').eq('grupo_id', id)
    const ids = (miembrosData ?? []).map((m) => m.jugador_id)
    if (ids.length > 0) {
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').in('id', ids).order('nombre')
      setMiembros(jugadoresData ?? [])
    } else {
      setMiembros([])
    }

    if (grupoData?.requiere_aprobacion && grupoData.creador_id === jugador?.id) {
      const { data: solicitudesData } = await supabase
        .from('solicitudes_grupo')
        .select('*')
        .eq('grupo_id', id)
        .eq('estado', 'pendiente')
      const jugadorIds = (solicitudesData ?? []).map((s) => s.jugador_id)
      if (jugadorIds.length > 0) {
        const { data: jugadoresSolicitantes } = await supabase.from('jugadores').select('*').in('id', jugadorIds)
        const mapaJugadores = new Map((jugadoresSolicitantes ?? []).map((j) => [j.id, j]))
        setSolicitudes(
          (solicitudesData ?? [])
            .map((s) => ({ ...s, jugador: mapaJugadores.get(s.jugador_id) }))
            .filter((s): s is SolicitudGrupo & { jugador: Jugador } => !!s.jugador),
        )
      } else {
        setSolicitudes([])
      }
    } else {
      setSolicitudes([])
    }

    setBajasTardiasMap(await fetchBajasTardiasMap())
    setLoading(false)
  }, [id, jugador?.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function invitar() {
    if (!grupo) return
    const url = `${window.location.origin}/grupos/unirse/${grupo.id}`
    const mensaje = `¡Sumate al grupo "${grupo.nombre}" en Fulbito Random! ${url}`
    if (navigator.share) {
      try {
        await navigator.share({ text: mensaje })
        return
      } catch {
        // cancelado, seguimos al fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  async function agregarSinRegistrar(e: FormEvent) {
    e.preventDefault()
    if (!id || !nombreNuevo.trim()) return
    setAgregando(true)
    const { data, error } = await supabase.from('jugadores').insert({ nombre: nombreNuevo.trim() }).select().single()
    if (!error && data) {
      await supabase.from('grupo_miembros').insert({ grupo_id: id, jugador_id: data.id })
      setLinkReclamo({ nombre: data.nombre, url: `${window.location.origin}/reclamar/${data.id}` })
      setNombreNuevo('')
      await cargar()
    }
    setAgregando(false)
  }

  async function compartirReclamo() {
    if (!linkReclamo) return
    const mensaje = `${linkReclamo.nombre}, te sumé al grupo en Fulbito Random. Entrá con este link para tomar tu perfil: ${linkReclamo.url}`
    if (navigator.share) {
      try {
        await navigator.share({ text: mensaje })
        return
      } catch {
        // cancelado
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  async function aprobarSolicitud(s: SolicitudGrupo) {
    if (!id || !grupo) return
    await supabase.from('grupo_miembros').insert({ grupo_id: id, jugador_id: s.jugador_id })
    await supabase.from('solicitudes_grupo').update({ estado: 'aprobada' }).eq('id', s.id)
    supabase.functions
      .invoke('rapid-action', { body: { tipo: 'aprobado_grupo', jugador_id: s.jugador_id, grupo_nombre: grupo.nombre } })
      .catch(() => {})
    await cargar()
  }

  async function rechazarSolicitud(s: SolicitudGrupo) {
    await supabase.from('solicitudes_grupo').update({ estado: 'rechazada' }).eq('id', s.id)
    await cargar()
  }

  async function compartirVistaPublica() {
    if (!grupo) return
    const url = `${window.location.origin}/grupos/${grupo.id}/publico`
    const mensaje = `Mirá las estadísticas del grupo "${grupo.nombre}" en Fulbito Random: ${url}`
    if (navigator.share) {
      try {
        await navigator.share({ text: mensaje, url })
        return
      } catch {
        // cancelado, seguimos al fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copiado al portapapeles')
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
    }
  }

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </p>
    )
  if (!grupo)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Este grupo no existe.
      </p>
    )

  const esAdmin = jugador?.id === grupo.creador_id

  return (
    <div>
      <Link to="/grupos" className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--pitch-500)' }}>
        ← Volver a grupos
      </Link>

      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          {grupo.nombre}
        </h1>
        <button
          onClick={invitar}
          className="tap inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: '#25D366' }}
        >
          Invitar
        </button>
      </div>

      {esAdmin && (
        <button
          onClick={compartirVistaPublica}
          className="tap glass mb-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold"
          style={{ color: 'var(--pitch-700)' }}
        >
          🔗 Compartir vista pública del grupo
        </button>
      )}

      {esAdmin && solicitudes.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Pedidos para sumarse ({solicitudes.length})
          </h2>
          <div className="flex flex-col gap-2">
            {solicitudes.map((s) => (
              <div key={s.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5">
                <Avatar nombre={s.jugador.nombre} avatar={s.jugador.avatar} size="sm" />
                <p className="flex-1 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                  {s.jugador.nombre}
                </p>
                <button
                  onClick={() => aprobarSolicitud(s)}
                  className="tap rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: 'var(--pitch-500)' }}
                >
                  Aprobar
                </button>
                <button
                  onClick={() => rechazarSolicitud(s)}
                  className="tap rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(179,67,47,.1)', color: '#b3432f' }}
                >
                  Rechazar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Partidos del grupo
          </h2>
          <Link to={`/partidos/nuevo?grupo=${grupo.id}`} className="tap text-sm font-semibold" style={{ color: 'var(--pitch-500)' }}>
            + Crear
          </Link>
        </div>
        {partidos.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
            Sin partidos programados todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {partidos.map((p) => (
              <Link key={p.id} to={`/partidos/${p.id}`} className="glass flex items-center justify-between rounded-2xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                    {p.cancha}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
                    {new Date(p.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--gold-500)' }}>
                  {formatCuentaRegresiva(p.fecha_hora)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={agregarSinRegistrar} className="glass mb-4 flex gap-2 rounded-2xl p-3">
        <input
          placeholder="Sumar sin registrar (nombre)"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          className="flex-1 rounded-xl border-0 bg-white/70 px-3 py-2 text-sm outline-none ring-1 ring-black/5 focus:ring-2"
          style={{ color: 'var(--pitch-900)' }}
        />
        <button
          type="submit"
          disabled={agregando || !nombreNuevo.trim()}
          className="tap rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--pitch-500)' }}
        >
          Sumar
        </button>
      </form>

      {linkReclamo && (
        <div className="glass mb-4 rounded-2xl p-4 text-sm" style={{ color: 'var(--pitch-700)' }}>
          <p className="mb-2">
            Sumaste a <strong>{linkReclamo.nombre}</strong> sin cuenta todavía. Mandale este link para que tome su
            perfil cuando quiera:
          </p>
          <button onClick={compartirReclamo} className="tap font-semibold" style={{ color: 'var(--pitch-500)' }}>
            Compartir link de {linkReclamo.nombre} →
          </button>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        Miembros ({miembros.length})
      </h2>
      <div className="flex flex-col gap-2">
        {miembros.map((m) => (
          <div key={m.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5">
            {m.user_id ? (
              <Link to={`/jugadores/${m.id}`} className="flex flex-1 items-center gap-3">
                <Avatar nombre={m.nombre} avatar={m.avatar} size="sm" />
                <p className="flex-1 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                  {m.nombre} {m.id === jugador?.id && <span style={{ color: 'var(--pitch-300)' }}>(vos)</span>}
                </p>
              </Link>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <Avatar nombre={m.nombre} avatar={m.avatar} size="sm" />
                <p className="flex-1 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                  {m.nombre} <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>(sin reclamar)</span>
                </p>
              </div>
            )}
            <BadgeConfiabilidad bajasTardias={bajasTardiasMap[m.id] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  )
}
