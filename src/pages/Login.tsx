import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Marca from '../components/Marca'

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

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8">
        <Marca size="lg" />
        <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
          Armá el partido, avisá si falta uno.
        </p>

        {!enviado && (
          <button
            type="button"
            onClick={handleGoogle}
            className="tap mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-[15px] font-semibold shadow-sm"
            style={{ color: 'var(--ink-900)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
              />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.28-1.7V4.96H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.04z" />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
              />
            </svg>
            Entrar con Google
          </button>
        )}

        {!enviado && (
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
            <span className="text-xs" style={{ color: 'var(--pitch-300)' }}>
              o con tu email
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
          </div>
        )}

        {enviado ? (
          <p
            className="anim-rise mt-7 rounded-2xl p-4 text-sm"
            style={{ background: 'rgba(159,198,154,.16)', color: 'var(--pitch-700)' }}
          >
            Te mandamos un link a <strong>{email}</strong>. Abrilo desde este mismo dispositivo para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2"
              style={{ color: 'var(--pitch-900)' }}
            />
            <button
              type="submit"
              disabled={enviando}
              className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
              style={{ background: 'var(--paper)' }}
            >
              {enviando ? 'Enviando...' : 'Entrar con email'}
            </button>
            {error && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>
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
