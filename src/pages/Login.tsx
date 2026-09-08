import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setEnviando(false)
    if (error) setError(error.message)
    else setEnviado(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8">
        <p className="brand text-4xl leading-none" style={{ color: 'var(--pitch-900)' }}>
          Fulbito Random
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
          Armá el partido, avisá si falta uno.
        </p>

        {enviado ? (
          <p
            className="anim-rise mt-7 rounded-2xl p-4 text-sm"
            style={{ background: 'rgba(45,106,79,.12)', color: 'var(--pitch-700)' }}
          >
            Te mandamos un link a <strong>{email}</strong>. Abrilo desde este mismo dispositivo para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2"
              style={{ color: 'var(--pitch-900)' }}
            />
            <button
              type="submit"
              disabled={enviando}
              className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
              style={{ background: 'var(--pitch-500)' }}
            >
              {enviando ? 'Enviando...' : 'Entrar con email'}
            </button>
            {error && (
              <p className="text-sm" style={{ color: '#b3432f' }}>
                {error}
              </p>
            )}
          </form>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
          Al entrar aceptás los{' '}
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
