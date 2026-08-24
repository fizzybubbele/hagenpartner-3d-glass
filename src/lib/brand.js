// troika-three-text (used by drei <Text/>) can only parse .ttf/.otf/.woff –
// NOT .woff2 and not variable-font axes. Switch static Mona Sans files instead.
export const textFontWeights = [
  { value: 300, label: 'Light', file: '/fonts/MonaSans-Light.ttf' },
  { value: 400, label: 'Regular', file: '/fonts/MonaSans-Regular.ttf' },
  { value: 500, label: 'Medium', file: '/fonts/MonaSans-Medium.ttf' },
  { value: 600, label: 'SemiBold', file: '/fonts/MonaSans-SemiBold.ttf' },
  { value: 700, label: 'Bold', file: '/fonts/MonaSans-Bold.ttf' },
  { value: 800, label: 'ExtraBold', file: '/fonts/MonaSans-ExtraBold.ttf' },
  { value: 900, label: 'Black', file: '/fonts/MonaSans-Black.ttf' },
]

export const defaultTextFontWeight = 700
export const minTextFontWeight = textFontWeights[0].value
export const maxTextFontWeight = textFontWeights[textFontWeights.length - 1].value
export const FONT_3D = textFontWeights.find((w) => w.value === defaultTextFontWeight).file

export function getTextFontWeightOption(weight = defaultTextFontWeight) {
  const numeric = Number(weight)
  if (!Number.isFinite(numeric)) {
    return textFontWeights.find((w) => w.value === defaultTextFontWeight)
  }

  return textFontWeights.reduce((closest, option) =>
    Math.abs(option.value - numeric) < Math.abs(closest.value - numeric)
      ? option
      : closest,
  )
}

export function getFontForWeight(weight = defaultTextFontWeight) {
  return getTextFontWeightOption(weight).file
}

export const brandColors = {
  mint: '#E1F3EF',
  ice: '#EDFDFC',
  green: '#9CFF71',
  yellow: '#FFED66',
  dark: '#07110f',
  darkSoft: '#0f1a18',
  text: '#161616',
}

export const backgroundOptions = [
  { id: 'neutral', label: 'Neutral', color: '#F9F9F9' },
  { id: 'peach', label: 'Peach', color: '#FFDD99' },
  { id: 'lavender', label: 'Lavender', color: '#C7B2FF' },
  { id: 'mint', label: 'Mint', color: '#BFFFB2' },
  { id: 'dark', label: 'Dark', color: '#161616' },
]

export const defaultBackground = backgroundOptions[0].color
export const defaultTextColor = brandColors.text
export const defaultTextSize = 0.62
export const defaultObjectScale = 0.2
export const defaultAnimationSpeed = 0.5
export const minAnimationSpeed = 0
export const maxAnimationSpeed = 3
export const defaultObjectId = 'hypercross'
export const defaultBackgroundText = 'HAGENPARTNER'

export function formatBackgroundText(text = defaultBackgroundText) {
  return text.toUpperCase()
}

export const glassPresets = {
  hypercross: {
    label: 'Glass Cross',
    type: 'glb',
    glb: '/medias/3D-Hypercross.glb',
    // Cache-bust when overwriting LODs so the browser picks up new meshes.
    roundedGlb: '/medias/3D-Hypercross-rounded.glb?v=inner-sdf3',
    roundedStrongGlb: '/medias/3D-Hypercross-rounded-strong.glb?v=inner-sdf3',
    node: 'Cube',
    autoRotateSpeed: 0.016,
  },
  torus: {
    label: 'Glass Torus',
    type: 'procedural',
    geometry: 'torus',
    geometryParams: {
      radius: 1,
      tube: 0.35,
      radialSegments: 64,
      tubularSegments: 128,
    },
    rotation: [Math.PI * 0.35, 0, Math.PI * 0.12],
    autoRotateSpeed: 0.02,
  },
  torusKnot: {
    label: 'Glass Torus Knot',
    type: 'procedural',
    geometry: 'torusKnot',
    geometryParams: {
      radius: 0.85,
      tube: 0.26,
      tubularSegments: 160,
      radialSegments: 24,
      p: 2,
      q: 3,
    },
    rotation: [Math.PI * 0.2, Math.PI * 0.15, 0],
    autoRotateSpeed: 0.018,
  },
}

export const objectIds = Object.keys(glassPresets)

export function getObjectPreset(id) {
  return glassPresets[id] ?? glassPresets.hypercross
}

export function getBackgroundColor(id) {
  return backgroundOptions.find((option) => option.id === id)?.color ?? defaultBackground
}

function getLuminance(hex) {
  const color = hex.replace('#', '')
  const red = parseInt(color.slice(0, 2), 16) / 255
  const green = parseInt(color.slice(2, 4), 16) / 255
  const blue = parseInt(color.slice(4, 6), 16) / 255
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function getReadableTextColor(backgroundColor, textColor = defaultTextColor) {
  if (!backgroundColor || backgroundColor === 'transparent') return textColor

  const backgroundLuminance = getLuminance(backgroundColor)
  const textLuminance = getLuminance(textColor)

  if (Math.abs(backgroundLuminance - textLuminance) < 0.28) {
    return backgroundLuminance > 0.55 ? '#161616' : '#F9F9F9'
  }

  return textColor
}
