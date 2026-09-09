import { useState } from 'react'
import { Link } from 'react-router-dom'
import MockupTelefono from '../components/MockupTelefono'
import Marca from '../components/Marca'
import LogoFR from '../components/LogoFR'
import Icono, { type NombreIcono } from '../components/Icono'
import { INSIGNIAS } from '../lib/insignias'

const PASOS = [
  {
    n: '01',
    titulo: 'Cargás el partido',
    texto: 'Dónde, qué día, a qué hora y cuántos entran. Tarda menos que escribir el mensaje del grupo.',
  },
  {
    n: '02',
    titulo: 'Pasás el link por WhatsApp',
    texto: 'Cada uno toca y se anota solo. Vos ves en vivo cuántos hay y cuántos faltan, sin contar mensajes.',
  },
  {
    n: '03',
    titulo: 'Si falta uno, lo buscás',
    texto: 'Entrás al buscador, filtrás por el puesto que te falta y lo invitás. Te contesta ahí mismo.',
  },
  {
    n: '04',
    titulo: 'Terminó: cada uno puntúa',
    texto: 'Diez segundos por compañero. Nadie ve quién puso qué, solo queda el promedio.',
  },
]

const FEATURES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: 'rayo',
    titulo: 'Convocatoria abierta',
    texto: 'No dependas de juntar a las diez personas del grupo por WhatsApp.',
  },
  {
    icono: 'estrella',
    titulo: 'Reputación portátil',
    texto: 'Valoración por estrellas entre compañeros, anónima y siempre con vos.',
  },
  {
    icono: 'personas',
    titulo: 'Grupos privados',
    texto: 'Tu grupo de siempre, o abierto a desconocidos cuando falte gente.',
  },
  {
    icono: 'balanza',
    titulo: 'Equipos parejos, si querés',
    texto: 'Si lo activás al crear el partido, un toque arma dos equipos equilibrados.',
  },
  {
    icono: 'pin',
    titulo: 'Cerca tuyo',
    texto: 'Los partidos abiertos se ordenan por distancia real, con cuenta regresiva.',
  },
  {
    icono: 'etiqueta',
    titulo: 'Gratis, sin vueltas',
    texto: 'El compromiso se cuida con reputación, no con multas.',
  },
]

// Testimonios reales de gente que la usó. Si el array está vacío, la sección
// no aparece: preferimos no mostrar nada antes que inventar frases.
const TESTIMONIOS: { texto: string; nombre: string; detalle: string }[] = []

const JUGADORES_DEMO = [
  { id: 'pablo', nombre: 'Pablo', apodo: 'La Joya Fake', posicion: 'Delantero centro', color: 'var(--acc-coral)' },
  { id: 'mario', nombre: 'Mario', apodo: 'El Enmascarado', posicion: 'Defensor central', color: 'var(--acc-purple)' },
  { id: 'camilo', nombre: 'Camilo', apodo: 'Ninja', posicion: 'Volante ofensivo', color: 'var(--acc-blue)' },
  { id: 'seba', nombre: 'Seba', apodo: 'Duffman', posicion: 'Arquero', color: 'var(--acc-orange)' },
]

const PARTIDOS_DEMO = [
  {
    cancha: 'La Bombonerita',
    grupo: null,
    cuando: 'sáb 13 sep, 20:30',
    falta: 'en 3 h',
    distancia: '1,2 km',
    precio: '$4.500',
    lugares: 2,
    anotados: 8,
    cupo: 10,
  },
  {
    cancha: 'Complejo El Potrero',
    grupo: 'Los jueves de Pedro',
    cuando: 'jue 18 sep, 21:00',
    falta: 'en 5 días',
    distancia: '3,4 km',
    precio: '$3.800',
    lugares: 1,
    anotados: 9,
    cupo: 10,
  },
  {
    cancha: 'Fútbol 5 Palermo',
    grupo: null,
    cuando: 'dom 14 sep, 19:00',
    falta: 'en 1 día',
    distancia: '5,8 km',
    precio: null,
    lugares: 0,
    anotados: 10,
    cupo: 10,
  },
]

