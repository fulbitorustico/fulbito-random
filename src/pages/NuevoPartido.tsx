import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

export default function NuevoPartido() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [cancha, setCancha] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cupo, setCupo] = useState(10)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!jugador) return
    setGuardando(true)
    setError(null)

    const fecha_hora = new Date(`${fecha}T${hora}`).toISOString()
    const { data, error } = await supabase
      .from('partidos')
      .insert({ cancha, fecha_hora, cupo_total: cupo, admin_id: jugador.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setGuardando(false)
      return
    }

    await supabase.from('participantes').insert({ partido_id: data.id, jugador_id: jugador.id })
    navigate('/partidos')
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Nuevo partido</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Cancha / lugar"
          value={cancha}
          onChange={(e) => setCancha(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
        />
        <div className="flex gap-3">
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
          <select
            required
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="" disabled>
              Hora
            </option>
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <label className="text-sm text-slate-600">
          Cupo total de jugadores
          <input
            required
            type="number"
            min={2}
            max={30}
            value={cupo}
            onChange={(e) => setCupo(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {guardando ? 'Creando...' : 'Crear partido'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}
