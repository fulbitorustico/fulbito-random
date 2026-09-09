import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { pedirUbicacion, type Coords } from '../lib/geo'
import Icono from '../components/Icono'
import { buscarCanchas, type CanchaEncontrada } from '../lib/canchas'
import type { AperturaPartido, Grupo } from '../lib/types'

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const inputClass =
  'rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2'

export default function NuevoPartido() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [cancha, setCancha] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cupo, setCupo] = useState(10)
  const [valorCancha, setValorCancha] = useState('')
  const [apertura, setApertura] = useState<AperturaPartido>('abierto')
  const [grupoId, setGrupoId] = useState<string>(searchParams.get('grupo') ?? '')
  const [misGrupos, setMisGrupos] = useState<Grupo[]>([])
  const [usaEquipos, setUsaEquipos] = useState(false)
  const [ubicacion, setUbicacion] = useState<Coords | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sugerencias, setSugerencias] = useState<CanchaEncontrada[]>([])
  const [buscandoCancha, setBuscandoCancha] = useState(false)
  const [sugerenciaElegida, setSugerenciaElegida] = useState(false)
  const [canchaElegida, setCanchaElegida] = useState<CanchaEncontrada | null>(null)

  // Se busca recién cuando dejás de escribir, para no castigar a OpenStreetMap.
  useEffect(() => {
    if (sugerenciaElegida || cancha.trim().length < 3) {
      setSugerencias([])
      return
    }
    setBuscandoCancha(true)
    const t = setTimeout(async () => {
      const encontradas = await buscarCanchas(cancha, ubicacion ?? undefined)
      setSugerencias(encontradas)
      setBuscandoCancha(false)
    }, 600)
    return () => {
      clearTimeout(t)
      setBuscandoCancha(false)
    }
  }, [cancha, sugerenciaElegida, ubicacion])

  useEffect(() => {
    async function cargarGrupos() {
      if (!jugador) return
      const { data: miembros } = await supabase.from('grupo_miembros').select('grupo_id').eq('jugador_id', jugador.id)
      const ids = (miembros ?? []).map((m) => m.grupo_id)
      if (ids.length === 0) return
      const { data } = await supabase.from('grupos').select('*').in('id', ids)
      setMisGrupos(data ?? [])
    }
    cargarGrupos()
  }, [jugador])

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

    // Si elegiste la cancha del buscador, queda ligada a su perfil: así el
    // catálogo de canchas se arma solo con el uso.
    let canchaId: string | null = null
    if (canchaElegida?.propia && canchaElegida.canchaId) {
      canchaId = canchaElegida.canchaId
    } else if (canchaElegida) {
      const { data: idCancha } = await supabase.rpc('buscar_o_crear_cancha', {
        p_nombre: canchaElegida.nombre,
        p_lat: canchaElegida.lat,
        p_lng: canchaElegida.lng,
        p_zona: canchaElegida.detalle,
      })
      canchaId = idCancha ?? null
    }

    const fecha_hora = new Date(`${fecha}T${hora}`).toISOString()
    const { data, error } = await supabase
      .from('partidos')
      .insert({
        cancha_id: canchaId,
        cancha,
        fecha_hora,
        cupo_total: cupo,
        admin_id: jugador.id,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
        valor_cancha: valorCancha ? Number(valorCancha) : null,
        apertura,
        grupo_id: grupoId || null,
        usa_equipos: usaEquipos,
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
        <div className="relative">
          <input
            required
            placeholder="Cancha / lugar"
            value={cancha}
            onChange={(e) => {
              setCancha(e.target.value)
              setSugerenciaElegida(false)
            }}
            className={`w-full ${inputClass}`}
            style={{ color: 'var(--pitch-900)' }}
          />
          {sugerencias.length > 0 && !sugerenciaElegida && (
            <div
              className="glass-strong absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl"
              style={{ maxHeight: 260, overflowY: 'auto' }}
            >
              {sugerencias.map((s) => (
                <button
                  key={`${s.lat}-${s.lng}`}
                  type="button"
                  onClick={() => {
                    setCancha(s.nombre)
                    setUbicacion({ lat: s.lat, lng: s.lng })
                    setCanchaElegida(s)
                    setSugerencias([])
                    setSugerenciaElegida(true)
                  }}
                  className="flex w-full items-start gap-2 px-4 py-3 text-left"
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <span className="mt-0.5" style={{ color: s.propia ? 'var(--gold-500)' : 'var(--acc-green)' }}>
                    <Icono name={s.propia ? 'pelota' : 'pin'} size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
                      {s.nombre}
                    </span>
                    <span className="block truncate text-xs" style={{ color: 'var(--pitch-300)' }}>
                      {s.detalle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {buscandoCancha && (
          <p className="-mt-1 text-xs" style={{ color: 'var(--pitch-300)' }}>
            Buscando canchas...
          </p>
        )}
        {!buscandoCancha && cancha.trim().length >= 3 && sugerencias.length === 0 && !sugerenciaElegida && (
          <p className="-mt-1 text-xs leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            No la encontramos en el mapa, pero podés dejar el nombre como lo escribiste. Queda guardada y la próxima
            vez aparece sola.
          </p>
        )}

        {misGrupos.length > 0 && (
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className={inputClass}
            style={{ color: 'var(--pitch-900)' }}
          >
            <option value="">Público (abierto, lo ve cualquiera cerca)</option>
            {misGrupos.map((g) => (
              <option key={g.id} value={g.id}>
                Grupo: {g.nombre}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoUbicacion}
          className="tap flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={
            ubicacion
              ? { background: 'rgba(159,198,154,.18)', color: 'var(--acc-green)' }
              : { background: 'rgba(242,239,233,.06)', color: 'var(--pitch-700)' }
          }
        >
          <Icono name="pin" size={15} />
          {buscandoUbicacion ? 'Buscando...' : ubicacion ? 'Ubicación guardada' : 'Usar mi ubicación actual'}
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

        <label className="text-sm" style={{ color: 'var(--pitch-700)' }}>
          Valor de la cancha (opcional)
          <input
            type="number"
            min={0}
            step="100"
            placeholder="$"
            value={valorCancha}
            onChange={(e) => setValorCancha(e.target.value)}
            className={`mt-1.5 w-full ${inputClass}`}
            style={{ color: 'var(--pitch-900)' }}
          />
          {valorCancha && cupo > 0 && (
            <span className="mt-1.5 block text-[13px]" style={{ color: 'var(--acc-green)' }}>
              ${Math.ceil(Number(valorCancha) / cupo)} por jugador
            </span>
          )}
        </label>

        <div>
          <p className="mb-2 text-sm" style={{ color: 'var(--pitch-700)' }}>
            ¿Quién se puede sumar?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setApertura('abierto')}
              className="tap flex-1 rounded-2xl px-3 py-2.5 text-[13px] font-semibold"
              style={{
                background: apertura === 'abierto' ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                color: apertura === 'abierto' ? 'var(--ink-900)' : 'var(--pitch-700)',
              }}
            >
              Abierto a todos
            </button>
            <button
              type="button"
              onClick={() => setApertura('solo_confiables')}
              className="tap flex-1 rounded-2xl px-3 py-2.5 text-[13px] font-semibold"
              style={{
                background: apertura === 'solo_confiables' ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                color: apertura === 'solo_confiables' ? 'var(--ink-900)' : 'var(--pitch-700)',
              }}
            >
              Solo confiables
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUsaEquipos((v) => !v)}
          className="tap flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: usaEquipos ? 'rgba(159,198,154,.18)' : 'rgba(242,239,233,.06)',
            color: usaEquipos ? 'var(--paper)' : 'var(--pitch-700)',
          }}
        >
          <span>Armar 2 equipos parejos automático</span>
          <span>{usaEquipos ? '✓' : ''}</span>
        </button>

        <button
          type="submit"
          disabled={guardando}
          className="tap mt-1 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
          style={{ background: 'var(--paper)' }}
        >
          {guardando ? 'Creando...' : 'Crear partido'}
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
