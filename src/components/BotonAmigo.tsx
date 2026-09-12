import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import { mensajeDeError } from '../lib/errores'

type EstadoAmistad = 'ninguna' | 'esperando' | 'te_pidieron' | 'amigos'

/**
 * Agregar como amigo al que jugó con vos o al que conociste en la cancha.
 *
 * No se puede agregar a cualquiera: la base exige que hayan compartido un
 * partido, o que la otra persona esté publicada como disponible. Es la misma
 * regla que rige para invitar, y evita que agregar desconocidos en masa
 * salga gratis.
 */
export default function BotonAmigo({ jugadorId, nombre }: { jugadorId: string; nombre: string }) {
  const { jugador } = useAuth()
  const [estado, setEstado] = useState<EstadoAmistad | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc('estado_amistad', { p_otro: jugadorId })
    setEstado((data as EstadoAmistad) ?? 'ninguna')
  }, [jugadorId])

  useEffect(() => {
    if (jugador && jugador.id !== jugadorId) cargar()
  }, [cargar, jugador, jugadorId])

  // En tu propio perfil no hay nada que agregar.
  if (!jugador || jugador.id === jugadorId || estado === null) return null

  async function pedir() {
    if (!jugador) return
    setOcupado(true)
    setError(null)
    const { error } = await supabase
      .from('amistades')
      .insert({ solicitante_id: jugador.id, destinatario_id: jugadorId })
    setOcupado(false)
    if (error) {
      setError(
        mensajeDeError(error) ??
          `Todavía no podés agregar a ${nombre}: primero tienen que jugar un partido juntos.`,
      )
      return
    }
    await cargar()
  }

  async function responder(acepta: boolean) {
    setOcupado(true)
    setError(null)
    const { error } = await supabase
      .from('amistades')
      .update({ estado: acepta ? 'aceptada' : 'rechazada', respondida_at: new Date().toISOString() })
      .eq('destinatario_id', jugador!.id)
      .eq('solicitante_id', jugadorId)
    setOcupado(false)
    if (error) {
      setError(mensajeDeError(error))
      return
    }
    await cargar()
  }

  async function deshacer() {
    if (!jugador) return
    setOcupado(true)
    setError(null)
    await supabase
      .from('amistades')
      .delete()
      .or(
        `and(solicitante_id.eq.${jugador.id},destinatario_id.eq.${jugadorId}),` +
          `and(solicitante_id.eq.${jugadorId},destinatario_id.eq.${jugador.id})`,
      )
    setOcupado(false)
    await cargar()
  }

  const claseBase = 'tap w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50'

  return (
    <div className="mt-4">
      {estado === 'ninguna' && (
        <button
          onClick={pedir}
          disabled={ocupado}
          className={`${claseBase} btn-2`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Icono name="personas" size={15} /> Agregar a {nombre}
          </span>
        </button>
      )}

      {estado === 'esperando' && (
        <button onClick={deshacer} disabled={ocupado} className={`${claseBase} btn-2`}>
          Solicitud enviada · tocá para cancelar
        </button>
      )}

      {estado === 'te_pidieron' && (
        <div className="glass-strong anim-rise rounded-2xl p-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
            {nombre} te quiere agregar
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => responder(true)}
              disabled={ocupado}
              className="tap flex-[2] rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
            >
              Aceptar
            </button>
            <button
              onClick={() => responder(false)}
              disabled={ocupado}
              className={`${claseBase} btn-2 flex-1`}
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {estado === 'amigos' && (
        <button
          onClick={deshacer}
          disabled={ocupado}
          className={claseBase}
          style={{ background: 'rgba(159,198,154,.16)', color: 'var(--acc-green)' }}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Icono name="check" size={15} /> Son amigos
          </span>
        </button>
      )}

      {error && (
        <p
          className="mt-2 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
          style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
