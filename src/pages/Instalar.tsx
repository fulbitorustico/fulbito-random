import { useState } from 'react'
import { Link } from 'react-router-dom'
import Marca from '../components/Marca'
import LogoFR from '../components/LogoFR'
import Icono from '../components/Icono'

type Sistema = 'android' | 'iphone'

function detectarSistema(): Sistema {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'iphone' : 'android'
}

const PASOS: Record<Sistema, { titulo: string; texto: string }[]> = {
  android: [
    {
      titulo: 'Abrí esta página en Chrome',
      texto:
        'Si la estás viendo dentro de Instagram, WhatsApp o Facebook, no va a funcionar. Tocá los tres puntitos arriba a la derecha y elegí "Abrir en Chrome".',
    },
    {
      titulo: 'Tocá los tres puntitos ⋮',
      texto: 'Están arriba a la derecha, al lado de la barra donde dice la dirección de la página.',
    },
    {
      titulo: 'Elegí "Instalar aplicación"',
      texto:
        'En algunos teléfonos dice "Agregar a pantalla principal" o "Añadir a inicio". Es lo mismo. Si no la encontrás, bajá un poco: la opción está en el medio de la lista.',
    },
    {
      titulo: 'Confirmá tocando "Instalar"',
      texto: 'Te va a aparecer un cartelito con el logo de Fulbito Random. Tocá "Instalar" y listo.',
    },
    {
      titulo: 'Buscá el ícono en tu pantalla',
      texto:
        'Ya tenés Fulbito Random como una app más, con los cinco pentágonos. Se abre sola, sin la barra del navegador.',
    },
  ],
  iphone: [
    {
      titulo: 'Abrí esta página en Safari',
      texto:
        'Tiene que ser Safari sí o sí: desde Chrome o desde adentro de Instagram el iPhone no deja instalarla. Si estás en otro lado, tocá compartir y elegí "Abrir en Safari".',
    },
    {
      titulo: 'Tocá el botón de compartir',
      texto:
        'Es el cuadradito con la flecha para arriba, abajo en el medio de la pantalla. Si no lo ves, deslizá un poco hacia abajo para que aparezca la barra.',
    },
    {
      titulo: 'Buscá "Agregar a inicio"',
      texto:
        'Deslizá la lista hacia arriba hasta encontrarlo. En algunos iPhone dice "Añadir a pantalla de inicio". Está junto al ícono de un cuadrado con un +.',
    },
    {
      titulo: 'Tocá "Agregar" arriba a la derecha',
      texto: 'Antes te deja cambiarle el nombre, pero dejalo como está.',
    },
    {
      titulo: 'Buscá el ícono en tu pantalla',
      texto:
        'Ya tenés Fulbito Random con los cinco pentágonos, como cualquier otra app. Se abre en pantalla completa.',
    },
  ],
}

export default function Instalar() {
  const [sistema, setSistema] = useState<Sistema>(detectarSistema)
  const pasos = PASOS[sistema]

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <Marca size="sm" />
          <Link to="/landing" className="text-sm font-medium" style={{ color: 'var(--acc-green)' }}>
            ← Volver
          </Link>
        </header>

        <div className="mt-10 flex flex-col items-center text-center">
          <LogoFR size={84} />
          <h1 className="brand mt-5 text-balance text-[30px] leading-[1.05]" style={{ color: 'var(--pitch-900)' }}>
            Ponete Fulbito Random en el celular
          </h1>
          <p className="mt-3 max-w-sm text-[15px]" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
            No hace falta bajar nada de ninguna tienda. En un minuto te queda el ícono en la pantalla, igual que
            cualquier otra app.
          </p>
        </div>

        <div className="mt-8 flex gap-2">
          {(['android', 'iphone'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSistema(s)}
              className="tap flex-1 rounded-2xl px-4 py-3 text-sm font-bold"
              style={{
                background: sistema === s ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                color: sistema === s ? 'var(--ink-900)' : 'var(--pitch-700)',
              }}
            >
              {s === 'android' ? 'Android' : 'iPhone'}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {pasos.map((paso, i) => (
            <div key={paso.titulo} className="glass flex gap-4 rounded-[24px] p-5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold"
                style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-[15px] font-bold" style={{ color: 'var(--pitch-900)' }}>
                  {paso.titulo}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
                  {paso.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-strong mt-8 rounded-[24px] p-5">
          <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--gold-500)' }}>
            <Icono name="cumplidor" size={16} /> ¿Cómo sé que quedó bien?
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pitch-700)', opacity: 0.85 }}>
            Cerrá el navegador del todo y abrí el ícono nuevo. Si se abre en pantalla completa, sin la barra de
            direcciones arriba, quedó perfecto. Vas a seguir logueado, no tenés que volver a entrar.
          </p>
        </div>

        <div className="glass mt-3 rounded-[24px] p-5">
          <p className="text-sm font-bold" style={{ color: 'var(--pitch-900)' }}>
            ¿No te aparece la opción?
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm" style={{ color: 'var(--pitch-700)' }}>
            <li>Casi siempre es porque estás dentro de Instagram o WhatsApp. Abrila en el navegador de verdad.</li>
            <li>En iPhone tiene que ser Safari. En Android, Chrome.</li>
            <li>Si ya la instalaste antes, no vuelve a ofrecerte instalarla: fijate si el ícono ya está.</li>
          </ul>
        </div>

        <Link
          to="/login"
          className="tap mt-8 block w-full rounded-2xl px-4 py-4 text-center text-[15px] font-semibold text-[color:var(--ink-900)]"
          style={{ background: 'var(--paper)' }}
        >
          Listo, quiero entrar
        </Link>
      </div>
    </div>
  )
}
