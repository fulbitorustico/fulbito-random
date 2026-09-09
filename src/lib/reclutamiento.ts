const CLAVE = 'fr_invitado_por'

export interface NivelReclutador {
  label: string
  desde: number
  color: string
}

export const NIVELES_RECLUTADOR: NivelReclutador[] = [
  { label: 'Armador', desde: 1, color: '#9fc69a' },
  { label: 'Reclutador', desde: 3, color: '#9dccda' },
  { label: 'Cabecilla', desde: 10, color: '#edc58d' },
]

export function nivelReclutador(reclutas: number): NivelReclutador | null {
  let actual: NivelReclutador | null = null
  for (const n of NIVELES_RECLUTADOR) if (reclutas >= n.desde) actual = n
  return actual
}

// El id de quien te invitó viaja en el link (?ref=) y se guarda hasta que
// completás el perfil, que es cuando recién existe tu jugador.
export function guardarInvitadoPorDeLaUrl() {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (ref) localStorage.setItem(CLAVE, ref)
}

export function tomarInvitadoPor(): string | null {
  return localStorage.getItem(CLAVE)
}

export function limpiarInvitadoPor() {
  localStorage.removeItem(CLAVE)
}
