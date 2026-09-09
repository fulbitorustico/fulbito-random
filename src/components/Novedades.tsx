import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icono, { type NombreIcono } from './Icono'

interface Novedad {
  tipo: string
  titulo: string
  detalle: string
  destino: string
  cuando: string
  prioridad: number
}

const ESTILO: Record<string, { color: string; fondo: string; icono: NombreIcono }> = {
  confirmar: { color: 'var(--gold-500)', fondo: 'rgba(237,197,141,.16)', icono: 'check' },
  invitacion: { color: 'var(--acc-blue)', fondo: 'rgba(157,204,218,.16)', icono: 'personas' },
  valorar: { color: 'var(--gold-500)', fondo: 'rgba(237,197,141,.16)', icono: 'estrella' },
  notas: { color: 'var(--acc-green)', fondo: 'rgba(159,198,154,.16)', icono: 'estrella' },
  resultado: { color: 'var(--acc-green)', fondo: 'rgba(159,198,154,.16)', icono: 'pelota' },
  se_sumo: { color: 'var(--acc-blue)', fondo: 'rgba(157,204,218,.16)', icono: 'personas' },
}

// Lo que te vence no se puede tapar: si te dejo esconder "confirmá que venís",
// el cartel deja de servir justo cuando más importa.
const NO_SE_TAPAN = ['confirmar', 'valorar']

const CLAVE_TAPADAS = 'fr_novedades_tapadas'
const DURACION_TAPADA = 48 * 3_600_000

function leerTapadas(): Record<string, number> {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_TAPADAS) ?? '{}') as Record<string, number>
    const vivas: Record<string, number> = {}
    for (const [clave, cuando] of Object.entries(guardado)) {
      if (Date.now() - cuando < DURACION_TAPADA) vivas[clave] = cuando
    }
    return vivas
  } catch {
    return {}
  }
}

/**
 * Qué pasó desde la última vez que entraste.
 *
 * Va como tarjetas que se pasan de costado y no como lista, por dos motivos:
 * ocupa el alto de una sola tarjeta arriba de todo, y se lee de a una.
 * Ordenadas por urgencia, no por fecha.
 */
export default function Novedades() {
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [tapadas, setTapadas] = useState<Record<string, number>>(leerTapadas)

  useEffect(() => {
    supabase.rpc('novedades').then(({ data }) => setNovedades((data ?? []) as Novedad[]))
  }, [])

  const tapar = useCallback((clave: string) => {
    setTapadas((previas) => {
      const nuevas = { ...previas, [clave]: Date.now() }
      try {
        localStorage.setItem(CLAVE_TAPADAS, JSON.stringify(nuevas))
      } catch {
        // Almacenamiento bloqueado: se tapa solo por esta vez.
      }
      return nuevas
    })
  }, [])

  const claveDe = (n: Novedad) => `${n.tipo}:${n.destino}`
  const visibles = novedades.filter((n) => !tapadas[claveDe(n)])
  if (visibles.length === 0) return null

  return (
    <div className="mb-5 -mx-4">
      <div
        className="flex gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {visibles.map((n) => {
          const estilo = ESTILO[n.tipo] ?? ESTILO.se_sumo
          const sePuedeTapar = !NO_SE_TAPAN.includes(n.tipo)
          return (
            <div
              key={claveDe(n)}
              className="glass-strong anim-rise relative shrink-0 rounded-[20px] p-4"
              style={{
                scrollSnapAlign: 'start',
                width: visibles.length === 1 ? '100%' : 'min(82%, 300px)',
                border: `1px solid ${estilo.fondo}`,
              }}
            >
              <Link to={n.destino} className="block pr-5">
                <span
                  className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: estilo.fondo, color: estilo.color }}
                >
                  <Icono name={estilo.icono} size={15} />
                </span>
                <p className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--pitch-900)' }}>
                  {n.titulo}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
                  {n.detalle}
                </p>
              </Link>

              {sePuedeTapar && (
                <button
                  onClick={() => tapar(claveDe(n))}
                  aria-label="Ocultar"
                  className="tap absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ color: 'var(--pitch-300)' }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
