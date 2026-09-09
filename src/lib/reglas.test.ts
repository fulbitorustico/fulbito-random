import { describe, it, expect } from 'vitest'
import { calcularRacha } from './racha'
import { proximaFecha } from './calendario'
import { nivelPorPartidos, progresoNivel } from './nivel'
import { calcularProgreso } from './objetivos'
import { puedeValorar, puedeAdministrar, enVentanaDeConfirmar, debePasarLaCapitania } from './permisos'
import { nivelDesdeBajasTardias } from './confiabilidad'
import { coordenadasDesdeLinkDeMapas, pareceLinkDeMapas, linkComoLlegar } from './mapas'
import type { Jugador, Partido } from './types'

// Estas pruebas cubren las reglas del negocio, que son las que duelen cuando
// se rompen sin que nadie se entere: quién puede valorar, cuándo se pide
// confirmación, cómo se cuenta una racha. No cubren las políticas de la base
// —eso necesita hablarle a Postgres— pero sí cubren la mitad de la pantalla,
// que es donde ya se nos desincronizó una vez.

const HORA = 3_600_000

function partidoDePrueba(desfaseHoras: number, extra: Partial<Partido> = {}): Partido {
  return {
    id: 'p1',
    cancha: 'La Bombonerita',
    fecha_hora: new Date(Date.now() + desfaseHoras * HORA).toISOString(),
    cupo_total: 10,
    admin_id: 'capitan',
    estado: 'abierto',
    created_at: new Date().toISOString(),
    lat: null,
    lng: null,
    valor_cancha: null,
    apertura: 'abierto',
    grupo_id: null,
    usa_equipos: false,
    subcapitan_id: 'subcapitan',
    cancha_id: null,
    mapa_url: null,
    nota: null,
    token: null,
    goles_a: null,
    goles_b: null,
    ...extra,
  }
}

const jugador = (id: string) => ({ id }) as Jugador

describe('racha en semanas seguidas', () => {
  const lunesHace = (semanas: number) => {
    const d = new Date()
    d.setDate(d.getDate() - semanas * 7)
    return d.toISOString()
  }

  it('sin partidos no hay racha', () => {
    expect(calcularRacha([])).toEqual({ actual: 0, mejor: 0 })
  })

  it('cuenta semanas seguidas, no partidos', () => {
    // Dos partidos en la misma semana son una sola semana.
    const r = calcularRacha([lunesHace(0), lunesHace(0), lunesHace(1), lunesHace(2)])
    expect(r.actual).toBe(3)
    expect(r.mejor).toBe(3)
  })

  it('la racha se corta si hace más de dos semanas que no jugás', () => {
    const r = calcularRacha([lunesHace(5), lunesHace(6), lunesHace(7)])
    expect(r.actual).toBe(0)
    expect(r.mejor).toBe(3)
  })

  it('una semana salteada corta la racha pero guarda el récord', () => {
    const r = calcularRacha([lunesHace(0), lunesHace(2), lunesHace(3), lunesHace(4)])
    expect(r.actual).toBe(1)
    expect(r.mejor).toBe(3)
  })
})

describe('repetir partido', () => {
  it('el semanal cae el mismo día de la semana', () => {
    const origen = new Date(Date.now() + 24 * HORA).toISOString()
    const proxima = proximaFecha(origen, 'semanal')
    expect(proxima.getDay()).toBe(new Date(origen).getDay())
    expect(proxima.getTime()).toBeGreaterThan(Date.now())
  })

  it('repetir un partido viejo salta hasta el futuro', () => {
    // La base rechaza los partidos con fecha pasada: si esto devolviera una
    // fecha vieja, "Repetir" fallaría sin explicación.
    const hace3Semanas = new Date(Date.now() - 21 * 24 * HORA).toISOString()
    for (const f of ['semanal', 'quincenal', 'mensual'] as const) {
      expect(proximaFecha(hace3Semanas, f).getTime()).toBeGreaterThan(Date.now())
    }
  })

  it('el mensual salta de mes', () => {
    const origen = new Date(Date.now() + 24 * HORA)
    const proxima = proximaFecha(origen.toISOString(), 'mensual')
    expect(proxima.getDate()).toBe(origen.getDate())
  })
})

describe('quién puede valorar', () => {
  it('no se valora un partido que todavía no se jugó', () => {
    expect(puedeValorar(partidoDePrueba(5), true)).toBe(false)
  })

  it('no se valora si no jugaste, aunque el partido haya terminado', () => {
    expect(puedeValorar(partidoDePrueba(-5), false)).toBe(false)
  })

  it('se valora habiendo jugado y dentro de las 24hs', () => {
    expect(puedeValorar(partidoDePrueba(-5), true)).toBe(true)
  })

  it('la ventana se cierra a las 24hs', () => {
    expect(puedeValorar(partidoDePrueba(-25), true)).toBe(false)
  })

  it('un partido cancelado no se valora', () => {
    expect(puedeValorar(partidoDePrueba(-5, { estado: 'cancelado' }), true)).toBe(false)
  })
})

describe('quién administra el partido', () => {
  it('el capitán', () => {
    expect(puedeAdministrar(partidoDePrueba(5), jugador('capitan'))).toBe(true)
  })

  it('el subcapitán también: acá se nos había desincronizado con la base', () => {
    expect(puedeAdministrar(partidoDePrueba(5), jugador('subcapitan'))).toBe(true)
  })

  it('un anotado cualquiera no', () => {
    expect(puedeAdministrar(partidoDePrueba(5), jugador('otro'))).toBe(false)
  })

  it('sin sesión, no', () => {
    expect(puedeAdministrar(partidoDePrueba(5), null)).toBe(false)
  })
})

