'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const builders = {
  torus: ({
    radius = 1,
    tube = 0.35,
    radialSegments = 48,
    tubularSegments = 96,
    arc = Math.PI * 2,
  } = {}) =>
    new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc),

  torusKnot: ({
    radius = 0.85,
    tube = 0.28,
    tubularSegments = 128,
    radialSegments = 16,
    p = 2,
    q = 3,
  } = {}) =>
    new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q),

  goldenPlus: ({ total = 1, grid = 4 } = {}) => {
    // 2×2×2 Voxel-Plus auf 4×4×4: drei sich schneidende Balken
    // (volle Länge × 2 Voxel × 2 Voxel) — eine Form ohne Unterteilungen.
    const unit = total / grid
    const span = unit * 2
    const bars = [
      new THREE.BoxGeometry(total, span, span),
      new THREE.BoxGeometry(span, total, span),
      new THREE.BoxGeometry(span, span, total),
    ]
    const merged = mergeGeometries(bars)
    bars.forEach((geometry) => geometry.dispose())
    return merged
  },
}

export function useProceduralGeometry(geometryType, params = {}) {
  const paramsKey = JSON.stringify(params)

  return useMemo(() => {
    const builder = builders[geometryType]
    if (!builder) return null

    const geometry = builder(JSON.parse(paramsKey))
    geometry.computeVertexNormals()
    return geometry
  }, [geometryType, paramsKey])
}
