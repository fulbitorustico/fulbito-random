import { useState } from 'react'
import { Link } from 'react-router-dom'
import MockupTelefono from '../components/MockupTelefono'
import { INSIGNIAS } from '../lib/insignias'

const PASOS = [
  {
    n: '01',
    titulo: 'Armá el partido',
    texto: 'Cancha, hora y cupo. Elegís si queda abierto a la comunidad o solo para tu grupo.',
  },
  {
    n: '02',
    titulo: 'Falta gente, se completa sola',
    texto: 'Si te quedan lugares vacíos, cualquiera cerca tuyo los puede ocupar con un toque.',
  },
  {
    n: '03',
    titulo: 'Jugás, valorás, repetís',
    texto: 'Después del partido calificás a tus compañeros. La reputación te sigue a todos lados.',
  },
]

const FEATURES = [
  {
    emoji: '⚡',
    titulo: 'Convocatoria abierta',
    texto: 'No dependas de juntar a las diez personas del grupo por WhatsApp.',
  },
  {
    emoji: '⭐',
    titulo: 'Reputación portátil',
    texto: 'Valoración por estrellas entre compañeros, anónima y siempre con vos.',
  },
  {
    emoji: '👥',
    titulo: 'Grupos privados',
    texto: 'Tu grupo de siempre, o abierto a desconocidos cuando falte gente.',
  },
  {
    emoji: '⚖️',
    titulo: 'Equipos parejos',
    texto: 'Un toque arma dos equipos equilibrados según el nivel de cada uno.',
  },
  {
    emoji: '📍',
    titulo: 'Cerca tuyo',
    texto: 'Los partidos abiertos se ordenan por distancia real, con cuenta regresiva.',
  },
  {
    emoji: '🆓',
    titulo: 'Gratis, sin vueltas',
    texto: 'El compromiso se cuida con reputación, no con multas.',
  },
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
              ? { background: 'var(--pitch-500)', color: '#fff' }
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
          className="rounded-full px-2.5 py-1 text-[9px] font-bold text-white"
          style={{ background: 'var(--pitch-500)' }}
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
                <p className="mt-0.5 text-[9px] font-semibold" style={{ color: 'var(--pitch-500)' }}>
                  📍 {p.distancia}
                  {p.precio && ` · ${p.precio}/jugador`}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold"
                style={
                  p.lugares > 0
                    ? { background: 'rgba(185,121,31,.16)', color: 'var(--gold-500)' }
                    : { background: 'rgba(18,38,28,.06)', color: 'var(--pitch-300)' }
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
                    ? { background: 'var(--pitch-500)', color: '#fff' }
                    : { background: 'rgba(18,38,28,.07)', color: 'var(--pitch-700)' }
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
  const [estrellas, setEstrellas] = useState(4)
  const [insignia, setInsignia] = useState('killer')

  return (
    <>
      <p className="shrink-0 text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
        Valorá a tus compañeros
      </p>
      <p className="mb-3 shrink-0 text-[9px]" style={{ color: 'var(--pitch-300)' }}>
        La Bombonerita · anónimo, solo se muestra el promedio
      </p>

      <div className="glass-strong shrink-0 rounded-[20px] p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: 'var(--pitch-500)' }}
          >
            C
          </div>
          <div>
            <p className="text-[11px] font-bold" style={{ color: 'var(--pitch-900)' }}>
              Cami
            </p>
            <p className="text-[8.5px]" style={{ color: 'var(--pitch-300)' }}>
              Volante ofensivo
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setEstrellas(n)} className="tap" aria-label={`${n} estrellas`}>
              <svg width="26" height="26" viewBox="0 0 20 20">
                <path
                  d="M10 1.5 12.5 7 18.5 7.8 14 11.9 15.3 18 10 14.8 4.7 18 6 11.9 1.5 7.8 7.5 7Z"
                  fill={estrellas >= n ? 'var(--gold-500)' : 'rgba(18,38,28,.12)'}
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
                className="tap rounded-full px-2 py-1 text-[8.5px] font-bold"
                style={{
                  background: activa ? 'var(--pitch-500)' : 'rgba(18,38,28,.06)',
                  color: activa ? '#fff' : 'var(--pitch-700)',
                }}
              >
                {ins.emoji} {ins.label}
              </button>
            )
          })}
        </div>

        <div
          className="mt-3 rounded-xl py-1.5 text-center text-[10px] font-bold text-white"
          style={{ background: 'var(--pitch-500)' }}
        >
          Valorar
        </div>
      </div>

      {[
        { inicial: 'N', nombre: 'Nico', color: 'var(--gold-500)' },
        { inicial: 'S', nombre: 'Sofi', color: 'var(--pitch-700)' },
        { inicial: 'L', nombre: 'Lucho', color: 'var(--pitch-500)' },
      ].map((j) => (
        <div key={j.nombre} className="glass mt-2 shrink-0 rounded-2xl p-2.5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: j.color }}
            >
              {j.inicial}
            </div>
            <p className="flex-1 text-[10.5px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {j.nombre}
            </p>
            <span className="text-[9px]" style={{ color: 'var(--pitch-300)' }}>
              sin valorar
            </span>
          </div>
        </div>
      ))}

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
      <p className="mb-3 shrink-0 text-[9px] font-semibold" style={{ color: 'var(--pitch-500)' }}>
        ⚖️ Equipos parejos · 0,1 ★ de diferencia
      </p>

      {(['a', 'b'] as const).map((lado) => {
        const equipo = EQUIPOS_DEMO[lado]
        const color = lado === 'a' ? 'var(--pitch-500)' : 'var(--gold-500)'
        return (
          <div key={lado} className="glass mb-2 shrink-0 rounded-2xl p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: color }}
                >
                  {lado.toUpperCase()}
                </span>
                Equipo {lado.toUpperCase()}
              </span>
              <span className="text-[9px] font-semibold" style={{ color }}>
                prom. ★ {equipo.promedio}
              </span>
            </div>
            {equipo.jugadores.map(([nombre, rating]) => (
              <div key={nombre} className="flex items-center justify-between py-0.5">
                <span className="text-[9.5px]" style={{ color: 'var(--pitch-700)' }}>
                  {nombre}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: 'var(--gold-500)' }}>
                  ★ {rating}
                </span>
              </div>
            ))}
          </div>
        )
      })}

      <div
        className="shrink-0 rounded-xl py-1.5 text-center text-[10px] font-bold"
        style={{ background: 'rgba(18,38,28,.06)', color: 'var(--pitch-700)' }}
      >
        Volver a generar equipos
      </div>

      <NavMockup activa="Partidos" />
    </>
  )
}

