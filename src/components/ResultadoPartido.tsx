import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'
import Icono from './Icono'
import { mensajeDeError } from '../lib/errores'
import type { Jugador, Partido } from '../lib/types'

/**
 * El resultado del partido, cargado por el capitán.
 *
 * El orden de importancia está puesto a propósito: **primero el resultado**,
 * después quién hizo los goles. Los goles son opcionales y no tocan nada del
 * armado de equipos — lo que ordena sigue siendo la valoración de los
 * compañeros. Están para que el que hizo tres pueda verlo en su perfil, no
 * para armar una tabla de goleadores.
 */
export default function ResultadoPartido({
  partido,
  anotados,
  equipos,
  puedeCargar,
  alGuardar,
}: {
  partido: Partido
  anotados: Jugador[]
  equipos: Record<string, 'A' | 'B'>
  puedeCargar: boolean
  alGuardar: () => Promise<void>
}) {
  const [editando, setEditando] = useState(false)
  const [golesA, setGolesA] = useState('')
  const [golesB, setGolesB] = useState('')
  const [porJugador, setPorJugador] = useState<Record<string, number>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarGoles = useCallback(async () => {
    const { data } = await supabase.from('goles').select('jugador_id, cantidad').eq('partido_id', partido.id)
    const mapa: Record<string, number> = {}
    for (const g of (data ?? []) as { jugador_id: string; cantidad: number }[]) mapa[g.jugador_id] = g.cantidad
    setPorJugador(mapa)
  }, [partido.id])

  useEffect(() => {
    cargarGoles()
    setGolesA(partido.goles_a?.toString() ?? '')
    setGolesB(partido.goles_b?.toString() ?? '')
  }, [cargarGoles, partido.goles_a, partido.goles_b])

  async function guardar() {
    setGuardando(true)
    setError(null)

    const { error: errorPartido } = await supabase
      .from('partidos')
      .update({
        goles_a: golesA === '' ? null : Number(golesA),
        goles_b: golesB === '' ? null : Number(golesB),
      })
      .eq('id', partido.id)

    if (errorPartido) {
      setGuardando(false)
      setError(mensajeDeError(errorPartido))
      return
    }

    // Los goles se reescriben enteros: es más simple de entender que ir
    // sumando diferencias, y son cuatro filas.
    await supabase.from('goles').delete().eq('partido_id', partido.id)
    const filas = Object.entries(porJugador)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([jugador_id, cantidad]) => ({ partido_id: partido.id, jugador_id, cantidad }))
    if (filas.length > 0) {
      const { error: errorGoles } = await supabase.from('goles').insert(filas)
      if (errorGoles) {
        setGuardando(false)
        setError(mensajeDeError(errorGoles))
        return
      }
    }

    setGuardando(false)
    setEditando(false)
    await alGuardar()
    await cargarGoles()
  }

  function cambiar(jugadorId: string, delta: number) {
    setPorJugador((previo) => {
      const nuevo = Math.max(0, (previo[jugadorId] ?? 0) + delta)
      return { ...previo, [jugadorId]: nuevo }
    })
  }

  const hayResultado = partido.goles_a != null && partido.goles_b != null
  const goleadores = anotados
    .filter((a) => (porJugador[a.id] ?? 0) > 0)
    .sort((a, b) => (porJugador[b.id] ?? 0) - (porJugador[a.id] ?? 0))

  if (!hayResultado && !puedeCargar) return null

  if (!editando) {
    return (
      <div className="glass-strong anim-rise mt-3 rounded-[24px] p-5">
        {hayResultado ? (
          <>
            <div className="flex items-center justify-center gap-5">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pitch-300)' }}>
                  Equipo A
                </p>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--pitch-900)' }}>
                  {partido.goles_a}
                </p>
              </div>
              <span className="text-xl" style={{ color: 'var(--pitch-300)' }}>
                ·
              </span>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pitch-300)' }}>
                  Equipo B
                </p>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--pitch-900)' }}>
                  {partido.goles_b}
                </p>
              </div>
            </div>

            {goleadores.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {goleadores.map((g) => (
                  <span
                    key={g.id}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-900)' }}
                  >
                    <Icono name="pelota" size={12} />
                    {g.apodo || g.nombre}
                    {porJugador[g.id] > 1 && (
                      <span style={{ color: 'var(--gold-500)' }}>×{porJugador[g.id]}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
            Todavía no cargaron el resultado.
          </p>
        )}

        {puedeCargar && (
          <button
            onClick={() => setEditando(true)}
            className="tap btn-2 mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            {hayResultado ? 'Corregir el resultado' : 'Cargar el resultado'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="glass-strong anim-rise mt-3 rounded-[24px] p-5">
      <p className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        ¿Cómo salió?
      </p>

      <div className="mt-3 flex items-center justify-center gap-4">
        {(
          [
            ['Equipo A', golesA, setGolesA],
            ['Equipo B', golesB, setGolesB],
          ] as const
        ).map(([label, valor, set]) => (
          <div key={label} className="text-center">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pitch-300)' }}>
              {label}
            </p>
            <input
              type="number"
              min={0}
              max={99}
              inputMode="numeric"
              value={valor}
              onChange={(e) => set(e.target.value)}
              className="w-20 rounded-2xl border-0 bg-white/5 px-3 py-3 text-center text-2xl font-bold outline-none ring-1 ring-white/10 focus:ring-2"
              style={{ color: 'var(--pitch-900)' }}
            />
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        ¿Quién hizo los goles?
      </p>
      <p className="mt-0.5 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
        Opcional. No afecta el armado de equipos ni las valoraciones.
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {anotados.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5">
            <Avatar nombre={a.nombre} avatar={a.avatar} fotoUrl={a.foto_url} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--pitch-900)' }}>
              {a.nombre}
              {equipos[a.id] && (
                <span className="ml-1.5 text-[11px]" style={{ color: 'var(--pitch-300)' }}>
                  {equipos[a.id]}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiar(a.id, -1)}
                aria-label={`Un gol menos para ${a.nombre}`}
                className="tap flex h-7 w-7 items-center justify-center rounded-full text-lg"
                style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-700)' }}
              >
                −
              </button>
              <span
                className="w-4 text-center text-sm font-bold"
                style={{ color: (porJugador[a.id] ?? 0) > 0 ? 'var(--gold-500)' : 'var(--pitch-300)' }}
              >
                {porJugador[a.id] ?? 0}
              </span>
              <button
                onClick={() => cambiar(a.id, 1)}
                aria-label={`Un gol más para ${a.nombre}`}
                className="tap flex h-7 w-7 items-center justify-center rounded-full text-lg"
                style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-700)' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p
          className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
          style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setEditando(false)
            setError(null)
            cargarGoles()
          }}
          className="tap btn-2 flex-1 rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="tap flex-[2] rounded-2xl px-4 py-3 text-[15px] font-semibold disabled:opacity-50"
          style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
