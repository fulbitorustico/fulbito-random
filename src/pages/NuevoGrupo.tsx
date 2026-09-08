import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NuevoGrupo() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!jugador) return
    setGuardando(true)
    setError(null)

    const { data, error } = await supabase
      .from('grupos')
      .insert({ nombre, creador_id: jugador.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setGuardando(false)
      return
    }

    await supabase.from('grupo_miembros').insert({ grupo_id: data.id, jugador_id: jugador.id })
    navigate(`/grupos/${data.id}`)
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Nuevo grupo
      </h1>
      <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-3 rounded-[28px] p-6">
        <input
          required
          autoFocus
          placeholder="Ej: Los jueves de Pedro"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2"
          style={{ color: 'var(--pitch-900)' }}
        />
        <button
          type="submit"
          disabled={guardando}
          className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
          style={{ background: 'var(--pitch-500)' }}
        >
          {guardando ? 'Creando...' : 'Crear grupo'}
        </button>
        {error && (
          <p className="text-sm" style={{ color: '#b3432f' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
