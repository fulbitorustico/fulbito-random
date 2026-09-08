import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Grupo } from '../lib/types'

export default function UnirseGrupo() {
  const { id } = useParams<{ id: string }>()
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [yaSoyMiembro, setYaSoyMiembro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uniendo, setUniendo] = useState(false)

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
      setLoading(false)
    }
    cargar()
  }, [id, jugador])

  async function unirme() {
    if (!id || !jugador) return
    setUniendo(true)
    await supabase.from('grupo_miembros').insert({ grupo_id: id, jugador_id: jugador.id })
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

        {yaSoyMiembro ? (
          <button
            onClick={() => navigate(`/grupos/${id}`)}
            className="tap mt-6 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm"
            style={{ background: 'var(--pitch-500)' }}
          >
            Ya sos miembro — ver grupo
          </button>
        ) : (
          <button
            onClick={unirme}
            disabled={uniendo}
            className="tap mt-6 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
            style={{ background: 'var(--pitch-500)' }}
          >
            {uniendo ? 'Uniéndote...' : 'Unirme al grupo'}
          </button>
        )}
      </div>
    </div>
  )
}
