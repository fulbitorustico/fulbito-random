import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Jugador } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  jugador: Jugador | null
  loading: boolean
  refreshJugador: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [jugador, setJugador] = useState<Jugador | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadJugador(userId: string) {
    const { data } = await supabase
      .from('jugadores')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    setJugador(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadJugador(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadJugador(newSession.user.id)
      } else {
        setJugador(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function refreshJugador() {
    if (session) await loadJugador(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, jugador, loading, refreshJugador }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
