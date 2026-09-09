import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Punto {
  mes: string
  promedio: number
  cantidad: number
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Un mes con una o dos valoraciones no dice nada: se dibuja apagado para que
// no parezca un bajón cuando en realidad es poca información.
const MINIMO_PARA_CONTAR = 3

/**
 * Cómo viene el jugador mes a mes. No es el promedio acumulado —ese casi no
 * se mueve y por eso no da motivo para volver a mirar— sino el de cada mes
 * por separado, que es la forma reciente.
 */
export default function Evolucion({ jugadorId }: { jugadorId: string }) {
  const [puntos, setPuntos] = useState<Punto[]>([])
  const idGradiente = useId()

  useEffect(() => {
    supabase
      .rpc('evolucion_jugador', { p_jugador_id: jugadorId })
      .then(({ data }) => setPuntos((data ?? []) as Punto[]))
  }, [jugadorId])

  // Con un solo mes no hay evolución que mostrar, hay un dato suelto.
  if (puntos.length < 2) return null

  const ancho = 300
  const alto = 90
  const margen = 8
  const x = (i: number) => margen + (i * (ancho - margen * 2)) / Math.max(1, puntos.length - 1)
  // La escala va de 1 a 5 fija: si se ajustara a los datos, una diferencia de
  // dos décimas parecería un derrumbe.
  const y = (v: number) => alto - margen - ((v - 1) / 4) * (alto - margen * 2)

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.promedio)}`).join(' ')
  const area = `${linea} L ${x(puntos.length - 1)} ${alto} L ${x(0)} ${alto} Z`

  const primero = puntos[0].promedio
  const ultimo = puntos[puntos.length - 1].promedio
  const cambio = ultimo - primero

  return (
    <div className="glass-strong mt-4 rounded-[24px] p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
          Cómo venís
        </h2>
        <span
          className="text-[12px] font-semibold"
          style={{ color: cambio >= 0 ? 'var(--acc-green)' : 'var(--pitch-300)' }}
        >
          {cambio > 0 ? '+' : ''}
          {cambio.toFixed(2)} desde {MESES[Number(puntos[0].mes.slice(5, 7)) - 1]}
        </span>
      </div>

      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full" style={{ height: 90 }}>
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc-green)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--acc-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* La línea del 3, que es donde arranca todo el mundo. */}
        <line
          x1={margen}
          y1={y(3)}
          x2={ancho - margen}
          y2={y(3)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.18"
        />

        <path d={area} fill={`url(#${idGradiente})`} />
        <path d={linea} fill="none" stroke="var(--acc-green)" strokeWidth="2" strokeLinejoin="round" />

        {puntos.map((p, i) => (
          <circle
            key={p.mes}
            cx={x(i)}
            cy={y(p.promedio)}
            r={p.cantidad >= MINIMO_PARA_CONTAR ? 3.5 : 2.5}
            fill={p.cantidad >= MINIMO_PARA_CONTAR ? 'var(--acc-green)' : 'var(--pitch-300)'}
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between">
        {puntos.map((p) => (
          <span key={p.mes} className="text-[10px]" style={{ color: 'var(--pitch-300)' }}>
            {MESES[Number(p.mes.slice(5, 7)) - 1]}
          </span>
        ))}
      </div>

      {puntos.some((p) => p.cantidad < MINIMO_PARA_CONTAR) && (
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
          Los puntos apagados son meses con menos de {MINIMO_PARA_CONTAR} valoraciones: hay poco de dónde sacar
          conclusiones.
        </p>
      )}
    </div>
  )
}
