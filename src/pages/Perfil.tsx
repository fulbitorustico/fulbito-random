import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']

export default function Perfil() {
  const { jugador, refreshJugador, session } = useAuth()
  const [nombre, setNombre] = useState(jugador?.nombre ?? '')
  const [apodo, setApodo] = useState(jugador?.apodo ?? '')
  const [posicion, setPosicion] = useState(jugador?.posicion ?? POSICIONES[0])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  if (!jugador) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('jugadores')
      .update({ nombre, apodo: apodo || null, posicion })
      .eq('id', jugador!.id)
    setGuardando(false)
    if (error) setMensaje(error.message)
    else {
      await refreshJugador()
      setMensaje('Guardado ✓')
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Mi perfil</h1>
      <p className="mb-4 text-sm text-slate-500">{session?.user.email}</p>
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
          value={posicion ?? POSICIONES[0]}
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
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      </form>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
