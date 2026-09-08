import { Link, useNavigate } from 'react-router-dom'

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
        {titulo}
      </h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
        {children}
      </div>
    </section>
  )
}

export default function Terminos() {
  const navigate = useNavigate()
  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-block text-sm font-medium"
        style={{ color: 'var(--pitch-500)' }}
      >
        ← Volver
      </button>
      <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Términos y condiciones
      </h1>
      <p className="mb-5 text-xs" style={{ color: 'var(--pitch-300)' }}>
        Última actualización: septiembre 2026.
      </p>

      <div className="glass-strong flex flex-col gap-5 rounded-[28px] p-6">
        <Seccion titulo="1. Qué es Fulbito Random">
          <p>
            Fulbito Random es una aplicación que ayuda a organizar partidos de fútbol amateur: crear partidos,
            sumarse o bajarse, formar grupos y dejar valoraciones entre compañeros de juego.
          </p>
          <p>
            Fulbito Random <strong>no organiza los partidos</strong>, no reserva ni administra canchas, no cobra
            ni gestiona pagos entre jugadores, y no es responsable de lo que ocurra durante el partido (lesiones,
            conflictos entre jugadores, cancelaciones de la cancha, etc.). La app es una herramienta de
            coordinación entre las personas que deciden jugar; la organización real del partido es un acuerdo
            entre ellas.
          </p>
        </Seccion>

        <Seccion titulo="2. Quién puede usar la app">
          <p>
            Para crear una cuenta tenés que tener al menos 16 años. Si sos menor de esa edad, necesitás la
            autorización de tu madre, padre o tutor para usar la app.
          </p>
        </Seccion>

        <Seccion titulo="3. Tu cuenta y tu contenido">
          <p>
            Sos responsable de la información que cargás: tu nombre, apodo, posiciones, foto o avatar, y los
            comentarios que dejás al valorar a otros jugadores. No cargues datos de otra persona sin su
            consentimiento, salvo el caso de un compañero sin cuenta que un admin de grupo suma manualmente para
            anotarlo a un partido (esa persona puede reclamar su perfil más adelante).
          </p>
          <p>
            Fulbito Random puede eliminar contenido o suspender una cuenta que incumpla estas normas de conducta,
            sin necesidad de aviso previo si la situación lo amerita (por ejemplo, acoso o datos falsos
            reiterados).
          </p>
        </Seccion>

        <Seccion titulo="4. Normas de conducta">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>No uses las valoraciones como represalia personal ni para ajustar cuentas fuera de la cancha.</li>
            <li>No inventes jugadores, partidos o resultados falsos.</li>
            <li>No acoses, insultes ni discrimines a otros usuarios dentro de la app.</li>
            <li>No uses la app para fines distintos a organizar y jugar partidos de fútbol amateur.</li>
          </ul>
          <p>El incumplimiento reiterado de estas normas puede derivar en la suspensión de la cuenta.</p>
        </Seccion>

        <Seccion titulo="5. Costo del servicio">
          <p>
            Hoy Fulbito Random es completamente gratis. Si en el futuro se incorporan funciones pagas, se van a
            comunicar con anticipación dentro de la app y nunca se te va a cobrar nada sin tu consentimiento
            explícito.
          </p>
        </Seccion>

        <Seccion titulo="6. Cambios en estos términos">
          <p>
            Estos términos pueden actualizarse a medida que la app suma funciones. Los cambios importantes se
            van a avisar dentro de la app.
          </p>
        </Seccion>

        <Seccion titulo="7. Ley aplicable">
          <p>
            Estos términos se rigen por las leyes de la República Argentina, incluyendo la Ley 24.240 de Defensa
            del Consumidor en lo que resulte aplicable a un servicio gratuito. Ante cualquier consulta, podés
            escribir a{' '}
            <a href="mailto:info.fulbitorustico@gmail.com" className="font-medium" style={{ color: 'var(--pitch-500)' }}>
              info.fulbitorustico@gmail.com
            </a>
            .
          </p>
        </Seccion>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
        Ver también la{' '}
        <Link to="/privacidad" className="font-medium underline" style={{ color: 'var(--pitch-500)' }}>
          Política de privacidad
        </Link>
        .
      </p>
    </div>
  )
}
