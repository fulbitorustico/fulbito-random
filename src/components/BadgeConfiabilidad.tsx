import { CONFIABILIDAD_INFO, nivelDesdeBajasTardias } from '../lib/confiabilidad'
import Icono from './Icono'

export default function BadgeConfiabilidad({ bajasTardias }: { bajasTardias: number }) {
  const nivel = nivelDesdeBajasTardias(bajasTardias)
  const info = CONFIABILIDAD_INFO[nivel]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: info.bg, color: info.color }}
    >
      <Icono name="punto" size={8} />
      {info.label}
    </span>
  )
}
