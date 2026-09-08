import { colorParaNombre, iniciales } from '../lib/avatar'

const SIZES = { sm: 36, md: 48, lg: 76 } as const

export default function Avatar({
  nombre,
  avatar,
  size = 'md',
}: {
  nombre: string
  avatar?: string | null
  size?: keyof typeof SIZES
}) {
  const px = SIZES[size]
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
      {avatar ?? iniciales(nombre)}
    </div>
  )
}
