import type { ReactNode } from 'react'

export default function MockupTelefono({
  children,
  hora = '21:04',
  className = '',
}: {
  children: ReactNode
  hora?: string
  className?: string
}) {
  return (
    <div
      className={`relative mx-auto w-full ${className}`}
      style={{
        maxWidth: 268,
        aspectRatio: '9 / 19',
        borderRadius: 42,
        padding: 9,
        background: 'linear-gradient(160deg, #1c4432, #0b1a12)',
        boxShadow: '0 26px 60px rgba(18,38,28,.3), inset 0 1px 0 rgba(255,255,255,.18)',
      }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          borderRadius: 34,
          background:
            'radial-gradient(420px 220px at 10% -6%, rgba(45,106,79,.18), transparent 60%), radial-gradient(360px 200px at 105% 0%, rgba(185,121,31,.16), transparent 55%), var(--chalk-50)',
        }}
      >
        <div
          className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full"
          style={{ width: 68, height: 17, background: '#0b1a12' }}
        />

        <div
          className="flex shrink-0 items-center justify-between px-5 pt-2.5 text-[10px] font-bold"
          style={{ color: 'var(--pitch-900)' }}
        >
          <span>{hora}</span>
          <span className="flex items-center gap-1">
            <svg width="13" height="9" viewBox="0 0 13 9" fill="currentColor">
              <rect x="0" y="6" width="2.2" height="3" rx="0.6" />
              <rect x="3.4" y="4.2" width="2.2" height="4.8" rx="0.6" />
              <rect x="6.8" y="2.2" width="2.2" height="6.8" rx="0.6" />
              <rect x="10.2" y="0" width="2.2" height="9" rx="0.6" />
            </svg>
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 3.2a7 7 0 0 1 10 0" strokeLinecap="round" />
              <path d="M3.1 5.4a4 4 0 0 1 5.8 0" strokeLinecap="round" />
              <circle cx="6" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
              <rect x="0.5" y="0.5" width="14" height="8" rx="2.2" stroke="currentColor" strokeOpacity="0.45" />
              <rect x="2" y="2" width="10.5" height="5" rx="1.2" fill="currentColor" />
              <path d="M16 3.2v2.6a1.6 1.6 0 0 0 0-2.6Z" fill="currentColor" fillOpacity="0.5" />
            </svg>
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3.5 pt-3">{children}</div>
      </div>
    </div>
  )
}
