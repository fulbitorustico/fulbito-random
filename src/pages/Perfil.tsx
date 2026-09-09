import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Estrellas from '../components/Estrellas'
import BadgeConfiabilidad from '../components/BadgeConfiabilidad'
import Icono from '../components/Icono'
import { AVATARES_DISPONIBLES } from '../lib/avatar'
import { achicarParaAvatar } from '../lib/imagen'
import SelectorPosiciones from '../components/SelectorPosiciones'
import { fetchBajasTardiasMap } from '../lib/bajas'
import { insigniaPorId } from '../lib/insignias'
import { MAX_CAMBIOS_POSICIONES } from '../lib/types'
import type { DistribucionValoracion, InsigniaConteo, ValoracionPromedio } from '../lib/types'

const inputClass =
  'rounded-2xl border-0 bg-white/5 px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 transition focus:ring-2'

export default function Perfil() {
  const { jugador, refreshJugador, session } = useAuth()
  const [nombre, setNombre] = useState(jugador?.nombre ?? '')
  const [apodo, setApodo] = useState(jugador?.apodo ?? '')
  const [posiciones, setPosiciones] = useState<string[]>(jugador?.posiciones ?? [])
  const [avatar, setAvatar] = useState(jugador?.avatar ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [promedio, setPromedio] = useState<ValoracionPromedio | null>(null)
  const [distribucion, setDistribucion] = useState<DistribucionValoracion[]>([])
  const [bajasTardias, setBajasTardias] = useState(0)
  const [partidosJugados, setPartidosJugados] = useState(0)
  const [comentarios, setComentarios] = useState<{ comentario: string; created_at: string }[]>([])
  const [insignias, setInsignias] = useState<InsigniaConteo[]>([])
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)
  const [editandoPosiciones, setEditandoPosiciones] = useState(false)
  const [guardandoPosiciones, setGuardandoPosiciones] = useState(false)
  const [mensajePosiciones, setMensajePosiciones] = useState<string | null>(null)

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
    supabase
      .rpc('distribucion_valoraciones', { p_evaluado_id: jugador.id })
      .then(({ data }: { data: DistribucionValoracion[] | null }) => setDistribucion(data ?? []))
    supabase
      .rpc('insignias_por_jugador', { p_jugador_id: jugador.id })
      .then(({ data }: { data: InsigniaConteo[] | null }) => setInsignias(data ?? []))
  }, [jugador])

  if (!jugador) return null

  const cambiosRestantes = Math.max(0, MAX_CAMBIOS_POSICIONES - (jugador.cambios_posiciones ?? 0))

  async function guardarAvatar(nuevo: string) {
    setAvatar(nuevo)
    await supabase.from('jugadores').update({ avatar: nuevo }).eq('id', jugador!.id)
    await refreshJugador()
  }

  async function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !jugador) return

    setSubiendoFoto(true)
    setMensaje(null)
    const blob = await achicarParaAvatar(file)
    const ruta = `${jugador.id}/${Date.now()}.jpg`
    const { error: errorSubida } = await supabase.storage
      .from('avatares')
      .upload(ruta, blob, { contentType: 'image/jpeg', upsert: true })

    if (errorSubida) {
      setMensaje(`No se pudo subir la foto: ${errorSubida.message}`)
      setSubiendoFoto(false)
      return
    }

    const { data } = supabase.storage.from('avatares').getPublicUrl(ruta)
    await supabase.from('jugadores').update({ foto_url: data.publicUrl }).eq('id', jugador.id)
    await refreshJugador()
    setSubiendoFoto(false)
  }

  async function quitarFoto() {
    if (!jugador) return
    await supabase.from('jugadores').update({ foto_url: null }).eq('id', jugador.id)
    await refreshJugador()
  }

  async function guardarPosiciones() {
    if (!jugador || posiciones.length === 0) return
    const restantes = MAX_CAMBIOS_POSICIONES - jugador.cambios_posiciones
    const aviso =
      restantes === 1
        ? 'Este es tu último cambio: después las posiciones quedan fijas. ¿Confirmás?'
        : `Después de este cambio te va a quedar ${restantes - 1}. ¿Confirmás?`
    if (!confirm(aviso)) return

    setGuardandoPosiciones(true)
    setMensajePosiciones(null)
    const { error } = await supabase.from('jugadores').update({ posiciones }).eq('id', jugador.id)
    setGuardandoPosiciones(false)

    if (error) {
      setMensajePosiciones(error.message)
      return
    }
    await refreshJugador()
    setEditandoPosiciones(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('jugadores')
      .update({ nombre, apodo: apodo || null })
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
        <Avatar nombre={jugador.nombre} avatar={jugador.avatar} fotoUrl={jugador.foto_url} size="lg" />

        <input ref={inputFoto} type="file" accept="image/*" onChange={elegirFoto} hidden />
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => inputFoto.current?.click()}
            disabled={subiendoFoto}
            className="tap glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ color: 'var(--pitch-700)' }}
          >
            <Icono name="camara" size={14} />
            {subiendoFoto ? 'Subiendo...' : jugador.foto_url ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {jugador.foto_url && (
            <button
              onClick={quitarFoto}
              className="tap text-xs font-semibold"
              style={{ color: 'var(--pitch-300)' }}
            >
              Quitar
            </button>
          )}
        </div>

        <p className="mt-3 text-sm" style={{ color: 'var(--pitch-300)' }}>
          {session?.user.email}
        </p>
        <div className="mt-3 w-full">
          <Estrellas
            promedio={promedio?.promedio ?? null}
            cantidad={promedio?.cantidad ?? 0}
            variant="completo"
            distribucion={distribucion}
          />
        </div>

        <div className="mt-2">
          <BadgeConfiabilidad bajasTardias={bajasTardias} />
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--pitch-300)' }}>
          {partidosJugados} {partidosJugados === 1 ? 'partido jugado' : 'partidos jugados'}
        </p>

        {!jugador.foto_url && (
          <>
            <p className="mt-5 text-xs" style={{ color: 'var(--pitch-300)' }}>
              O elegí un símbolo
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {AVATARES_DISPONIBLES.map((a) => (
                <button
                  key={a}
                  onClick={() => guardarAvatar(a)}
                  aria-label={a}
                  className="tap flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: avatar === a ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                    color: avatar === a ? 'var(--ink-900)' : 'var(--pitch-700)',
                  }}
                >
                  <Icono name={a} size={19} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {insignias.length > 0 && (
        <div className="glass-strong mb-4 rounded-[28px] p-5">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Medallero — insignias que te votó el grupo
          </h2>
          <div className="flex flex-wrap gap-2">
            {insignias.map((i) => {
              const info = insigniaPorId(i.insignia)
              if (!info) return null
              return (
                <div
                  key={i.insignia}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold"
                  style={{ background: 'rgba(237,197,141,.16)', color: 'var(--gold-500)' }}
                >
                  <Icono name={info.icono} size={14} />
                  {info.label}
                  <span style={{ color: 'var(--pitch-300)' }}>×{i.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
        <button
          type="submit"
          disabled={guardando}
          className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-50"
          style={{ background: 'var(--paper)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {mensaje && (
          <p className="text-sm" style={{ color: 'var(--pitch-700)' }}>
            {mensaje}
          </p>
        )}
      </form>

      <div className="glass-strong mt-4 rounded-[28px] p-6">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
          Dónde jugás
        </h2>

        {!editandoPosiciones ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {(jugador.posiciones ?? []).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
                  Todavía no elegiste posición.
                </p>
              ) : (
                (jugador.posiciones ?? []).map((p) => (
                  <span
                    key={p}
                    className="rounded-full px-3.5 py-2 text-[13px] font-semibold"
                    style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
                  >
                    {p}
                  </span>
                ))
              )}
            </div>

            <p className="mt-3 text-xs" style={{ color: 'var(--pitch-300)' }}>
              {cambiosRestantes > 0
                ? `Te ${cambiosRestantes === 1 ? 'queda' : 'quedan'} ${cambiosRestantes} ${
                    cambiosRestantes === 1 ? 'cambio' : 'cambios'
                  }.`
                : 'Ya usaste los dos cambios: tus posiciones quedaron fijas.'}
            </p>

            <button
              type="button"
              onClick={() => {
                setPosiciones(jugador.posiciones ?? [])
                setEditandoPosiciones(true)
                setMensajePosiciones(null)
              }}
              disabled={cambiosRestantes === 0}
              className="tap glass mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-40"
              style={{ color: 'var(--pitch-700)' }}
            >
              Cambiar posiciones
            </button>
          </>
        ) : (
          <div className="mt-3">
            <SelectorPosiciones value={posiciones} onChange={setPosiciones} />
            <p
              className="mt-3 rounded-2xl p-3 text-xs leading-relaxed"
              style={{ background: 'rgba(237,197,141,.14)', color: 'var(--gold-500)' }}
            >
              Pensalo bien: te {cambiosRestantes === 1 ? 'queda' : 'quedan'}{' '}
              {cambiosRestantes} {cambiosRestantes === 1 ? 'cambio' : 'cambios'}. Cuando se terminen, tus
              posiciones quedan fijas.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={guardarPosiciones}
                disabled={guardandoPosiciones || posiciones.length === 0}
                className="tap flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] disabled:opacity-40"
                style={{ background: 'var(--paper)' }}
              >
                {guardandoPosiciones ? 'Guardando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setEditandoPosiciones(false)}
                className="tap rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{ background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mensajePosiciones && (
          <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>
            {mensajePosiciones}
          </p>
        )}
      </div>

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
