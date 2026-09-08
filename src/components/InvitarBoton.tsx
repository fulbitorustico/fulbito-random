const MENSAJE = '¡Che! Te sumo a Fulbito Random para organizar los partidos: https://fulbito-random.vercel.app'

export default function InvitarBoton() {
  async function invitar() {
    if (navigator.share) {
      try {
        await navigator.share({ text: MENSAJE })
        return
      } catch {
        // el usuario canceló el share nativo, seguimos al fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(MENSAJE)}`, '_blank')
  }

  return (
    <button
      onClick={invitar}
      className="tap inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
      style={{ background: '#25D366' }}
    >
      Invitar amigos
    </button>
  )
}