const EQUIPOS_DEMO = {
  a: { promedio: '4,2', jugadores: [['Cami', '4,6'], ['Juan', '3,8'], ['Belén', '4,1'], ['Diego', '4,3'], ['Pili', '4,2']] },
  b: { promedio: '4,1', jugadores: [['Nico', '4,5'], ['Sofi', '4,0'], ['Lucho', '3,9'], ['Meli', '4,2'], ['Rama', '4,1']] },
}

function NavMockup({ activa = 'Partidos' }: { activa?: string }) {
  const tabs = ['Partidos', 'Grupos', 'Jugadores', 'Perfil']
  return (
    <div
      className="glass-strong mx-auto mb-3 mt-auto flex shrink-0 items-center justify-between rounded-full p-1"
      style={{ width: '96%' }}
    >
      {tabs.map((t) => (
        <span
          key={t}
          className="flex-1 rounded-full py-1.5 text-center text-[8.5px] font-bold"
          style={
            t === activa
              ? { background: 'var(--paper)', color: 'var(--ink-900)' }
              : { color: 'var(--pitch-700)' }
          }
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function PantallaPartidos() {
  return (
    <>
      <div className="mb-2.5 flex shrink-0 items-center justify-between">
        <p className="text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
          Partidos
        </p>
        <span
          className="rounded-full px-2.5 py-1 text-[9px] font-bold text-[color:var(--ink-900)]"
          style={{ background: 'var(--paper)' }}
        >
          + Nuevo
        </span>
      </div>

      <div className="flex min-h-0 flex-col gap-2">
        {PARTIDOS_DEMO.map((p) => (
          <div key={p.cancha} className="glass shrink-0 rounded-2xl p-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                  {p.cancha}
                  {p.grupo && (
                    <span className="ml-1 text-[8px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
                      {p.grupo}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[9px]" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
                  {p.cuando}
                  <span style={{ color: 'var(--gold-500)' }}> · {p.falta}</span>
                </p>
                <p
                  className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold"
                  style={{ color: 'var(--acc-green)' }}
                >
                  <Icono name="pin" size={10} />
                  {p.distancia}
                  {p.precio && ` · ${p.precio}/jugador`}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold"
                style={
                  p.lugares > 0
                    ? { background: 'rgba(237,197,141,.18)', color: 'var(--gold-500)' }
                    : { background: 'rgba(242,239,233,.07)', color: 'var(--pitch-300)' }
                }
              >
                {p.lugares > 0 ? `Faltan ${p.lugares}` : 'Completo'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px]" style={{ color: 'var(--pitch-300)' }}>
                {p.anotados}/{p.cupo} anotados
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[9px] font-bold"
                style={
                  p.lugares > 0
                    ? { background: 'var(--paper)', color: 'var(--ink-900)' }
                    : { background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }
                }
              >
                {p.lugares > 0 ? 'Sumarme' : 'Bajarme'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <NavMockup />
    </>
  )
}

function PantallaValorar() {
  const [indice, setIndice] = useState(0)
  const [estrellas, setEstrellas] = useState(0)
  const [insignia, setInsignia] = useState('')
  const [puntajes, setPuntajes] = useState<Record<string, number>>({})

  const actual = JUGADORES_DEMO[indice]
  const termino = indice >= JUGADORES_DEMO.length

  function valorar() {
    if (!estrellas || !actual) return
    setPuntajes((p) => ({ ...p, [actual.id]: estrellas }))
    setIndice((i) => i + 1)
    setEstrellas(0)
    setInsignia('')
  }

  function reiniciar() {
    setIndice(0)
    setEstrellas(0)
    setInsignia('')
    setPuntajes({})
  }

  return (
    <>
      <p className="shrink-0 text-[14px] font-bold" style={{ color: 'var(--pitch-900)' }}>
        Valorá a tus compañeros
      </p>
      <div className="mb-3 flex shrink-0 items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-[9px]" style={{ color: 'var(--pitch-300)' }}>
          La Bombonerita · anónimo
        </p>
        <span className="shrink-0 text-[9px] font-bold" style={{ color: 'var(--gold-500)' }}>
          {Math.min(indice + (termino ? 0 : 1), 4)} de 4
        </span>
      </div>

      {!termino && actual && (
        <div key={actual.id} className="glass-strong anim-rise shrink-0 rounded-[20px] p-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-[color:var(--ink-900)]"
              style={{ background: actual.color }}
            >
              {actual.nombre[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                {actual.nombre}{' '}
                <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{actual.apodo}"</span>
              </p>
              <p className="text-[8.5px]" style={{ color: 'var(--pitch-300)' }}>
                {actual.posicion}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                className="tap"
                aria-label={`${n} estrellas para ${actual.nombre}`}
              >
                <svg width="26" height="26" viewBox="0 0 20 20">
                  <path
                    d="M10 1.5 12.5 7 18.5 7.8 14 11.9 15.3 18 10 14.8 4.7 18 6 11.9 1.5 7.8 7.5 7Z"
                    fill={estrellas >= n ? 'var(--gold-500)' : 'rgba(242,239,233,.14)'}
                  />
                </svg>
              </button>
            ))}
          </div>

          <p className="mt-2.5 text-[8.5px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
            Insignia (opcional)
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {INSIGNIAS.slice(0, 5).map((ins) => {
              const activa = insignia === ins.id
              return (
                <button
                  key={ins.id}
                  type="button"
                  onClick={() => setInsignia(activa ? '' : ins.id)}
                  className="tap flex items-center gap-1 rounded-full px-2 py-1 text-[8.5px] font-bold"
                  style={{
                    background: activa ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                    color: activa ? 'var(--ink-900)' : 'var(--pitch-700)',
                  }}
                >
                  <Icono name={ins.icono} size={11} />
                  {ins.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={valorar}
            disabled={!estrellas}
            className="tap mt-3 w-full rounded-xl py-1.5 text-center text-[10px] font-bold text-[color:var(--ink-900)] disabled:opacity-40"
            style={{ background: 'var(--paper)' }}
          >
            {estrellas ? `Valorar a ${actual.nombre}` : 'Tocá las estrellas'}
          </button>
        </div>
      )}

      {termino && (
        <div className="glass-strong anim-pop shrink-0 rounded-[20px] p-4 text-center">
          <div className="flex justify-center" style={{ color: 'var(--acc-green)' }}>
            <Icono name="cumplidor" size={26} />
          </div>
          <p className="mt-2 text-[11px] font-bold" style={{ color: 'var(--pitch-900)' }}>
            Ya valoraste a todos
          </p>
          <p className="mt-1 text-[9px]" style={{ color: 'var(--pitch-300)' }}>
            Nadie va a ver quién puso qué
          </p>
          <button
            type="button"
            onClick={reiniciar}
            className="tap mt-3 w-full rounded-xl py-1.5 text-[10px] font-bold"
            style={{ background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }}
          >
            Probar de nuevo
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {JUGADORES_DEMO.map((j, i) => {
          if (!termino && i === indice) return null
          const puntaje = puntajes[j.id]
          return (
            <div key={j.id} className="glass shrink-0 rounded-2xl p-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-[color:var(--ink-900)]"
                  style={{ background: j.color, opacity: puntaje ? 1 : 0.45 }}
                >
                  {j.nombre[0]}
                </div>
                <p className="min-w-0 flex-1 truncate text-[10.5px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
                  {j.nombre} <span style={{ color: 'var(--pitch-300)', fontWeight: 400 }}>"{j.apodo}"</span>
                </p>
                {puntaje ? (
                  <span
                    className="flex items-center gap-1 text-[9px] font-bold"
                    style={{ color: 'var(--gold-500)' }}
                  >
                    <Icono name="estrella" size={9} />
                    {puntaje}
                  </span>
                ) : (
                  <span className="text-[9px]" style={{ color: 'var(--pitch-300)' }}>
                    en espera
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <NavMockup activa="Partidos" />
    </>
  )
}

function PantallaEquipos() {
  return (
    <>
      <p className="shrink-0 text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
        La Bombonerita
      </p>
      <p className="shrink-0 text-[9px]" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
        sáb 13 sep, 20:30 · 10/10 anotados
      </p>
      <p
        className="mb-3 flex shrink-0 items-center gap-1 text-[9px] font-semibold"
        style={{ color: 'var(--acc-green)' }}
      >
        <Icono name="balanza" size={10} /> Equipos parejos · 0,1 de diferencia
      </p>

      {(['a', 'b'] as const).map((lado) => {
        const equipo = EQUIPOS_DEMO[lado]
        const color = lado === 'a' ? 'var(--paper)' : 'var(--gold-500)'
        return (
          <div key={lado} className="glass mb-2 shrink-0 rounded-2xl p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-[color:var(--ink-900)]"
                  style={{ background: color }}
                >
                  {lado.toUpperCase()}
                </span>
                Equipo {lado.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color }}>
                prom. <Icono name="estrella" size={9} /> {equipo.promedio}
              </span>
            </div>
            {equipo.jugadores.map(([nombre, rating]) => (
              <div key={nombre} className="flex items-center justify-between py-0.5">
                <span className="text-[9.5px]" style={{ color: 'var(--pitch-700)' }}>
                  {nombre}
                </span>
                <span
                  className="flex items-center gap-1 text-[9px] font-semibold"
                  style={{ color: 'var(--gold-500)' }}
                >
                  <Icono name="estrella" size={9} /> {rating}
                </span>
              </div>
            ))}
          </div>
        )
      })}

      <div
        className="shrink-0 rounded-xl py-1.5 text-center text-[10px] font-bold"
        style={{ background: 'rgba(242,239,233,.07)', color: 'var(--pitch-700)' }}
      >
        Volver a generar equipos
      </div>

      <NavMockup activa="Partidos" />
    </>
  )
}

const PREGUNTAS: { q: string; a: string }[] = [
  {
    q: '¿Las valoraciones se ven con nombre y apellido?',
    a: 'No. Solo se muestra el promedio y la cantidad. Nadie sabe quién le puso qué a quién, y solo pueden valorarte los que jugaron ese partido con vos, dentro de las 24 horas siguientes.',
  },
  {
    q: 'Valoré a mis compañeros y no cambió nada, ¿falló?',
    a: 'No: es a propósito. Las valoraciones de un partido quedan guardadas pero no entran a ningún promedio hasta que pasan 24 horas del partido. Recién ahí aparecen todas juntas. Es para que nadie pueda mirar qué le pusieron y devolver el golpe: cuando te enterás, ya pasó el momento de responder. Mientras tanto podés dejarle una reacción al partido.',
  },
  {
    q: '¿Por qué todos arrancan en 3 estrellas?',
    a: 'Para que el promedio signifique algo. Si cada uno arrancara en 5, la única forma de moverse sería para abajo y todos terminarían iguales. Arrancando en el medio, subir y bajar cuestan lo mismo.',
  },
  {
    q: '¿Qué es ser "confiable"?',
    a: 'Se mide por las bajas de último momento: si te bajás con menos de 45 minutos, cuenta. Con una o ninguna sos confiable; después pasás a "a prueba" y a "poco confiable". El que arma el partido puede pedir que solo entren confiables.',
  },
  {
    q: '¿Quién puede armar los equipos?',
    a: 'El capitán y el subcapitán. Los equipos se arman solos, repartiendo por promedio en zigzag para que queden parejos.',
  },
  {
    q: 'Me invitaron a un partido de un grupo del que no soy parte, ¿puedo entrar?',
    a: 'Sí. La invitación te da ese partido, y solo ese: no te da el grupo ni los otros partidos del grupo. Para entrar al grupo tenés que pedirlo aparte, y ahí decide quien lo creó.',
  },
  {
    q: 'El partido está lleno y quiero jugar, ¿qué pasa?',
    a: 'Por ahora entra el que llega primero. Estamos armando la lista de espera: si el cupo es 10 y ya están, te anotás igual como 11, 12 y así. Si alguien se baja, entra el 11. Si se baja otro, el 12. Es por orden, sin vueltas.',
  },
  {
    q: 'Estar en la lista de espera, ¿es estar en el banco?',
    a: 'No, es tener el lugar guardado. En el fulbito siempre se cae alguien, así que la lista se mueve. Y el que está en la lista tiene la misma responsabilidad que los diez: si te toca entrar, vas. Avisar que no podés estando 11 vale lo mismo que avisarlo estando entre los que juegan.',
  },
  {
    q: 'Dos nos anotamos al mismo tiempo para el último lugar, ¿quién entra?',
    a: 'Ahí, y solo ahí, mira el historial: entra el que más viene jugando ese partido, contando los últimos 4 encuentros. Es para no decidir por milésimas de segundo. El otro queda primero en la lista de espera, que es el primero en entrar si alguien se baja.',
  },
  {
    q: 'Soy el capitán y no puedo ir, ¿qué hago?',
    a: 'Antes de bajarte tenés que pasarle la capitanía a alguno de los anotados: si te vas sin dejar a nadie a cargo, quedan diez personas sin quién organice. Pasarla no te cuesta nada.',
  },
  {
    q: '¿Qué son las tarjetas del capitán?',
    a: 'Bajarte de un partido que armaste vos es una amarilla, y se ve en tu perfil. Con dos amarillas en dos meses es roja: quedás dos fechas sin poder armar partidos. La suspensión se cumple jugando, no esperando: jugás dos partidos y volvés a poder ser capitán. Armar un partido es un compromiso con nueve personas más, y por eso es lo único que la app sanciona.',
  },
  {
    q: '¿Puedo estar en varios grupos?',
    a: 'Sí, en todos los que quieras. Los del laburo, los del barrio y los del club pueden convivir sin mezclarse.',
  },
  {
    q: 'Me pasaron un link de un partido y no tengo la app, ¿qué hago?',
    a: 'Abrilo y listo. Vas a ver dónde y cuándo se juega, cuántos faltan y quién te invita. Si te sumás te pide el mail para confirmar que sos vos, y quedás anotado. No hay que instalar nada.',
  },
  {
    q: '¿Cuánto sale?',
    a: 'Nada. La app es gratis.',
  },
]

export default function Landing() {
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null)

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8 md:max-w-4xl">
        <header className="flex items-center justify-between">
          <Marca />
          <Link
            to="/login"
            className="tap rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--ink-900)]"
            style={{ background: 'var(--paper)' }}
          >
            Entrar
          </Link>
        </header>

        <section className="mt-12 md:grid md:grid-cols-2 md:items-center md:gap-10">
          <div className="anim-pop text-center md:text-left">
            <h1
              className="brand text-balance text-[30px] leading-[1.05] md:text-5xl"
              style={{ color: 'var(--pitch-900)' }}
            >
              Nunca más un partido que se cae por faltar uno
            </h1>
            <p
              className="mx-auto mt-4 max-w-xs text-[15px] md:mx-0"
              style={{ color: 'var(--pitch-700)', opacity: 0.8 }}
            >
              Armá tu fulbito, completá el cupo con la comunidad y dejá de escribirle a diez personas por WhatsApp.
            </p>
            <Link
              to="/login"
              className="tap mt-7 inline-block rounded-2xl px-7 py-4 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm"
              style={{ background: 'var(--paper)' }}
            >
              Armar mi primer partido
            </Link>
          </div>

          <div className="anim-rise mt-12 md:mt-0">
            <MockupTelefono>
              <PantallaPartidos />
            </MockupTelefono>
            <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
              Los partidos abiertos, ordenados por lo que tenés más cerca.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            Cómo funciona
          </p>
          <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2">
            {PASOS.map((p) => (
              <div key={p.n} className="glass anim-rise flex gap-4 rounded-[24px] p-5 md:flex-col md:gap-2">
                <span className="brand shrink-0 text-3xl" style={{ color: 'var(--gold-500)' }}>
                  {p.n}
                </span>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                    {p.titulo}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
                    {p.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 md:grid md:grid-cols-2 md:items-center md:gap-10">
          <div className="text-center md:order-2 md:text-left">
            <span
              className="inline-block rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(237,197,141,.16)', color: 'var(--gold-500)' }}
            >
              Probalo acá · es una demo
            </span>
            <p className="brand mt-4 text-3xl leading-none" style={{ color: 'var(--pitch-900)' }}>
              Después del partido,
              <br />
              cada uno puntúa
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm md:mx-0" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
              Estrellas del 1 al 5 y una insignia por compañero, solo a los que jugaron con vos. Nadie ve quién puso
              qué: se muestra únicamente el promedio.
            </p>
          </div>

          <div className="mt-8 md:order-1 md:mt-0">
            <MockupTelefono>
              <PantallaValorar />
            </MockupTelefono>
            <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
              Tocá las estrellas y las insignias — es una demo, no se guarda nada.
            </p>
          </div>
        </section>

        <section className="mt-20 md:grid md:grid-cols-2 md:items-center md:gap-10">
          <div className="text-center md:text-left">
            <p className="brand text-3xl leading-none" style={{ color: 'var(--pitch-900)' }}>
              Y si querés,
              <br />
              te armamos los equipos
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm md:mx-0" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
              Lo activás al crear el partido, solo si te sirve — no viene puesto de fábrica. Si lo prendés, con las
              valoraciones que ya tiene cada uno la app reparte los dos equipos lo más parejos posible, y podés
              volver a tirar el reparto las veces que quieras.
            </p>
          </div>

          <div className="mt-8 md:mt-0">
            <MockupTelefono>
              <PantallaEquipos />
            </MockupTelefono>
          </div>
        </section>

        <section className="mt-20">
          <Link
            to="/instalar"
            className="tap glass-strong anim-rise flex items-center gap-4 rounded-[28px] p-6"
            style={{ border: '1px solid rgba(157,204,218,.35)' }}
          >
            <LogoFR size={52} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold" style={{ color: 'var(--pitch-900)' }}>
                Ponela en tu celular
              </p>
              <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
                Te queda el ícono en la pantalla como cualquier app. No hay que bajar nada de ninguna tienda.
              </p>
              <p className="mt-2 text-[13px] font-bold" style={{ color: 'var(--acc-blue)' }}>
                Te explico paso a paso →
              </p>
            </div>
          </Link>
        </section>

        {TESTIMONIOS.length > 0 && (
          <section className="mt-20">
            <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
              Los que ya juegan
            </p>
            <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-3">
              {TESTIMONIOS.map((t) => (
                <div key={t.nombre} className="glass anim-rise rounded-[24px] p-5">
                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--pitch-900)' }}>
                    "{t.texto}"
                  </p>
                  <p className="mt-3 text-[13px] font-bold" style={{ color: 'var(--acc-green)' }}>
                    {t.nombre}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
                    {t.detalle}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-20">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            El que trae gente, suma
          </p>
          <div className="glass anim-rise mt-4 rounded-[28px] p-6">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
              Cada jugador que entra con tu invitación queda contado como tuyo. Con el primero ya sos{' '}
              <strong style={{ color: 'var(--acc-green)' }}>Armador</strong>; a los tres,{' '}
              <strong style={{ color: 'var(--acc-blue)' }}>Reclutador</strong>; a los diez,{' '}
              <strong style={{ color: 'var(--gold-500)' }}>Cabecilla</strong>, y la chapa te queda en el perfil
              para que la vea todo el grupo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'Armador', desc: '1 jugador', color: 'var(--acc-green)' },
                { label: 'Reclutador', desc: '3 jugadores', color: 'var(--acc-blue)' },
                { label: 'Cabecilla', desc: '10 jugadores', color: 'var(--gold-500)' },
              ].map((r) => (
                <span
                  key={r.label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold"
                  style={{ background: `${r.color}22`, color: r.color }}
                >
                  <Icono name="corona" size={13} />
                  {r.label}
                  <span style={{ color: 'var(--pitch-300)', fontWeight: 500 }}>{r.desc}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            Qué tiene la app
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.titulo} className="glass anim-rise rounded-[22px] p-4">
                <Icono name={f.icono} size={24} className="text-[color:var(--acc-green)]" />
                <p className="mt-2 text-sm font-bold" style={{ color: 'var(--pitch-900)' }}>
                  {f.titulo}
                </p>
                <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--pitch-700)', opacity: 0.75 }}>
                  {f.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-strong anim-pop mt-20 rounded-[28px] p-7 text-center">
          <div className="mb-4 flex justify-center">
            <LogoFR size={54} />
          </div>
          <p className="brand text-2xl" style={{ color: 'var(--pitch-900)' }}>
            ¿Organizás un fulbito?
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
            Entrá con tu email o con Google, sin contraseñas. Es gratis.
          </p>
          <Link
            to="/login"
            className="tap mx-auto mt-5 inline-block w-full max-w-xs rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-[color:var(--ink-900)] shadow-sm"
            style={{ background: 'var(--paper)' }}
          >
            Entrar
          </Link>
        </section>

        <section className="mt-20">
          <div
            className="glass-strong anim-rise rounded-[28px] p-7"
            style={{ border: '1px solid rgba(237,197,141,.3)' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--gold-500)' }}
            >
              Para dueños de canchas
            </p>
            <p className="brand mt-3 text-2xl leading-none" style={{ color: 'var(--pitch-900)' }}>
              ¿Tenés una cancha?
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
              Estamos armando la parte para complejos y organizadores: cargar tu establecimiento, publicar tus
              propios partidos abiertos o cerrados, y que la gente se anote sola con un link. Si querés estar
              entre los primeros, escribime y lo vemos.
            </p>
            <a
              href="mailto:info.fulbitorustico@gmail.com?subject=Tengo%20una%20cancha%20y%20quiero%20sumarme%20a%20Fulbito%20Random&body=Hola!%20Te%20cuento%20de%20mi%20cancha%3A%0A%0ANombre%20del%20complejo%3A%0AZona%3A%0ACu%C3%A1ntas%20canchas%3A%0ATel%C3%A9fono%20de%20contacto%3A%0A"
              className="tap mt-5 inline-block w-full rounded-2xl px-4 py-3.5 text-center text-[15px] font-semibold text-[color:var(--ink-900)]"
              style={{ background: 'var(--gold-500)' }}
            >
              Escribime por mi cancha
            </a>
          </div>
        </section>

        <section className="mt-20">
          <div className="glass anim-rise rounded-[28px] p-7 text-center">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--acc-orange)' }}
            >
              Since 2015
            </p>
            <p className="brand mt-3 text-2xl" style={{ color: 'var(--pitch-900)' }}>
              Venimos de Fulbito Rústico
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
              Fulbito Rústico es el nombre que le pusimos a nuestros partidos: torneos entre varios, la actuación
              de cada uno puntuada fecha a fecha, y una fiesta de cierre a fin de año con premios y menciones para
              los que se la bancaron todo el campeonato. Fulbito Random es esa misma idea, hecha app.
            </p>
            <a
              href="https://instagram.com/fulbitorustico"
              target="_blank"
              rel="noopener noreferrer"
              className="tap glass-strong mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              style={{ color: 'var(--pitch-900)' }}
            >
              <Icono name="camara" size={16} /> @fulbitorustico
            </a>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="mb-1 text-center text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
            Preguntas de siempre
          </h2>
          <p className="mb-6 text-center text-sm" style={{ color: 'var(--pitch-300)' }}>
            Las reglas están a la vista: si no se entienden, parecen acomodo.
          </p>
          <div className="flex flex-col gap-2">
            {PREGUNTAS.map((p, i) => {
              // Una sola abierta por vez: con diez preguntas abiertas, la
              // página se vuelve un scroll interminable.
              const abierta = preguntaAbierta === i
              return (
                <div key={p.q} className="glass anim-rise rounded-2xl p-5">
                  <button
                    onClick={() => setPreguntaAbierta(abierta ? null : i)}
                    aria-expanded={abierta}
                    className="tap flex w-full items-start justify-between gap-3 text-left text-[15px] font-semibold"
                    style={{ color: 'var(--pitch-900)' }}
                  >
                    <span>{p.q}</span>
                    <span
                      className="mt-0.5 shrink-0 transition-transform duration-200"
                      style={{ color: 'var(--pitch-300)', transform: abierta ? 'rotate(45deg)' : 'none' }}
                    >
                      <Icono name="mas" size={15} />
                    </span>
                  </button>
                  {abierta && (
                    <p className="anim-rise mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
                      {p.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <footer className="mt-10 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
          <p>
            Creado por{' '}
            <a
              href="https://x.com/heywilli_e"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: 'var(--acc-blue)' }}
            >
              @heywilli_e
            </a>
          </p>
          <p className="mt-2">
            <span className="marca text-[11px]">
              fulbito <strong>random</strong>
            </span>
            {' · fútbol amateur en Argentina'}
          </p>
          <p className="mt-2">
            <Link to="/terminos" className="underline">
              Términos
            </Link>
            {' · '}
            <Link to="/privacidad" className="underline">
              Privacidad
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
