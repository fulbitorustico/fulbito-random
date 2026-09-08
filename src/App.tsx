import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import CompletarPerfil from './pages/CompletarPerfil'
import Partidos from './pages/Partidos'
import NuevoPartido from './pages/NuevoPartido'
import DetallePartido from './pages/DetallePartido'
import ValorarPartido from './pages/ValorarPartido'
import Jugadores from './pages/Jugadores'
import JugadorDetalle from './pages/JugadorDetalle'
import Perfil from './pages/Perfil'
import BasesYCondiciones from './pages/BasesYCondiciones'

function Shell() {
  const location = useLocation()

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
        <Routes location={location} key={location.pathname}>
          <Route path="/partidos" element={<PageTransition><Partidos /></PageTransition>} />
          <Route path="/partidos/nuevo" element={<PageTransition><NuevoPartido /></PageTransition>} />
          <Route path="/partidos/:id" element={<PageTransition><DetallePartido /></PageTransition>} />
          <Route path="/partidos/:id/valorar" element={<PageTransition><ValorarPartido /></PageTransition>} />
          <Route path="/jugadores" element={<PageTransition><Jugadores /></PageTransition>} />
          <Route path="/jugadores/:id" element={<PageTransition><JugadorDetalle /></PageTransition>} />
          <Route path="/perfil" element={<PageTransition><Perfil /></PageTransition>} />
          <Route path="/bases-y-condiciones" element={<PageTransition><BasesYCondiciones /></PageTransition>} />
          <Route path="*" element={<Navigate to="/partidos" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

function Router() {
  const { session, jugador, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </div>
    )
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
