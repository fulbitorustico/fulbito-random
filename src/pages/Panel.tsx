import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Icono from '../components/Icono'

// Todo lo que llega acá es agregado: cuentas, promedios y rankings.
// La función de la base no devuelve ni un nombre ni un mail.
interface Metricas {
  gente: {
    jugadores: number
    con_cuenta: number
    sin_reclamar: number
    nuevos_7d: number
    nuevos_30d: number
    entraron_7d: number
    entraron_30d: number
    nunca_entraron: number
    activos_7d: number
  }
  partidos: {
    total: number
    jugados: number
    proximos: number
    cancelados: number
    nuevos_7d: number
    de_grupo: number
    ocupacion: number | null
    valor_promedio: number | null
  }
  compromiso: {
    bajas: number
    bajas_tardias: number
    valoraciones: number
    estrella_promedio: number | null
    insignias: number
    votos_mvp: number
    invitaciones: number
    invitaciones_aceptadas: number
    grupos: number
    canchas: number
  }
  embudo: {
    se_registraron: number
    hicieron_perfil: number
    jugaron_1: number
    jugaron_3: number
  }
  altas_semanales: { semana: string; cantidad: number }[]
  partidos_semanales: { semana: string; cantidad: number }[]
  dias: { dia: number; cantidad: number }[]
  horas: { hora: number; cantidad: number }[]
  canchas_top: { nombre: string; partidos: number; jugadores: number }[]
  zonas: { zona: string; cantidad: number }[]
  generado: string
}

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="glass-strong mb-4 rounded-[24px] p-5">
      <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--pitch-700)' }}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Dato({ valor, label, detalle }: { valor: string | number; label: string; detalle?: string }) {
  return (
    <div>
      <p className="text-2xl font-bold leading-none" style={{ color: 'var(--pitch-900)' }}>
        {valor}
      </p>
      <p className="mt-1 text-[12px] font-semibold" style={{ color: 'var(--pitch-700)' }}>
        {label}
      </p>
      {detalle && (
        <p className="text-[11px]" style={{ color: 'var(--pitch-300)' }}>
          {detalle}
        </p>
      )}
    </div>
  )
}

