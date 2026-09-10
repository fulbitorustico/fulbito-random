import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'

// Botón flotante, siempre a mano, por fuera del menú de abajo. La idea es
// que reportar algo cueste menos que aguantárselo: si hay que buscar dónde
// escribir, no escribe nadie.
export default function Sugerencias() {
  const { jugador } = useAuth()
  const location = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!jugador) return null

  async function enviar() {
    if (!jugador || texto.trim().length < 3) return
    setEnviando(true)
    setError(null)
    const { error } = await supabase.from('sugerencias').insert({
      jugador_id: jugador.id,
      texto: texto.trim(),
      // Guardamos desde qué pantalla lo mandó: casi siempre el problema
      // está ahí, y ahorra la mitad de las repreguntas.
      pantalla: location.pathname,
    })
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    setTexto('')
    setEnviado(true)
  }

  function cerrar() {
    setAbierto(false)
    setEnviado(false)
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Mandar una sugerencia"
        className="tap glass-strong fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)', color: 'var(--pitch-700)' }}
      >
        <Icono name="chat" size={18} />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={cerrar}
        >
          <div
            className="glass-strong anim-rise w-full max-w-lg rounded-[28px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {enviado ? (
              <>
                <p className="text-lg font-bold" style={{ color: 'var(--pitch-900)' }}>
                  Gracias, llegó.
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
                  Lo leemos todo. Si es algo que se puede arreglar, se arregla.
                </p>
                <button
                  onClick={cerrar}
                  className="tap mt-5 w-full rounded-2xl px-4 py-3 text-[15px] font-semibold"
                  style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                >
                  Listo
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-bold" style={{ color: 'var(--pitch-900)' }}>
                  ¿Qué mejorarías?
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
                  Algo que no funciona, algo que falta, algo que te resulta incómodo. Cuanto más concreto, mejor.
                </p>
                <textarea
                  autoFocus
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Escribí acá..."
                  className="mt-3 w-full resize-none rounded-2xl border-0 bg-white/5 px-4 py-3 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2"
                  style={{ color: 'var(--pitch-900)' }}
                />
                {error && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>
                    {error}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={cerrar}
                    className="tap btn-2 flex-1 rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={enviar}
                    disabled={enviando || texto.trim().length < 3}
                    className="tap flex-[2] rounded-2xl px-4 py-3 text-[15px] font-semibold disabled:opacity-40"
                    style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                  >
                    {enviando ? 'Mandando...' : 'Mandar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
