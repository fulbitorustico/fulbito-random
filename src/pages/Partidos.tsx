import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Partido } from '../lib/types'
import { distanciaKm, formatCuentaRegresiva, formatDistancia, pedirUbicacion, type Coords } from '../lib/geo'
import { registrarBaja, fetchBajasTardiasMap } from '../lib/bajas'
import { nivelDesdeBajasTardias } from '../lib/confiabilidad'

interface PartidoConCupo extends Partido {
  anotados: number
  yo_anotado: boolean
  distanciaKm: number | null
  grupos: { nombre: string } | null
}

export default function Partidos() {
  const { jugador } = useAuth()
  const [partidos, setPartidos] = useState<PartidoConCupo[]>([])
  const [loading, setLoading] = useState(true)
  const [miUbicacion, setMiUbicacion] = useState<Coords | null>(null)
  const [ubicacionNegada, setUbicacionNegada] = useState(false)
  const [miConfiable, setMiConfiable] = useState(true)

  useEffect(() => {
    if (!jugador) return
    fetchBajasTardiasMap().then((map) => {
      setMiConfiable(nivelDesdeBajasTardias(map[jugador.id] ?? 0) === 'confiable')
    })
  }, [jugador])

  const cargar = useCallback(
    async (ubicacion: Coords | null) => {
      setLoading(true)
      const { data: partidosData } = await supabase
        .from('partidos')
        .select('*, grupos(nombre)')
        .neq('estado', 'cancelado')
        .order('fecha_hora', { ascending: true })

      const { data: participantesData } = await supabase.from('participantes').select('partido_id, jugador_id')

      let lista: PartidoConCupo[] = (partidosData ?? []).map((p) => {
        const deEsePartido = (participantesData ?? []).filter((x) => x.partido_id === p.id)
        return {
          ...p,
          anotados: deEsePartido.length,
          yo_anotado: deEsePartido.some((x) => x.jugador_id === jugador?.id),
          distanciaKm: ubicacion && p.lat != null && p.lng != null ? distanciaKm(ubicacion, { lat: p.lat, lng: p.lng }) : null,
        }
      })

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
    if (p.yo_anotado) {
      await supabase.from('participantes').delete().eq('partido_id', p.id).eq('jugador_id', jugador.id)
      await registrarBaja(p.id, jugador.id, p.fecha_hora)
    } else {
      await supabase.from('participantes').insert({ partido_id: p.id, jugador_id: jugador.id })
    }
    await cargar(miUbicacion)
  }

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

      <div className="flex flex-col gap-3">
        {partidos.map((p, i) => {
          const lugares = p.cupo_total - p.anotados
          const restringido = p.apertura === 'solo_confiables' && !miConfiable && !p.yo_anotado
          const abierto = p.estado === 'abierto' && lugares > 0 && !restringido
          return (
            <div
              key={p.id}
              className="glass anim-rise rounded-3xl p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <Link to={`/partidos/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold" style={{ color: 'var(--pitch-900)' }}>
                    {p.cancha}
                    {p.grupos && (
                      <span className="ml-2 text-[11px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
                        {p.grupos.nombre}
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
                    <span style={{ color: 'var(--gold-500)' }}> · {formatCuentaRegresiva(p.fecha_hora)}</span>
                  </p>
                  {(p.distanciaKm != null || p.valor_cancha) && (
                    <p className="mt-0.5 flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--acc-green)' }}>
                      {p.distanciaKm != null && <span>📍 {formatDistancia(p.distanciaKm)}</span>}
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
                  {lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
                  {p.anotados}/{p.cupo_total} anotados
                  {p.apertura === 'solo_confiables' && ' · Solo confiables 🟢'}
                </span>
                <button
                  onClick={() => toggleAnotarse(p)}
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
        })}
      </div>
    </div>
  )
}
