'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  defaultBackgroundText,
  defaultAnimationSpeed,
  defaultObjectScale,
  getFontForWeight,
} from '@/lib/brand'
import { useProceduralGeometry } from '@/lib/useProceduralGeometry'
import { useMaterialLayerControls } from '@/lib/materialLayers'
import { useLayeredMaterial } from '@/lib/useLayeredMaterial'

function getMeshFromScene(scene, nodeName) {
  if (nodeName) {
    const named = scene.getObjectByName(nodeName)
    if (named?.isMesh) return named
  }

  let mesh = null
  scene.traverse((child) => {
    if (child.isMesh && !mesh) mesh = child
  })
  return mesh
}

function centerGeometryFromMesh(mesh) {
  const geometry = mesh.geometry.clone()
  const matrix = new THREE.Matrix4().compose(
    mesh.position,
    mesh.quaternion,
    mesh.scale,
  )
  geometry.applyMatrix4(matrix)
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

function glassMaterialProps(layers) {
  const glassOn = layers.glass.visible
  return {
    thickness: layers.glass.thickness,
    roughness: layers.glass.roughness,
    // Opaque metal only when Glass is off; transmission glass stays dielectric.
    metalness: glassOn ? 0 : layers.glass.metalness,
    transmission: glassOn ? layers.glass.opacity / 100 : 0,
    ior: layers.glass.ior,
    chromaticAberration: layers.glass.chromaticAberration,
    anisotropy: layers.glass.anisotropy,
    backside: layers.glass.backside,
  }
}

function pickGlbUrl(preset, layers) {
  const roundness = layers.edges.visible ? layers.edges.opacity : 0
  // Keep low roundness (e.g. Ice Crystal ~12) on the sharp original mesh.
  if (!preset.roundedGlb || roundness < 20) return preset.glb
  if (roundness < 55) return preset.roundedGlb
  return preset.roundedStrongGlb ?? preset.roundedGlb
}

function GlbGlassMesh({ url, node, layers, materialRef }) {
  const { scene } = useGLTF(url)

  const sourceMesh = useMemo(
    () => getMeshFromScene(scene, node),
    [scene, node],
  )

  const geometry = useMemo(
    () => (sourceMesh ? centerGeometryFromMesh(sourceMesh) : null),
    [sourceMesh],
  )

  if (!geometry) return null

  return (
    <mesh geometry={geometry}>
      <MeshTransmissionMaterial ref={materialRef} {...glassMaterialProps(layers)} />
    </mesh>
  )
}

function ProceduralGlassMesh({ preset, layers, materialRef }) {
  const geometry = useProceduralGeometry(preset.geometry, preset.geometryParams)

  if (!geometry) return null

  return (
    <mesh geometry={geometry} rotation={preset.rotation ?? [0, 0, 0]}>
      <MeshTransmissionMaterial ref={materialRef} {...glassMaterialProps(layers)} />
    </mesh>
  )
}

export default function GlassTorus({
  preset,
  backgroundText = defaultBackgroundText,
  textColor = '#161616',
  textSize = 0.62,
  textFontWeight = 700,
  objectScale = defaultObjectScale,
  animationSpeed = defaultAnimationSpeed,
  showBackgroundText = true,
  interactive = true,
}) {
  const objectGroupRef = useRef(null)
  const materialRef = useRef(null)
  const { viewport, gl } = useThree()
  const textFont = getFontForWeight(textFontWeight)
  const rotation = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const isProcedural = preset.type === 'procedural'

  useEffect(() => {
    if (preset.glb) useGLTF.preload(preset.glb)
    if (preset.roundedGlb) useGLTF.preload(preset.roundedGlb)
    if (preset.roundedStrongGlb) useGLTF.preload(preset.roundedStrongGlb)
  }, [preset.glb, preset.roundedGlb, preset.roundedStrongGlb])

  useEffect(() => {
    if (!interactive) return undefined

    const canvas = gl.domElement
    canvas.style.cursor = 'grab'

    const onPointerDown = () => {
      dragging.current = true
      canvas.style.cursor = 'grabbing'
    }

    const onPointerUp = () => {
      dragging.current = false
      canvas.style.cursor = 'grab'
    }

    const onPointerMove = (event) => {
      if (!dragging.current) return
      rotation.current.y += event.movementX * 0.005
      rotation.current.x += event.movementY * 0.005
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.style.cursor = ''
    }
  }, [interactive, gl])

  const layers = useMaterialLayerControls('Material')
  const glbUrl = !isProcedural ? pickGlbUrl(preset, layers) : null

  useLayeredMaterial(materialRef, layers)

  useFrame((_, delta) => {
    if (!objectGroupRef.current) return
    if (!dragging.current) {
      rotation.current.x += preset.autoRotateSpeed * animationSpeed * delta * 60
    }
    objectGroupRef.current.rotation.x = rotation.current.x
    objectGroupRef.current.rotation.y = rotation.current.y
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
      <group ref={objectGroupRef} scale={objectScale}>
        {isProcedural ? (
          <ProceduralGlassMesh preset={preset} layers={layers} materialRef={materialRef} />
        ) : (
          <Suspense fallback={null}>
            <GlbGlassMesh
              key={glbUrl}
              url={glbUrl}
              node={preset.node}
              layers={layers}
              materialRef={materialRef}
            />
          </Suspense>
        )}
      </group>
    </group>
  )
}