export default function Landing() {
  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8 md:max-w-4xl">
        <header className="flex items-center justify-between">
          <p className="brand text-2xl" style={{ color: 'var(--pitch-900)' }}>
            Fulbito Random
          </p>
          <Link
            to="/login"
            className="tap rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--pitch-500)' }}
          >
            Entrar
          </Link>
        </header>

        <section className="mt-12 md:grid md:grid-cols-2 md:items-center md:gap-10">
          <div className="anim-pop text-center md:text-left">
            <h1
              className="brand text-balance text-[38px] leading-[0.95] md:text-6xl"
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
              className="tap mt-7 inline-block rounded-2xl px-7 py-4 text-[15px] font-semibold text-white shadow-sm"
              style={{ background: 'var(--pitch-500)' }}
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
          <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-3">
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
              style={{ background: 'rgba(185,121,31,.14)', color: 'var(--gold-500)' }}
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
              Y los equipos
              <br />
              se arman solos
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm md:mx-0" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
              Con las valoraciones que ya tiene cada uno, la app reparte los dos equipos para que queden lo más
              parejos posible. Un toque y listo, sin discutir en el vestuario.
            </p>
          </div>

          <div className="mt-8 md:mt-0">
            <MockupTelefono>
              <PantallaEquipos />
            </MockupTelefono>
          </div>
        </section>

        <section className="mt-20">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            Qué tiene la app
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.titulo} className="glass anim-rise rounded-[22px] p-4">
                <span className="text-2xl">{f.emoji}</span>
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
          <p className="brand text-2xl" style={{ color: 'var(--pitch-900)' }}>
            ¿Organizás fulbito?
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
            Entrá con tu email o con Google, sin contraseñas. Es gratis.
          </p>
          <Link
            to="/login"
            className="tap mx-auto mt-5 inline-block w-full max-w-xs rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm"
            style={{ background: 'var(--pitch-500)' }}
          >
            Entrar
          </Link>
        </section>

        <footer className="mt-10 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
          <p>Fulbito Random · fútbol amateur en Argentina</p>
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
