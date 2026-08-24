'use client'

import { Suspense, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, Text } from '@react-three/drei'
import { useExtrudedSvg } from '@/lib/useExtrudedSvg'
import {
  defaultAnimationSpeed,
  defaultBackgroundText,
  getFontForWeight,
} from '@/lib/brand'
import { useMaterialLayerControls } from '@/lib/materialLayers'
import { useLayeredMaterial } from '@/lib/useLayeredMaterial'

export default function GlassObject({
  preset,
  interactive = true,
  backgroundText = defaultBackgroundText,
  textColor = '#161616',
  textSize = 0.62,
  textFontWeight = 700,
  animationSpeed = defaultAnimationSpeed,
  showBackgroundText = true,
}) {
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const { viewport } = useThree()
  const geometry = useExtrudedSvg(preset.svg, preset.depth)
  const textFont = getFontForWeight(textFontWeight)

  const layers = useMaterialLayerControls(
    `${preset.label} Material`,
    preset.tint ? { color: { tint: preset.tint, visible: true } } : undefined,
  )

  useLayeredMaterial(materialRef, layers)

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const targetX = interactive ? pointer.current.y * 0.45 : 0
    const targetY = interactive ? pointer.current.x * 0.65 : 0

    meshRef.current.rotation.x = THREE_LERP(
      meshRef.current.rotation.x,
      targetX,
      1 - Math.pow(0.001, delta),
    )
    meshRef.current.rotation.y += delta * preset.autoRotateSpeed * animationSpeed
    meshRef.current.rotation.z = THREE_LERP(
      meshRef.current.rotation.z,
      -targetY * 0.25,
      1 - Math.pow(0.001, delta),
    )

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.015
    meshRef.current.scale.setScalar(preset.scale * pulse)
  })

  return (
    <group scale={viewport.width / 3.75}>
      {showBackgroundText && (
        <Suspense fallback={null}>
          <Text
            key={textFont}
            font={textFont}
            position={[0, 0, -1]}
            fontSize={textSize}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={12}
            letterSpacing={-0.03}
          >
            {backgroundText}
          </Text>
        </Suspense>
      )}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={(event) => {
          if (!interactive) return
          pointer.current.x = event.pointer.x
          pointer.current.y = event.pointer.y
        }}
        onPointerOut={() => {
          pointer.current.x = 0
          pointer.current.y = 0
        }}
      >
        <MeshTransmissionMaterial
          ref={materialRef}
          thickness={layers.glass.thickness}
          roughness={layers.glass.roughness}
          metalness={layers.glass.visible ? 0 : layers.glass.metalness}
          transmission={layers.glass.visible ? layers.glass.opacity / 100 : 0}
          ior={layers.glass.ior}
          chromaticAberration={layers.glass.chromaticAberration}
          anisotropy={layers.glass.anisotropy}
          backside={layers.glass.backside}
          transparent
          samples={10}
          resolution={512}
        />
      </mesh>
    </group>
  )
}

function THREE_LERP(start, end, alpha) {
  return start + (end - start) * alpha
}
