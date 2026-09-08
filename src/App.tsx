import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import CompletarPerfil from './pages/CompletarPerfil'
import Partidos from './pages/Partidos'
import NuevoPartido from './pages/NuevoPartido'
import DetallePartido from './pages/DetallePartido'
import Jugadores from './pages/Jugadores'
import Perfil from './pages/Perfil'
import BasesYCondiciones from './pages/BasesYCondiciones'

function Shell() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 py-3 text-center text-sm font-semibold ${isActive ? 'text-green-600' : 'text-slate-400'}`

  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <div className="flex-1 pb-16">
        <Routes>
          <Route path="/partidos" element={<Partidos />} />
          <Route path="/partidos/nuevo" element={<NuevoPartido />} />
          <Route path="/partidos/:id" element={<DetallePartido />} />
          <Route path="/jugadores" element={<Jugadores />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/bases-y-condiciones" element={<BasesYCondiciones />} />
          <Route path="*" element={<Navigate to="/partidos" replace />} />
        </Routes>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-slate-200 bg-white">
        <NavLink to="/partidos" className={linkClass}>
          ⚽ Partidos
        </NavLink>
        <NavLink to="/jugadores" className={linkClass}>
          👥 Jugadores
        </NavLink>
        <NavLink to="/perfil" className={linkClass}>
          👤 Perfil
        </NavLink>
      </nav>
    </div>
  )
}

function Router() {
  const { session, jugador, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-slate-400">Cargando...</div>
  }

  if (!session) return <Login />
  if (!jugador) return <CompletarPerfil />

  return <Shell />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </BrowserRouter>
  )
}
