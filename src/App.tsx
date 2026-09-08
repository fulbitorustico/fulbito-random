import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import PageTransition from './components/PageTransition'
import Landing from './pages/Landing'
import Login from './pages/Login'
import CompletarPerfil from './pages/CompletarPerfil'
import Partidos from './pages/Partidos'
import NuevoPartido from './pages/NuevoPartido'
import DetallePartido from './pages/DetallePartido'
import ValorarPartido from './pages/ValorarPartido'
import Jugadores from './pages/Jugadores'
import JugadorDetalle from './pages/JugadorDetalle'
import Grupos from './pages/Grupos'
import NuevoGrupo from './pages/NuevoGrupo'
import GrupoDetalle from './pages/GrupoDetalle'
import UnirseGrupo from './pages/UnirseGrupo'
import ReclamarPerfil from './pages/ReclamarPerfil'
import Perfil from './pages/Perfil'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'
import GrupoPublico from './pages/GrupoPublico'

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
          <Route path="/grupos" element={<PageTransition><Grupos /></PageTransition>} />
          <Route path="/grupos/nuevo" element={<PageTransition><NuevoGrupo /></PageTransition>} />
          <Route path="/grupos/unirse/:id" element={<PageTransition><UnirseGrupo /></PageTransition>} />
          <Route path="/grupos/:id" element={<PageTransition><GrupoDetalle /></PageTransition>} />
          <Route path="/perfil" element={<PageTransition><Perfil /></PageTransition>} />
          <Route path="*" element={<Navigate to="/partidos" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

function Router() {
  const { session, jugador, loading } = useAuth()
  const location = useLocation()

  const esRutaPublicaConId =
    location.pathname.startsWith('/reclamar/') ||
    location.pathname === '/terminos' ||
    location.pathname === '/privacidad' ||
    /^\/grupos\/[^/]+\/publico$/.test(location.pathname)

  if (esRutaPublicaConId) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/reclamar/:id" element={<ReclamarPerfil />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/grupos/:id/publico" element={<GrupoPublico />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando...
      </div>
    )
  }

  if (!session) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    )
  }
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
