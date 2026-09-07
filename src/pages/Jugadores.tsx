import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Jugador, ValoracionPromedio } from '../lib/types'

export default function Jugadores() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [promedios, setPromedios] = useState<Record<string, ValoracionPromedio>>({})
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').order('nombre')
      const { data: promediosData } = await supabase.from('valoraciones_promedio').select('*')
      setJugadores(jugadoresData ?? [])
      const map: Record<string, ValoracionPromedio> = {}
      for (const p of promediosData ?? []) map[p.evaluado_id] = p
      setPromedios(map)
      setLoading(false)
    }
    cargar()
  }, [])

  const filtrados = jugadores.filter((j) => {
    const q = busqueda.toLowerCase()
    return j.nombre.toLowerCase().includes(q) || (j.apodo ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">Jugadores</h1>
      <input
        placeholder="Buscar por nombre o apodo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
      />

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}

      <div className="flex flex-col gap-2">
        {filtrados.map((j) => {
          const prom = promedios[j.id]
          return (
            <div key={j.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold text-slate-900">
                  {j.nombre} {j.apodo && <span className="font-normal text-slate-400">"{j.apodo}"</span>}
                </p>
                <p className="text-sm text-slate-500">{j.posicion ?? 'Sin posición'}</p>
              </div>
              <div className="text-right">
                {prom ? (
                  <p className="text-sm font-semibold text-amber-600">★ {prom.promedio}</p>
                ) : (
                  <p className="text-xs text-slate-400">Sin valorar</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
