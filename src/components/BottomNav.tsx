import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/partidos', label: 'Partidos', icon: BallIcon },
  { to: '/grupos', label: 'Grupos', icon: GruposIcon },
  { to: '/jugadores', label: 'Jugadores', icon: PeopleIcon },
  { to: '/perfil', label: 'Perfil', icon: PersonIcon },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className="glass-strong fixed inset-x-4 z-40 mx-auto flex max-w-xs items-stretch justify-between rounded-full p-1.5"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`)
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="tap relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-colors duration-300"
            style={{ background: active ? 'var(--paper)' : 'transparent' }}
          >
            <tab.icon active={active} />
            <span
              className="text-[10.5px] font-semibold transition-colors duration-300"
              style={{ color: active ? 'var(--ink-900)' : 'var(--pitch-700)' }}
            >
              {tab.label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function BallIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? 'var(--ink-900)' : 'var(--pitch-700)'} strokeWidth="1.8" />
      <path
        d="M12 8.2 15.2 10.5 14 14.3H10L8.8 10.5 12 8.2Z"
        stroke={active ? 'var(--ink-900)' : 'var(--pitch-700)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GruposIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--ink-900)' : 'var(--pitch-700)'
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" stroke={c} strokeWidth="1.7" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" stroke={c} strokeWidth="1.7" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" stroke={c} strokeWidth="1.7" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" stroke={c} strokeWidth="1.7" />
    </svg>
  )
}

function PeopleIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--ink-900)' : 'var(--pitch-700)'
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.8" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" stroke={c} strokeWidth="1.6" />
      <path d="M15.5 19c.2-2.3 1.7-4 3.7-4.4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PersonIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--ink-900)' : 'var(--pitch-700)'
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" stroke={c} strokeWidth="1.8" />
      <path d="M4.5 19.2c0-3.6 3.3-6.2 7.5-6.2s7.5 2.6 7.5 6.2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
