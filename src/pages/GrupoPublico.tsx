import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import Marca from '../components/Marca'

interface MiembroPublico {
  jugador_id: string
  nombre: string
  apodo: string | null
  avatar: string | null
  promedio: number | null
  cantidad: number
}

export default function GrupoPublico() {
  const { id } = useParams<{ id: string }>()
  const [nombre, setNombre] = useState<string | null>(null)
  const [miembros, setMiembros] = useState<MiembroPublico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!id) return
      const { data: infoData } = await supabase.rpc('grupo_publico_info', { p_grupo_id: id })
      setNombre(infoData?.[0]?.nombre ?? null)
      const { data: miembrosData } = await supabase.rpc('grupo_publico_miembros', { p_grupo_id: id })
      setMiembros(miembrosData ?? [])
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      </div>
    )
  }

  if (!nombre) {
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
            Este grupo no existe o el link ya no es válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        <Marca size="sm" />
        <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          {nombre}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--pitch-300)' }}>
          Vista pública del grupo — {miembros.length} {miembros.length === 1 ? 'jugador' : 'jugadores'}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {miembros.map((m) => (
            <div key={m.jugador_id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <Avatar nombre={m.nombre} avatar={m.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {m.nombre} {m.apodo && <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{m.apodo}"</span>}
                </p>
              </div>
              <Estrellas promedio={m.promedio} cantidad={m.cantidad} />
            </div>
          ))}
        </div>

        <div className="glass-strong anim-pop mt-10 rounded-[28px] p-7 text-center">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            ¿Organizás fulbito?
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
            Sumá a tu grupo a Fulbito Random, es gratis.
          </p>
          <Link
            to="/login"
            className="tap mt-5 inline-block w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm"
            style={{ background: 'var(--paper)' }}
          >
            Entrar con email
          </Link>
        </div>
      </div>
    </div>
  )
}
