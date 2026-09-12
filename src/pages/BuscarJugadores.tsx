import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { compartirPartido } from '../lib/compartir'
import PublicarmeEnBase from '../components/PublicarmeEnBase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import Icono from '../components/Icono'
import { pedirUbicacion, type Coords } from '../lib/geo'
import { POSICIONES } from '../lib/posiciones'
import { formatDisponibilidad } from '../lib/disponibilidad'
import type { JugadorDisponible, Partido } from '../lib/types'

const RADIO_KM = 15

export default function BuscarJugadores() {
  const { jugador } = useAuth()
  const [searchParams] = useSearchParams()
  const partidoId = searchParams.get('partido')

  const [partido, setPartido] = useState<Partido | null>(null)
  const [disponibles, setDisponibles] = useState<JugadorDisponible[]>([])
  const [indice, setIndice] = useState(0)
  const [posicion, setPosicion] = useState<string>('')
  const [ubicacion, setUbicacion] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [invitados, setInvitados] = useState<Set<string>>(new Set())
  const [accionando, setAccionando] = useState(false)
  // Bloquear es irreversible desde la app: se pide un segundo toque, pero
  // dentro de la pantalla y no con el cartel del navegador, que se puede
  // bloquear en el iPhone y deja el botón muerto sin avisar.
  const [confirmandoBloqueo, setConfirmandoBloqueo] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [franjas, setFranjas] = useState<string[]>([])
  const [edadMin, setEdadMin] = useState('')
  const [edadMax, setEdadMax] = useState('')

  const buscar = useCallback(
    async (coords: Coords | null, pos: string, franjasSel: string[] = [], min = '', max = '') => {
      setLoading(true)
      const { data } = await supabase.rpc('jugadores_disponibles', {
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
        p_km: RADIO_KM,
        p_posicion: pos || null,
        p_franjas: franjasSel.length > 0 ? franjasSel : null,
        p_edad_min: min ? Number(min) : null,
        p_edad_max: max ? Number(max) : null,
      })
      setDisponibles(data ?? [])
      setIndice(0)
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    async function arrancar() {
      if (partidoId) {
        const { data } = await supabase.from('partidos').select('*').eq('id', partidoId).maybeSingle()
        setPartido(data)
      }
      const coords = await pedirUbicacion()
      setUbicacion(coords)
      await buscar(coords, '')
    }
    arrancar()
  }, [partidoId, buscar])

  async function invitar(j: JugadorDisponible) {
    if (!jugador || !partidoId) return
    setAccionando(true)
    const { error } = await supabase.from('invitaciones').insert({
      partido_id: partidoId,
      invitado_id: j.jugador_id,
      invitado_por_id: jugador.id,
    })
    if (!error) {
      setInvitados((s) => new Set(s).add(j.jugador_id))
      supabase.functions
        .invoke('rapid-action', {
          body: {
            tipo: 'invitacion_partido',
            jugador_id: j.jugador_id,
            cancha: partido?.cancha ?? '',
            invitado_por: jugador.nombre,
          },
        })
        .catch(() => {})
    }
    setAccionando(false)
    setIndice((i) => i + 1)
  }

  async function bloquear(j: JugadorDisponible) {
    if (!jugador) return
    if (confirmandoBloqueo !== j.jugador_id) {
      setConfirmandoBloqueo(j.jugador_id)
      return
    }
    setConfirmandoBloqueo(null)
    setAccionando(true)
    await supabase.from('bloqueos').insert({ bloqueador_id: jugador.id, bloqueado_id: j.jugador_id })
    setAccionando(false)
    setDisponibles((d) => d.filter((x) => x.jugador_id !== j.jugador_id))
  }

  const actual = disponibles[indice]

  return (
    <div>
      <Link
        to={partidoId ? `/partidos/${partidoId}` : '/jugadores'}
        className="mb-4 inline-block text-sm font-medium"
        style={{ color: 'var(--acc-green)' }}
      >
        ← Volver
      </Link>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Buscar jugadores
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--pitch-300)' }}>
        {partido
          ? `Para ${partido.cancha} · a menos de ${RADIO_KM} km`
          : `Jugadores publicados a menos de ${RADIO_KM} km`}
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setPosicion('')
            buscar(ubicacion, '', franjas, edadMin, edadMax)
          }}
          className="tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium"
          style={{
            background: posicion === '' ? 'var(--paper)' : 'rgba(242,239,233,.07)',
            color: posicion === '' ? 'var(--ink-900)' : 'var(--pitch-700)',
          }}
        >
          Todos
        </button>
        {POSICIONES.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPosicion(p)
              buscar(ubicacion, p, franjas, edadMin, edadMax)
            }}
            className="tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium"
            style={{
              background: posicion === p ? 'var(--paper)' : 'rgba(242,239,233,.07)',
              color: posicion === p ? 'var(--ink-900)' : 'var(--pitch-700)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/*
        La franja sale de la disponibilidad que cada uno ya eligió: no hay
        que pedirle nada nuevo a nadie. Al que no cargó disponibilidad no se
        lo esconde — quiere decir "cualquier día".
      */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {[
          ['manana', 'Mañana'],
          ['tarde', 'Tarde'],
          ['noche', 'Noche'],
        ].map(([id, label]) => {
          const activa = franjas.includes(id)
          return (
            <button
              key={id}
              onClick={() => {
                const nuevas = activa ? franjas.filter((f) => f !== id) : [...franjas, id]
                setFranjas(nuevas)
                buscar(ubicacion, posicion, nuevas, edadMin, edadMax)
              }}
              className="tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium"
              style={{
                background: activa ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                color: activa ? 'var(--ink-900)' : 'var(--pitch-700)',
              }}
            >
              {label}
            </button>
          )
        })}

        <span className="ml-1 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
          Edad
        </span>
        {(
          [
            [edadMin, setEdadMin, 'desde'],
            [edadMax, setEdadMax, 'hasta'],
          ] as const
        ).map(([valor, set, ph]) => (
          <input
            key={ph}
            type="number"
            inputMode="numeric"
            min={12}
            max={90}
            placeholder={ph}
            value={valor}
            onChange={(e) => set(e.target.value)}
            onBlur={() => buscar(ubicacion, posicion, franjas, edadMin, edadMax)}
            className="w-[72px] rounded-full border-0 bg-white/5 px-3 py-2 text-[13px] outline-none ring-1 ring-white/10 focus:ring-2"
            style={{ color: 'var(--pitch-900)' }}
          />
        ))}
      </div>

      {(edadMin || edadMax) && (
        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
          Filtrando por edad se esconde a quien todavía no la cargó.
        </p>
      )}

      {loading && (
        <p className="mt-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
          Buscando...
        </p>
      )}

      {/*
        La pantalla vacía era un cartel y nada más, justo en el momento en que
        a la persona le falta un jugador. Ahora ofrece las dos únicas cosas
        que sirven ahí: pasar el link a alguien de afuera, y publicarse para
        que la próxima vez el buscador tenga a quién mostrar.
      */}
      {!loading && !actual && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="glass rounded-[24px] p-6 text-center">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
              {disponibles.length === 0
                ? 'Todavía no hay nadie publicado cerca tuyo. La app es nueva y la base se llena con cada uno que entra.'
                : 'Viste a todos los que había con ese puesto. Probá sin filtro.'}
            </p>

            {partido && (
              <>
                <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
                  Mientras tanto, pasale el link a alguien que sepas que juega. Se anota sin instalar nada, y queda
                  disponible para la próxima vez que a alguien le falte uno.
                </p>
                <button
                  onClick={async () => {
                    const resultado = await compartirPartido(partido)
                    if (resultado === 'copiado') {
                      setLinkCopiado(true)
                      setTimeout(() => setLinkCopiado(false), 2500)
                    }
                  }}
                  className="tap mt-4 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold"
                  style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                >
                  {linkCopiado ? 'Link copiado' : 'Pasar el link por WhatsApp'}
                </button>
              </>
            )}
          </div>

          <PublicarmeEnBase />
        </div>
      )}

      {!loading && actual && (
        <>
          <div key={actual.jugador_id} className="glass-strong anim-pop mt-5 rounded-[28px] p-6">
            <div className="flex items-center gap-4">
              <Avatar nombre={actual.nombre} avatar={actual.avatar} fotoUrl={actual.foto_url} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-extrabold" style={{ color: 'var(--pitch-900)' }}>
                  {actual.nombre}
                </p>
                {actual.apodo && (
                  <p className="truncate text-sm" style={{ color: 'var(--pitch-300)' }}>
                    "{actual.apodo}"
                  </p>
                )}
                {actual.distancia_km != null && (
                  <p
                    className="mt-1 flex items-center gap-1 text-[13px] font-semibold"
                    style={{ color: 'var(--acc-green)' }}
                  >
                    <Icono name="pin" size={12} /> a {actual.distancia_km} km
                    {actual.zona && ` · ${actual.zona}`}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {(actual.posiciones ?? []).map((p) => (
                <span
                  key={p}
                  className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={{ background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }}
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <Estrellas promedio={actual.promedio} cantidad={actual.cantidad} />
            </div>

            <p className="mt-3 text-[13px]" style={{ color: 'var(--pitch-300)' }}>
              {formatDisponibilidad(actual.disponibilidad)}
            </p>

            {actual.bio && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
                "{actual.bio}"
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIndice((i) => i + 1)}
              disabled={accionando}
              className="tap glass flex-1 rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50"
              style={{ color: 'var(--pitch-700)' }}
            >
              Pasar
            </button>
            {partidoId ? (
              <button
                onClick={() => invitar(actual)}
                disabled={accionando || invitados.has(actual.jugador_id)}
                className="tap flex-[2] rounded-2xl px-4 py-3.5 text-sm font-semibold text-[color:var(--ink-900)] disabled:opacity-50"
                style={{ background: 'var(--paper)' }}
              >
                {invitados.has(actual.jugador_id) ? 'Invitado' : 'Invitar a mi partido'}
              </button>
            ) : (
              <Link
                to="/partidos"
                className="tap flex-[2] rounded-2xl px-4 py-3.5 text-center text-sm font-semibold text-[color:var(--ink-900)]"
                style={{ background: 'var(--paper)' }}
              >
                Elegir un partido
              </Link>
            )}
          </div>

          {confirmandoBloqueo === actual.jugador_id ? (
            <div className="anim-rise mt-3 rounded-2xl p-3" style={{ background: 'rgba(224,122,99,.12)' }}>
              <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
                Si bloqueás a {actual.nombre}, no se van a volver a ver ninguno de los dos.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => setConfirmandoBloqueo(null)}
                  className="tap flex-[2] rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                >
                  Mejor no
                </button>
                <button
                  onClick={() => bloquear(actual)}
                  disabled={accionando}
                  className="tap flex-1 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  style={{ background: 'rgba(242,239,233,.07)', color: 'var(--error)' }}
                >
                  Bloquear
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => bloquear(actual)}
              className="tap mt-3 w-full text-center text-xs font-semibold"
              style={{ color: 'var(--pitch-300)' }}
            >
              Bloquear a {actual.nombre}
            </button>
          )}

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
            {indice + 1} de {disponibles.length}
          </p>
        </>
      )}
    </div>
  )
}
