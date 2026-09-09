import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { guardarInvitadoPorDeLaUrl } from './lib/reclutamiento'

guardarInvitadoPorDeLaUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
