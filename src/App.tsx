import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import Marca from './components/Marca'
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
import BuscarJugadores from './pages/BuscarJugadores'
import CanchaDetalle from './pages/CanchaDetalle'
import Instalar from './pages/Instalar'
import Panel from './pages/Panel'
import Sugerencias from './components/Sugerencias'

function Shell() {
  const location = useLocation()

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-lg items-center justify-between px-4 pt-5">
        <Marca size="sm" />
        <Link to="/instalar" className="text-[11px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
          Ponela en tu celu
        </Link>
      </header>
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
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
          <Route path="/buscar" element={<PageTransition><BuscarJugadores /></PageTransition>} />
          <Route path="/canchas/:id" element={<PageTransition><CanchaDetalle /></PageTransition>} />
          <Route path="/panel" element={<PageTransition><Panel /></PageTransition>} />
          <Route path="*" element={<Navigate to="/partidos" replace />} />
        </Routes>
      </div>
      <Sugerencias />
      <BottomNav />
    </div>
  )
}

function Router() {
  const { session, jugador, loading } = useAuth()
  const location = useLocation()

  // Rutas que se ven igual con o sin sesión (incluye /landing, para poder
  // mirar la landing aunque estés logueado).
  const esRutaPublica =
    location.pathname.startsWith('/reclamar/') ||
    location.pathname === '/terminos' ||
    location.pathname === '/privacidad' ||
    location.pathname === '/landing' ||
    location.pathname === '/instalar' ||
    /^\/grupos\/[^/]+\/publico$/.test(location.pathname)

  if (esRutaPublica) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/reclamar/:id" element={<ReclamarPerfil />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/instalar" element={<Instalar />} />
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
