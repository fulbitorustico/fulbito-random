import { useState, type ReactNode } from 'react'
import Icono from './Icono'

/**
 * Una tarjeta que arranca cerrada cuando el dato ya está cargado, y muestra
 * lo elegido en el encabezado.
 *
 * El perfil tenía los formularios de nombre y posiciones siempre abiertos,
 * ocupando media pantalla para decir algo que ya estaba decidido y que casi
 * nadie vuelve a tocar. Lo que importa —tu card, tu racha, tus objetivos—
 * quedaba abajo de todo.
 */
export default function Plegable({
  titulo,
  resumen,
  abiertoPorDefecto = false,
  children,
}: {
  titulo: string
  resumen?: ReactNode
  abiertoPorDefecto?: boolean
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto)

  return (
    <div className="glass-strong mt-4 rounded-[28px] p-6">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="tap flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            {titulo}
          </span>
          {!abierto && resumen && (
            <span className="mt-1 block text-[15px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {resumen}
            </span>
          )}
        </span>
        <span
          className="shrink-0 transition-transform duration-200"
          style={{ color: 'var(--pitch-300)', transform: abierto ? 'rotate(45deg)' : 'none' }}
        >
          <Icono name="mas" size={16} />
        </span>
      </button>

      {abierto && <div className="anim-rise mt-4">{children}</div>}
    </div>
  )
}
