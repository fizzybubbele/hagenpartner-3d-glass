'use client'

import dynamic from 'next/dynamic'
import {
  brandColors,
  defaultAnimationSpeed,
  defaultBackgroundText,
  defaultObjectScale,
  defaultTextFontWeight,
  defaultTextSize,
  formatBackgroundText,
  getBackgroundColor,
  getObjectPreset,
  getReadableTextColor,
  getTextFontWeightOption,
  maxAnimationSpeed,
  maxTextFontWeight,
  minAnimationSpeed,
  minTextFontWeight,
} from '@/lib/brand'

const GlassScene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
})

const MaterialControls = dynamic(() => import('@/components/MaterialControls'), {
  ssr: false,
})

function resolveBackground(searchParams) {
  if (searchParams?.bg === 'transparent') return 'transparent'

  const hex = searchParams?.bg?.replace('#', '')
  if (hex && /^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`

  if (searchParams?.bg) return getBackgroundColor(searchParams.bg)

  return getBackgroundColor('neutral')
}

function resolveTextColor(searchParams) {
  const hex = searchParams?.textColor?.replace('#', '')
  if (hex && /^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`
  return brandColors.text
}

function resolveTextSize(searchParams) {
  const size = Number(searchParams?.textSize)
  if (Number.isFinite(size) && size >= 0.2 && size <= 1.5) return size
  return defaultTextSize
}

function resolveTextFontWeight(searchParams) {
  const weight = Number(searchParams?.textWeight)
  if (Number.isFinite(weight)) {
    return getTextFontWeightOption(weight).value
  }
  return defaultTextFontWeight
}

function resolveObjectScale(searchParams) {
  const scale = Number(searchParams?.objectScale)
  if (Number.isFinite(scale) && scale >= 0.1 && scale <= 2.5) return scale
  return defaultObjectScale
}

function resolveAnimationSpeed(searchParams) {
  const speed = Number(searchParams?.animationSpeed)
  if (
    Number.isFinite(speed) &&
    speed >= minAnimationSpeed &&
    speed <= maxAnimationSpeed
  ) {
    return speed
  }
  return defaultAnimationSpeed
}

export default function EmbedPage({ params, searchParams }) {
  const preset = getObjectPreset(params.object)
  const background = resolveBackground(searchParams)
  const interactive = searchParams?.interactive !== 'false'
  const showControls = searchParams?.controls !== 'false'
  const backgroundText = formatBackgroundText(searchParams?.text ?? defaultBackgroundText)
  const textColor = getReadableTextColor(background, resolveTextColor(searchParams))
  const textSize = resolveTextSize(searchParams)
  const textFontWeight = resolveTextFontWeight(searchParams)
  const objectScale = resolveObjectScale(searchParams)
  const animationSpeed = resolveAnimationSpeed(searchParams)

  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0 }}>
      <MaterialControls hidden={!showControls} />
      <GlassScene
        preset={preset}
        background={background}
        backgroundText={backgroundText}
        textColor={textColor}
        textSize={textSize}
        textFontWeight={textFontWeight}
        objectScale={objectScale}
        animationSpeed={animationSpeed}
        interactive={interactive}
      />
    </main>
  )
}
