import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icono from '../components/Icono'
import Estrellas from '../components/Estrellas'
import { ASPECTOS_CANCHA, logrosDeCancha, type ResumenCancha } from '../lib/cancha'

interface Cancha {
  id: string
  nombre: string
  zona: string | null
  direccion: string | null
  tipo: string | null
  techada: boolean | null
}

export default function CanchaDetalle() {
  const { id } = useParams<{ id: string }>()
  const [cancha, setCancha] = useState<Cancha | null>(null)
  const [resumen, setResumen] = useState<ResumenCancha | null>(null)
  const [comentarios, setComentarios] = useState<{ comentario: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!id) return
      const { data: canchaData } = await supabase.from('canchas').select('*').eq('id', id).maybeSingle()
      setCancha(canchaData)

      const { data: resumenData } = await supabase.rpc('cancha_resumen', { p_cancha_id: id })
      setResumen(resumenData?.[0] ?? null)

      const { data: comentariosData } = await supabase.rpc('comentarios_cancha', { p_cancha_id: id })
      setComentarios(comentariosData ?? [])

      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </p>
    )
  if (!cancha)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Esta cancha no existe.
      </p>
    )

  const datos: ResumenCancha = resumen ?? {
    cesped: null,
    iluminacion: null,
    vestuarios: null,
    estacionamiento: null,
    personal: null,
    general: null,
    valoraciones: 0,
    partidos_jugados: 0,
  }
  const logros = logrosDeCancha(datos)
  const conseguidos = logros.filter((l) => l.logrado)

  return (
    <div>
      <Link to="/partidos" className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--acc-green)' }}>
        ← Volver
      </Link>

      <div className="glass-strong anim-pop rounded-[28px] p-6">
        <div className="flex items-start gap-3">
          <div style={{ color: 'var(--acc-green)' }}>
            <Icono name="pin" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold leading-tight" style={{ color: 'var(--pitch-900)' }}>
              {cancha.nombre}
            </h1>
            {(cancha.zona || cancha.direccion) && (
              <p className="mt-0.5 text-sm" style={{ color: 'var(--pitch-300)' }}>
                {cancha.zona ?? cancha.direccion}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <span className="text-4xl font-extrabold leading-none" style={{ color: 'var(--pitch-900)' }}>
            {datos.general != null ? datos.general.toFixed(1) : '—'}
          </span>
          <div className="flex flex-col gap-1">
            {datos.general != null && <Estrellas promedio={datos.general} cantidad={datos.valoraciones} />}
            <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
              {datos.valoraciones === 0
                ? 'Todavía nadie la valoró'
                : `${datos.valoraciones} ${datos.valoraciones === 1 ? 'valoración' : 'valoraciones'} · ${
                    datos.partidos_jugados
                  } ${datos.partidos_jugados === 1 ? 'partido' : 'partidos'}`}
            </span>
          </div>
        </div>
      </div>

      {datos.valoraciones > 0 && (
        <div className="glass-strong mt-4 rounded-[28px] p-5">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Cómo la puntúan
          </h2>
          <div className="flex flex-col gap-3">
            {ASPECTOS_CANCHA.map((a) => {
              const valor = datos[a.id]
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span style={{ color: 'var(--pitch-300)' }}>
                    <Icono name={a.icono} size={16} />
                  </span>
                  <span className="w-28 shrink-0 text-[13px]" style={{ color: 'var(--pitch-700)' }}>
                    {a.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(242,239,233,.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${((valor ?? 0) / 5) * 100}%`, background: 'var(--gold-500)' }}
                    />
                  </div>
                  <span className="w-7 text-right text-[13px] font-bold" style={{ color: 'var(--gold-500)' }}>
                    {valor != null ? valor.toFixed(1) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="glass-strong mt-4 rounded-[28px] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Chapas de la cancha
          </h2>
          <span className="text-xs font-bold" style={{ color: 'var(--gold-500)' }}>
            {conseguidos.length} de {logros.length}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {logros.map((l) => (
            <span
              key={l.id}
              title={l.detalle}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold"
              style={{
                background: l.logrado ? `${l.color}26` : 'rgba(242,239,233,.05)',
                color: l.logrado ? l.color : 'var(--pitch-300)',
                opacity: l.logrado ? 1 : 0.6,
              }}
            >
              <Icono name={l.icono} size={13} />
              {l.label}
            </span>
          ))}
        </div>
        {datos.valoraciones < 3 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--pitch-300)' }}>
            Las chapas de calidad se destraban con al menos 3 valoraciones.
          </p>
        )}
      </div>

      {comentarios.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Lo que dicen los que jugaron
          </h2>
          <div className="flex flex-col gap-2">
            {comentarios.map((c, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3 text-sm" style={{ color: 'var(--pitch-700)' }}>
                "{c.comentario}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
