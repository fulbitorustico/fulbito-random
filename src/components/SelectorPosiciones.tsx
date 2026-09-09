import { POSICIONES, MAX_POSICIONES } from '../lib/posiciones'

export default function SelectorPosiciones({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  // Todas las opciones quedan siempre elegibles: si ya tenés dos y tocás una
  // tercera, entra esa y sale la más vieja. Nunca hay botones apagados.
  function elegir(p: string) {
    if (value.includes(p)) {
      onChange(value.filter((x) => x !== p))
      return
    }
    if (value.length < MAX_POSICIONES) {
      onChange([...value, p])
      return
    }
    onChange([...value.slice(1), p])
  }

  return (
    <div>
      <p className="mb-2 text-sm" style={{ color: 'var(--pitch-700)' }}>
        Elegí hasta {MAX_POSICIONES}
      </p>
      <div className="flex flex-wrap gap-2">
        {POSICIONES.map((p) => {
          const activa = value.includes(p)
          return (
            <button
              key={p}
              type="button"
              onClick={() => elegir(p)}
              className="tap rounded-full px-3.5 py-2 text-[13px] font-medium"
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
