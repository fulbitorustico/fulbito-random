import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']

const inputClass =
  'rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2'

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
    <div>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Mi perfil
      </h1>
      <p className="mb-4 text-sm" style={{ color: 'var(--pitch-300)' }}>
        {session?.user.email}
      </p>

      <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-3 rounded-[28px] p-6">
        <input
          required
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
        />
        <input
          placeholder="Apodo (opcional)"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
        />
        <select
          value={posicion ?? POSICIONES[0]}
          onChange={(e) => setPosicion(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
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
          className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
          style={{ background: 'var(--pitch-500)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {mensaje && (
          <p className="text-sm" style={{ color: 'var(--pitch-700)' }}>
            {mensaje}
          </p>
        )}
      </form>

      <Link
        to="/bases-y-condiciones"
        className="mt-5 block text-center text-sm"
        style={{ color: 'var(--pitch-300)' }}
      >
        Bases y condiciones
      </Link>

      <button
        onClick={() => supabase.auth.signOut()}
        className="tap glass mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{ color: 'var(--pitch-700)' }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
