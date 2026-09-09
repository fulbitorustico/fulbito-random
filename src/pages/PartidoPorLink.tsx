import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Marca from '../components/Marca'
import Icono from '../components/Icono'
import { formatCuentaRegresiva } from '../lib/geo'
import { guardarPartidoDelLink, limpiarPartidoDelLink } from '../lib/invitacion'

interface PartidoPublico {
  id: string
  cancha: string
  fecha_hora: string
  cupo_total: number
  anotados: number
  lugares: number
  invita: string | null
  es_de_grupo: boolean
  nota: string | null
  mapa_url: string | null
  estado: string
}

const RESPUESTAS: Record<string, string> = {
  no_existe: 'Ese link no corresponde a ningún partido.',
  cerrado: 'Ese partido está cerrado.',
  ya_paso: 'Ese partido ya se jugó.',
  lleno: 'Justo se llenó. Pedile al que te invitó que te avise si se libera un lugar.',
  ya_estabas: 'Ya estabas anotado.',
}

/**
 * La pantalla que ve alguien que llega por un link compartido, tenga o no
 * cuenta. Muestra lo justo para decidir si va: cancha, día, hora, cuántos
 * faltan y quién invita.
 *
 * Lo que NO muestra, a propósito: quiénes están anotados y sus valoraciones.
 * El link abre este partido, no el grupo ni la gente que lo juega.
 */
export default function PartidoPorLink() {
  const { token } = useParams<{ token: string }>()
  const { session, jugador } = useAuth()
  const navigate = useNavigate()

  const [partido, setPartido] = useState<PartidoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [sumandome, setSumandome] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    supabase.rpc('partido_por_token', { p_token: token }).then(({ data }) => {
      setPartido(((data ?? []) as PartidoPublico[])[0] ?? null)
      setLoading(false)
    })
  }, [token])

  async function sumarme() {
    if (!token) return

    // Sin cuenta: se guarda el token y se sigue al login. Cuando termine de
    // hacerse el perfil, la app lo anota sola.
    if (!session || !jugador) {
      guardarPartidoDelLink(token)
      navigate('/login')
      return
    }

    setSumandome(true)
    const { data, error } = await supabase.rpc('sumarme_con_token', { p_token: token })
    setSumandome(false)

    if (error) {
      setAviso('No pudimos anotarte. Probá de nuevo en un rato.')
      return
    }
    if (data === 'listo' || data === 'ya_estabas') {
      limpiarPartidoDelLink()
      navigate(`/partidos/${partido?.id}`)
      return
    }
    setAviso(RESPUESTAS[data as string] ?? 'No pudimos anotarte.')
  }

  if (loading)
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
          Cargando...
        </p>
      </div>
    )

  if (!partido)
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-8 text-center">
          <Marca />
          <p className="mt-4 text-sm" style={{ color: 'var(--pitch-300)' }}>
            Este link ya no sirve: el partido puede haberse jugado o cancelado.
          </p>
        </div>
      </div>
    )

  const fecha = new Date(partido.fecha_hora)
  const cerrado = partido.estado !== 'abierto' || partido.lugares === 0

  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-8">
      <div className="glass-strong anim-pop w-full max-w-sm rounded-[28px] p-7">
        <Marca />

        {partido.invita && (
          <p className="mt-4 text-sm" style={{ color: 'var(--pitch-700)' }}>
            <strong>{partido.invita}</strong> te invita a jugar
          </p>
        )}

        <h1 className="mt-3 text-2xl font-bold leading-tight" style={{ color: 'var(--pitch-900)' }}>
          {partido.cancha}
        </h1>

        <p className="mt-1.5 text-[15px] capitalize" style={{ color: 'var(--pitch-700)' }}>
          {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--pitch-300)' }}>
          {formatCuentaRegresiva(partido.fecha_hora)}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: 'rgba(242,239,233,.06)' }}>
          <Icono name="personas" size={16} />
          <span className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
            {partido.anotados} de {partido.cupo_total}
          </span>
          <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
            {partido.lugares === 0
              ? '· completo'
              : partido.lugares === 1
                ? '· falta uno'
                : `· faltan ${partido.lugares}`}
          </span>
        </div>

        {partido.nota && (
          <p
            className="mt-2 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
            style={{ background: 'rgba(237,197,141,.14)', color: 'var(--pitch-700)' }}
          >
            {partido.nota}
          </p>
        )}

        {partido.mapa_url && (
          <a
            href={partido.mapa_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: 'var(--acc-green)' }}
          >
            <Icono name="pin" size={13} /> Cómo llegar
          </a>
        )}

        <button
          onClick={sumarme}
          disabled={sumandome || cerrado}
          className="tap mt-5 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
        >
          {cerrado ? 'No quedan lugares' : sumandome ? 'Anotándote...' : 'Sumarme'}
        </button>

        {!session && !cerrado && (
          <p className="mt-2 text-center text-[12px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            Te va a pedir el mail para confirmar que sos vos. No hay que instalar nada.
          </p>
        )}

        {aviso && (
          <p
            className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
            style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
          >
            {aviso}
          </p>
        )}

        {partido.es_de_grupo && (
          <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            Este partido es de un grupo. El link te suma a este partido, no al grupo.
          </p>
        )}
      </div>
    </div>
  )
}
