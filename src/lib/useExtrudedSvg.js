'use client'

import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import * as THREE from 'three'
import { attachSmoothNormals } from './attachSmoothNormals'

function normalizeGeometry(geometry, targetSize = 2) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001)
  const scale = targetSize / maxAxis
  geometry.scale(scale, scale, scale)
  geometry.center()
  geometry.computeVertexNormals()
  attachSmoothNormals(geometry)
  return geometry
}

export function useExtrudedSvg(url, depth = 0.3) {
  const data = useLoader(SVGLoader, url)

  return useMemo(() => {
    const shapes = []

    for (const path of data.paths) {
      const pathShapes = path.toShapes(true)
      shapes.push(...pathShapes)
    }

    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.08,
      bevelSize: depth * 0.06,
      bevelSegments: 3,
      curveSegments: 24,
    })

    geometry.rotateX(Math.PI)
    return normalizeGeometry(geometry)
  }, [data, depth])
}
