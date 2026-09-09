import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import { pedirUbicacion } from '../lib/geo'
import { DIAS_DISPONIBILIDAD } from '../lib/disponibilidad'

export default function PublicarmeEnBase() {
  const { jugador, refreshJugador } = useAuth()
  const [zona, setZona] = useState(jugador?.zona ?? '')
  const [bio, setBio] = useState(jugador?.bio ?? '')
  const [dias, setDias] = useState<string[]>(jugador?.disponibilidad ?? [])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  if (!jugador) return null
  const publicado = jugador.buscando

  function toggleDia(id: string) {
    setDias((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  }

  async function publicarme() {
    setGuardando(true)
    setMensaje(null)

    const coords = await pedirUbicacion()
    const { error } = await supabase
      .from('jugadores')
      .update({
        buscando: true,
        zona: zona.trim() || null,
        bio: bio.trim() || null,
        disponibilidad: dias,
      })
      .eq('id', jugador!.id)

    // La ubicación va en su propia tabla, que solo puede leer su dueño:
    // redondeada a ~1 km alcanza para ordenar por cercanía sin decirle a nadie
    // dónde vivís.
    if (coords) {
      await supabase.from('jugadores_ubicacion').upsert({
        jugador_id: jugador!.id,
        lat_aprox: Math.round(coords.lat * 100) / 100,
        lng_aprox: Math.round(coords.lng * 100) / 100,
      })
    }

    setGuardando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    await refreshJugador()
  }

  async function despublicarme() {
    setGuardando(true)
    await supabase.from('jugadores').update({ buscando: false }).eq('id', jugador!.id)
    await supabase.from('jugadores_ubicacion').delete().eq('jugador_id', jugador!.id)
    setGuardando(false)
    await refreshJugador()
  }

  return (
    <div className="glass-strong rounded-[28px] p-6">
      <div className="flex items-start gap-3">
        <div style={{ color: publicado ? 'var(--acc-green)' : 'var(--pitch-300)' }}>
          <Icono name="personas" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Buscar equipo
          </h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            {publicado
              ? 'Estás en la base: los que arman partidos cerca tuyo te pueden invitar.'
              : 'Publicate para que te encuentren cuando a alguien le falte un jugador de tu puesto. Solo se muestra tu zona, nunca tu dirección ni tu mail.'}
          </p>
        </div>
      </div>

      {!publicado ? (
        <div className="mt-4 flex flex-col gap-3">
          <input
            placeholder="Tu zona (ej: Palermo, Quilmes centro)"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="rounded-2xl border-0 bg-white/5 px-4 py-3 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2"
            style={{ color: 'var(--pitch-900)' }}
          />
          <input
            placeholder="Una línea tuya (opcional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={90}
            className="rounded-2xl border-0 bg-white/5 px-4 py-3 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2"
            style={{ color: 'var(--pitch-900)' }}
          />

          <div>
            <p className="mb-2 text-xs" style={{ color: 'var(--pitch-300)' }}>
              ¿Cuándo podés jugar?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_DISPONIBILIDAD.map((d) => {
                const activo = dias.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDia(d.id)}
                    className="tap rounded-full px-3 py-1.5 text-[12.5px] font-medium"
                    style={{
                      background: activo ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                      color: activo ? 'var(--ink-900)' : 'var(--pitch-700)',
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={publicarme}
            disabled={guardando}
            className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] disabled:opacity-50"
            style={{ background: 'var(--paper)' }}
          >
            {guardando ? 'Publicando...' : 'Publicarme en la base'}
          </button>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            Al publicarte, otros jugadores van a ver tu nombre, foto, posiciones, promedio y zona. Podés salir
            de la base cuando quieras.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {jugador.zona && (
              <span
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
                style={{ background: 'rgba(159,198,154,.16)', color: 'var(--acc-green)' }}
              >
                <Icono name="pin" size={12} /> {jugador.zona}
              </span>
            )}
            {(jugador.disponibilidad ?? []).map((id) => (
              <span
                key={id}
                className="rounded-full px-3 py-1.5 text-[12.5px] font-medium"
                style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-700)' }}
              >
                {DIAS_DISPONIBILIDAD.find((d) => d.id === id)?.label ?? id}
              </span>
            ))}
          </div>

          <button
            onClick={despublicarme}
            disabled={guardando}
            className="tap glass mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
            style={{ color: 'var(--pitch-700)' }}
          >
            {guardando ? 'Saliendo...' : 'Salir de la base'}
          </button>
        </div>
      )}

      {mensaje && (
        <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>
          {mensaje}
        </p>
      )}
    </div>
  )
}
