export default function Estrellas({
  promedio,
  cantidad,
  size = 16,
}: {
  promedio: number | null
  cantidad: number
  size?: number
}) {
  if (promedio == null || cantidad === 0) {
    return (
      <span className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Todavía sin valoraciones
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" style={{ gap: 1 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.max(0, Math.min(1, promedio - (n - 1)))
          return (
            <svg key={n} width={size} height={size} viewBox="0 0 20 20">
              <defs>
                <linearGradient id={`estrella-${n}-${size}`}>
                  <stop offset={`${fill * 100}%`} stopColor="var(--gold-500)" />
                  <stop offset={`${fill * 100}%`} stopColor="rgba(18,38,28,.12)" />
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
      <span className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
        {promedio.toFixed(1)}
      </span>
      <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
        ({cantidad})
      </span>
    </div>
  )
}
