import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CardJugador from '../components/CardJugador'
import Objetivos from '../components/Objetivos'
import Evolucion from '../components/Evolucion'
import { calcularProgreso } from '../lib/objetivos'
import CartelLogro from '../components/CartelLogro'
import Icono from '../components/Icono'
import BotonCompartir from '../components/BotonCompartir'
import { calcularRacha, textoRacha } from '../lib/racha'
import { LINK_COLABORAR, TEXTO_COLABORAR } from '../lib/apoyo'
import PublicarmeEnBase from '../components/PublicarmeEnBase'
import AvisosMail from '../components/AvisosMail'
import { insigniaPorId } from '../lib/insignias'
import { nivelPorPartidos } from '../lib/nivel'
import { AVATARES_DISPONIBLES } from '../lib/avatar'
import { achicarParaAvatar } from '../lib/imagen'
import SelectorPosiciones from '../components/SelectorPosiciones'
import { fetchBajasTardiasMap } from '../lib/bajas'
import { fetchSancionCapitan, textoSancion, SIN_SANCION, type SancionCapitan } from '../lib/sanciones'
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
  const [racha, setRacha] = useState({ actual: 0, mejor: 0 })
  const [sancion, setSancion] = useState<SancionCapitan>(SIN_SANCION)
  const [goles, setGoles] = useState(0)
  const [dandoDeBaja, setDandoDeBaja] = useState(false)
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)
  const [errorBaja, setErrorBaja] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<{ comentario: string; created_at: string }[]>([])
  const [insignias, setInsignias] = useState<InsigniaConteo[]>([])
  const [reclutas, setReclutas] = useState(0)
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
    fetchSancionCapitan(jugador.id).then(setSancion)
    supabase.rpc('goles_por_jugador', { p_jugador_id: jugador.id }).then(({ data }) => setGoles(Number(data ?? 0)))
    supabase
      .from('participantes')
      .select('partidos(fecha_hora, estado)')
      .eq('jugador_id', jugador.id)
      .then(({ data }) => {
        const jugados = ((data ?? []) as unknown as { partidos: { fecha_hora: string; estado: string } | null }[])
          .map((p) => p.partidos)
          .filter((p): p is { fecha_hora: string; estado: string } => !!p && p.estado !== 'cancelado' && new Date(p.fecha_hora) < new Date())
        setPartidosJugados(jugados.length)
        setRacha(calcularRacha(jugados.map((p) => p.fecha_hora)))
      })
    supabase.rpc('comentarios_recibidos', { p_evaluado_id: jugador.id }).then(({ data }) => setComentarios(data ?? []))
    supabase
      .rpc('distribucion_valoraciones', { p_evaluado_id: jugador.id })
      .then(({ data }: { data: DistribucionValoracion[] | null }) => setDistribucion(data ?? []))
    supabase
      .rpc('insignias_por_jugador', { p_jugador_id: jugador.id })
      .then(({ data }: { data: InsigniaConteo[] | null }) => setInsignias(data ?? []))
    supabase
      .rpc('reclutas_por_jugador', { p_jugador_id: jugador.id })
      .then(({ data }: { data: number | null }) => setReclutas(data ?? 0))
  }, [jugador])

  async function darmeDeBaja() {
    setConfirmandoBaja(true)
    setErrorBaja(null)
    const { data, error } = await supabase.rpc('borrar_mi_cuenta')
    setConfirmandoBaja(false)

    if (error) {
      setErrorBaja('No pudimos darte de baja. Probá de nuevo en un rato.')
      return
    }
    if (typeof data === 'string' && data.startsWith('tenes_partidos:')) {
      const cuantos = data.split(':')[1]
      setErrorBaja(
        `Sos capitán de ${cuantos} partido${cuantos === '1' ? '' : 's'} que todavía no se jugó. Pasale la capitanía a alguien o cancelalo antes de irte: si no, queda gente esperando sin quién organice.`,
      )
      return
    }
    // La cuenta ya no existe: se cierra la sesión y la app vuelve a la landing.
    await supabase.auth.signOut()
  }

  if (!jugador) return null

  const cambiosRestantes = Math.max(0, MAX_CAMBIOS_POSICIONES - (jugador.cambios_posiciones ?? 0))
  const nombreBloqueado = (jugador.cambios_nombre ?? 0) >= 1
  // El botón solo se prende si de verdad cambiaste algo.
  const hayCambios =
    !nombreBloqueado && (nombre.trim() !== jugador.nombre || (apodo.trim() || null) !== jugador.apodo)
  const datosObjetivos = {
    partidos_jugados: partidosJugados,
    valoraciones_recibidas: promedio?.cantidad ?? 0,
    insignias_recibidas: insignias.reduce((t, i) => t + i.cantidad, 0),
    partidos_sin_bajas: bajasTardias === 0 ? partidosJugados : 0,
    mejor_racha: racha.mejor,
    goles,
  }
  const objetivosCumplidos = calcularProgreso(datosObjetivos).filter((o) => o.cumplido).length

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
    if (!hayCambios) return
    if (!confirm('El nombre y el apodo se pueden cambiar una sola vez. ¿Confirmás?')) return

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

      <CardJugador
        jugador={jugador}
        promedio={promedio?.promedio ?? null}
        cantidad={promedio?.cantidad ?? 0}
        distribucion={distribucion}
        insignias={insignias}
        bajasTardias={bajasTardias}
        partidosJugados={partidosJugados}
        reclutas={reclutas}
      >
        <input ref={inputFoto} type="file" accept="image/*" onChange={elegirFoto} hidden />
        <div className="mt-5 flex items-center justify-center gap-2">
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
            <button onClick={quitarFoto} className="tap text-xs font-semibold" style={{ color: 'var(--pitch-300)' }}>
              Quitar
            </button>
          )}
        </div>

        {!jugador.foto_url && (
          <>
            <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
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

        <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
          {session?.user.email}
        </p>
      </CardJugador>

      {sancion.amarillas > 0 && (
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ background: sancion.roja ? 'rgba(224,122,99,.18)' : 'rgba(237,197,141,.16)' }}
        >
          <p className="text-sm font-semibold" style={{ color: sancion.roja ? 'var(--error)' : 'var(--gold-500)' }}>
            {sancion.roja ? '🟥 ' : '🟨 '}
            {textoSancion(sancion)}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
            {sancion.roja
              ? 'La suspensión se cumple jugando, no esperando. Podés sumarte a los partidos de otros como siempre.'
              : 'Con dos amarillas en dos meses es roja: dos fechas sin poder armar partidos.'}
          </p>
        </div>
      )}

      {goles > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(242,239,233,.06)' }}>
          <Icono name="pelota" size={18} />
          <p className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
            {goles} {goles === 1 ? 'gol' : 'goles'}
            <span className="ml-1.5 font-normal" style={{ color: 'var(--pitch-300)' }}>
              que te anotaron los capitanes
            </span>
          </p>
        </div>
      )}

      {racha.actual > 1 && (
        <div
          className="anim-rise mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(221,151,123,.14)' }}
        >
          <Icono name="fuego" size={20} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {textoRacha(racha.actual)} jugando
            </p>
            <p className="text-[12px]" style={{ color: 'var(--pitch-300)' }}>
              {racha.actual >= racha.mejor ? 'Es tu mejor racha hasta ahora.' : `Tu récord es de ${racha.mejor}.`}
            </p>
          </div>
        </div>
      )}

      <BotonCompartir
        className="mt-4"
        etiquetaBoton="Compartir mi card"
        texto="Mi card en Fulbito Random"
        datos={{
          etiqueta: nivelPorPartidos(partidosJugados).nombre,
          titulo: jugador.apodo ? `${jugador.nombre} "${jugador.apodo}"` : jugador.nombre,
          subtitulo: (jugador.posiciones ?? []).join(' · ') || undefined,
          destacado: (promedio?.promedio ?? 3).toFixed(1),
          pieDestacado:
            (promedio?.cantidad ?? 0) === 0
              ? 'puntaje de arranque'
              : `promedio en ${promedio!.cantidad} valoraciones`,
          filas: [
            { izquierda: 'Partidos jugados', derecha: String(partidosJugados) },
            ...(racha.mejor > 1 ? [{ izquierda: 'Mejor racha', derecha: `${racha.mejor} semanas` }] : []),
            ...insignias.slice(0, 2).map((i) => ({
              izquierda: insigniaPorId(i.insignia)?.label ?? i.insignia,
              derecha: `×${i.cantidad}`,
            })),
          ],
        }}
      />

      {partidosJugados > 0 && (
        <div className="glass-strong anim-rise mt-4 rounded-[24px] p-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
            Tu temporada
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            Todo tu año en una imagen, lista para la historia.
          </p>
          <BotonCompartir
            className="mt-3"
            etiquetaBoton="Armar mi temporada"
            texto={`Mi temporada ${new Date().getFullYear()} en Fulbito Random`}
            datos={{
              etiqueta: `Temporada ${new Date().getFullYear()}`,
              titulo: jugador.apodo ? `${jugador.nombre} "${jugador.apodo}"` : jugador.nombre,
              subtitulo: nivelPorPartidos(partidosJugados).nombre,
              destacado: String(partidosJugados),
              pieDestacado: partidosJugados === 1 ? 'partido jugado' : 'partidos jugados',
              filas: [
                {
                  izquierda: 'Promedio',
                  derecha: `${(promedio?.promedio ?? 3).toFixed(1)} ★`,
                },
                { izquierda: 'Mejor racha', derecha: racha.mejor > 1 ? `${racha.mejor} semanas` : '—' },
                ...(goles > 0 ? [{ izquierda: 'Goles', derecha: String(goles) }] : []),
                {
                  izquierda: 'Insignias',
                  derecha: String(insignias.reduce((t, i) => t + i.cantidad, 0)),
                },
                { izquierda: 'Objetivos cumplidos', derecha: String(objetivosCumplidos) },
                ...(reclutas > 0 ? [{ izquierda: 'Jugadores que trajiste', derecha: String(reclutas) }] : []),
              ],
            }}
          />
        </div>
      )}

      <Evolucion jugadorId={jugador.id} />

      <CartelLogro datos={datosObjetivos} />

      <div className="mt-4">
        <PublicarmeEnBase />
      </div>

      <div className="mt-4">
        <AvisosMail />
      </div>

      <div className="mt-4">
        <Objetivos datos={datosObjetivos} />
      </div>

      {comentarios.length > 0 && (
        <div className="mb-4 mt-4">
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

      <form onSubmit={handleSubmit} className="glass-strong mt-4 flex flex-col gap-3 rounded-[28px] p-6">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
          Cómo te llamás
        </h2>
        <input
          required
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={nombreBloqueado}
          className={`${inputClass} disabled:opacity-60`}
          style={{ color: 'var(--pitch-900)' }}
        />
        <input
          placeholder="Apodo (opcional)"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          disabled={nombreBloqueado}
          className={`${inputClass} disabled:opacity-60`}
          style={{ color: 'var(--pitch-900)' }}
        />

        <p className="text-xs" style={{ color: nombreBloqueado ? 'var(--pitch-300)' : 'var(--gold-500)' }}>
          {nombreBloqueado
            ? 'Ya usaste tu cambio: el nombre y el apodo quedaron fijos.'
            : 'Ojo: el nombre y el apodo se pueden cambiar una sola vez.'}
        </p>

        {!nombreBloqueado && (
          <button
            type="submit"
            disabled={guardando || !hayCambios}
            className="tap rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm disabled:opacity-40"
            style={{ background: 'var(--paper)' }}
          >
            {guardando ? 'Guardando...' : hayCambios ? 'Guardar cambios' : 'No hay cambios para guardar'}
          </button>
        )}
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

      {jugador.es_admin && (
        <Link
          to="/panel"
          className="tap glass mt-5 block w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold"
          style={{ color: 'var(--gold-500)' }}
        >
          Panel del creador
        </Link>
      )}

      <div className="glass mt-5 rounded-2xl p-5 text-center">
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
          {TEXTO_COLABORAR}
        </p>
        <a
          href={LINK_COLABORAR}
          target="_blank"
          rel="noopener noreferrer"
          className="tap glass-strong mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
          style={{ color: 'var(--pitch-900)' }}
        >
          <Icono name="fuego" size={15} /> Colaborar
        </a>
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

      {!dandoDeBaja ? (
        <button
          onClick={() => setDandoDeBaja(true)}
          className="tap mt-3 w-full px-4 py-3 text-[13px] font-semibold"
          style={{ color: 'var(--pitch-300)' }}
        >
          Darme de baja
        </button>
      ) : (
        <div className="glass anim-rise mt-3 rounded-2xl p-5">
          <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
            ¿Seguro que querés darte de baja?
          </p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
            Se borran tu mail, tu nombre, tu apodo, tu foto, tu bio y tu ubicación, y no vas a poder volver a entrar
            con esta cuenta. <strong>No tiene vuelta atrás.</strong>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
            Tu paso por los partidos queda, sin tu nombre: también es el historial de los que jugaron con vos, y
            borrarlo les rompería sus estadísticas y las valoraciones que recibieron.
          </p>

          {errorBaja && (
            <p
              className="mt-3 rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
              style={{ background: 'rgba(224,122,99,.14)', color: 'var(--error)' }}
            >
              {errorBaja}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setDandoDeBaja(false)
                setErrorBaja(null)
              }}
              className="tap flex-[2] rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
            >
              Mejor me quedo
            </button>
            <button
              onClick={darmeDeBaja}
              disabled={confirmandoBaja}
              className="tap glass flex-1 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{ color: 'var(--error)' }}
            >
              {confirmandoBaja ? 'Borrando...' : 'Darme de baja'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
