'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import GlassObject from './GlassObject'
import GlassTorus from './GlassTorus'
import SceneBackground from './SceneBackground'
import {
  brandColors,
  defaultAnimationSpeed,
  defaultBackground,
  defaultBackgroundText,
  defaultObjectScale,
  defaultTextFontWeight,
  defaultTextSize,
  formatBackgroundText,
  getReadableTextColor,
} from '@/lib/brand'

function SceneContent({
  preset,
  interactive,
  isGlb,
  showBackgroundText,
  backgroundText,
  textColor,
  textSize,
  textFontWeight,
  objectScale,
  animationSpeed,
}) {
  const sharedProps = {
    backgroundText,
    textColor,
    textSize,
    textFontWeight,
    animationSpeed,
    showBackgroundText,
  }

  return (
    <>
      {isGlb ? (
        <GlassTorus
          preset={preset}
          objectScale={objectScale}
          interactive={interactive}
          {...sharedProps}
        />
      ) : (
        <GlassObject preset={preset} interactive={interactive} {...sharedProps} />
      )}
      <directionalLight intensity={2.2} position={[2, 3, 4]} />
      <directionalLight intensity={0.8} position={[-3, -1, 2]} />
      <Environment preset="city" />
    </>
  )
}

export default function GlassScene({
  preset,
  background,
  backgroundText = defaultBackgroundText,
  textColor = brandColors.text,
  textSize = defaultTextSize,
  textFontWeight = defaultTextFontWeight,
  objectScale = defaultObjectScale,
  animationSpeed = defaultAnimationSpeed,
  showBackgroundText = true,
  interactive = true,
  className,
}) {
  const sceneBackground = background ?? defaultBackground
  const readableTextColor = getReadableTextColor(sceneBackground, textColor)
  const displayText = formatBackgroundText(backgroundText)
  const isGlb = preset.type === 'glb' || preset.type === 'procedural'

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', background: sceneBackground }}
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: sceneBackground === 'transparent', antialias: true }}
      >
        <SceneBackground color={sceneBackground} />
        <Suspense fallback={null}>
          <SceneContent
            preset={preset}
            interactive={interactive}
            isGlb={isGlb}
            showBackgroundText={showBackgroundText}
            backgroundText={displayText}
            textColor={readableTextColor}
            textSize={textSize}
            textFontWeight={textFontWeight}
            objectScale={objectScale}
            animationSpeed={animationSpeed}
          />
        </Suspense>
        {interactive && !isGlb && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI * 0.85}
            minPolarAngle={Math.PI * 0.15}
          />
        )}
      </Canvas>
    </div>
  )
}
