import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Grupo } from '../lib/types'

export default function Grupos() {
  const { jugador } = useAuth()
  const [grupos, setGrupos] = useState<(Grupo & { miembros: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!jugador) return
      const { data: misMiembros } = await supabase
        .from('grupo_miembros')
        .select('grupo_id')
        .eq('jugador_id', jugador.id)
      const misGrupoIds = (misMiembros ?? []).map((m) => m.grupo_id)

      if (misGrupoIds.length === 0) {
        setGrupos([])
        setLoading(false)
        return
      }

      const { data: gruposData } = await supabase.from('grupos').select('*').in('id', misGrupoIds)
      const { data: todosMiembros } = await supabase
        .from('grupo_miembros')
        .select('grupo_id')
        .in('grupo_id', misGrupoIds)

      const conteo: Record<string, number> = {}
      for (const m of todosMiembros ?? []) conteo[m.grupo_id] = (conteo[m.grupo_id] ?? 0) + 1

      setGrupos((gruposData ?? []).map((g) => ({ ...g, miembros: conteo[g.id] ?? 0 })))
      setLoading(false)
    }
    cargar()
  }, [jugador])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          Mis grupos
        </h1>
        <Link
          to="/grupos/nuevo"
          className="tap inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: 'var(--pitch-500)' }}
        >
          + Grupo
        </Link>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      )}

      {!loading && grupos.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
          Todavía no estás en ningún grupo. Creá el tuyo — la junta fija con la que jugás siempre — o entrá con un link de invitación.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {grupos.map((g, i) => (
          <Link
            key={g.id}
            to={`/grupos/${g.id}`}
            className="glass anim-rise flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <p className="font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {g.nombre}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
              {g.miembros} {g.miembros === 1 ? 'miembro' : 'miembros'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
