// Supabase Edge Function: envía mails transaccionales vía Resend.
//
// IMPORTANTE: en el proyecto real esta función quedó deployada con el nombre
// visible "notificar" pero el slug/URL real es "rapid-action"
// (https://<proyecto>.supabase.co/functions/v1/rapid-action) — el nombre que
// se le puso al crearla en el Dashboard no coincide con el slug de la URL.
// El frontend (DetallePartido.tsx, GrupoDetalle.tsx) invoca 'rapid-action'
// por eso. Si el día de mañana se borra y se vuelve a crear esta función con
// el nombre "notificar" desde cero, actualizar esos dos `.invoke(...)` para
// que apunten a 'notificar' en vez de 'rapid-action'.
//
// Deploy: npx supabase functions deploy notificar
// Secrets necesarios (Supabase Dashboard → Edge Functions → notificar → Secrets,
// o `npx supabase secrets set RESEND_API_KEY=...`):
//   RESEND_API_KEY  → API key de resend.com (plan free)
//   RESEND_FROM     → opcional, remitente. Por defecto usa el dominio de pruebas de Resend.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya están disponibles automáticamente en runtime.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM = Deno.env.get('RESEND_FROM') ?? 'Fulbito Random <onboarding@resend.dev>'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function emailDeJugador(jugadorId: string): Promise<string | null> {
  const { data: jugador } = await admin.from('jugadores').select('user_id').eq('id', jugadorId).maybeSingle()
  if (!jugador?.user_id) return null
  const { data } = await admin.auth.admin.getUserById(jugador.user_id)
  return data.user?.email ?? null
}

async function enviarMail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY no configurada, se omite el envío:', { to, subject })
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) console.error('Error enviando mail con Resend:', await res.text())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('JSON inválido', { status: 400, headers: CORS_HEADERS })
  }

  try {
    switch (body.tipo) {
      case 'sumaron_partido': {
        const email = await emailDeJugador(String(body.admin_id))
        if (email) {
          await enviarMail(
            email,
            `${body.jugador_nombre} se sumó a tu partido`,
            `<p>${body.jugador_nombre} se anotó en el partido en <strong>${body.cancha}</strong>. Van ${body.anotados}/${body.cupo}.</p>`,
          )
        }
        break
      }
      case 'partido_completo': {
        const email = await emailDeJugador(String(body.admin_id))
        if (email) {
          await enviarMail(
            email,
            `Tu partido en ${body.cancha} se completó`,
            `<p>Ya tenés los ${body.cupo} jugadores confirmados para el partido en <strong>${body.cancha}</strong>. ¡A jugar!</p>`,
          )
        }
        break
      }
      case 'aprobado_grupo': {
        const email = await emailDeJugador(String(body.jugador_id))
        if (email) {
          await enviarMail(
            email,
            `Te sumaron al grupo "${body.grupo_nombre}"`,
            `<p>El admin aprobó tu pedido para unirte al grupo <strong>${body.grupo_nombre}</strong> en Fulbito Random.</p>`,
          )
        }
        break
      }
      default:
        return new Response('Tipo desconocido', { status: 400, headers: CORS_HEADERS })
    }
    return new Response('ok', { headers: CORS_HEADERS })
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500, headers: CORS_HEADERS })
  }
})
