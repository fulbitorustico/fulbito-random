import { Link } from 'react-router-dom'

export default function BasesYCondiciones() {
  return (
    <div>
      <Link to="/perfil" className="mb-4 inline-block text-sm font-medium" style={{ color: 'var(--pitch-500)' }}>
        ← Volver
      </Link>
      <h1 className="mb-5 text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
        Bases y condiciones
      </h1>
      <div
        className="glass-strong flex flex-col gap-4 rounded-[28px] p-6 text-sm leading-relaxed"
        style={{ color: 'var(--pitch-700)' }}
      >
        <p>
          Fulbito Random es un espacio para organizar partidos amateur entre conocidos. Al usarla, aceptás estas
          reglas simples:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Anotate a un partido solo si tenés intención real de jugarlo.</li>
          <li>Si no podés ir, bajate lo antes posible para liberar el lugar a otro.</li>
          <li>Las valoraciones son para ayudar al grupo, no para ajustar cuentas — sé justo.</li>
          <li>El admin de cada partido puede editar horario, cancha o cupo, o cancelarlo si hace falta.</li>
        </ul>
        <p className="text-xs" style={{ color: 'var(--pitch-300)' }}>
          Última actualización: septiembre 2026.
        </p>
      </div>
    </div>
  )
}
