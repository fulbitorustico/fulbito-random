import Icono from './Icono'
import type { DistribucionValoracion } from '../lib/types'

function FilaEstrellas({ promedio, size }: { promedio: number; size: number }) {
  return (
    <div className="flex" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, promedio - (n - 1)))
        return (
          <svg key={n} width={size} height={size} viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`estrella-${n}-${size}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--gold-500)" />
                <stop offset={`${fill * 100}%`} stopColor="rgba(242,239,233,.14)" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5 12.5 7 18.5 7.8 14 11.9 15.3 18 10 14.8 4.7 18 6 11.9 1.5 7.8 7.5 7Z"
              fill={`url(#estrella-${n}-${size})`}
            />
          </svg>
        )
      })}
    </div>
  )
}

export default function Estrellas({
  promedio,
  cantidad,
  size = 16,
  variant = 'compacto',
  distribucion,
}: {
  promedio: number | null
  cantidad: number
  size?: number
  variant?: 'compacto' | 'completo'
  distribucion?: DistribucionValoracion[]
}) {
  // Todos arrancan en 3 estrellas: si todavía no lo valoró nadie, se muestran
  // igual, pero aclarando que es el puntaje de arranque y no algo que ganó.
  const puntaje = promedio ?? 3
  const esArranque = cantidad === 0

  if (variant === 'completo') {
    const maxCantidad = Math.max(1, ...(distribucion ?? []).map((d) => d.cantidad))
    return (
      <div className="w-full">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold leading-none" style={{ color: 'var(--pitch-900)' }}>
            {puntaje.toFixed(1)}
          </span>
          <div className="flex flex-col gap-1">
            <FilaEstrellas promedio={puntaje} size={18} />
            <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
              {esArranque
                ? 'Puntaje de arranque'
                : `${cantidad} ${cantidad === 1 ? 'valoración' : 'valoraciones'}`}
            </span>
          </div>
        </div>

        {distribucion && !esArranque && (
          <div className="mt-4 flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const fila = distribucion.find((d) => d.estrellas === n)
              const cant = fila?.cantidad ?? 0
              const pct = (cant / maxCantidad) * 100
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-2.5 text-right text-[11px] font-medium" style={{ color: 'var(--pitch-700)' }}>
                    {n}
                  </span>
                  <Icono name="estrella" size={10} className="text-[color:var(--gold-500)]" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(242,239,233,.09)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'var(--gold-500)' }}
                    />
                  </div>
                  <span className="w-5 text-right text-[11px]" style={{ color: 'var(--pitch-300)' }}>
                    {cant}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <FilaEstrellas promedio={puntaje} size={size} />
      <span className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
        {puntaje.toFixed(1)}
      </span>
      <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
        {esArranque ? 'de arranque' : `(${cantidad})`}
      </span>
    </div>
  )
}
