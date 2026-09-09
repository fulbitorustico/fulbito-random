// Todos los íconos de la app, dibujados como SVG sobre una grilla de 24×24.
// Heredan el color del texto (currentColor), así que no hay imágenes ni emojis.

export type NombreIcono =
  | 'rayo'
  | 'diana'
  | 'pase'
  | 'muralla'
  | 'gambeta'
  | 'cumplidor'
  | 'motor'
  | 'pin'
  | 'estrella'
  | 'personas'
  | 'balanza'
  | 'etiqueta'
  | 'camara'
  | 'compartir'
  | 'link'
  | 'mas'
  | 'check'
  | 'pelota'
  | 'fuego'
  | 'corona'
  | 'guante'
  | 'botin'
  | 'punto'
  | 'chat'

const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const DIBUJOS: Record<NombreIcono, React.ReactNode> = {
  rayo: <path d="M13.5 2.5 5.5 13.5h5l-1 8 8-11h-5l1-8Z" {...TRAZO} />,
  diana: (
    <>
      <circle cx="12" cy="12" r="8.5" {...TRAZO} />
      <circle cx="12" cy="12" r="4.5" {...TRAZO} />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  pase: (
    <>
      <circle cx="5.5" cy="17.5" r="2.4" {...TRAZO} />
      <path d="M8.4 16.2C10 11.4 13.4 8.4 18.6 7.4" {...TRAZO} />
      <path d="M14.6 6.4 19 7.3l-1.2 4.3" {...TRAZO} />
    </>
  ),
  muralla: <path d="M12 2.8 4.6 5.9v6c0 4.4 3.1 7.9 7.4 9.3 4.3-1.4 7.4-4.9 7.4-9.3v-6L12 2.8Z" {...TRAZO} />,
  gambeta: (
    <>
      <path d="M4 19c2.6 0 2.6-4.6 5.2-4.6S11.8 19 14.4 19s2.6-4.6 5.2-4.6" {...TRAZO} />
      <circle cx="17" cy="6.4" r="2.6" {...TRAZO} />
    </>
  ),
  cumplidor: (
    <>
      <circle cx="12" cy="12" r="8.8" {...TRAZO} />
      <path d="m8.2 12.3 2.7 2.7 5-5.4" {...TRAZO} />
    </>
  ),
  motor: <path d="M2.5 12.5h3.8l2-4.6 3.2 9 2.6-6.2 1.6 3.4h5.8" {...TRAZO} />,
  pin: (
    <>
      <path d="M12 21.5s6.6-6.1 6.6-11a6.6 6.6 0 1 0-13.2 0c0 4.9 6.6 11 6.6 11Z" {...TRAZO} />
      <circle cx="12" cy="10.2" r="2.5" {...TRAZO} />
    </>
  ),
  estrella: (
    <path
      d="M12 2.6 14.9 9l7 .9-5.2 4.8 1.5 7-6.2-3.7-6.2 3.7 1.5-7L2.1 9.9l7-.9L12 2.6Z"
      fill="currentColor"
    />
  ),
  personas: (
    <>
      <circle cx="9" cy="8" r="3.4" {...TRAZO} />
      <path d="M3 19.4c0-3.4 2.7-5.7 6-5.7s6 2.3 6 5.7" {...TRAZO} />
      <circle cx="17.6" cy="9.3" r="2.5" {...TRAZO} />
      <path d="M16.2 19.4c.2-2.6 1.9-4.5 4.1-5" {...TRAZO} />
    </>
  ),
  balanza: (
    <>
      <path d="M12 4.2v16" {...TRAZO} />
      <path d="M5 7.4h14" {...TRAZO} />
      <path d="M7.5 20.2h9" {...TRAZO} />
      <path d="M5 7.4 2.4 13a2.9 2.9 0 0 0 5.2 0L5 7.4Z" {...TRAZO} />
      <path d="M19 7.4 16.4 13a2.9 2.9 0 0 0 5.2 0L19 7.4Z" {...TRAZO} />
    </>
  ),
  etiqueta: (
    <>
      <path d="M11.2 3.2H20v8.8l-8.6 8.6a1.8 1.8 0 0 1-2.6 0l-6.2-6.2a1.8 1.8 0 0 1 0-2.6l8.6-8.6Z" {...TRAZO} />
      <circle cx="16.1" cy="7.1" r="1.5" {...TRAZO} />
    </>
  ),
  camara: (
    <>
      <rect x="2.8" y="6.4" width="18.4" height="13.4" rx="3.2" {...TRAZO} />
      <circle cx="12" cy="13.1" r="3.7" {...TRAZO} />
      <path d="M8.4 6.4 9.9 3.6h4.2l1.5 2.8" {...TRAZO} />
    </>
  ),
  compartir: (
    <>
      <circle cx="17.8" cy="5.9" r="2.7" {...TRAZO} />
      <circle cx="6.2" cy="12" r="2.7" {...TRAZO} />
      <circle cx="17.8" cy="18.1" r="2.7" {...TRAZO} />
      <path d="m8.6 10.7 6.8-3.5M8.6 13.3l6.8 3.5" {...TRAZO} />
    </>
  ),
  link: (
    <>
      <path d="M10.2 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3" {...TRAZO} />
      <path d="M13.8 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" {...TRAZO} />
    </>
  ),
  mas: <path d="M12 5.5v13M5.5 12h13" {...TRAZO} />,
  check: <path d="m5 12.6 4.6 4.6L19 7.2" {...TRAZO} />,
  pelota: (
    <>
      <circle cx="12" cy="12" r="9" {...TRAZO} />
      <path d="M12 7.2l4.1 3-1.6 4.9h-5L8 10.2l4-3Z" {...TRAZO} />
      <path d="M12 3v4.2M4.4 9.6l3.6.6M19.6 9.6l-3.6.6M7.6 20l1.9-5M16.4 20l-1.9-5" {...TRAZO} />
    </>
  ),
  fuego: (
    <>
      <path d="M12 2.8c3.4 3.4 6.6 5.8 6.6 10.2A6.6 6.6 0 0 1 5.4 13c0-2.3 1-3.8 2.4-5.3.3 1.5 1.1 2.3 2 2.6-.2-3 .8-5.7 2.2-7.5Z" {...TRAZO} />
      <path d="M12 20.6c-1.9 0-3.2-1.3-3.2-3 0-1.5 1.2-2.4 1.8-3.5.6 1 1.3 1.4 2 1.6 1.3.4 2.6 1 2.6 2.4 0 1.5-1.3 2.5-3.2 2.5Z" {...TRAZO} />
    </>
  ),
  corona: <path d="M3.4 7.6 6.9 12 12 4.6 17.1 12l3.5-4.4 -1.5 11.8H4.9L3.4 7.6Z" {...TRAZO} />,
  guante: (
    <>
      <path d="M7 21.2V13l-1.8-2.2a2 2 0 0 1 2.9-2.8L9.6 9.4V4.3a1.8 1.8 0 0 1 3.6 0v3.5a1.8 1.8 0 0 1 3.5 0v.9a1.8 1.8 0 0 1 3.5.6v4.3c0 3.4-1.8 6-4.4 7.6" {...TRAZO} />
      <path d="M7 17.6h10.8" {...TRAZO} />
    </>
  ),
  botin: (
    <>
      <path d="M2.6 16.6V9.2h4.9l3.1 2.6 7.8 1.7c1.8.4 3 1.9 3 3.6v1.7H2.6v-2.2Z" {...TRAZO} />
      <path d="M6 18.8v1.6M10 18.8v1.6M14 18.8v1.6M18 18.8v1.6" {...TRAZO} />
    </>
  ),
  punto: <circle cx="12" cy="12" r="6" fill="currentColor" />,
  chat: (
    <path
      d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.15-2.9-.42L4 20.5l1.6-3.7C4.3 15.5 3.5 13.85 3.5 12 3.5 7.9 7.3 4.6 12 4.6s8.5 3.3 8.5 7.4Z"
      {...TRAZO}
    />
  ),
}

export default function Icono({
  name,
  size = 18,
  className = '',
}: {
  name: NombreIcono
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none' }}
    >
      {DIBUJOS[name]}
    </svg>
  )
}
