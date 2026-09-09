import Icono from './Icono'
import { calcularProgreso, type DatosObjetivos } from '../lib/objetivos'

export default function Objetivos({ datos }: { datos: DatosObjetivos }) {
  const progreso = calcularProgreso(datos)
  const cumplidos = progreso.filter((p) => p.cumplido).length

  // Primero lo que está por caer, después lo ya logrado.
  const ordenados = [...progreso].sort((a, b) => {
    if (a.cumplido !== b.cumplido) return a.cumplido ? 1 : -1
    return b.porcentaje - a.porcentaje
  })

  return (
    <div className="glass-strong rounded-[28px] p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
          Objetivos
        </h2>
        <span className="text-xs font-bold" style={{ color: 'var(--gold-500)' }}>
          {cumplidos} de {progreso.length}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {ordenados.map(({ objetivo, valor, cumplido, porcentaje }) => (
          <div key={objetivo.id} className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: cumplido ? objetivo.color : 'rgba(242,239,233,.06)',
                color: cumplido ? 'var(--ink-900)' : 'var(--pitch-300)',
              }}
            >
              <Icono name={objetivo.icono} size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className="truncate text-[13.5px] font-semibold"
                  style={{ color: cumplido ? 'var(--pitch-900)' : 'var(--pitch-700)' }}
                >
                  {objetivo.titulo}
                </p>
                <span className="shrink-0 text-[11px]" style={{ color: 'var(--pitch-300)' }}>
                  {cumplido ? 'Logrado' : `${valor}/${objetivo.meta}`}
                </span>
              </div>

              <p className="truncate text-[11.5px]" style={{ color: 'var(--pitch-300)' }}>
                {objetivo.detalle}
              </p>

              {!cumplido && (
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(242,239,233,.08)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${porcentaje}%`, background: objetivo.color }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
