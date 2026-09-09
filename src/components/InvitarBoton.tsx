import { useAuth } from '../context/AuthContext'
import Icono from './Icono'

export default function InvitarBoton() {
  const { jugador } = useAuth()

  async function invitar() {
    // El ?ref= es lo que después te acredita ese jugador como tuyo.
    const url = jugador
      ? `${window.location.origin}/landing?ref=${jugador.id}`
      : `${window.location.origin}/landing`
    const mensaje = `¡Che! Te sumo a Fulbito Random para organizar los partidos: ${url}`

    if (navigator.share) {
      try {
        await navigator.share({ text: mensaje })
        return
      } catch {
        // el usuario canceló el share nativo, seguimos al fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  return (
    <button
      onClick={invitar}
      className="tap inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] shadow-sm"
      style={{ background: '#25D366' }}
    >
      <Icono name="compartir" size={14} />
      Invitar amigos
    </button>
  )
}
