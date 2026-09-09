// Achica la foto antes de subirla: el plan gratis de Supabase tiene 1 GB y una
// foto de celular sin tocar pesa varios megas.
export async function achicarParaAvatar(file: File, lado = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.82)
  })
}
