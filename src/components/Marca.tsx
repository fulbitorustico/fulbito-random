import LogoFR from './LogoFR'

// "fulbito" siempre en Light, "random" siempre en Bold.
export default function Marca({
  size = 'md',
  conLogo = true,
  apilado = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  conLogo?: boolean
  apilado?: boolean
}) {
  const texto = { sm: 'text-[13px]', md: 'text-lg', lg: 'text-2xl' }[size]
  const logo = { sm: 26, md: 38, lg: 58 }[size]

  return (
    <span className="inline-flex items-center gap-2.5">
      {conLogo && <LogoFR size={logo} />}
      <span className={`marca leading-[1.1] ${texto}`} style={{ color: 'var(--paper)' }}>
        fulbito
        {apilado ? <br /> : ' '}
        <strong>random</strong>
      </span>
    </span>
  )
}
