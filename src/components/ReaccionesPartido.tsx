import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Pocos y elegidos: si hay treinta emojis nadie usa ninguno.
const EMOJIS = ['⚽', '🔥', '😂', '💪', '🙌', '😱']

/**
 * La barra de reacciones del partido. Reaccionan solo los que estuvieron
 * anotados, y las ve cualquiera.
 *
 * Existe sobre todo por la valoración a ciegas: si las notas no aparecen
 * hasta el día siguiente, el partido recién jugado quedaría mudo. Esto le
 * da algo para hacer a la gente mientras tanto.
 */
export default function ReaccionesPartido({ partidoId, puedoReaccionar }: { partidoId: string; puedoReaccionar: boolean }) {
  const { jugador } = useAuth()
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [mias, setMias] = useState<Set<string>>(new Set())
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('reacciones_partido')
      .select('emoji, jugador_id')
      .eq('partido_id', partidoId)

    const cuenta: Record<string, number> = {}
    const propias = new Set<string>()
    for (const r of (data ?? []) as { emoji: string; jugador_id: string }[]) {
      cuenta[r.emoji] = (cuenta[r.emoji] ?? 0) + 1
      if (r.jugador_id === jugador?.id) propias.add(r.emoji)
    }
    setConteos(cuenta)
    setMias(propias)
  }, [partidoId, jugador?.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function alternar(emoji: string) {
    if (!jugador || !puedoReaccionar || ocupado) return
    setOcupado(true)
    if (mias.has(emoji)) {
      await supabase
        .from('reacciones_partido')
        .delete()
        .eq('partido_id', partidoId)
        .eq('jugador_id', jugador.id)
        .eq('emoji', emoji)
    } else {
      await supabase.from('reacciones_partido').insert({ partido_id: partidoId, jugador_id: jugador.id, emoji })
    }
    await cargar()
    setOcupado(false)
  }

  const total = Object.values(conteos).reduce((t, n) => t + n, 0)
  // Si nadie reaccionó y vos tampoco podés, no hay nada que mostrar.
  if (total === 0 && !puedoReaccionar) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {EMOJIS.map((emoji) => {
        const n = conteos[emoji] ?? 0
        const mia = mias.has(emoji)
        if (n === 0 && !puedoReaccionar) return null
        return (
          <button
            key={emoji}
            onClick={() => alternar(emoji)}
            disabled={!puedoReaccionar || ocupado}
            className="tap flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[15px] transition disabled:opacity-60"
            style={{
              background: mia ? 'rgba(159,198,154,.20)' : 'rgba(242,239,233,.06)',
              border: mia ? '1px solid rgba(159,198,154,.5)' : '1px solid transparent',
            }}
          >
            <span>{emoji}</span>
            {n > 0 && (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--pitch-700)' }}>
                {n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
