import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mensajeDeError } from '../lib/errores'
import { useAuth } from '../context/AuthContext'
import type { Partido } from '../lib/types'
import {
  calcularEstadoPartido,
  distanciaKm,
  formatCuentaRegresiva,
  formatDistancia,
  pedirUbicacion,
  type Coords,
} from '../lib/geo'
import { registrarBaja, fetchBajasTardiasMap } from '../lib/bajas'
import { nivelDesdeBajasTardias } from '../lib/confiabilidad'
import Icono from '../components/Icono'
import MisInvitaciones from '../components/MisInvitaciones'
import Novedades from '../components/Novedades'

interface PartidoConCupo extends Partido {
  anotados: number
  yo_anotado: boolean
  distanciaKm: number | null
  grupo_nombre: string | null
}

function TarjetaPartido({
  p,
  miConfiable,
  onToggle,
  delayMs,
}: {
  p: PartidoConCupo
  miConfiable: boolean
  onToggle: (p: PartidoConCupo) => void
  delayMs: number
}) {
  const lugares = p.cupo_total - p.anotados
  const restringido = p.apertura === 'solo_confiables' && !miConfiable && !p.yo_anotado
  const abierto = p.estado === 'abierto' && lugares > 0 && !restringido
  const estadoTiempo = calcularEstadoPartido(p.fecha_hora, p.estado)

  return (
    <div className="glass anim-rise rounded-3xl p-4" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/partidos/${p.id}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold" style={{ color: 'var(--pitch-900)' }}>
            {p.cancha}
            {p.grupo_nombre && (
              <span className="ml-2 text-[11px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
                {p.grupo_nombre}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
            {new Date(p.fecha_hora).toLocaleString('es-AR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {estadoTiempo !== 'cancelado' && (
              <span style={{ color: estadoTiempo === 'en_juego' ? 'var(--acc-green)' : 'var(--gold-500)' }}>
                {' '}
                · {formatCuentaRegresiva(p.fecha_hora)}
              </span>
            )}
          </p>
          {(p.distanciaKm != null || p.valor_cancha) && (
            <p className="mt-0.5 flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--acc-green)' }}>
              {p.distanciaKm != null && (
                <span className="inline-flex items-center gap-1">
                  <Icono name="pin" size={13} /> {formatDistancia(p.distanciaKm)}
                </span>
              )}
              {p.valor_cancha && <span>${Math.ceil(p.valor_cancha / p.cupo_total)}/jugador</span>}
            </p>
          )}
        </Link>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={
            abierto
              ? { background: 'rgba(237,197,141,.18)', color: 'var(--gold-500)' }
              : { background: 'rgba(242,239,233,.07)', color: 'var(--pitch-300)' }
          }
        >
          {estadoTiempo === 'cancelado' ? 'Cancelado' : lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
          {p.anotados}/{p.cupo_total} anotados
          {p.apertura === 'solo_confiables' && ' · Solo confiables'}
        </span>
        <button
          onClick={() => onToggle(p)}
          disabled={!abierto && !p.yo_anotado}
          className="tap rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
          style={
            p.yo_anotado
              ? { background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }
              : { background: 'var(--paper)', color: 'var(--ink-900)' }
          }
        >
          {p.yo_anotado ? 'Bajarme' : restringido ? 'Solo confiables' : 'Sumarme'}
        </button>
      </div>
    </div>
  )
}

export default function Partidos() {
  const { jugador } = useAuth()
  const [partidos, setPartidos] = useState<PartidoConCupo[]>([])
  const [loading, setLoading] = useState(true)
  const [miUbicacion, setMiUbicacion] = useState<Coords | null>(null)
  const [ubicacionNegada, setUbicacionNegada] = useState(false)
  const [miConfiable, setMiConfiable] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jugador) return
    fetchBajasTardiasMap().then((map) => {
      setMiConfiable(nivelDesdeBajasTardias(map[jugador.id] ?? 0) === 'confiable')
    })
  }, [jugador])

  const cargar = useCallback(
    async (ubicacion: Coords | null) => {
      setLoading(true)

      // La base ya devuelve el conteo de anotados y si estoy yo: antes nos
      // traíamos todos los anotados de todos los partidos para contarlos acá.
      const { data } = await supabase.rpc('partidos_con_cupo')

      let lista: PartidoConCupo[] = (
        (data ?? []) as { partido: Partido & { grupo_nombre: string | null }; anotados: number; yo_anotado: boolean }[]
      ).map((fila) => ({
        ...fila.partido,
        anotados: Number(fila.anotados),
        yo_anotado: fila.yo_anotado,
        distanciaKm:
          ubicacion && fila.partido.lat != null && fila.partido.lng != null
            ? distanciaKm(ubicacion, { lat: fila.partido.lat, lng: fila.partido.lng })
            : null,
      }))

      if (ubicacion) {
        lista = lista.sort((a, b) => {
          if (a.distanciaKm == null && b.distanciaKm == null) return 0
          if (a.distanciaKm == null) return 1
          if (b.distanciaKm == null) return -1
          return a.distanciaKm - b.distanciaKm
        })
      }

      setPartidos(lista)
      setLoading(false)
    },
    [jugador?.id],
  )

  useEffect(() => {
    pedirUbicacion().then((coords) => {
      setMiUbicacion(coords)
      setUbicacionNegada(coords === null)
      cargar(coords)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleAnotarse(p: PartidoConCupo) {
    if (!jugador) return
    setError(null)
    if (p.yo_anotado) {
      await supabase.from('participantes').delete().eq('partido_id', p.id).eq('jugador_id', jugador.id)
      await registrarBaja(p.id, jugador.id, p.fecha_hora)
    } else {
      const { error } = await supabase.from('participantes').insert({ partido_id: p.id, jugador_id: jugador.id })
      if (error) {
        setError(mensajeDeError(error, 'sumarse'))
        return
      }
    }
    await cargar(miUbicacion)
  }

  const conEstado = partidos.map((p) => ({ p, estadoTiempo: calcularEstadoPartido(p.fecha_hora, p.estado) }))
  const enJuego = conEstado.filter((x) => x.estadoTiempo === 'en_juego')
  // "¿Cuándo juego?" es la primera pregunta del que vuelve a abrir la app.
  // Antes había que buscar los propios entre los de desconocidos.
  const mios = conEstado.filter((x) => x.estadoTiempo === 'programado' && x.p.yo_anotado)
  const cerca = conEstado.filter((x) => x.estadoTiempo === 'programado' && !x.p.yo_anotado)
  const jugados = conEstado.filter((x) => x.estadoTiempo === 'terminado' || x.estadoTiempo === 'cancelado')

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          Partidos
        </h1>
        <Link
          to="/partidos/nuevo"
          className="tap inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] shadow-sm"
          style={{ background: 'var(--paper)' }}
        >
          + Nuevo
        </Link>
      </div>

      {error && (
        <p
          className="anim-rise mb-4 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
          style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <Novedades />

      <MisInvitaciones alResponder={() => cargar(miUbicacion)} />

      {ubicacionNegada && (
        <div className="glass mb-4 rounded-2xl px-4 py-3 text-xs" style={{ color: 'var(--pitch-700)' }}>
          Activá la ubicación para ver qué partidos tenés más cerca.
        </div>
      )}

      {loading && (
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Buscando partidos...
        </p>
      )}
      {!loading && partidos.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
          No hay partidos todavía. Creá el primero.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {enJuego.length > 0 && (
          <div className="flex flex-col gap-3">
            <p
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
              style={{ color: 'var(--acc-green)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--acc-green)' }} />
              En juego
            </p>
            {enJuego.map(({ p }, i) => (
              <TarjetaPartido key={p.id} p={p} miConfiable={miConfiable} onToggle={toggleAnotarse} delayMs={i * 60} />
            ))}
          </div>
        )}

        {mios.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--paper)' }}>
              Jugás vos
            </p>
            {mios.map(({ p }, i) => (
              <TarjetaPartido key={p.id} p={p} miConfiable={miConfiable} onToggle={toggleAnotarse} delayMs={i * 60} />
            ))}
          </div>
        )}

        {cerca.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--pitch-300)' }}>
              {mios.length > 0 ? 'Cerca tuyo' : 'Próximos'}
            </p>
            {cerca.map(({ p }, i) => (
              <TarjetaPartido key={p.id} p={p} miConfiable={miConfiable} onToggle={toggleAnotarse} delayMs={i * 60} />
            ))}
          </div>
        )}

        {jugados.length > 0 && (
          <details>
            <summary
              className="cursor-pointer text-xs font-bold uppercase tracking-wide"
              style={{ color: 'var(--pitch-300)' }}
            >
              Jugados ({jugados.length})
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {jugados.map(({ p }, i) => (
                <TarjetaPartido key={p.id} p={p} miConfiable={miConfiable} onToggle={toggleAnotarse} delayMs={i * 60} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
