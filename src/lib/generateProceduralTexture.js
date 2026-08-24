import * as THREE from 'three'

function createCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function finalizeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Chrome-sphere matcap generated on the fly (no binary asset). High-contrast
// studio bands + tight specular so the Matcap layer can read as metal.
export function createMatcapTexture(size = 256) {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')
  const center = size / 2
  const radius = size * 0.5

  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, size, size)

  // Soft environment bands (horizontal) to sell liquid/chrome reflections.
  const band = ctx.createLinearGradient(0, 0, 0, size)
  band.addColorStop(0, '#f7f8fa')
  band.addColorStop(0.18, '#9aa3ad')
  band.addColorStop(0.34, '#1c2228')
  band.addColorStop(0.5, '#d8dde3')
  band.addColorStop(0.66, '#2a3138')
  band.addColorStop(0.82, '#aeb6c0')
  band.addColorStop(1, '#0c1014')
  ctx.fillStyle = band
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  // Cool silver radial falloff for sphere shading.
  const sphere = ctx.createRadialGradient(
    center * 0.78,
    center * 0.72,
    size * 0.015,
    center,
    center,
    radius,
  )
  sphere.addColorStop(0, 'rgba(255,255,255,0.95)')
  sphere.addColorStop(0.18, 'rgba(230,235,240,0.55)')
  sphere.addColorStop(0.42, 'rgba(120,130,140,0.2)')
  sphere.addColorStop(0.72, 'rgba(20,24,28,0.45)')
  sphere.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = sphere
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  // Tight hot specular.
  const spec = ctx.createRadialGradient(
    center * 0.72,
    center * 0.66,
    0,
    center * 0.72,
    center * 0.66,
    size * 0.14,
  )
  spec.addColorStop(0, 'rgba(255,255,255,1)')
  spec.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  spec.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = spec
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  // Thin bright rim.
  const rim = ctx.createRadialGradient(center, center, radius * 0.78, center, center, radius)
  rim.addColorStop(0, 'rgba(255,255,255,0)')
  rim.addColorStop(0.75, 'rgba(255,255,255,0)')
  rim.addColorStop(1, 'rgba(255,255,255,0.55)')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  return finalizeTexture(canvas)
}

// Fine, tileable film-grain style noise for the "Image" layer's Noise
// pattern (foil/paper grain look).
export function createNoiseTexture(size = 128) {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = 150 + Math.random() * 105
    imageData.data[i] = v
    imageData.data[i + 1] = v
    imageData.data[i + 2] = v
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  const texture = finalizeTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(6, 6)
  texture.magFilter = THREE.NearestFilter
  return texture
}

// Neutral fallback used by the "Video" layer before a URL is set.
export function createPlaceholderTexture(size = 8) {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#4a4a4a'
  ctx.fillRect(0, 0, size, size)
  return finalizeTexture(canvas)
}

// Small set of placeholder patterns for the "Image" layer. Swap these out
// for a real brand texture whenever one is ready (see brand.js).
export function createImageTexture(pattern = 'Gradient', size = 256) {
  if (pattern === 'Noise') {
    return createNoiseTexture(size)
  }

  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')

  if (pattern === 'Grid') {
    ctx.fillStyle = '#101010'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = Math.max(1, size * 0.01)
    const step = size / 8
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * step)
      ctx.lineTo(size, i * step)
      ctx.stroke()
    }
  } else if (pattern === 'Rings') {
    ctx.fillStyle = '#101010'
    ctx.fillRect(0, 0, size, size)
    const center = size / 2
    const ringCount = 10
    for (let i = ringCount; i > 0; i--) {
      const radius = (i / ringCount) * center
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, Math.PI * 2)
      ctx.fillStyle = i % 2 === 0 ? '#f5f5f5' : '#101010'
      ctx.fill()
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.5, '#9cff71')
    gradient.addColorStop(1, '#161616')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  return finalizeTexture(canvas)
}
