export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 1568 // Claude's recommended long-edge max for vision input
const JPEG_QUALITY = 0.85

export class ImageValidationError extends Error {}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode the image'))
    img.src = src
  })
}

// Validates the file is an image under the size limit, then downsizes and
// re-encodes it as JPEG. This keeps the payload well under both Supabase's
// request limit and Claude's per-image size limit, and guarantees the bytes
// we send are actually JPEG — regardless of whether the source was a PNG
// screenshot, HEIC photo, or anything else the camera/gallery produced.
export async function prepareImageUpload(file) {
  if (!file.type.startsWith('image/')) {
    throw new ImageValidationError('Please upload an image file.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError('That image is over 10MB — try a smaller photo.')
  }

  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  let { width, height } = img
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
