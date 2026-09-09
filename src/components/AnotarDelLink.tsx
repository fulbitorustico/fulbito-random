import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { limpiarPartidoDelLink, tomarPartidoDelLink } from '../lib/invitacion'

/**
 * Cierra el círculo del link compartido: si alguien llegó por un link, se
 * hizo la cuenta y completó el perfil, acá se lo anota al partido y se lo
 * lleva derecho ahí.
 *
 * Sin esto, la persona termina el registro y aparece en una lista de partidos
 * cualquiera, sin entender qué pasó con el partido al que la invitaron.
 */
export default function AnotarDelLink() {
  const { jugador } = useAuth()
  const navigate = useNavigate()
  const yaIntentado = useRef(false)

  useEffect(() => {
    const token = tomarPartidoDelLink()
    if (!jugador || !token || yaIntentado.current) return
    yaIntentado.current = true

    supabase.rpc('sumarme_con_token', { p_token: token }).then(({ data }) => {
      limpiarPartidoDelLink()
      // Si no se pudo (se llenó, se canceló), igual lo llevamos al partido:
      // que lo vea y decida, es mejor que dejarlo sin explicación.
      if (data === 'listo' || data === 'ya_estabas' || data === 'lleno') {
        navigate(`/p/${token}`)
      }
    })
  }, [jugador, navigate])

  return null
}
