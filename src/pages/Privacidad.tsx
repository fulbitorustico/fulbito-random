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

export default function Privacidad() {
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
        Política de privacidad
      </h1>
      <p className="mb-5 text-xs" style={{ color: 'var(--pitch-300)' }}>
        Última actualización: septiembre 2026.
      </p>

      <div className="glass-strong flex flex-col gap-5 rounded-[28px] p-6">
        <Seccion titulo="1. Qué datos guardamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Cuenta:</strong> tu email, usado para el login (link mágico o Google) y para identificarte
              en la app.
            </li>
            <li>
              <strong>Perfil:</strong> nombre, apodo (opcional), posiciones en la cancha y avatar o foto que
              elijas cargar.
            </li>
            <li>
              <strong>Actividad:</strong> partidos que creás o a los que te sumás, grupos de los que participás,
              y las bajas de partidos (para el sistema de confiabilidad).
            </li>
            <li>
              <strong>Valoraciones:</strong> las estrellas y comentarios que dejás sobre tus compañeros después
              de un partido. Tu voto se guarda asociado a tu cuenta únicamente para evitar que vote dos veces
              sobre el mismo partido — a los demás jugadores <strong>nunca</strong> se les muestra quién los
              valoró, solo el promedio y los comentarios de forma anónima.
            </li>
            <li>
              <strong>Ubicación:</strong> solo si elegís usar "Usar mi ubicación actual" al crear o buscar
              partidos por cercanía. No se guarda un historial de tu ubicación, se usa en el momento para
              calcular distancias.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="2. Qué es obligatorio y qué es opcional">
          <p>
            El email y el nombre son obligatorios para crear una cuenta. El apodo, la foto/avatar, las
            posiciones y compartir tu ubicación son siempre opcionales.
          </p>
        </Seccion>

        <Seccion titulo="3. Para qué usamos tus datos">
          <p>
            Únicamente para el funcionamiento de la app: mostrar partidos y grupos, calcular promedios y
            distancias, y (cuando esté disponible) avisarte por mail sobre novedades de tus partidos o grupos.
            No vendemos ni compartimos tus datos con terceros para publicidad.
          </p>
        </Seccion>

        <Seccion titulo="4. Quién aloja tus datos">
          <p>
            Fulbito Random funciona sobre dos proveedores de infraestructura:{' '}
            <strong>Supabase</strong> (base de datos y autenticación) y <strong>Vercel</strong> (hosting de la
            aplicación). Ambos operan con servidores ubicados en Estados Unidos, por lo que tus datos pueden
            transferirse y almacenarse fuera de Argentina. Ambos proveedores cuentan con políticas de seguridad
            propias para proteger la información que procesan en nuestro nombre.
          </p>
        </Seccion>

        <Seccion titulo="5. Tus derechos (Ley 25.326)">
          <p>
            De acuerdo a la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a acceder,
            rectificar, actualizar o solicitar la supresión de tus datos personales en cualquier momento.
          </p>
          <p>
            Podés editar tu nombre, apodo, posiciones y avatar directamente desde tu Perfil. Para solicitar la
            eliminación completa de tu cuenta y tus datos, o cualquier otra consulta sobre tu información,
            escribinos a{' '}
            <a href="mailto:info.fulbitorustico@gmail.com" className="font-medium" style={{ color: 'var(--pitch-500)' }}>
              info.fulbitorustico@gmail.com
            </a>
            . La Agencia de Acceso a la Información Pública, como órgano de control de la Ley 25.326, es la
            autoridad ante la que podés reclamar si considerás que tus derechos no fueron respetados.
          </p>
        </Seccion>

        <Seccion titulo="6. Cambios en esta política">
          <p>
            Esta política puede actualizarse a medida que la app suma funciones que involucren nuevos datos
            (por ejemplo, notificaciones por mail). Los cambios importantes se van a avisar dentro de la app.
          </p>
        </Seccion>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
        Ver también los{' '}
        <Link to="/terminos" className="font-medium underline" style={{ color: 'var(--pitch-500)' }}>
          Términos y condiciones
        </Link>
        .
      </p>
    </div>
  )
}
