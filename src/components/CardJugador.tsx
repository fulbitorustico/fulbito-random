import Avatar from './Avatar'
import Estrellas from './Estrellas'
import BadgeConfiabilidad from './BadgeConfiabilidad'
import Icono from './Icono'
import { insigniaPorId } from '../lib/insignias'
import { progresoNivel } from '../lib/nivel'
import { nivelReclutador } from '../lib/reclutamiento'
import { formatPosiciones } from '../lib/posiciones'
import type { DistribucionValoracion, InsigniaConteo, Jugador } from '../lib/types'

export default function CardJugador({
  jugador,
  promedio,
  cantidad,
  distribucion,
  insignias,
  bajasTardias,
  partidosJugados,
  reclutas = 0,
  children,
}: {
  jugador: Jugador
  promedio: number | null
  cantidad: number
  distribucion?: DistribucionValoracion[]
  insignias: InsigniaConteo[]
  bajasTardias: number
  partidosJugados: number
  reclutas?: number
  children?: React.ReactNode
}) {
  const { actual, siguiente, faltan, porcentaje } = progresoNivel(partidosJugados)
  const chapaReclutador = nivelReclutador(reclutas)

  return (
    <div
      className="anim-pop overflow-hidden rounded-[28px]"
      style={{
        border: `1.5px solid ${actual.color}`,
        background: `linear-gradient(180deg, ${actual.color}1f 0%, rgba(255,255,255,.05) 38%, rgba(255,255,255,.05) 100%)`,
        boxShadow: `0 14px 44px rgba(0,0,0,.45)`,
      }}
    >
      <div className="flex items-center gap-4 px-6 pt-6">
        <div className="rounded-full p-[3px]" style={{ border: `2px solid ${actual.color}` }}>
          <Avatar nombre={jugador.nombre} avatar={jugador.avatar} fotoUrl={jugador.foto_url} size="lg" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-extrabold leading-tight" style={{ color: 'var(--pitch-900)' }}>
            {jugador.nombre}
          </p>
          {jugador.apodo && (
            <p className="truncate text-sm" style={{ color: 'var(--pitch-300)' }}>
              "{jugador.apodo}"
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ background: `${actual.color}26`, color: actual.color }}
            >
              {actual.nombre}
            </span>
            {chapaReclutador && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ background: `${chapaReclutador.color}26`, color: chapaReclutador.color }}
                title={`Trajo ${reclutas} ${reclutas === 1 ? 'jugador' : 'jugadores'}`}
              >
                <Icono name="corona" size={11} />
                {chapaReclutador.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {(jugador.posiciones ?? []).length > 0 ? (
            jugador.posiciones!.map((p) => (
              <span
                key={p}
                className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: 'rgba(242,239,233,.08)', color: 'var(--pitch-700)' }}
              >
                {p}
              </span>
            ))
          ) : (
            <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
              {formatPosiciones(jugador.posiciones)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 px-6">
        <Estrellas promedio={promedio} cantidad={cantidad} variant="completo" distribucion={distribucion} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 px-6">
        <BadgeConfiabilidad bajasTardias={bajasTardias} />
        <span className="text-[13px]" style={{ color: 'var(--pitch-300)' }}>
          {partidosJugados} {partidosJugados === 1 ? 'partido' : 'partidos'}
        </span>
      </div>

      {siguiente && (
        <div className="mt-4 px-6">
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(242,239,233,.08)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${porcentaje}%`, background: siguiente.color }}
            />
          </div>
          <p className="mt-2 text-[11.5px]" style={{ color: 'var(--pitch-300)' }}>
            {faltan} {faltan === 1 ? 'partido' : 'partidos'} para <strong>{siguiente.nombre}</strong>
          </p>
        </div>
      )}

      {insignias.length > 0 && (
        <div className="mt-5 px-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--pitch-300)' }}>
            Insignias del grupo
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {insignias.map((i) => {
              const info = insigniaPorId(i.insignia)
              if (!info) return null
              return (
                <div
                  key={i.insignia}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                  style={{ background: 'rgba(237,197,141,.16)', color: 'var(--gold-500)' }}
                >
                  <Icono name={info.icono} size={13} />
                  {info.label}
                  <span style={{ color: 'var(--pitch-300)' }}>×{i.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-6 pb-6">{children}</div>
    </div>
  )
}
