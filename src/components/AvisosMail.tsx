import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import type { AvisosMail as Avisos } from '../lib/types'
import { MAILS_A_TERCEROS_ANDANDO } from '../lib/correo'

const OPCIONES: { id: keyof Avisos; label: string; detalle: string }[] = [
  { id: 'invitacion', label: 'Me invitaron a un partido', detalle: 'Alguien te busca para completar su cancha.' },
  { id: 'completo', label: 'Mi partido se completó', detalle: 'Cuando se llena un partido que armaste vos.' },
  { id: 'aprobado_grupo', label: 'Me aceptaron en un grupo', detalle: 'Cuando el admin aprueba tu pedido.' },
  {
    id: 'se_suman',
    label: 'Cada vez que alguien se suma',
    detalle: 'Un mail por persona que se anota. Es el que más molesta: viene apagado.',
  },
]

const POR_DEFECTO: Avisos = { se_suman: false, completo: true, invitacion: true, aprobado_grupo: true }

export default function AvisosMail() {
  const { jugador, refreshJugador } = useAuth()
  const [guardando, setGuardando] = useState(false)

  if (!jugador) return null
  const avisos: Avisos = { ...POR_DEFECTO, ...(jugador.avisos_mail ?? {}) }

  async function alternar(id: keyof Avisos) {
    const nuevos = { ...avisos, [id]: !avisos[id] }
    setGuardando(true)
    await supabase.from('jugadores').update({ avisos_mail: nuevos }).eq('id', jugador!.id)
    setGuardando(false)
    await refreshJugador()
  }

  const prendidos = OPCIONES.filter((o) => avisos[o.id]).length

  return (
    <div className="glass-strong rounded-[28px] p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        <Icono name="camara" size={15} /> Avisos por mail
      </h2>
      {/*
        No prometemos lo que no cumplimos. Mientras el remitente sea el
        dominio de pruebas de Resend, los mails no le llegan a nadie: se
        aceptan y se descartan, sin error. Ver lib/correo.ts.
      */}
      {MAILS_A_TERCEROS_ANDANDO ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--pitch-300)' }}>
          {prendidos === 0
            ? 'No te llega ningún mail. Todo lo vas a ver al abrir la app.'
            : `Te llegan ${prendidos} de ${OPCIONES.length} tipos de aviso.`}
        </p>
      ) : (
        <div
          className="mt-3 rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed"
          style={{ background: 'rgba(237,197,141,.14)', color: 'var(--pitch-700)' }}
        >
          <strong style={{ color: 'var(--gold-500)' }}>Los mails todavía no están andando.</strong> Nos falta el
          dominio propio para poder mandarlos. Nada se pierde: todo esto te aparece igual al abrir la app, arriba de
          la lista de partidos. Dejá elegido lo que quieras y te va a llegar cuando se prenda.
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {OPCIONES.map((o) => {
          const activo = avisos[o.id]
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => alternar(o.id)}
              disabled={guardando}
              className="tap flex items-start gap-3 rounded-2xl p-3 text-left disabled:opacity-60"
              style={{ background: 'rgba(242,239,233,.05)' }}
            >
              <span
                className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors"
                style={{ background: activo ? 'var(--acc-green)' : 'rgba(242,239,233,.15)' }}
              >
                <span
                  className="h-4 w-4 rounded-full transition-transform"
                  style={{
                    background: activo ? 'var(--ink-900)' : 'var(--paper)',
                    transform: activo ? 'translateX(16px)' : 'translateX(0)',
                  }}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {o.label}
                </span>
                <span className="block text-[11.5px]" style={{ color: 'var(--pitch-300)' }}>
                  {o.detalle}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