// Barras verticales para las series de tiempo y las horas del día.
function Columnas({ datos, color }: { datos: { etiqueta: string; valor: number }[]; color: string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  if (datos.length === 0)
    return (
      <p className="text-[12px]" style={{ color: 'var(--pitch-300)' }}>
        Todavía no hay datos.
      </p>
    )
  return (
    <div className="flex items-end gap-1" style={{ height: 96 }}>
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--pitch-300)' }}>
            {d.valor || ''}
          </span>
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max(2, (d.valor / max) * 64)}px`,
              background: d.valor ? color : 'rgba(242,239,233,.10)',
            }}
          />
          <span className="text-[9px]" style={{ color: 'var(--pitch-300)' }}>
            {d.etiqueta}
          </span>
        </div>
      ))}
    </div>
  )
}

// Barras horizontales para rankings, donde el nombre necesita lugar.
function Ranking({ datos }: { datos: { nombre: string; valor: number; detalle?: string }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  if (datos.length === 0)
    return (
      <p className="text-[12px]" style={{ color: 'var(--pitch-300)' }}>
        Todavía no hay datos.
      </p>
    )
  return (
    <div className="flex flex-col gap-2.5">
      {datos.map((d) => (
        <div key={d.nombre}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
              {d.nombre}
            </span>
            <span className="shrink-0 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
              {d.detalle ?? d.valor}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(242,239,233,.08)' }}>
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${(d.valor / max) * 100}%`, background: 'var(--acc-green)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// El embudo se lee mejor con el porcentaje respecto del paso anterior:
// ahí se ve dónde se cae la gente.
function Embudo({ pasos }: { pasos: { label: string; valor: number }[] }) {
  const base = Math.max(1, pasos[0]?.valor ?? 1)
  return (
    <div className="flex flex-col gap-2">
      {pasos.map((p, i) => {
        const previo = i === 0 ? null : pasos[i - 1].valor
        const caida = previo && previo > 0 ? Math.round((p.valor / previo) * 100) : null
        return (
          <div key={p.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--pitch-900)' }}>
                {p.label}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--pitch-300)' }}>
                {p.valor}
                {caida !== null && ` · ${caida}% del paso anterior`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full" style={{ background: 'rgba(242,239,233,.08)' }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${(p.valor / base) * 100}%`, background: 'var(--gold-500)' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Sugerencia {
  id: string
  texto: string
  pantalla: string | null
  estado: string
  created_at: string
}

export default function Panel() {
  const [m, setM] = useState<Metricas | null>(null)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('panel_metricas').then(({ data, error }) => {
      if (error) setError(error.message)
      else setM(data as Metricas)
      setLoading(false)
    })
    supabase
      .from('sugerencias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setSugerencias((data ?? []) as Sugerencia[]))
  }, [])

  async function marcar(id: string, estado: string) {
    await supabase.from('sugerencias').update({ estado }).eq('id', id)
    setSugerencias((prev) => prev.map((s) => (s.id === id ? { ...s, estado } : s)))
  }

  if (loading)
    return (
      <p className="text-sm" style={{ color: 'var(--pitch-300)' }}>
        Cargando el panel...
      </p>
    )

  if (error || !m)
    return (
      <div className="glass rounded-2xl p-6 text-sm" style={{ color: 'var(--pitch-300)' }}>
        Este panel es solo para el creador de la app.
      </div>
    )

  const tasaBajasTardias = m.compromiso.bajas > 0 ? Math.round((m.compromiso.bajas_tardias / m.compromiso.bajas) * 100) : 0
  const tasaInvitaciones =
    m.compromiso.invitaciones > 0 ? Math.round((m.compromiso.invitaciones_aceptadas / m.compromiso.invitaciones) * 100) : 0

  const semanaCorta = (s: string) => s.slice(8, 10) + '/' + s.slice(5, 7)

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pitch-900)' }}>
          Panel
        </h1>
        <Icono name="estrella" size={16} />
      </div>
      <p className="mb-5 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
        Datos al {m.generado}. Todo agregado: no sale ningún nombre ni ningún mail.
      </p>

      {sugerencias.length > 0 && (
        <Bloque titulo={`Sugerencias (${sugerencias.filter((s) => s.estado === 'nueva').length} sin leer)`}>
          <div className="flex flex-col gap-2.5">
            {sugerencias.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-3.5"
                style={{
                  background: s.estado === 'nueva' ? 'rgba(237,197,141,.10)' : 'rgba(242,239,233,.05)',
                }}
              >
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--pitch-900)' }}>
                  {s.texto}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px]" style={{ color: 'var(--pitch-300)' }}>
                    {new Date(s.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    {s.pantalla && ` · ${s.pantalla}`}
                  </span>
                  <div className="flex gap-1.5">
                    {(['vista', 'hecha', 'descartada'] as const).map((e) => (
                      <button
                        key={e}
                        onClick={() => marcar(s.id, e)}
                        className="tap rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: s.estado === e ? 'var(--paper)' : 'rgba(242,239,233,.07)',
                          color: s.estado === e ? 'var(--ink-900)' : 'var(--pitch-700)',
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Bloque>
      )}

      <Bloque titulo="Gente">
        <div className="grid grid-cols-3 gap-4">
          <Dato valor={m.gente.jugadores} label="Jugadores" detalle={`${m.gente.con_cuenta} con cuenta`} />
          <Dato valor={m.gente.activos_7d} label="Activos" detalle="últimos 7 días" />
          <Dato valor={m.gente.entraron_7d} label="Entraron" detalle="últimos 7 días" />
          <Dato valor={`+${m.gente.nuevos_7d}`} label="Nuevos" detalle="últimos 7 días" />
          <Dato valor={`+${m.gente.nuevos_30d}`} label="Nuevos" detalle="últimos 30 días" />
          <Dato valor={m.gente.sin_reclamar} label="Sin reclamar" detalle="perfiles cargados" />
        </div>
        {m.gente.nunca_entraron > 0 && (
          <p className="mt-4 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
            {m.gente.nunca_entraron} cuenta{m.gente.nunca_entraron === 1 ? '' : 's'} creada
            {m.gente.nunca_entraron === 1 ? '' : 's'} que nunca llegó a entrar.
          </p>
        )}
      </Bloque>

      <Bloque titulo="Altas por semana">
        <Columnas
          datos={m.altas_semanales.map((a) => ({ etiqueta: semanaCorta(a.semana), valor: a.cantidad }))}
          color="var(--acc-blue)"
        />
      </Bloque>

      <Bloque titulo="Partidos">
        <div className="grid grid-cols-3 gap-4">
          <Dato valor={m.partidos.jugados} label="Jugados" />
          <Dato valor={m.partidos.proximos} label="Próximos" />
          <Dato valor={`+${m.partidos.nuevos_7d}`} label="Nuevos" detalle="últimos 7 días" />
          <Dato
            valor={m.partidos.ocupacion != null ? `${m.partidos.ocupacion}%` : '—'}
            label="Ocupación"
            detalle="del cupo, promedio"
          />
          <Dato valor={m.partidos.de_grupo} label="De grupo" detalle={`${m.partidos.total - m.partidos.de_grupo} abiertos`} />
          <Dato valor={m.partidos.cancelados} label="Cancelados" />
        </div>
        {m.partidos.valor_promedio != null && (
          <p className="mt-4 text-[12px]" style={{ color: 'var(--pitch-300)' }}>
            Cancha promedio: ${m.partidos.valor_promedio.toLocaleString('es-AR')}
          </p>
        )}
      </Bloque>

      <Bloque titulo="Partidos jugados por semana">
        <Columnas
          datos={m.partidos_semanales.map((p) => ({ etiqueta: semanaCorta(p.semana), valor: p.cantidad }))}
          color="var(--acc-green)"
        />
      </Bloque>

      <Bloque titulo="Qué día se juega">
        <Columnas
          datos={[1, 2, 3, 4, 5, 6, 7].map((d) => ({
            etiqueta: DIAS[d],
            valor: m.dias.find((x) => x.dia === d)?.cantidad ?? 0,
          }))}
          color="var(--gold-500)"
        />
      </Bloque>

      <Bloque titulo="A qué hora se juega">
        <Columnas
          datos={Array.from({ length: 18 }, (_, i) => i + 6).map((h) => ({
            etiqueta: String(h),
            valor: m.horas.find((x) => x.hora === h)?.cantidad ?? 0,
          }))}
          color="var(--gold-500)"
        />
      </Bloque>

      <Bloque titulo="Canchas más usadas">
        <Ranking
          datos={m.canchas_top.map((c) => ({
            nombre: c.nombre,
            valor: c.partidos,
            detalle: `${c.partidos} partido${c.partidos === 1 ? '' : 's'}`,
          }))}
        />
      </Bloque>

      {m.zonas.length > 0 && (
        <Bloque titulo="Zonas con más jugadores">
          <Ranking datos={m.zonas.map((z) => ({ nombre: z.zona, valor: z.cantidad }))} />
        </Bloque>
      )}

      <Bloque titulo="De registrarse a jugar">
        <Embudo
          pasos={[
            { label: 'Se registraron', valor: m.embudo.se_registraron },
            { label: 'Hicieron el perfil', valor: m.embudo.hicieron_perfil },
            { label: 'Jugaron una vez', valor: m.embudo.jugaron_1 },
            { label: 'Jugaron tres o más', valor: m.embudo.jugaron_3 },
          ]}
        />
      </Bloque>

      <Bloque titulo="Compromiso">
        <div className="grid grid-cols-3 gap-4">
          <Dato valor={m.compromiso.valoraciones} label="Valoraciones" />
          <Dato
            valor={m.compromiso.estrella_promedio != null ? m.compromiso.estrella_promedio.toFixed(2) : '—'}
            label="Estrella promedio"
          />
          <Dato valor={m.compromiso.insignias} label="Insignias" />
          <Dato valor={m.compromiso.bajas} label="Bajas" detalle={`${tasaBajasTardias}% tardías`} />
          <Dato valor={m.compromiso.invitaciones} label="Invitaciones" detalle={`${tasaInvitaciones}% aceptadas`} />
          <Dato valor={m.compromiso.votos_mvp} label="Votos al MVP" />
          <Dato valor={m.compromiso.grupos} label="Grupos" />
          <Dato valor={m.compromiso.canchas} label="Canchas" />
        </div>
      </Bloque>

      <p className="mb-4 text-[11px] leading-relaxed" style={{ color: 'var(--pitch-300)' }}>
        Los jugadores de demostración quedan afuera de las cuentas de gente, así el crecimiento que ves es el real.
        Los partidos sí los incluyen.
      </p>
    </div>
  )
}
