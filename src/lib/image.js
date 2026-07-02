// ─────────────────────────────────────────────────────────────
// Image helper — compress a File into a small JPEG data-URL so it
// fits inside a Firestore document (1MB limit). No Firebase Storage.
// ─────────────────────────────────────────────────────────────

export async function fileToCompressedDataURL(file, maxDim = 1000, quality = 0.6) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Not an image file')
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = dataUrl
  })

  let { width, height } = img
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width)
    width = maxDim
  } else if (height >= width && height > maxDim) {
    width = Math.round((width * maxDim) / height)
    height = maxDim
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}
