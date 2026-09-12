/**
 * ¿Los mails de aviso le llegan a alguien que no sea el dueño de la cuenta
 * de Resend?
 *
 * Hoy **no**. La Edge Function manda desde `onboarding@resend.dev`, que es
 * el dominio de pruebas de Resend, y ese dominio **solo entrega a la casilla
 * del dueño de la cuenta**. Resend acepta el pedido y lo descarta: no falla,
 * no avisa, no llega.
 *
 * PARA PONERLO EN VERDADERO HACEN FALTA DOS COSAS, EN ESTE ORDEN:
 *
 *   1. Un dominio propio verificado en Resend (pegar los registros que
 *      Resend te da, en el panel de tu proveedor de dominio).
 *   2. La variable `RESEND_FROM` cargada en Supabase → Edge Functions →
 *      Secrets, con un remitente de ese dominio. Por ejemplo:
 *      `Fulbito Random <hola@fulbitorandom.com.ar>`
 *
 * Recién cuando las dos estén hechas, cambiar esto a `true`. Mientras siga
 * en falso, la app avisa en pantalla que los mails no están andando, en vez
 * de prometer algo que no cumple.
 *
 * Lo mismo destraba el SMTP propio en Supabase Auth, que hoy está apagado y
 * deja el ingreso por mail con el servidor de prueba: unos pocos por hora.
 */
export const MAILS_A_TERCEROS_ANDANDO = false
