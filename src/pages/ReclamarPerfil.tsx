import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Marca from '../components/Marca'
import type { Jugador } from '../lib/types'

export default function ReclamarPerfil() {
  const { id } = useParams<{ id: string }>()
  const { session, jugador, refreshJugador, loading: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  const [placeholder, setPlaceholder] = useState<Jugador | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [reclamando, setReclamando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      if (!id) return
      const { data } = await supabase.from('jugadores').select('*').eq('id', id).maybeSingle()
      setPlaceholder(data)
      setLoading(false)
    }
    cargar()
  }, [id])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setEnviando(false)
    if (error) setError(error.message)
    else setEnviado(true)
  }

  async function reclamar() {
    if (!id) return
    setReclamando(true)
    setError(null)
    // El .select() no es decorativo: si la base rechaza el reclamo por permisos
    // no devuelve error, devuelve cero filas. Sin esto el reclamo fallido
    // parecía exitoso y te dejaba en una app vacía.
    const { data, error } = await supabase
      .from('jugadores')
      .update({ user_id: session!.user.id })
      .eq('id', id)
      .is('user_id', null)
      .select('id')
    setReclamando(false)
    if (error) {
      setError(error.message)
      return
    }
    if (!data?.length) {
      setError('Este perfil no se puede reclamar. Si creés que es un error, escribinos.')
      return
    }
    await refreshJugador()
    navigate('/partidos')
  }

  if (loading || cargandoAuth)
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      </div>
    )

  // Los jugadores de demostración vienen con valoraciones e insignias puestas:
  // no son de nadie y no se reclaman.
  if (!placeholder || placeholder.user_id || placeholder.es_demo) {
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
            Este link de reclamo ya no es válido — puede que este perfil ya haya sido reclamado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8">
        <Marca />
        <p className="mt-3 text-sm" style={{ color: 'var(--pitch-700)' }}>
          Te sumaron como <strong>{placeholder.nombre}</strong>. Confirmá tu email para tomar este perfil — vas a
          quedar con el historial y las valoraciones que ya tenías.
        </p>

        {!session ? (
          enviado ? (
            <p
              className="mt-6 rounded-2xl p-4 text-sm"
              style={{ background: 'rgba(159,198,154,.16)', color: 'var(--pitch-700)' }}
            >
              Te mandamos un link a <strong>{email}</strong>. Abrilo desde este mismo dispositivo.
            </p>
          ) : (
            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2"
                style={{ color: 'var(--pitch-900)' }}
              />
              <button
                type="submit"
                disabled={enviando}
                className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
                style={{ background: 'var(--paper)' }}
              >
                {enviando ? 'Enviando...' : 'Confirmar con email'}
              </button>
            </form>
          )
        ) : jugador ? (
          <p className="mt-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
            Tu cuenta ya tiene un perfil propio, así que no podés tomar este.
          </p>
        ) : (
          <button
            onClick={reclamar}
            disabled={reclamando}
            className="tap mt-6 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
            style={{ background: 'var(--paper)' }}
          >
            {reclamando ? 'Confirmando...' : `Sí, soy ${placeholder.nombre}`}
          </button>
        )}
        {error && (
          <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
