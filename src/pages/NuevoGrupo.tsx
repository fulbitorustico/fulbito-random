import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NuevoGrupo() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [requiereAprobacion, setRequiereAprobacion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!jugador) return
    setGuardando(true)
    setError(null)

    const { data, error } = await supabase
      .from('grupos')
      .insert({ nombre, creador_id: jugador.id, requiere_aprobacion: requiereAprobacion })
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
          className="rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2"
          style={{ color: 'var(--pitch-900)' }}
        />

        <button
          type="button"
          onClick={() => setRequiereAprobacion((v) => !v)}
          className="tap flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: requiereAprobacion ? 'rgba(159,198,154,.18)' : 'rgba(242,239,233,.06)',
            color: requiereAprobacion ? 'var(--paper)' : 'var(--pitch-700)',
          }}
        >
          <span>El admin aprueba antes de sumar gente</span>
          <span>{requiereAprobacion ? '✓' : ''}</span>
        </button>

        <button
          type="submit"
          disabled={guardando}
          className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
          style={{ background: 'var(--paper)' }}
        >
          {guardando ? 'Creando...' : 'Crear grupo'}
        </button>
        {error && (
          <p className="text-sm" style={{ color: 'var(--error)' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
