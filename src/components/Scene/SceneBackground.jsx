'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Color } from 'three'

export default function SceneBackground({ color }) {
  const { scene, gl } = useThree()

  useEffect(() => {
    if (color === 'transparent') {
      scene.background = null
      gl.setClearColor(0x000000, 0)
      return
    }

    const threeColor = new Color(color)
    scene.background = threeColor
    gl.setClearColor(threeColor, 1)
  }, [color, scene, gl])

  return null
}
