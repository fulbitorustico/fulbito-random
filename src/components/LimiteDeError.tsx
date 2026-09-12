import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface Estado {
  fallo: boolean
}

// Si recarga y vuelve a fallar, no se recarga de nuevo: sería un bucle
// infinito y la persona no vería nunca el cartel que explica qué pasa.
const CLAVE_YA_RECARGUE = 'fr_recargue_por_version'

function esVersionVieja(error: Error) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError/i.test(
    `${error.name} ${error.message}`,
  )
}

/**
 * Atrapa los errores que rompen la pantalla entera, con un caso en la mira:
 * **la pestaña que quedó abierta cuando se publicó una versión nueva.**
 *
 * Desde que la app carga las pantallas de a pedazos, una pestaña vieja pide
 * archivos que el despliegue nuevo ya borró. Sin esto, la persona ve una
 * pantalla en blanco y no tiene forma de saber que alcanza con recargar.
 */
export default class LimiteDeError extends Component<Props, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  componentDidCatch(error: Error) {
    let yaRecargue = false
    try {
      yaRecargue = sessionStorage.getItem(CLAVE_YA_RECARGUE) === '1'
    } catch {
      // Almacenamiento bloqueado: se muestra el cartel y listo.
    }

    if (esVersionVieja(error) && !yaRecargue) {
      try {
        sessionStorage.setItem(CLAVE_YA_RECARGUE, '1')
      } catch {
        // ídem
      }
      window.location.reload()
    }
  }

  recargar = () => {
    try {
      sessionStorage.removeItem(CLAVE_YA_RECARGUE)
    } catch {
      // ídem
    }
    window.location.reload()
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <div className="glass-strong w-full max-w-sm rounded-[28px] p-8 text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--pitch-900)' }}>
            Hay una versión nueva
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)' }}>
            Esta pantalla quedó de una versión anterior de la app. Recargá y sigue todo donde estaba: no se pierde
            nada de lo que hayas hecho.
          </p>
          <button
            onClick={this.recargar}
            className="tap mt-6 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold"
            style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }
}
