import { Link } from 'react-router-dom'

export default function BasesYCondiciones() {
  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <Link to="/perfil" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>
      <h1 className="mb-4 text-xl font-bold text-slate-900">Bases y condiciones</h1>
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
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
        <p className="text-xs text-slate-400">Última actualización: septiembre 2026.</p>
      </div>
    </div>
  )
}
