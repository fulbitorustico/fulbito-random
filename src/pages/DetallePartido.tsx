import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { formatPosiciones } from '../lib/posiciones'
import { registrarBaja, fetchBajasTardiasMap } from '../lib/bajas'
import ReaccionesPartido from '../components/ReaccionesPartido'
import ResultadoPartido from '../components/ResultadoPartido'
import { linkComoLlegar } from '../lib/mapas'
import { compartirPartido } from '../lib/compartir'
import { mensajeDeError } from '../lib/errores'
import { calcularEstadoPartido } from '../lib/geo'
import {
  puedeAdministrar,
  puedeValorar as puedoValorarEste,
  enVentanaDeConfirmar as enVentanaConfirmar,
  debePasarLaCapitania,
  esCapitan as soyCapitan,
  LIBERAR_A_LAS_HORAS,
} from '../lib/permisos'
import { nivelDesdeBajasTardias } from '../lib/confiabilidad'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import Icono from '../components/Icono'
import BotonCompartir from '../components/BotonCompartir'
import { descargarIcs, linkGoogleCalendar, proximaFecha, FRECUENCIAS, type Frecuencia } from '../lib/calendario'
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
  const [eligiendoFrecuencia, setEligiendoFrecuencia] = useState(false)
  const [confirmados, setConfirmados] = useState<Record<string, boolean>>({})
  const [confirmando, setConfirmando] = useState(false)
  const [pasandoCapitania, setPasandoCapitania] = useState(false)
  const [editandoNota, setEditandoNota] = useState(false)
  const [nota, setNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
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
    // Antes de leer nada: la base libera los lugares de los que no confirmaron.
    // No hay tarea programada corriendo de fondo, así que se hace cuando alguien
    // abre el partido — que en la práctica es todo el tiempo.
    await supabase.rpc('liberar_lugares_sin_confirmar', { p_partido_id: id })

    const { data: partidoData } = await supabase.from('partidos').select('*').eq('id', id).maybeSingle()
    const { data: participantesData } = await supabase
      .from('participantes')
      .select('jugador_id, equipo, confirmado_at')
      .eq('partido_id', id)

    if (partidoData) {
      setPartido(partidoData)
      const { fecha, hora } = aFechaHora(partidoData.fecha_hora)
      setCancha(partidoData.cancha)
      setFecha(fecha)
      setHora(hora)
      setCupo(partidoData.cupo_total)
      setNota(partidoData.nota ?? '')
    }

    const ids = (participantesData ?? []).map((p) => p.jugador_id)
    if (ids.length > 0) {
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').in('id', ids)
      setAnotados(jugadoresData ?? [])
    } else {
      setAnotados([])
    }

    const equiposMap: Record<string, 'A' | 'B'> = {}
    const confirmadosMap: Record<string, boolean> = {}
    for (const p of participantesData ?? []) {
      if (p.equipo === 'A' || p.equipo === 'B') equiposMap[p.jugador_id] = p.equipo
      confirmadosMap[p.jugador_id] = !!p.confirmado_at
    }
    setEquipos(equiposMap)
    setConfirmados(confirmadosMap)

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

  // Quién puede qué sale todo de lib/permisos.ts, que es el único lugar donde
  // esto está escrito y donde cada regla nombra su política de la base.
  const esCapitan = soyCapitan(partido, jugador)
  const esAdmin = puedeAdministrar(partido, jugador)
  const yoAnotado = anotados.some((a) => a.id === jugador?.id)
  const lugares = partido.cupo_total - anotados.length
  const estadoTiempo = calcularEstadoPartido(partido.fecha_hora, partido.estado)
  const puedeValorar = puedoValorarEste(partido, yoAnotado)
  const enVentanaDeConfirmar = enVentanaConfirmar(partido)
  const meFaltaConfirmar = yoAnotado && enVentanaDeConfirmar && jugador ? !confirmados[jugador.id] : false
  const horaLimite = new Date(new Date(partido.fecha_hora).getTime() - LIBERAR_A_LAS_HORAS * 3_600_000)
  const miConfiable = !jugador || nivelDesdeBajasTardias(bajasTardiasMap[jugador.id] ?? 0) === 'confiable'
  const restringido = partido.apertura === 'solo_confiables' && !miConfiable && !yoAnotado
  const abierto = partido.estado === 'abierto' && lugares > 0 && !restringido

  async function toggleAnotarse() {
    if (!jugador || !partido) return
    setError(null)
    if (yoAnotado) {
      // El capitán no puede irse dejando el partido sin dueño: si hay a quién,
      // primero elige sucesor. Si está solo, no hay a quién pasarle nada.
      if (debePasarLaCapitania(partido, jugador, anotados.length)) {
        setPasandoCapitania(true)
        return
      }
      await supabase.from('participantes').delete().eq('partido_id', partido.id).eq('jugador_id', jugador.id)
      await registrarBaja(partido.id, jugador.id, partido.fecha_hora, esCapitan)
    } else {
      const { error } = await supabase
        .from('participantes')
        .insert({ partido_id: partido.id, jugador_id: jugador.id })
      // La base puede decir que no por cupo, por grupo, por confiabilidad o
      // por fecha. Antes eso no se miraba y el botón simplemente no hacía nada.
      if (error) {
        setError(mensajeDeError(error, 'sumarse'))
        return
      }
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

  async function pasarCapitaniaYBajarme(nuevoCapitanId: string) {
    if (!jugador || !partido) return
    await supabase
      .from('partidos')
      .update({
        admin_id: nuevoCapitanId,
        // Si el sucesor era el subcapitán, el puesto queda vacante: no tiene
        // sentido que sea capitán y subcapitán a la vez.
        subcapitan_id: partido.subcapitan_id === nuevoCapitanId ? null : partido.subcapitan_id,
      })
      .eq('id', partido.id)
    await supabase.from('participantes').delete().eq('partido_id', partido.id).eq('jugador_id', jugador.id)
    await registrarBaja(partido.id, jugador.id, partido.fecha_hora, true)
    setPasandoCapitania(false)
    await cargar()
  }

  async function guardarNota() {
    if (!partido) return
    setGuardandoNota(true)
    const { error } = await supabase
      .from('partidos')
      .update({ nota: nota.trim() || null })
      .eq('id', partido.id)
    setGuardandoNota(false)
    if (error) {
      setError(mensajeDeError(error))
      return
    }
    setEditandoNota(false)
    await cargar()
  }

  async function compartirLink() {
    if (!partido?.token) return
    const resultado = await compartirPartido(partido)
    if (resultado === 'copiado') {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    }
  }

  async function confirmarAsistencia() {
    if (!jugador || !partido) return
    setConfirmando(true)
    const { error } = await supabase
      .from('participantes')
      .update({ confirmado_at: new Date().toISOString() })
      .eq('partido_id', partido.id)
      .eq('jugador_id', jugador.id)
    setConfirmando(false)
    if (error) {
      setError(mensajeDeError(error))
      return
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
    setCancelando(true)
    setError(null)

    // El .select() no es de adorno: si la base rechaza el cambio por permisos
    // no devuelve error, devuelve cero filas. Sin esto, un rechazo se veía
    // igual que un éxito.
    const { data, error } = await supabase
      .from('partidos')
      .update({ estado: 'cancelado' })
      .eq('id', partido.id)
      .select('id')

    setCancelando(false)
    if (error) {
      setError(mensajeDeError(error))
      return
    }
    if (!data?.length) {
      setError('No pudimos cancelarlo. Solo puede cancelar el partido quien lo armó.')
      setConfirmandoCancelar(false)
      return
    }
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
    const { error } = await supabase.from('partidos').update({ subcapitan_id: jugadorId }).eq('id', partido.id)
    if (error) setError(mensajeDeError(error))
    await cargar()
  }

  async function duplicarPartido(frecuencia: Frecuencia) {
    if (!partido || !jugador) return
    setDuplicando(true)
    const nuevaFecha = proximaFecha(partido.fecha_hora, frecuencia)
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
    setEligiendoFrecuencia(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data) {
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

          <a
            href={linkComoLlegar(partido)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 mr-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: 'var(--acc-green)' }}
          >
            <Icono name="pin" size={13} /> Cómo llegar
          </a>

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

          {partido.nota && !editandoNota && (
            <p
              className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
              style={{ background: 'rgba(237,197,141,.14)', color: 'var(--pitch-700)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--gold-500)' }}>
                Del capitán:{' '}
              </span>
              {partido.nota}
            </p>
          )}

          {editandoNota && (
            <div className="anim-rise mt-3">
              <textarea
                autoFocus
                rows={3}
                maxLength={400}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Llevo las pecheras. Traigan cambio de $5.000. El que llega tarde no juega el primero."
                className="w-full resize-none rounded-2xl border-0 bg-white/5 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-2"
                style={{ color: 'var(--pitch-900)' }}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setNota(partido.nota ?? '')
                    setEditandoNota(false)
                  }}
                  className="tap btn-2 flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNota}
                  disabled={guardandoNota}
                  className="tap flex-[2] rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                >
                  {guardandoNota ? 'Guardando...' : 'Guardar aviso'}
                </button>
              </div>
            </div>
          )}

          {esAdmin && !editandoNota && estadoTiempo !== 'terminado' && (
            <button
              onClick={() => setEditandoNota(true)}
              className="tap mt-2 text-[13px] font-semibold underline"
              style={{ color: 'var(--gold-500)' }}
            >
              {partido.nota ? 'Editar el aviso' : 'Dejar un aviso para los que van'}
            </button>
          )}

          {estadoTiempo === 'programado' && (
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

          {error && (
            <p
              className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
              style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
            >
              {error}
            </p>
          )}

          {meFaltaConfirmar && (
            <div className="anim-rise mt-4 rounded-2xl p-4" style={{ background: 'rgba(237,197,141,.16)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--gold-500)' }}>
                ¿Venís?
              </p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
                Confirmá antes de las{' '}
                {horaLimite.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })} de
                {horaLimite.toDateString() === new Date().toDateString() ? ' hoy' : ' mañana'}. Si no, tu lugar queda
                libre para que entre otro.
              </p>
              <button
                onClick={confirmarAsistencia}
                disabled={confirmando}
                className="tap mt-3 w-full rounded-2xl px-4 py-3 text-[15px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
              >
                {confirmando ? 'Confirmando...' : 'Sí, voy'}
              </button>
            </div>
          )}

          {yoAnotado && estadoTiempo === 'programado' && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => descargarIcs(partido)}
                className="tap glass flex-1 rounded-2xl px-4 py-3 text-[15px] font-semibold"
                style={{ color: 'var(--acc-blue)' }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Icono name="pin" size={15} /> Agendar con aviso
                </span>
              </button>
              <a
                href={linkGoogleCalendar(partido)}
                target="_blank"
                rel="noreferrer"
                className="tap glass shrink-0 rounded-2xl px-4 py-3 text-[13px] font-semibold"
                style={{ color: 'var(--pitch-700)' }}
              >
                Google
              </a>
            </div>
          )}

          {puedeValorar && (
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

      {estadoTiempo === 'terminado' && mvp.length > 0 && (
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

      {estadoTiempo === 'terminado' && (
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

      {estadoTiempo === 'terminado' && partido.estado !== 'cancelado' && (
        <ResultadoPartido
          partido={partido}
          anotados={anotados}
          equipos={equipos}
          puedeCargar={esAdmin}
          alGuardar={cargar}
        />
      )}

      {estadoTiempo !== 'programado' && partido.estado !== 'cancelado' && (
        <ReaccionesPartido partidoId={partido.id} puedoReaccionar={yoAnotado} />
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
          {lugares > 0 && estadoTiempo === 'programado' && (
            <button
              onClick={compartirLink}
              className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
              style={{ color: 'var(--gold-500)' }}
            >
              {linkCopiado ? 'Link copiado' : 'Pasar el link'}
            </button>
          )}
          {lugares > 0 && estadoTiempo === 'programado' && (
            <Link
              to={`/buscar?partido=${partido.id}`}
              className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-center text-sm font-semibold"
              style={{ color: 'var(--acc-blue)' }}
            >
              Buscar {lugares === 1 ? 'un jugador' : 'jugadores'}
            </Link>
          )}
          <button
            onClick={() => setEligiendoFrecuencia((v) => !v)}
            disabled={duplicando}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ color: 'var(--pitch-700)' }}
          >
            {duplicando ? 'Creando...' : 'Repetir'}
          </button>
          <button
            onClick={() => setConfirmandoCancelar(true)}
            className="tap glass flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{ color: 'var(--error)' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {confirmandoCancelar && (
        <div className="glass-strong anim-rise mt-3 rounded-2xl p-5">
          <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
            ¿Cancelar este partido?
          </p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
            {anotados.length > 1
              ? `Los ${anotados.length} anotados van a dejar de verlo en la lista.`
              : 'Va a dejar de aparecer en la lista.'}{' '}
            No se puede deshacer: si después querés jugarlo, hay que armarlo de nuevo.
          </p>

          {error && (
            <p
              className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
              style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setConfirmandoCancelar(false)
                setError(null)
              }}
              className="tap flex-[2] rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
            >
              No, dejalo
            </button>
            <button
              onClick={cancelarPartido}
              disabled={cancelando}
              className="tap btn-2 flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{ color: 'var(--error)', borderColor: 'rgba(224,122,99,.45)' }}
            >
              {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      )}

      {pasandoCapitania && (
        <div className="glass-strong anim-rise mt-3 rounded-2xl p-5">
          <p className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
            Sos el capitán de este partido
          </p>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
            Antes de bajarte, pasale la capitanía a alguien que sí vaya. Si te vas sin dejar a nadie a cargo, quedan
            diez personas sin quién organice.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {anotados
              .filter((a) => a.id !== jugador?.id)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => pasarCapitaniaYBajarme(a.id)}
                  className="tap glass flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left"
                >
                  <Avatar nombre={a.nombre} avatar={a.avatar} fotoUrl={a.foto_url} size="sm" />
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--pitch-900)' }}>
                    {a.nombre}
                    {a.id === partido.subcapitan_id && (
                      <span className="ml-1.5 text-[11px]" style={{ color: 'var(--acc-blue)' }}>
                        subcapitán
                      </span>
                    )}
                  </span>
                  <Icono name="corona" size={14} />
                </button>
              ))}
          </div>
          <button
            onClick={() => setPasandoCapitania(false)}
            className="tap btn-2 mt-3 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Mejor me quedo
          </button>
        </div>
      )}

      {eligiendoFrecuencia && esAdmin && (
        <div className="glass anim-rise mt-2 rounded-2xl p-4">
          <p className="mb-2.5 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            ¿Cada cuánto se repite?
          </p>
          <div className="flex gap-2">
            {FRECUENCIAS.map((f) => (
              <button
                key={f.valor}
                onClick={() => duplicarPartido(f.valor)}
                disabled={duplicando}
                className="tap flex-1 rounded-2xl px-3 py-2.5 text-[13px] font-semibold disabled:opacity-50"
                style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-900)' }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
            Se crea el próximo partido con la misma cancha, el mismo cupo y la misma configuración. Si el partido que
            estás repitiendo ya pasó, salta hasta la próxima fecha que caiga adelante.
          </p>
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
                {enVentanaDeConfirmar && !confirmados[a.id] && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'rgba(237,197,141,.18)', color: 'var(--gold-500)' }}
                  >
                    sin confirmar
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
