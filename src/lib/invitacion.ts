// El token del partido viaja en el link y hay que sostenerlo mientras la
// persona se hace la cuenta: entra por /p/xxxx, se va al login, vuelve del
// mail, completa el perfil, y recién ahí se la puede anotar.
//
// Es el mismo mecanismo que ya usa `reclutamiento.ts` para el "?ref=".

const CLAVE = 'fr_partido_del_link'

export function guardarPartidoDelLink(token: string) {
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    // Navegador con el almacenamiento bloqueado: se pierde el token y la
    // persona vuelve a tocar el link. No es motivo para romper nada.
  }
}

export function tomarPartidoDelLink(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function limpiarPartidoDelLink() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // ídem
  }
}
