import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { formatPosiciones } from '../lib/posiciones'
import { registrarBaja, fetchBajasTardiasMap } from '../lib/bajas'
import { nivelDesdeBajasTardias } from '../lib/confiabilidad'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import Icono from '../components/Icono'
import BotonCompartir from '../components/BotonCompartir'
import type { Jugador, MvpDelPartido, Partido, ValoracionPromedio } from '../lib/types'

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const inputClass =
  'rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2'

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
  const [bajasTardiasMap, setBajasTardiasMap] = useState<Record<string, number>>({})
  const [equipos, setEquipos] = useState<Record<string, 'A' | 'B'>>({})
  const [promedios, setPromedios] = useState<Record<string, number>>({})
  const [generandoEquipos, setGenerandoEquipos] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [mvp, setMvp] = useState<MvpDelPartido[]>([])

  useEffect(() => {
    fetchBajasTardiasMap().then(setBajasTardiasMap)
    supabase.rpc('valoraciones_promedio').then(({ data }: { data: ValoracionPromedio[] | null }) => {
      const map: Record<string, number> = {}
      for (const p of data ?? []) map[p.evaluado_id] = p.promedio
      setPromedios(map)
    })
  }, [])

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: partidoData } = await supabase.from('partidos').select('*').eq('id', id).maybeSingle()
    const { data: participantesData } = await supabase
      .from('participantes')
      .select('jugador_id, equipo')
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

    const equiposMap: Record<string, 'A' | 'B'> = {}
    for (const p of participantesData ?? []) if (p.equipo === 'A' || p.equipo === 'B') equiposMap[p.jugador_id] = p.equipo
    setEquipos(equiposMap)

    const { data: mvpData } = await supabase.rpc('mvp_del_partido', { p_partido_id: id })
    setMvp(mvpData ?? [])

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

  const esCapitan = jugador?.id === partido.admin_id
  const esSubcapitan = jugador?.id === partido.subcapitan_id
  // El subcapitán tiene los mismos poderes que el capitán sobre el partido.
  const esAdmin = esCapitan || esSubcapitan
  const yoAnotado = anotados.some((a) => a.id === jugador?.id)
  const lugares = partido.cupo_total - anotados.length
  const yaSeJugo = new Date(partido.fecha_hora).getTime() < Date.now()
  const miConfiable = !jugador || nivelDesdeBajasTardias(bajasTardiasMap[jugador.id] ?? 0) === 'confiable'
  const restringido = partido.apertura === 'solo_confiables' && !miConfiable && !yoAnotado
  const abierto = partido.estado === 'abierto' && lugares > 0 && !restringido

  async function toggleAnotarse() {
    if (!jugador || !partido) return
    if (yoAnotado) {
      await supabase.from('participantes').delete().eq('partido_id', partido.id).eq('jugador_id', jugador.id)
      await registrarBaja(partido.id, jugador.id, partido.fecha_hora)
    } else {
      await supabase.from('participantes').insert({ partido_id: partido.id, jugador_id: jugador.id })
      if (jugador.id !== partido.admin_id) {
        const nuevosAnotados = anotados.length + 1
        supabase.functions
          .invoke('rapid-action', {
            body: {
              tipo: nuevosAnotados >= partido.cupo_total ? 'partido_completo' : 'sumaron_partido',
              admin_id: partido.admin_id,
              jugador_nombre: jugador.nombre,
              cancha: partido.cancha,
              anotados: nuevosAnotados,
              cupo: partido.cupo_total,
            },
          })
          .catch(() => {})
      }
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

  async function generarEquipos() {
    if (!partido) return
    setGenerandoEquipos(true)
    const ordenados = [...anotados].sort((a, b) => (promedios[b.id] ?? 0) - (promedios[a.id] ?? 0))
    // draft en serpentina (A,B,B,A,A,B,B,A...) para que los dos equipos queden parejos por rating
    const asignaciones = ordenados.map((j, i) => {
      const bloque = Math.floor(i / 2)
      const equipo: 'A' | 'B' = bloque % 2 === 0 ? (i % 2 === 0 ? 'A' : 'B') : i % 2 === 0 ? 'B' : 'A'
      return { jugador_id: j.id, equipo }
    })
    await Promise.all(
      asignaciones.map((a) =>
        supabase.from('participantes').update({ equipo: a.equipo }).eq('partido_id', partido.id).eq('jugador_id', a.jugador_id),
      ),
    )
    setGenerandoEquipos(false)
    await cargar()
  }

  async function designarSubcapitan(jugadorId: string | null) {
    if (!partido) return
    await supabase.from('partidos').update({ subcapitan_id: jugadorId }).eq('id', partido.id)
    await cargar()
  }

  async function duplicarPartido() {
    if (!partido || !jugador) return
    setDuplicando(true)
    const nuevaFecha = new Date(partido.fecha_hora)
    nuevaFecha.setDate(nuevaFecha.getDate() + 7)
    const { data, error } = await supabase
      .from('partidos')
      .insert({
        cancha: partido.cancha,
        fecha_hora: nuevaFecha.toISOString(),
        cupo_total: partido.cupo_total,
        admin_id: jugador.id,
        lat: partido.lat,
        lng: partido.lng,
        valor_cancha: partido.valor_cancha,
        apertura: partido.apertura,
        grupo_id: partido.grupo_id,
        usa_equipos: partido.usa_equipos,
      })
      .select()
      .single()
    setDuplicando(false)
    if (!error && data) {
      await supabase.from('participantes').insert({ partido_id: data.id, jugador_id: jugador.id })
      navigate(`/partidos/${data.id}`)
    }
  }

  return (
    <div>
      <Link
        to="/partidos"
        className="mb-4 inline-block text-sm font-medium"
        style={{ color: 'var(--acc-green)' }}
      >
        ← Volver a partidos
      </Link>

      {partido.estado === 'cancelado' && (
        <p
          className="mb-4 rounded-2xl p-3 text-sm"
          style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
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
                  ? { background: 'rgba(237,197,141,.18)', color: 'var(--gold-500)' }
                  : { background: 'rgba(242,239,233,.07)', color: 'var(--pitch-300)' }
              }
            >
              {partido.estado === 'cancelado' ? 'Cancelado' : lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
            </span>
          </div>

          {partido.cancha_id && (
            <Link
              to={`/canchas/${partido.cancha_id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: 'var(--acc-blue)' }}
            >
              <Icono name="pin" size={13} /> Ver el perfil de la cancha
            </Link>
          )}

          {partido.valor_cancha && (
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--acc-green)' }}>
              ${Math.ceil(partido.valor_cancha / partido.cupo_total)} por jugador · ${partido.valor_cancha} total
            </p>
          )}

          {partido.apertura === 'solo_confiables' && (
            <p className="mt-2 text-[13px] font-medium" style={{ color: 'var(--acc-green)' }}>
              Solo para jugadores confiables
            </p>
          )}

          {partido.estado !== 'cancelado' && (
            <button
              onClick={toggleAnotarse}
              disabled={!abierto && !yoAnotado}
              className="tap mt-4 w-full rounded-2xl px-4 py-3 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={
                yoAnotado
                  ? { background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }
                  : { background: 'var(--paper)', color: 'var(--ink-900)' }
              }
            >
              {yoAnotado ? 'Bajarme' : restringido ? 'Solo confiables' : 'Sumarme'}
            </button>
          )}

          {yaSeJugo && partido.estado !== 'cancelado' && (
            <Link
              to={`/partidos/${partido.id}/valorar`}
              className="tap mt-2 block w-full rounded-2xl px-4 py-3 text-center text-[15px] font-semibold"
              style={{ background: 'rgba(237,197,141,.16)', color: 'var(--gold-500)' }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Icono name="estrella" size={15} /> Valorar compañeros
              </span>
            </Link>
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
              className="tap flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] disabled:opacity-50"
              style={{ background: 'var(--paper)' }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="tap rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-700)' }}
            >
              Cancelar
            </button>
          </div>
          {error && (
            <p className="text-sm" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          )}
        </form>
      )}

      {yaSeJugo && mvp.length > 0 && (
        <div className="glass-strong anim-rise mt-3 rounded-[24px] p-5">
          <div className="flex items-center gap-3">
            <div style={{ color: 'var(--gold-500)' }}>
              <Icono name="corona" size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--pitch-300)' }}>
                MVP de la fecha
              </p>
              <p className="truncate text-lg font-extrabold" style={{ color: 'var(--pitch-900)' }}>
                {mvp[0].nombre}
                {mvp[0].apodo && (
                  <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}> "{mvp[0].apodo}"</span>
                )}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--gold-500)' }}>
              {mvp[0].votos} {mvp[0].votos === 1 ? 'voto' : 'votos'}
            </span>
          </div>
        </div>
      )}

      {yaSeJugo && partido.estado !== 'cancelado' && (
        <div
          className="glass-strong mt-3 rounded-[24px] p-5"
          style={{ border: '1px solid rgba(162,138,188,.3)' }}
        >
          <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--acc-purple)' }}>
            <Icono name="camara" size={16} /> Subilo a tu historia
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
            La placa sale con el MVP, los equipos y la cancha, lista para Instagram. Sumale la foto del partido y
            ya tenés la historia armada.
          </p>
          <BotonCompartir
            className="mt-3"
            etiquetaBoton="Armar la placa del partido"
          texto={`Jugamos en ${partido.cancha} 🏟️`}
          datos={{
            etiqueta: 'Fecha jugada',
            titulo: partido.cancha,
            subtitulo: new Date(partido.fecha_hora).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            destacado: mvp.length > 0 ? mvp[0].nombre : `${anotados.length}`,
            pieDestacado: mvp.length > 0 ? 'MVP de la fecha' : 'jugadores en cancha',
              filas: anotados.slice(0, 10).map((a) => ({
                izquierda: a.nombre,
                derecha: equipos[a.id] ? `Equipo ${equipos[a.id]}` : '—',
              })),
            }}
          />
        </div>
      )}

      {esAdmin && partido.estado !== 'cancelado' && !editando && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setEditando(true)}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: 'var(--pitch-700)' }}
          >
            Editar
          </button>
          {partido.usa_equipos && anotados.length >= 2 && (
            <button
              onClick={generarEquipos}
              disabled={generandoEquipos}
              className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ color: 'var(--acc-green)' }}
            >
              {generandoEquipos ? 'Armando...' : 'Generar equipos'}
            </button>
          )}
          {lugares > 0 && !yaSeJugo && (
            <Link
              to={`/buscar?partido=${partido.id}`}
              className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-center text-sm font-semibold"
              style={{ color: 'var(--acc-blue)' }}
            >
              Buscar {lugares === 1 ? 'un jugador' : 'jugadores'}
            </Link>
          )}
          <button
            onClick={duplicarPartido}
            disabled={duplicando}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ color: 'var(--pitch-700)' }}
          >
            {duplicando ? 'Creando...' : 'Repetir la próxima semana'}
          </button>
          <button
            onClick={cancelarPartido}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: 'var(--error)' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {esCapitan && partido.estado !== 'cancelado' && anotados.length > 1 && (
        <div className="glass mt-3 rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            <Icono name="corona" size={15} /> Subcapitán del partido
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--pitch-300)' }}>
            Puede editar, armar equipos, buscar jugadores y cancelar, igual que vos.
          </p>
          <select
            value={partido.subcapitan_id ?? ''}
            onChange={(e) => designarSubcapitan(e.target.value || null)}
            className="mt-3 w-full rounded-2xl border-0 bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-2"
            style={{ color: 'var(--pitch-900)' }}
          >
            <option value="">Sin subcapitán</option>
            {anotados
              .filter((a) => a.id !== partido.admin_id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
          </select>
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
            <Link
              key={a.id}
              to={`/jugadores/${a.id}`}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5"
            >
              {equipos[a.id] && (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[color:var(--ink-900)]"
                  style={{ background: equipos[a.id] === 'A' ? 'var(--paper)' : 'var(--gold-500)' }}
                >
                  {equipos[a.id]}
                </span>
              )}
              <Avatar nombre={a.nombre} avatar={a.avatar} fotoUrl={a.foto_url} size="sm" />
              <p className="flex flex-1 items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                <span className="min-w-0 truncate">
                  {a.nombre}{' '}
                  {a.apodo && <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{a.apodo}"</span>}
                </span>
                {a.id === partido.admin_id && (
                  <span title="Capitán" style={{ color: 'var(--gold-500)' }}>
                    <Icono name="corona" size={13} />
                  </span>
                )}
                {a.id === partido.subcapitan_id && (
                  <span title="Subcapitán" style={{ color: 'var(--acc-blue)' }}>
                    <Icono name="corona" size={13} />
                  </span>
                )}
              </p>
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
                  {formatPosiciones(a.posiciones)}
                </p>
                <BadgeConfiabilidad bajasTardias={bajasTardiasMap[a.id] ?? 0} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
