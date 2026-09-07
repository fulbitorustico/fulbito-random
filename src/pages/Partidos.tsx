import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Partido } from '../lib/types'

interface PartidoConCupo extends Partido {
  anotados: number
  yo_anotado: boolean
}

export default function Partidos() {
  const { jugador } = useAuth()
  const [partidos, setPartidos] = useState<PartidoConCupo[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: partidosData } = await supabase
      .from('partidos')
      .select('*')
      .neq('estado', 'cancelado')
      .order('fecha_hora', { ascending: true })

    const { data: participantesData } = await supabase.from('participantes').select('partido_id, jugador_id')

    const lista: PartidoConCupo[] = (partidosData ?? []).map((p) => {
      const deEsePartido = (participantesData ?? []).filter((x) => x.partido_id === p.id)
      return {
        ...p,
        anotados: deEsePartido.length,
        yo_anotado: deEsePartido.some((x) => x.jugador_id === jugador?.id),
      }
    })
    setPartidos(lista)
    setLoading(false)
  }, [jugador?.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function toggleAnotarse(p: PartidoConCupo) {
    if (!jugador) return
    if (p.yo_anotado) {
      await supabase.from('participantes').delete().eq('partido_id', p.id).eq('jugador_id', jugador.id)
    } else {
      await supabase.from('participantes').insert({ partido_id: p.id, jugador_id: jugador.id })
    }
    await cargar()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Partidos</h1>
        <Link
          to="/partidos/nuevo"
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          + Nuevo partido
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {!loading && partidos.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          No hay partidos todavía. Creá el primero.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {partidos.map((p) => {
          const lugares = p.cupo_total - p.anotados
          const abierto = p.estado === 'abierto' && lugares > 0
          return (
            <div key={p.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{p.cancha}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(p.fecha_hora).toLocaleString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
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
                  {lugares > 0 ? `Faltan ${lugares}` : 'Completo'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {p.anotados}/{p.cupo_total} anotados
                </span>
                <button
                  onClick={() => toggleAnotarse(p)}
                  disabled={!abierto && !p.yo_anotado}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    p.yo_anotado
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {p.yo_anotado ? 'Bajarme' : 'Sumarme'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
