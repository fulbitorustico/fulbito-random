import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import { calcularProgreso, type DatosObjetivos, type ProgresoObjetivo } from '../lib/objetivos'

// Muestra el cartel una sola vez por logro: lo que se guarda es cuáles ya
// mostramos, no el progreso (ese se calcula solo).
export default function CartelLogro({ datos }: { datos: DatosObjetivos }) {
  const { jugador } = useAuth()
  const [nuevo, setNuevo] = useState<ProgresoObjetivo | null>(null)

  // Ojo: `datos` es un objeto nuevo en cada render, así que el efecto tiene que
  // depender de sus valores y no del objeto, o queda girando para siempre.
  const { partidos_jugados, valoraciones_recibidas, insignias_recibidas, partidos_sin_bajas } = datos

  useEffect(() => {
    async function revisar() {
      if (!jugador) return
      const cumplidos = calcularProgreso({
        partidos_jugados,
        valoraciones_recibidas,
        insignias_recibidas,
        partidos_sin_bajas,
      }).filter((p) => p.cumplido)
      if (cumplidos.length === 0) return

      const { data: vistos, error } = await supabase
        .from('logros_vistos')
        .select('objetivo')
        .eq('jugador_id', jugador.id)
      if (error) return

      const yaVistos = new Set((vistos ?? []).map((v) => v.objetivo))
      const pendiente = cumplidos.find((c) => !yaVistos.has(c.objetivo.id))
      if (pendiente) setNuevo(pendiente)
    }
    revisar()
  }, [jugador, partidos_jugados, valoraciones_recibidas, insignias_recibidas, partidos_sin_bajas])

  async function cerrar() {
    if (!jugador || !nuevo) return
    await supabase
      .from('logros_vistos')
      .insert({ jugador_id: jugador.id, objetivo: nuevo.objetivo.id })
    setNuevo(null)
  }

  if (!nuevo) return null
  const { objetivo } = nuevo

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,.72)' }}
      onClick={cerrar}
    >
      <div
        className="glass-strong anim-pop w-full max-w-xs rounded-[28px] p-7 text-center"
        style={{ border: `1.5px solid ${objetivo.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: objetivo.color }}>
          Logro nuevo
        </p>

        <div
          className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: objetivo.color, color: 'var(--ink-900)' }}
        >
          <Icono name={objetivo.icono} size={38} />
        </div>

        <p className="mt-5 text-xl font-extrabold" style={{ color: 'var(--pitch-900)' }}>
          {objetivo.titulo}
        </p>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--pitch-300)' }}>
          {objetivo.detalle}
        </p>

        <button
          onClick={cerrar}
          className="tap mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
          style={{ background: 'var(--paper)' }}
        >
          Dale
        </button>
      </div>
    </div>
  )
}
