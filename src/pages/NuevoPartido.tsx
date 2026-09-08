import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { pedirUbicacion, type Coords } from '../lib/geo'

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const inputClass =
  'rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2'

export default function NuevoPartido() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [cancha, setCancha] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cupo, setCupo] = useState(10)
  const [ubicacion, setUbicacion] = useState<Coords | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function usarMiUbicacion() {
    setBuscandoUbicacion(true)
    const coords = await pedirUbicacion()
    setUbicacion(coords)
    setBuscandoUbicacion(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!jugador) return
    setGuardando(true)
    setError(null)

    const fecha_hora = new Date(`${fecha}T${hora}`).toISOString()
    const { data, error } = await supabase
      .from('partidos')
      .insert({
        cancha,
        fecha_hora,
        cupo_total: cupo,
        admin_id: jugador.id,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      })
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
    <div>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Nuevo partido
      </h1>
      <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-3 rounded-[28px] p-6">
        <input
          required
          placeholder="Cancha / lugar"
          value={cancha}
          onChange={(e) => setCancha(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
        />

        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoUbicacion}
          className="tap flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={
            ubicacion
              ? { background: 'rgba(45,106,79,.14)', color: 'var(--pitch-500)' }
              : { background: 'rgba(18,38,28,.05)', color: 'var(--pitch-700)' }
          }
        >
          {buscandoUbicacion ? 'Buscando...' : ubicacion ? '📍 Ubicación guardada' : '📍 Usar mi ubicación actual'}
        </button>

        <div className="flex gap-3">
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={`flex-1 ${inputClass}`}
            style={{ color: 'var(--pitch-900)' }}
          />
          <select
            required
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={`flex-1 ${inputClass}`}
            style={{ color: 'var(--pitch-900)' }}
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

        <label className="text-sm" style={{ color: 'var(--pitch-700)' }}>
          Cupo total de jugadores
          <input
            required
            type="number"
            min={2}
            max={30}
            value={cupo}
            onChange={(e) => setCupo(Number(e.target.value))}
            className={`mt-1.5 w-full ${inputClass}`}
            style={{ color: 'var(--pitch-900)' }}
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="tap mt-1 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
          style={{ background: 'var(--pitch-500)' }}
        >
          {guardando ? 'Creando...' : 'Crear partido'}
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
