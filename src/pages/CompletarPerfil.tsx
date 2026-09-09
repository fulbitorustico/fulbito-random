import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SelectorPosiciones from '../components/SelectorPosiciones'
import { limpiarInvitadoPor, tomarInvitadoPor } from '../lib/reclutamiento'

export default function CompletarPerfil() {
  const { session, refreshJugador } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [posiciones, setPosiciones] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setGuardando(true)
    setError(null)
    const invitadoPor = tomarInvitadoPor()
    const { error } = await supabase.from('jugadores').insert({
      user_id: session.user.id,
      nombre,
      apodo: apodo || null,
      posiciones,
      invitado_por_id: invitadoPor,
    })
    if (!error) limpiarInvitadoPor()
    setGuardando(false)
    if (error) setError(error.message)
    else await refreshJugador()
  }

  const inputClass =
    'rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2'

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          Completá tu perfil
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
          Así te van a reconocer tus compañeros
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
          <SelectorPosiciones value={posiciones} onChange={setPosiciones} />
          <button
            type="submit"
            disabled={guardando}
            className="tap mt-1 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
            style={{ background: 'var(--paper)' }}
          >
            {guardando ? 'Guardando...' : 'Guardar y entrar'}
          </button>
          {error && (
            <p className="text-sm" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          )}
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
          Al continuar aceptás los{' '}
          <Link to="/terminos" className="underline">
            términos
          </Link>{' '}
          y la{' '}
          <Link to="/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
