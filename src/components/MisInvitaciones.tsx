import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import type { Invitacion, Partido } from '../lib/types'

export default function MisInvitaciones({ alResponder }: { alResponder: () => void }) {
  const { jugador } = useAuth()
  const [invitaciones, setInvitaciones] = useState<(Invitacion & { partido: Partido })[]>([])
  const [respondiendo, setRespondiendo] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!jugador) return
    const { data } = await supabase
      .from('invitaciones')
      .select('*')
      .eq('invitado_id', jugador.id)
      .eq('estado', 'pendiente')
    if (!data?.length) {
      setInvitaciones([])
      return
    }

    const { data: partidos } = await supabase
      .from('partidos')
      .select('*')
      .in('id', data.map((i) => i.partido_id))
      .neq('estado', 'cancelado')
      .gt('fecha_hora', new Date().toISOString())

    const mapa = new Map((partidos ?? []).map((p) => [p.id, p]))
    setInvitaciones(
      data
        .map((i) => ({ ...i, partido: mapa.get(i.partido_id) }))
        .filter((i): i is Invitacion & { partido: Partido } => !!i.partido),
    )
  }, [jugador])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function responder(inv: Invitacion & { partido: Partido }, acepta: boolean) {
    if (!jugador) return
    setRespondiendo(inv.id)

    if (acepta) {
      // Entre que te invitaron y que aceptás, el partido se pudo llenar.
      const { count } = await supabase
        .from('participantes')
        .select('*', { count: 'exact', head: true })
        .eq('partido_id', inv.partido_id)

      if ((count ?? 0) >= inv.partido.cupo_total) {
        alert('Justo se llenó ese partido. Le avisamos al que te invitó.')
        await supabase.from('invitaciones').update({ estado: 'rechazada' }).eq('id', inv.id)
        setRespondiendo(null)
        await cargar()
        return
      }

      await supabase.from('participantes').insert({ partido_id: inv.partido_id, jugador_id: jugador.id })
    }
    await supabase
      .from('invitaciones')
      .update({ estado: acepta ? 'aceptada' : 'rechazada' })
      .eq('id', inv.id)

    setRespondiendo(null)
    await cargar()
    alResponder()
  }

  if (invitaciones.length === 0) return null

  return (
    <div className="mb-5">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--acc-blue)' }}>
        <Icono name="personas" size={16} />
        Te invitaron a jugar
      </h2>

      <div className="flex flex-col gap-2">
        {invitaciones.map((inv) => (
          <div
            key={inv.id}
            className="glass-strong anim-rise rounded-2xl p-4"
            style={{ border: '1px solid rgba(157,204,218,.3)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {inv.partido.cancha}
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
              {new Date(inv.partido.fecha_hora).toLocaleString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => responder(inv, true)}
                disabled={respondiendo === inv.id}
                className="tap flex-[2] rounded-2xl px-4 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] disabled:opacity-50"
                style={{ background: 'var(--paper)' }}
              >
                {respondiendo === inv.id ? 'Un momento...' : 'Sumarme'}
              </button>
              <button
                onClick={() => responder(inv, false)}
                disabled={respondiendo === inv.id}
                className="tap flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }}
              >
                Ahora no
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
