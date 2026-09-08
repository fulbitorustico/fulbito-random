import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="anim-rise">{children}</div>
}
