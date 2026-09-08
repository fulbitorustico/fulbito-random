import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import { AVATARES_DISPONIBLES } from '../lib/avatar'
import SelectorPosiciones from '../components/SelectorPosiciones'
import { fetchBajasTardiasMap } from '../lib/bajas'
import type { ValoracionPromedio } from '../lib/types'

const inputClass =
  'rounded-2xl border-0 bg-white/70 px-4 py-3.5 text-[15px] outline-none ring-1 ring-black/5 transition focus:ring-2'

export default function Perfil() {
  const { jugador, refreshJugador, session } = useAuth()
  const [nombre, setNombre] = useState(jugador?.nombre ?? '')
  const [apodo, setApodo] = useState(jugador?.apodo ?? '')
  const [posiciones, setPosiciones] = useState<string[]>(jugador?.posiciones ?? [])
  const [avatar, setAvatar] = useState(jugador?.avatar ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [promedio, setPromedio] = useState<ValoracionPromedio | null>(null)
  const [bajasTardias, setBajasTardias] = useState(0)
  const [partidosJugados, setPartidosJugados] = useState(0)
  const [comentarios, setComentarios] = useState<{ comentario: string; created_at: string }[]>([])

  useEffect(() => {
    if (!jugador) return
    supabase
      .rpc('valoraciones_promedio')
      .then(({ data }: { data: ValoracionPromedio[] | null }) => {
        setPromedio((data ?? []).find((p) => p.evaluado_id === jugador.id) ?? null)
      })
    fetchBajasTardiasMap().then((map) => setBajasTardias(map[jugador.id] ?? 0))
    supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .eq('jugador_id', jugador.id)
      .then(({ count }) => setPartidosJugados(count ?? 0))
    supabase.rpc('comentarios_recibidos', { p_evaluado_id: jugador.id }).then(({ data }) => setComentarios(data ?? []))
  }, [jugador])

  if (!jugador) return null

  async function guardarAvatar(nuevo: string) {
    setAvatar(nuevo)
    await supabase.from('jugadores').update({ avatar: nuevo }).eq('id', jugador!.id)
    await refreshJugador()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('jugadores')
      .update({ nombre, apodo: apodo || null, posiciones })
      .eq('id', jugador!.id)
    setGuardando(false)
    if (error) setMensaje(error.message)
    else {
      await refreshJugador()
      setMensaje('Guardado ✓')
    }
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Mi perfil
      </h1>

      <div className="glass-strong anim-pop mb-4 flex flex-col items-center rounded-[28px] p-6 text-center">
        <Avatar nombre={jugador.nombre} avatar={jugador.avatar} size="lg" />
        <p className="mt-3 text-sm" style={{ color: 'var(--pitch-300)' }}>
          {session?.user.email}
        </p>
        <div className="mt-3">
          <Estrellas promedio={promedio?.promedio ?? null} cantidad={promedio?.cantidad ?? 0} />
        </div>

        <div className="mt-2">
          <BadgeConfiabilidad bajasTardias={bajasTardias} />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--pitch-300)' }}>
          {partidosJugados} {partidosJugados === 1 ? 'partido jugado' : 'partidos jugados'}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {AVATARES_DISPONIBLES.map((a) => (
            <button
              key={a}
              onClick={() => guardarAvatar(a)}
              className="tap flex h-10 w-10 items-center justify-center rounded-full text-lg"
              style={{
                background: avatar === a ? 'var(--pitch-500)' : 'rgba(18,38,28,.06)',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {comentarios.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Comentarios recibidos
          </h2>
          <div className="flex flex-col gap-2">
            {comentarios.map((c, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3 text-sm" style={{ color: 'var(--pitch-700)' }}>
                "{c.comentario}"
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-3 rounded-[28px] p-6">
        <input
          required
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
        />
        <input
          placeholder="Apodo (opcional)"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          className={inputClass}
          style={{ color: 'var(--pitch-900)' }}
        />
        <SelectorPosiciones value={posiciones} onChange={setPosiciones} />
        <button
          type="submit"
          disabled={guardando}
          className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-50"
          style={{ background: 'var(--pitch-500)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {mensaje && (
          <p className="text-sm" style={{ color: 'var(--pitch-700)' }}>
            {mensaje}
          </p>
        )}
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
        <Link to="/terminos" className="underline">
          Términos y condiciones
        </Link>
        {' · '}
        <Link to="/privacidad" className="underline">
          Política de privacidad
        </Link>
      </p>

      <button
        onClick={() => supabase.auth.signOut()}
        className="tap glass mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{ color: 'var(--pitch-700)' }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
