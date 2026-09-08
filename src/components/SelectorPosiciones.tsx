import { POSICIONES, MAX_POSICIONES } from '../lib/posiciones'

export default function SelectorPosiciones({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(p: string) {
    if (value.includes(p)) {
      onChange(value.filter((x) => x !== p))
    } else if (value.length < MAX_POSICIONES) {
      onChange([...value, p])
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm" style={{ color: 'var(--pitch-700)' }}>
        Posición (hasta {MAX_POSICIONES})
      </p>
      <div className="flex flex-wrap gap-2">
        {POSICIONES.map((p) => {
          const activa = value.includes(p)
          const deshabilitada = !activa && value.length >= MAX_POSICIONES
          return (
            <button
              key={p}
              type="button"
              disabled={deshabilitada}
              onClick={() => toggle(p)}
              className="tap rounded-full px-3.5 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                background: activa ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                color: activa ? 'var(--ink-900)' : 'var(--pitch-700)',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}
