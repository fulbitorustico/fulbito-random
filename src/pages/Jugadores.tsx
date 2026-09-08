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
      const { data: promediosData } = await supabase.rpc('valoraciones_promedio')
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
    <div>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Jugadores
      </h1>
      <input
        placeholder="Buscar por nombre o apodo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 w-full rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2"
        style={{ color: 'var(--pitch-900)' }}
      />

      {loading && (
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {filtrados.map((j, i) => {
          const prom = promedios[j.id]
          return (
            <div
              key={j.id}
              className="glass anim-rise flex items-center justify-between rounded-2xl px-4 py-3.5"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {j.nombre}{' '}
                  {j.apodo && (
                    <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{j.apodo}"</span>
                  )}
                </p>
                <p className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
                  {j.posicion ?? 'Sin posición'}
                </p>
              </div>
              <div className="text-right">
                {prom ? (
                  <p className="text-sm font-semibold" style={{ color: 'var(--gold-500)' }}>
                    ★ {prom.promedio}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
                    Sin valorar
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
