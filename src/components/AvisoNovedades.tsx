import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'

interface SugerenciaHecha {
  id: string
  texto: string
}

interface Novedad {
  id: string
  titulo: string
  texto: string
}

interface Avisos {
  sugerencias: SugerenciaHecha[]
  novedad: Novedad | null
}

const CLAVE_VISTOS = 'fr_avisos_vistos'

/**
 * El cartel que aparece al entrar cuando hay algo para contar.
 *
 * Dos casos, y la diferencia importa:
 *
 *   · **"Arreglamos lo que pediste"** le llega solo a quien escribió esa
 *     sugerencia. Es lo único que le devuelve algo a alguien que se tomó el
 *     trabajo de reportar un problema, y es lo que hace que vuelva a
 *     reportar.
 *
 *   · **La novedad de la app** la ve todo el mundo. Existe para cuando se
 *     hacen cinco cosas juntas y no da mandar cinco carteles.
 *
 * Los dos viven 48 horas y se muestran una sola vez por persona: lo que se
 * guarda es qué ids ya vio, no si lo cerró.
 */
export default function AvisoNovedades() {
  const { jugador } = useAuth()
  const [avisos, setAvisos] = useState<Avisos | null>(null)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!jugador) return

    supabase.rpc('avisos_pendientes').then(({ data }) => {
      const recibidos = (data ?? { sugerencias: [], novedad: null }) as Avisos

      let vistos: string[] = []
      try {
        vistos = JSON.parse(localStorage.getItem(CLAVE_VISTOS) ?? '[]') as string[]
      } catch {
        // Almacenamiento bloqueado: se muestra igual, es preferible a no avisar.
      }

      const sugerencias = (recibidos.sugerencias ?? []).filter((s) => !vistos.includes(s.id))
      const novedad = recibidos.novedad && !vistos.includes(recibidos.novedad.id) ? recibidos.novedad : null

      if (sugerencias.length === 0 && !novedad) return
      setAvisos({ sugerencias, novedad })
      setAbierto(true)
    })
  }, [jugador])

  function cerrar() {
    if (avisos) {
      const ids = [...avisos.sugerencias.map((s) => s.id), ...(avisos.novedad ? [avisos.novedad.id] : [])]
      try {
        const previos = JSON.parse(localStorage.getItem(CLAVE_VISTOS) ?? '[]') as string[]
        // Se recorta para que la lista no crezca para siempre.
        localStorage.setItem(CLAVE_VISTOS, JSON.stringify([...previos, ...ids].slice(-80)))
      } catch {
        // ídem
      }
    }
    setAbierto(false)
  }

  if (!abierto || !avisos) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
      style={{ background: 'rgba(0,0,0,.55)' }}
      onClick={cerrar}
    >
      <div className="glass-strong anim-rise w-full max-w-lg rounded-[28px] p-6" onClick={(e) => e.stopPropagation()}>
        {avisos.sugerencias.length > 0 && (
          <>
            <span
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'rgba(159,198,154,.18)', color: 'var(--acc-green)' }}
            >
              <Icono name="check" size={18} />
            </span>
            <p className="text-lg font-bold" style={{ color: 'var(--pitch-900)' }}>
              {avisos.sugerencias.length === 1 ? 'Arreglamos lo que pediste' : 'Arreglamos lo que pediste'}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
              {avisos.sugerencias.length === 1
                ? 'Nos escribiste esto y ya está hecho:'
                : `Nos escribiste estas ${avisos.sugerencias.length} cosas y ya están hechas:`}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {avisos.sugerencias.map((s) => (
                <p
                  key={s.id}
                  className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
                  style={{ background: 'rgba(159,198,154,.12)', color: 'var(--pitch-700)' }}
                >
                  “{s.texto}”
                </p>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
              Gracias por avisar. Si ves otra cosa, el botón del chat sigue ahí abajo.
            </p>
          </>
        )}

        {avisos.novedad && (
          <div className={avisos.sugerencias.length > 0 ? 'mt-5 border-t pt-5' : ''} style={{ borderColor: 'var(--line)' }}>
            <span
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'rgba(237,197,141,.18)', color: 'var(--gold-500)' }}
            >
              <Icono name="rayo" size={18} />
            </span>
            <p className="text-lg font-bold" style={{ color: 'var(--pitch-900)' }}>
              {avisos.novedad.titulo}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
              {avisos.novedad.texto}
            </p>
          </div>
        )}

        <button
          onClick={cerrar}
          className="tap mt-5 w-full rounded-2xl px-4 py-3 text-[15px] font-semibold"
          style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
        >
          Listo
        </button>
      </div>
    </div>
  )
}
