// Dibuja la imagen para las historias de Instagram (1080×1920) en el mismo
// celular y la manda al menú de compartir del sistema. No hace falta la API de
// Instagram ni ningún servidor.

const ANCHO = 1080
const ALTO = 1920

const COLORES_LOGO = ['#dd977b', '#edc58d', '#9fc69a', '#9dccda', '#a28abc']
const TINTA = '#141414'
const PAPEL = '#f2efe9'

export interface FilaHistoria {
  izquierda: string
  derecha: string
}

export interface DatosHistoria {
  etiqueta: string
  titulo: string
  subtitulo?: string
  destacado?: string
  pieDestacado?: string
  filas?: FilaHistoria[]
}

function pentagono(ctx: CanvasRenderingContext2D, cx: number, cy: number, radio: number, giro: number) {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = giro + (i * 2 * Math.PI) / 5 - Math.PI / 2
    const x = cx + radio * Math.cos(a)
    const y = cy + radio * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function dibujarLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, escala: number) {
  const anillo = 44 * escala
  const radio = 23 * escala
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
    ctx.fillStyle = COLORES_LOGO[i]
    pentagono(ctx, cx + anillo * Math.cos(a), cy + anillo * Math.sin(a), radio, a + Math.PI / 2)
  }
}

function marca(ctx: CanvasRenderingContext2D, x: number, y: number, tam: number) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${tam * 0.16}px`

  ctx.font = `300 ${tam}px Montserrat, sans-serif`
  ctx.fillStyle = PAPEL
  ctx.fillText('FULBITO', x, y)
  const ancho = ctx.measureText('FULBITO ').width

  ctx.font = `800 ${tam}px Montserrat, sans-serif`
  ctx.fillText('RANDOM', x + ancho, y)
  ctx.letterSpacing = '0px'
}

export async function generarHistoria(datos: DatosHistoria): Promise<Blob> {
  await document.fonts.load('800 100px Montserrat')
  await document.fonts.load('300 40px Montserrat')

  const canvas = document.createElement('canvas')
  canvas.width = ANCHO
  canvas.height = ALTO
  const ctx = canvas.getContext('2d')!

  // Fondo
  ctx.fillStyle = TINTA
  ctx.fillRect(0, 0, ANCHO, ALTO)

  const brilloVerde = ctx.createRadialGradient(180, 120, 0, 180, 120, 900)
  brilloVerde.addColorStop(0, 'rgba(159,198,154,.16)')
  brilloVerde.addColorStop(1, 'rgba(159,198,154,0)')
  ctx.fillStyle = brilloVerde
  ctx.fillRect(0, 0, ANCHO, ALTO)

  const brilloVioleta = ctx.createRadialGradient(980, 1750, 0, 980, 1750, 900)
  brilloVioleta.addColorStop(0, 'rgba(162,138,188,.16)')
  brilloVioleta.addColorStop(1, 'rgba(162,138,188,0)')
  ctx.fillStyle = brilloVioleta
  ctx.fillRect(0, 0, ANCHO, ALTO)

  // Logo y marca arriba
  dibujarLogo(ctx, 140, 250, 1.15)
  marca(ctx, 240, 250, 40)

  // Etiqueta
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.letterSpacing = '7px'
  ctx.font = '700 34px Montserrat, sans-serif'
  ctx.fillStyle = '#edc58d'
  ctx.fillText(datos.etiqueta.toUpperCase(), 100, 520)
  ctx.letterSpacing = '0px'

  // Título
  ctx.font = '800 96px Montserrat, sans-serif'
  ctx.fillStyle = PAPEL
  const palabras = datos.titulo.toUpperCase().split(' ')
  let linea = ''
  let y = 640
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra
    if (ctx.measureText(prueba).width > ANCHO - 200 && linea) {
      ctx.fillText(linea, 100, y)
      y += 104
      linea = palabra
    } else {
      linea = prueba
    }
  }
  if (linea) ctx.fillText(linea, 100, y)

  if (datos.subtitulo) {
    y += 62
    ctx.font = '400 38px Montserrat, sans-serif'
    ctx.fillStyle = 'rgba(242,239,233,.66)'
    ctx.fillText(datos.subtitulo, 100, y)
  }

  // Número o dato grande
  if (datos.destacado) {
    y += 190
    ctx.font = '800 210px Montserrat, sans-serif'
    ctx.fillStyle = PAPEL
    ctx.fillText(datos.destacado, 100, y)

    if (datos.pieDestacado) {
      y += 60
      ctx.font = '600 36px Montserrat, sans-serif'
      ctx.fillStyle = '#edc58d'
      ctx.fillText(datos.pieDestacado, 100, y)
    }
  }

  // Filas (equipos, jugadores, lo que sea)
  if (datos.filas?.length) {
    y += 120
    for (const fila of datos.filas) {
      ctx.font = '500 42px Montserrat, sans-serif'
      ctx.fillStyle = 'rgba(242,239,233,.86)'
      ctx.textAlign = 'left'
      ctx.fillText(fila.izquierda, 100, y)

      ctx.font = '700 42px Montserrat, sans-serif'
      ctx.fillStyle = '#edc58d'
      ctx.textAlign = 'right'
      ctx.fillText(fila.derecha, ANCHO - 100, y)

      ctx.strokeStyle = 'rgba(242,239,233,.1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(100, y + 26)
      ctx.lineTo(ANCHO - 100, y + 26)
      ctx.stroke()

      y += 84
    }
  }

  // Pie
  ctx.textAlign = 'center'
  ctx.font = '500 32px Montserrat, sans-serif'
  ctx.fillStyle = 'rgba(242,239,233,.45)'
  ctx.fillText('fulbito-random.vercel.app', ANCHO / 2, ALTO - 110)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92)
  })
}

export async function compartirHistoria(datos: DatosHistoria, texto: string): Promise<'compartido' | 'descargado'> {
  const blob = await generarHistoria(datos)
  const archivo = new File([blob], 'fulbito-random.jpg', { type: 'image/jpeg' })

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto })
      return 'compartido'
    } catch {
      // el usuario canceló: no hace falta descargar nada
      return 'compartido'
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fulbito-random.jpg'
  a.click()
  URL.revokeObjectURL(url)
  return 'descargado'
}
