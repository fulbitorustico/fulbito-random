import { colorParaNombre, esAvatarSvg, iniciales } from '../lib/avatar'
import Icono from './Icono'

const SIZES = { sm: 36, md: 48, lg: 76 } as const

export default function Avatar({
  nombre,
  avatar,
  fotoUrl,
  size = 'md',
}: {
  nombre: string
  avatar?: string | null
  fotoUrl?: string | null
  size?: keyof typeof SIZES
}) {
  const px = SIZES[size]

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        className="shrink-0 rounded-full object-cover"
        style={{ width: px, height: px, border: '1px solid var(--line)' }}
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-[color:var(--ink-900)]"
      style={{
        width: px,
        height: px,
        background: colorParaNombre(nombre),
        fontSize: px * 0.4,
      }}
    >
      {esAvatarSvg(avatar) ? <Icono name={avatar} size={px * 0.52} /> : iniciales(nombre)}
    </div>
  )
}
