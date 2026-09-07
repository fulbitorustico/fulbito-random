import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']

export default function CompletarPerfil() {
  const { session, refreshJugador } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [posicion, setPosicion] = useState(POSICIONES[0])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setGuardando(true)
    setError(null)
    const { error } = await supabase.from('jugadores').insert({
      user_id: session.user.id,
      nombre,
      apodo: apodo || null,
      posicion,
    })
    setGuardando(false)
    if (error) setError(error.message)
    else await refreshJugador()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Completá tu perfil</h1>
        <p className="mb-6 text-sm text-slate-500">Así te van a reconocer tus compañeros</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
          <input
            placeholder="Apodo (opcional)"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
          <select
            value={posicion}
            onChange={(e) => setPosicion(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          >
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar y entrar'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  )
}
