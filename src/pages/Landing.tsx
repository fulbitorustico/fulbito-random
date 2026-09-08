import { Link } from 'react-router-dom'

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

export default function Landing() {
  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
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

        <section className="anim-pop mt-12 text-center">
          <h1 className="brand text-5xl leading-[0.95]" style={{ color: 'var(--pitch-900)' }}>
            Nunca más un partido
            <br />
            que se cae por faltar uno
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-[15px]" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
            Armá tu fulbito, completá el cupo con la comunidad y dejá de escribirle a diez personas por WhatsApp.
          </p>
          <Link
            to="/login"
            className="tap mt-7 inline-block rounded-2xl px-7 py-4 text-[15px] font-semibold text-white shadow-sm"
            style={{ background: 'var(--pitch-500)' }}
          >
            Armar mi primer partido
          </Link>
        </section>

        <section className="mt-14">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            Cómo funciona
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {PASOS.map((p) => (
              <div key={p.n} className="glass anim-rise flex gap-4 rounded-[24px] p-5">
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

        <section className="mt-14">
          <p className="brand text-xl" style={{ color: 'var(--pitch-900)' }}>
            Qué tiene la app
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
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

        <section className="glass-strong anim-pop mt-14 rounded-[28px] p-7 text-center">
          <p className="brand text-2xl" style={{ color: 'var(--pitch-900)' }}>
            ¿Organizás fulbito?
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--pitch-700)', opacity: 0.8 }}>
            Entrá con tu email, sin contraseñas. Es gratis.
          </p>
          <Link
            to="/login"
            className="tap mt-5 inline-block w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm"
            style={{ background: 'var(--pitch-500)' }}
          >
            Entrar con email
          </Link>
        </section>

        <footer className="mt-10 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
          Fulbito Random · fútbol amateur en Argentina
        </footer>
      </div>
    </div>
  )
}