describe('confirmación de asistencia', () => {
  it('no se pide con tres días de anticipación', () => {
    expect(enVentanaDeConfirmar(partidoDePrueba(72))).toBe(false)
  })

  it('se pide dentro de las 24hs', () => {
    expect(enVentanaDeConfirmar(partidoDePrueba(10))).toBe(true)
  })

  it('no se pide si el partido ya empezó', () => {
    expect(enVentanaDeConfirmar(partidoDePrueba(-1))).toBe(false)
  })

  it('no se pide en un partido cancelado', () => {
    expect(enVentanaDeConfirmar(partidoDePrueba(10, { estado: 'cancelado' }))).toBe(false)
  })
})

describe('el capitán que se baja', () => {
  it('tiene que pasar la capitanía si hay a quién', () => {
    expect(debePasarLaCapitania(partidoDePrueba(10), jugador('capitan'), 8)).toBe(true)
  })

  it('si está solo, no hay a quién pasársela', () => {
    expect(debePasarLaCapitania(partidoDePrueba(10), jugador('capitan'), 1)).toBe(false)
  })

  it('el que no es capitán se baja y listo', () => {
    expect(debePasarLaCapitania(partidoDePrueba(10), jugador('otro'), 8)).toBe(false)
  })
})

describe('niveles y confiabilidad', () => {
  it('el debutante arranca abajo', () => {
    expect(nivelPorPartidos(0).nombre).toBe('Debutante')
  })

  it('se llega a Leyenda a los 60', () => {
    expect(nivelPorPartidos(60).nombre).toBe('Leyenda')
    expect(progresoNivel(60).siguiente).toBeNull()
  })

  it('una baja tardía todavía es confiable, dos ya no', () => {
    expect(nivelDesdeBajasTardias(1)).toBe('confiable')
    expect(nivelDesdeBajasTardias(2)).toBe('a_prueba')
    expect(nivelDesdeBajasTardias(4)).toBe('poco_confiable')
  })
})

describe('objetivos', () => {
  it('la racha alimenta los dos objetivos de racha', () => {
    const progreso = calcularProgreso({
      partidos_jugados: 0,
      valoraciones_recibidas: 0,
      insignias_recibidas: 0,
      partidos_sin_bajas: 0,
      mejor_racha: 4,
      goles: 0,
    })
    expect(progreso.find((p) => p.objetivo.id === 'racha_4')?.cumplido).toBe(true)
    expect(progreso.find((p) => p.objetivo.id === 'racha_10')?.cumplido).toBe(false)
  })

  it('el progreso nunca pasa del 100%', () => {
    const progreso = calcularProgreso({
      partidos_jugados: 999,
      valoraciones_recibidas: 999,
      insignias_recibidas: 999,
      partidos_sin_bajas: 999,
      mejor_racha: 999,
      goles: 999,
    })
    expect(progreso.every((p) => p.porcentaje === 100)).toBe(true)
  })
})


describe('links de Google Maps', () => {
  it('saca las coordenadas del marcador del lugar, que es el dato más preciso', () => {
    const url =
      'https://www.google.com/maps/place/Cancha/@-34.6037,-58.3816,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-34.6100!4d-58.3900'
    expect(coordenadasDesdeLinkDeMapas(url)).toEqual({ lat: -34.61, lng: -58.39 })
  })

  it('si no hay marcador, usa el centro de la vista', () => {
    const url = 'https://www.google.com/maps/@-34.6037,-58.3816,17z'
    expect(coordenadasDesdeLinkDeMapas(url)).toEqual({ lat: -34.6037, lng: -58.3816 })
  })

  it('entiende los links armados con coordenadas', () => {
    expect(coordenadasDesdeLinkDeMapas('https://maps.google.com/?q=-34.5,-58.5')).toEqual({
      lat: -34.5,
      lng: -58.5,
    })
  })

  it('del link corto del celular no se pueden sacar: hay que seguir el redireccionamiento', () => {
    expect(coordenadasDesdeLinkDeMapas('https://maps.app.goo.gl/aBcDeF123')).toBeNull()
  })

  it('reconoce igual el link corto, para poder guardarlo', () => {
    expect(pareceLinkDeMapas('https://maps.app.goo.gl/aBcDeF123')).toBe(true)
    expect(pareceLinkDeMapas('https://www.instagram.com/algo')).toBe(false)
  })

  it('"Cómo llegar" siempre devuelve algo abrible', () => {
    expect(linkComoLlegar({ cancha: 'La Bombonerita', lat: null, lng: null, mapa_url: null })).toContain(
      'La%20Bombonerita',
    )
    expect(linkComoLlegar({ cancha: 'x', lat: -34.6, lng: -58.4, mapa_url: null })).toContain('-34.6,-58.4')
    // El link que pegó el que armó el partido gana sobre todo lo demás.
    expect(
      linkComoLlegar({ cancha: 'x', lat: -34.6, lng: -58.4, mapa_url: 'https://maps.app.goo.gl/xyz' }),
    ).toBe('https://maps.app.goo.gl/xyz')
  })
})
