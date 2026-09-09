import { useState } from 'react'
import Icono from './Icono'
import { compartirHistoria, type DatosHistoria } from '../lib/historia'

export default function BotonCompartir({
  datos,
  texto,
  etiquetaBoton = 'Compartir en historias',
  className = '',
}: {
  datos: DatosHistoria
  texto: string
  etiquetaBoton?: string
  className?: string
}) {
  const [estado, setEstado] = useState<'listo' | 'generando' | 'descargado'>('listo')

  async function compartir() {
    setEstado('generando')
    try {
      const resultado = await compartirHistoria(datos, texto)
      setEstado(resultado === 'descargado' ? 'descargado' : 'listo')
    } catch {
      setEstado('listo')
    }
  }

  return (
    <div className={className}>
      <button
        onClick={compartir}
        disabled={estado === 'generando'}
        className="tap glass flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
        style={{ color: 'var(--pitch-700)' }}
      >
        <Icono name="compartir" size={15} />
        {estado === 'generando' ? 'Armando la imagen...' : etiquetaBoton}
      </button>
      {estado === 'descargado' && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--pitch-300)' }}>
          Se descargó la imagen: subila a tu historia desde la galería.
        </p>
      )}
    </div>
  )
}
