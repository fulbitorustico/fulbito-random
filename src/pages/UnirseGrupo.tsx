import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mensajeDeError } from '../lib/errores'
import { useAuth } from '../context/AuthContext'
import type { EstadoSolicitud, Grupo } from '../lib/types'

export default function UnirseGrupo() {
  const { id } = useParams<{ id: string }>()
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [yaSoyMiembro, setYaSoyMiembro] = useState(false)
  const [solicitudEstado, setSolicitudEstado] = useState<EstadoSolicitud | null>(null)
  const [loading, setLoading] = useState(true)
  const [uniendo, setUniendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      if (!id || !jugador) return
      const { data: grupoData } = await supabase.from('grupos').select('*').eq('id', id).maybeSingle()
      setGrupo(grupoData)
      const { data: miembro } = await supabase
        .from('grupo_miembros')
        .select('id')
        .eq('grupo_id', id)
        .eq('jugador_id', jugador.id)
        .maybeSingle()
      setYaSoyMiembro(!!miembro)

      if (grupoData?.requiere_aprobacion && !miembro) {
        const { data: solicitud } = await supabase
          .from('solicitudes_grupo')
          .select('estado')
          .eq('grupo_id', id)
          .eq('jugador_id', jugador.id)
          .maybeSingle()
        setSolicitudEstado(solicitud?.estado ?? null)
      }
      setLoading(false)
    }
    cargar()
  }, [id, jugador])

  async function unirme() {
    if (!id || !jugador || !grupo) return
    setUniendo(true)
    if (grupo.requiere_aprobacion) {
      await supabase
        .from('solicitudes_grupo')
        .upsert({ grupo_id: id, jugador_id: jugador.id, estado: 'pendiente' }, { onConflict: 'grupo_id,jugador_id' })
      setSolicitudEstado('pendiente')
      setUniendo(false)
      return
    }
    const { error: errorMiembro } = await supabase
      .from('grupo_miembros')
      .insert({ grupo_id: id, jugador_id: jugador.id })
    if (errorMiembro) {
      setAviso(mensajeDeError(errorMiembro, 'grupo'))
      setUniendo(false)
      return
    }
    navigate(`/grupos/${id}`)
  }

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </p>
    )
  if (!grupo)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Este link de invitación no es válido.
      </p>
    )

  return (
    <div className="flex min-h-[70svh] items-center justify-center">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8 text-center">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          {grupo.nombre}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
          Te invitaron a este grupo en Fulbito Random
        </p>

        {aviso && (
          <p
            className="anim-rise mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
            style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
          >
            {aviso}
          </p>
        )}

        {yaSoyMiembro ? (

          <button
            onClick={() => navigate(`/grupos/${id}`)}
            className="tap mt-6 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm"
            style={{ background: 'var(--paper)' }}
          >
            Ya sos miembro — ver grupo
          </button>
        ) : solicitudEstado === 'pendiente' ? (
          <p
            className="mt-6 rounded-2xl p-4 text-sm"
            style={{ background: 'rgba(237,197,141,.16)', color: 'var(--gold-500)' }}
          >
            Tu pedido para sumarte está pendiente de aprobación del admin del grupo.
          </p>
        ) : (
          <>
            {solicitudEstado === 'rechazada' && (
              <p className="mt-6 text-sm" style={{ color: 'var(--error)' }}>
                Tu pedido anterior fue rechazado. Podés volver a pedirlo:
              </p>
            )}
            <button
              onClick={unirme}
              disabled={uniendo}
              className="tap mt-3 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
              style={{ background: 'var(--paper)' }}
            >
              {uniendo
                ? 'Enviando...'
                : grupo.requiere_aprobacion
                  ? 'Pedir sumarme (requiere aprobación)'
                  : 'Unirme al grupo'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
