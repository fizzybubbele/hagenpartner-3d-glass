import * as THREE from 'three'

// For every vertex index, lists the *other* two vertex indices of every
// triangle it belongs to — a one-ring adjacency used to tell convex corners
// (which stick out beyond their neighbors) apart from concave/reflex ones
// (which sit recessed relative to their neighbors), since a rounded fillet
// has to bulge in opposite directions for the two cases.
function buildVertexAdjacency(index, count) {
  const neighbors = new Array(count)
  for (let i = 0; i < count; i += 1) neighbors[i] = []

  const addTriangle = (a, b, c) => {
    neighbors[a].push(b, c)
    neighbors[b].push(a, c)
    neighbors[c].push(a, b)
  }

  if (index) {
    const idx = index.array
    for (let t = 0; t < idx.length; t += 3) {
      addTriangle(idx[t], idx[t + 1], idx[t + 2])
    }
  } else {
    for (let t = 0; t + 2 < count; t += 3) {
      addTriangle(t, t + 1, t + 2)
    }
  }

  return neighbors
}

// Fakes rounded/chamfered edges on a hard-shaded mesh without changing its
// topology (so it works on any geometry — GLB, procedural, SVG-extruded —
// with zero risk of cracks/holes appearing at seams).
//
// Hard edges in a mesh are represented by multiple vertices that share the
// exact same position but have different (flat, per-face) normals. For each
// such position we compute:
//   - `smoothNormal`: the averaged normal across all faces meeting there,
//     used by the shader to blend from the sharp flat-shaded normal towards
//     a smooth one — this alone makes specular highlights and (crucially,
//     for a transmissive glass material) refraction bend gradually across
//     the edge instead of creasing sharply.
//   - `edgeBevelOffset`: a small push along that averaged normal, scaled by
//     how sharp the corner is (dot product of the flat normals vs. the
//     average — near 0 on flat faces, larger on sharp corners) and by the
//     mesh's own size. Every duplicate vertex at a given position gets the
//     *same* offset, so coincident vertices stay coincident after the push
//     — no visible seams.
//
//     The push direction depends on convexity: at a *convex* corner (e.g.
//     an outer point of the Hypercross) `avgNormal` points away from the
//     solid and pushing `-avgNormal` cuts the sharp tip back, reading as a
//     rounded bevel. At a *concave/reflex* corner (e.g. the inward notch
//     where two arms meet) `avgNormal` also points away from the solid —
//     but into the empty notch — so the same `-avgNormal` push would shove
//     the vertex further into the material instead of bulging a fillet
//     into the notch. We disambiguate the two cases by comparing the
//     corner's position against the average position of its immediate
//     mesh neighbors (a discrete curvature estimate): if the corner sticks
//     out beyond its neighbors along `avgNormal` it's convex (keep the
//     existing push); if it sits recessed relative to them, it's concave
//     and the push is flipped to `+avgNormal` so the notch rounds out to
//     match the convex edges.
export function attachSmoothNormals(geometry, { bevelFraction = 0.05 } = {}) {
  if (!geometry || geometry.attributes.smoothNormal) return geometry

  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  if (!position || !normal) return geometry

  const count = position.count
  const precision = 1e4
  const groups = new Map()

  for (let i = 0; i < count; i += 1) {
    const key = `${Math.round(position.getX(i) * precision)}_${Math.round(
      position.getY(i) * precision,
    )}_${Math.round(position.getZ(i) * precision)}`
    let bucket = groups.get(key)
    if (!bucket) {
      bucket = []
      groups.set(key, bucket)
    }
    bucket.push(i)
  }

  if (!geometry.boundingSphere) geometry.computeBoundingSphere()
  const radius = geometry.boundingSphere?.radius || 1
  const maxPush = radius * bevelFraction

  const neighbors = buildVertexAdjacency(geometry.index, count)

  const smoothNormals = new Float32Array(count * 3)
  const edgeBevelOffset = new Float32Array(count * 3)
  const memberNormal = new THREE.Vector3()
  const avgNormal = new THREE.Vector3()
  const cornerPos = new THREE.Vector3()
  const meanNeighborPos = new THREE.Vector3()
  const curvature = new THREE.Vector3()

  for (const indices of groups.values()) {
    avgNormal.set(0, 0, 0)
    for (const i of indices) {
      avgNormal.x += normal.getX(i)
      avgNormal.y += normal.getY(i)
      avgNormal.z += normal.getZ(i)
    }
    if (avgNormal.lengthSq() < 1e-10) avgNormal.set(0, 1, 0)
    avgNormal.normalize()

    let dotSum = 0
    for (const i of indices) {
      memberNormal.set(normal.getX(i), normal.getY(i), normal.getZ(i))
      dotSum += memberNormal.dot(avgNormal)
    }
    const sharpness = THREE.MathUtils.clamp(1 - dotSum / indices.length, 0, 1)

    // One-ring neighbor average, excluding the corner's own (coincident)
    // sibling vertices, to estimate whether this corner sticks out
    // (convex) or sits recessed (concave) relative to the surrounding mesh.
    const memberSet = new Set(indices)
    const neighborSet = new Set()
    for (const i of indices) {
      for (const n of neighbors[i]) {
        if (!memberSet.has(n)) neighborSet.add(n)
      }
    }

    let convexSign = 1
    if (neighborSet.size > 0) {
      meanNeighborPos.set(0, 0, 0)
      for (const n of neighborSet) {
        meanNeighborPos.x += position.getX(n)
        meanNeighborPos.y += position.getY(n)
        meanNeighborPos.z += position.getZ(n)
      }
      meanNeighborPos.divideScalar(neighborSet.size)

      const firstIndex = indices[0]
      cornerPos.set(position.getX(firstIndex), position.getY(firstIndex), position.getZ(firstIndex))
      curvature.copy(cornerPos).sub(meanNeighborPos)
      const signedConvexity = curvature.dot(avgNormal)
      // Ambiguous/near-flat cases default to the convex (cut-back) push,
      // matching the previous behavior where it mattered least (sharpness
      // is already ~0 there).
      if (signedConvexity < 0) convexSign = -1
    }

    const push = sharpness * maxPush * convexSign

    for (const i of indices) {
      smoothNormals[i * 3] = avgNormal.x
      smoothNormals[i * 3 + 1] = avgNormal.y
      smoothNormals[i * 3 + 2] = avgNormal.z
      edgeBevelOffset[i * 3] = -avgNormal.x * push
      edgeBevelOffset[i * 3 + 1] = -avgNormal.y * push
      edgeBevelOffset[i * 3 + 2] = -avgNormal.z * push
    }
  }

  geometry.setAttribute('smoothNormal', new THREE.BufferAttribute(smoothNormals, 3))
  geometry.setAttribute('edgeBevelOffset', new THREE.BufferAttribute(edgeBevelOffset, 3))

  return geometry
}
