import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import { ASPECTOS_CANCHA } from '../lib/cancha'

export default function ValorarCancha({
  canchaId,
  partidoId,
  nombreCancha,
}: {
  canchaId: string
  partidoId: string
  nombreCancha: string
}) {
  const { jugador } = useAuth()
  const [puntajes, setPuntajes] = useState<Record<string, number>>({})
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [yaValore, setYaValore] = useState<boolean | null>(null)

  useEffect(() => {
    async function revisar() {
      if (!jugador) return
      const { data } = await supabase
        .from('valoraciones_cancha')
        .select('id')
        .eq('partido_id', partidoId)
        .eq('jugador_id', jugador.id)
        .maybeSingle()
      setYaValore(!!data)
    }
    revisar()
  }, [jugador, partidoId])

  async function enviar() {
    if (!jugador) return
    setEnviando(true)
    const { error } = await supabase.from('valoraciones_cancha').insert({
      cancha_id: canchaId,
      partido_id: partidoId,
      jugador_id: jugador.id,
      cesped: puntajes.cesped ?? null,
      iluminacion: puntajes.iluminacion ?? null,
      vestuarios: puntajes.vestuarios ?? null,
      estacionamiento: puntajes.estacionamiento ?? null,
      personal: puntajes.personal ?? null,
      comentario: comentario.trim() || null,
    })
    setEnviando(false)
    if (!error) setYaValore(true)
  }

  if (yaValore === null) return null

  if (yaValore) {
    return (
      <div className="glass mt-4 flex items-center gap-2 rounded-2xl p-5 text-sm" style={{ color: 'var(--acc-green)' }}>
        <Icono name="cumplidor" size={17} /> Ya valoraste la cancha
      </div>
    )
  }

  const algunoElegido = Object.keys(puntajes).length > 0

  return (
    <div className="glass-strong mt-4 rounded-[24px] p-5">
      <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        ¿Cómo estuvo {nombreCancha}?
      </h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--pitch-300)' }}>
        Lo que pongas arma el perfil de la cancha. Podés puntuar solo lo que te acuerdes.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {ASPECTOS_CANCHA.map((a) => (
          <div key={a.id}>
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--pitch-700)' }}>
              <Icono name={a.icono} size={13} /> {a.label}
            </p>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} para ${a.label}`}
                  onClick={() => setPuntajes((p) => ({ ...p, [a.id]: n }))}
                  className="tap"
                >
                  <svg width="24" height="24" viewBox="0 0 20 20">
                    <path
                      d="M10 1.5 12.5 7 18.5 7.8 14 11.9 15.3 18 10 14.8 4.7 18 6 11.9 1.5 7.8 7.5 7Z"
                      fill={(puntajes[a.id] ?? 0) >= n ? 'var(--gold-500)' : 'rgba(242,239,233,.14)'}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Algo para agregar sobre la cancha (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={2}
        className="mt-4 w-full resize-none rounded-2xl border-0 bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-2"
        style={{ color: 'var(--pitch-900)' }}
      />

      <button
        type="button"
        onClick={enviar}
        disabled={!algunoElegido || enviando}
        className="tap mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] disabled:opacity-40"
        style={{ background: 'var(--paper)' }}
      >
        {enviando ? 'Enviando...' : algunoElegido ? 'Puntuar la cancha' : 'Puntuá al menos una cosa'}
      </button>
    </div>
  )
}
