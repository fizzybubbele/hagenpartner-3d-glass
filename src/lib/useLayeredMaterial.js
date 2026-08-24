'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  createImageTexture,
  createMatcapTexture,
  createPlaceholderTexture,
} from './generateProceduralTexture'

const WHITE = new THREE.Color('#ffffff')
const patternTypeIndex = { Checker: 0, Stripes: 1, Dots: 2 }

// Extra GLSL uniforms for every layer beyond Glass/Color, declared once up
// front so every injection point below can use them.
const FRAGMENT_HEAD = /* glsl */ `
uniform float uImageOpacity;
uniform sampler2D uImageMap;

uniform float uVideoOpacity;
uniform sampler2D uVideoMap;

uniform float uDepthOpacity;
uniform float uDepthNear;
uniform float uDepthFar;
uniform vec3 uDepthColorNear;
uniform vec3 uDepthColorFar;

uniform float uPatternOpacity;
uniform float uPatternType;
uniform float uPatternScale;
uniform vec3 uPatternColorA;
uniform vec3 uPatternColorB;

uniform float uLightingOpacity;

uniform float uToonOpacity;
uniform float uToonSteps;

uniform float uNormalOpacity;

uniform float uFresnelOpacity;
uniform vec3 uFresnelColor;
uniform float uFresnelPower;

uniform float uMatcapOpacity;
uniform vec3 uMatcapTint;
uniform sampler2D uMatcapMap;
uniform float uMatcapRotation;
uniform float uMatcapMode;

uniform float uRainbowOpacity;
uniform float uRainbowSpeed;
uniform float uRainbowScale;
uniform float uTime;

uniform float uOutlineOpacity;
uniform vec3 uOutlineColor;
uniform float uOutlineThreshold;
uniform float uOutlineWidth;

uniform float uFrostOpacity;
uniform float uFrostStart;
uniform float uFrostEnd;
uniform float uFrostNoiseScale;
uniform float uFrostNoiseStrength;
uniform float uFrostRoughness;
uniform vec3 uFrostColor;
uniform vec3 uFrostClearColor;
uniform float uFrostClearTint;

varying vec3 vFrostLocalPosition;

float layeredFrostNoise(vec3 p) {
  return sin(p.x * 3.1 + sin(p.z * 2.3)) * sin(p.y * 2.7 - p.x * 1.1) * sin(p.z * 3.7 + p.y * 0.9);
}

// A coarser, second octave layered on top of layeredFrostNoise gives the
// clear/frost boundary soft, irregular cloud-like tendrils instead of a
// crisp gradient or fine sand-like grain.
float layeredFrostCloudNoise(vec3 p) {
  float fine = layeredFrostNoise(p);
  float coarse = layeredFrostNoise(p * 0.35 + vec3(11.3, -7.1, 4.7));
  return coarse * 0.7 + fine * 0.3;
}

vec3 layeredHueShift(float hue) {
  vec3 rgb = clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return rgb * rgb * (3.0 - 2.0 * rgb);
}

float layeredPatternValue(vec2 uv, float patternType, float scale) {
  vec2 scaled = uv * scale;
  if (patternType < 0.5) {
    vec2 cell = floor(scaled);
    return mod(cell.x + cell.y, 2.0);
  } else if (patternType < 1.5) {
    return step(0.5, fract(scaled.x));
  }
  vec2 cell = fract(scaled) - 0.5;
  return 1.0 - smoothstep(0.25, 0.3, length(cell));
}
`

const VERTEX_HEAD = /* glsl */ `
uniform float uTime;
uniform float uDisplaceOpacity;
uniform float uDisplaceScale;
uniform float uDisplaceSpeed;
uniform float uDisplaceStrength;

varying vec3 vFrostLocalPosition;

float layeredDisplaceNoise(vec3 p, float t) {
  return sin(p.x * 1.7 + t) * sin(p.y * 1.3 - t * 0.7) * sin(p.z * 1.9 + t * 0.5);
}
`

// Patches a live MeshTransmissionMaterial instance (from drei) to add many
// more visual layers on top of its own transmission/backside GLSL. The
// original onBeforeCompile is preserved and called first, so drei's glass
// behavior is untouched; we only append further shader chunks.
function installLayeredShaderPatch(material) {
  if (material.userData.__layeredPatched) {
    return material.userData.layerUniforms
  }

  const matcapDefaultTexture = createMatcapTexture()
  const videoDefaultTexture = createPlaceholderTexture()

  const layerUniforms = {
    uImageOpacity: { value: 0 },
    uImageMap: { value: createImageTexture('Gradient') },

    uVideoOpacity: { value: 0 },
    uVideoMap: { value: videoDefaultTexture },

    uDepthOpacity: { value: 0 },
    uDepthNear: { value: 1 },
    uDepthFar: { value: 6 },
    uDepthColorNear: { value: new THREE.Color('#ffffff') },
    uDepthColorFar: { value: new THREE.Color('#000000') },

    uPatternOpacity: { value: 0 },
    uPatternType: { value: 0 },
    uPatternScale: { value: 8 },
    uPatternColorA: { value: new THREE.Color('#ffffff') },
    uPatternColorB: { value: new THREE.Color('#161616') },

    uLightingOpacity: { value: 1 },

    uToonOpacity: { value: 0 },
    uToonSteps: { value: 4 },

    uNormalOpacity: { value: 0 },

    uFresnelOpacity: { value: 0 },
    uFresnelColor: { value: new THREE.Color('#ffffff') },
    uFresnelPower: { value: 2.5 },

    uMatcapOpacity: { value: 0 },
    uMatcapTint: { value: new THREE.Color('#ffffff') },
    uMatcapMap: { value: matcapDefaultTexture },
    uMatcapRotation: { value: 0 },
    uMatcapMode: { value: 0 },

    uRainbowOpacity: { value: 0 },
    uRainbowSpeed: { value: 0.15 },
    uRainbowScale: { value: 1.2 },
    uTime: { value: 0 },

    uOutlineOpacity: { value: 0 },
    uOutlineColor: { value: new THREE.Color('#000000') },
    uOutlineThreshold: { value: 0.3 },
    uOutlineWidth: { value: 0.1 },

    uDisplaceOpacity: { value: 0 },
    uDisplaceScale: { value: 1.5 },
    uDisplaceSpeed: { value: 0.3 },
    uDisplaceStrength: { value: 0.12 },

    uFrostOpacity: { value: 0 },
    uFrostStart: { value: -0.65 },
    uFrostEnd: { value: 0.25 },
    uFrostNoiseScale: { value: 2.5 },
    uFrostNoiseStrength: { value: 0.35 },
    uFrostRoughness: { value: 0.95 },
    uFrostColor: { value: new THREE.Color('#ffffff') },
    uFrostClearColor: { value: new THREE.Color('#ffffff') },
    uFrostClearTint: { value: 0 },
  }

  const originalOnBeforeCompile = material.onBeforeCompile.bind(material)

  material.onBeforeCompile = (shader, renderer) => {
    originalOnBeforeCompile(shader, renderer)

    shader.uniforms = { ...shader.uniforms, ...layerUniforms }
    // vUv is only declared by three when a map/anisotropy feature is active;
    // force it on so the base-color layers can always sample by UV.
    shader.defines = { ...shader.defines, USE_UV: '' }

    shader.vertexShader = VERTEX_HEAD + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      transformed += normal * layeredDisplaceNoise( transformed * uDisplaceScale, uTime * uDisplaceSpeed ) * uDisplaceStrength * uDisplaceOpacity;
      vFrostLocalPosition = transformed;
      `,
    )

    shader.fragmentShader = FRAGMENT_HEAD + shader.fragmentShader

    // Base-color layers: Image, Video, Depth, Pattern all fade into the
    // diffuse color before lighting is applied.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      diffuseColor.rgb = mix( diffuseColor.rgb, texture2D( uImageMap, vUv ).rgb, uImageOpacity );
      diffuseColor.rgb = mix( diffuseColor.rgb, texture2D( uVideoMap, vUv ).rgb, uVideoOpacity );
      {
        float depthDist = length( vViewPosition );
        float depthT = clamp( ( depthDist - uDepthNear ) / max( uDepthFar - uDepthNear, 0.0001 ), 0.0, 1.0 );
        vec3 depthColor = mix( uDepthColorNear, uDepthColorFar, depthT );
        diffuseColor.rgb = mix( diffuseColor.rgb, depthColor, uDepthOpacity );
      }
      {
        float patternMask = layeredPatternValue( vUv, uPatternType, uPatternScale );
        vec3 patternColor = mix( uPatternColorB, uPatternColorA, patternMask );
        diffuseColor.rgb = mix( diffuseColor.rgb, patternColor, uPatternOpacity );
      }
      float frostT = 0.0;
      {
        float frostRaw = ( uFrostEnd - vFrostLocalPosition.y ) / max( uFrostEnd - uFrostStart, 0.0001 );
        float frostNoise = layeredFrostCloudNoise( vFrostLocalPosition * uFrostNoiseScale ) * uFrostNoiseStrength;
        float frostRawT = clamp( smoothstep( 0.0, 1.0, frostRaw + frostNoise ), 0.0, 1.0 );
        frostT = frostRawT * uFrostOpacity;
        // Clear-side tint (e.g. a saturated glass color) fades in towards the
        // top as the frosted bottom tint fades out — independent strength so
        // the default white clearColor never changes existing looks.
        diffuseColor.rgb = mix( diffuseColor.rgb, uFrostClearColor, ( 1.0 - frostRawT ) * uFrostClearTint );
      }
      diffuseColor.rgb = mix( diffuseColor.rgb, uFrostColor, frostT );
      `,
    )

    // Frost layer (continued): once roughnessFactor exists, blend towards
    // the frosted roughness using the same frostT computed above — this is
    // untouched by drei's own patch, which only rewrites the later
    // transmission_pars_fragment / transmission_fragment chunks.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
      #include <roughnessmap_fragment>
      roughnessFactor = mix( roughnessFactor, uFrostRoughness, frostT );
      `,
    )

    // Lighting layer: blend between the flat base color (0%) and the fully
    // lit + transmitted result (100%, today's default look).
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
      /* glsl */ `
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      outgoingLight = mix( diffuseColor.rgb, outgoingLight, uLightingOpacity );
      `,
    )

    // Final layers: Toon, Normal, Fresnel, Matcap, Rainbow, Outline all
    // operate on the fully shaded result, using the normal/view dir already
    // computed by lights_fragment_begin.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      /* glsl */ `
      {
        vec3 patchNormal = normalize( geometryNormal );
        vec3 patchViewDir = normalize( geometryViewDir );
        float patchFacing = clamp( dot( patchNormal, patchViewDir ), 0.0, 1.0 );

        float toonLum = dot( outgoingLight, vec3( 0.299, 0.587, 0.114 ) );
        float toonQuant = floor( toonLum * uToonSteps + 0.5 ) / max( uToonSteps, 1.0 );
        vec3 toonColor = outgoingLight * ( toonQuant / max( toonLum, 0.0001 ) );
        outgoingLight = mix( outgoingLight, toonColor, uToonOpacity );

        vec3 normalColor = patchNormal * 0.5 + 0.5;
        outgoingLight = mix( outgoingLight, normalColor, uNormalOpacity );

        float fresnelRim = pow( 1.0 - patchFacing, uFresnelPower );
        outgoingLight += uFresnelColor * fresnelRim * uFresnelOpacity;

        vec3 matcapTangent = normalize( vec3( patchViewDir.z, 0.0, -patchViewDir.x ) );
        vec3 matcapBitangent = cross( patchViewDir, matcapTangent );
        vec2 matcapUv = vec2( dot( matcapTangent, patchNormal ), dot( matcapBitangent, patchNormal ) ) * 0.495 + 0.5;
        float matcapAngle = radians( uMatcapRotation );
        float matcapCos = cos( matcapAngle );
        float matcapSin = sin( matcapAngle );
        vec2 matcapCentered = matcapUv - 0.5;
        vec2 matcapRotated = vec2(
          matcapCentered.x * matcapCos - matcapCentered.y * matcapSin,
          matcapCentered.x * matcapSin + matcapCentered.y * matcapCos
        ) + 0.5;
        vec3 matcapColor = texture2D( uMatcapMap, matcapRotated ).rgb * uMatcapTint;
        if ( uMatcapMode > 0.5 ) {
          float matcapLum = dot( matcapColor, vec3( 0.299, 0.587, 0.114 ) );
          outgoingLight = mix( outgoingLight, outgoingLight * matcapLum, uMatcapOpacity );
        } else {
          // Color mode replaces toward the matcap (not additive) so high
          // opacity reads as chrome/metal instead of a washed-out bloom.
          outgoingLight = mix( outgoingLight, matcapColor, uMatcapOpacity );
        }

        float rainbowHue = fract( patchFacing * uRainbowScale + uTime * uRainbowSpeed );
        float rainbowRim = pow( 1.0 - patchFacing, 1.5 );
        outgoingLight += layeredHueShift( rainbowHue ) * rainbowRim * uRainbowOpacity;

        float outlineEdge = smoothstep( uOutlineThreshold - uOutlineWidth, uOutlineThreshold + uOutlineWidth, 1.0 - patchFacing );
        outgoingLight = mix( outgoingLight, uOutlineColor, outlineEdge * uOutlineOpacity );
      }
      #include <opaque_fragment>
      `,
    )
  }

  material.userData.__layeredPatched = true
  material.userData.layerUniforms = layerUniforms
  material.userData.layerDefaults = {
    matcapMap: matcapDefaultTexture,
    videoMap: videoDefaultTexture,
  }
  material.needsUpdate = true

  return layerUniforms
}

function manageMatcapImage(uniforms, defaults, stateRef, imageDataUrl) {
  if (stateRef.current.source === imageDataUrl) return
  stateRef.current.source = imageDataUrl

  if (!imageDataUrl) {
    uniforms.uMatcapMap.value = defaults.matcapMap
    stateRef.current.customTexture?.dispose()
    stateRef.current.customTexture = null
    return
  }

  new THREE.TextureLoader().load(imageDataUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    uniforms.uMatcapMap.value = texture
    stateRef.current.customTexture?.dispose()
    stateRef.current.customTexture = texture
  })
}

function manageVideoTexture(uniforms, defaults, stateRef, url) {
  if (stateRef.current.url === url) return
  stateRef.current.url = url

  stateRef.current.video?.pause()
  stateRef.current.texture?.dispose()
  stateRef.current.video = null
  stateRef.current.texture = null

  if (!url) {
    uniforms.uVideoMap.value = defaults.videoMap
    return
  }

  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.src = url
  video.play().catch(() => {})

  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace

  uniforms.uVideoMap.value = texture
  stateRef.current.video = video
  stateRef.current.texture = texture
}

// A custom uploaded image always wins over the procedural pattern; clearing
// the upload (via Leva's image control) falls back to the selected pattern.
function manageImageTexture(uniforms, stateRef, layer) {
  const key = layer.image || `pattern:${layer.pattern}`
  if (stateRef.current.key === key) return
  stateRef.current.key = key

  if (layer.image) {
    new THREE.TextureLoader().load(layer.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      uniforms.uImageMap.value = texture
      stateRef.current.texture?.dispose()
      stateRef.current.texture = texture
    })
    return
  }

  const nextTexture = createImageTexture(layer.pattern)
  const previous = stateRef.current.texture
  uniforms.uImageMap.value = nextTexture
  stateRef.current.texture = nextTexture
  previous?.dispose()
}

// Wires a Leva-driven `layers` object (see materialLayers.js) into a
// MeshTransmissionMaterial ref every frame. Toggling/dragging a layer never
// triggers a shader recompile: every layer collapses to a small set of
// uniforms that are just multiplied/mixed in.
export function useLayeredMaterial(materialRef, layers) {
  const imageStateRef = useRef({ key: null, texture: null })
  const videoStateRef = useRef({ url: null, video: null, texture: null })
  const matcapStateRef = useRef({ source: undefined, customTexture: null })

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return

    const uniforms = installLayeredShaderPatch(material)
    const defaults = material.userData.layerDefaults

    uniforms.uImageOpacity.value = layers.image.visible ? layers.image.opacity / 100 : 0
    manageImageTexture(uniforms, imageStateRef, layers.image)

    uniforms.uVideoOpacity.value = layers.video.visible ? layers.video.opacity / 100 : 0
    manageVideoTexture(uniforms, defaults, videoStateRef, layers.video.url)

    uniforms.uDepthOpacity.value = layers.depth.visible ? layers.depth.opacity / 100 : 0
    uniforms.uDepthNear.value = layers.depth.near
    uniforms.uDepthFar.value = layers.depth.far
    uniforms.uDepthColorNear.value.set(layers.depth.colorNear)
    uniforms.uDepthColorFar.value.set(layers.depth.colorFar)

    uniforms.uPatternOpacity.value = layers.pattern.visible ? layers.pattern.opacity / 100 : 0
    uniforms.uPatternType.value = patternTypeIndex[layers.pattern.type] ?? 0
    uniforms.uPatternScale.value = layers.pattern.scale
    uniforms.uPatternColorA.value.set(layers.pattern.colorA)
    uniforms.uPatternColorB.value.set(layers.pattern.colorB)

    uniforms.uLightingOpacity.value = layers.lighting.visible ? layers.lighting.opacity / 100 : 0
    material.envMapIntensity = layers.lighting.envMapIntensity
    // Keep opaque-metal path in sync (Chrome Liquid); glass transmission stays dielectric.
    material.metalness = layers.glass.visible ? 0 : layers.glass.metalness ?? 0
    material.roughness = layers.glass.roughness

    uniforms.uToonOpacity.value = layers.toon.visible ? layers.toon.opacity / 100 : 0
    uniforms.uToonSteps.value = layers.toon.steps

    uniforms.uNormalOpacity.value = layers.normal.visible ? layers.normal.opacity / 100 : 0

    uniforms.uFresnelOpacity.value = layers.fresnel.visible ? layers.fresnel.opacity / 100 : 0
    uniforms.uFresnelColor.value.set(layers.fresnel.color)
    uniforms.uFresnelPower.value = layers.fresnel.power

    uniforms.uMatcapOpacity.value = layers.matcap.visible ? layers.matcap.opacity / 100 : 0
    uniforms.uMatcapTint.value.set(layers.matcap.tint)
    uniforms.uMatcapRotation.value = layers.matcap.rotation
    uniforms.uMatcapMode.value = layers.matcap.mode === 'Mask' ? 1 : 0
    manageMatcapImage(uniforms, defaults, matcapStateRef, layers.matcap.image)

    uniforms.uRainbowOpacity.value = layers.rainbow.visible ? layers.rainbow.opacity / 100 : 0
    uniforms.uRainbowSpeed.value = layers.rainbow.speed
    uniforms.uRainbowScale.value = layers.rainbow.scale
    uniforms.uTime.value = state.clock.elapsedTime

    uniforms.uOutlineOpacity.value = layers.outline.visible ? layers.outline.opacity / 100 : 0
    uniforms.uOutlineColor.value.set(layers.outline.color)
    uniforms.uOutlineThreshold.value = layers.outline.thickness
    uniforms.uOutlineWidth.value = layers.outline.width

    uniforms.uDisplaceOpacity.value = layers.displace.visible ? layers.displace.opacity / 100 : 0
    uniforms.uDisplaceScale.value = layers.displace.scale
    uniforms.uDisplaceSpeed.value = layers.displace.speed
    uniforms.uDisplaceStrength.value = layers.displace.strength

    uniforms.uFrostOpacity.value = layers.frost.visible ? layers.frost.opacity / 100 : 0
    uniforms.uFrostStart.value = layers.frost.start
    uniforms.uFrostEnd.value = layers.frost.end
    uniforms.uFrostNoiseScale.value = layers.frost.noiseScale
    uniforms.uFrostNoiseStrength.value = layers.frost.noiseStrength
    uniforms.uFrostRoughness.value = layers.frost.roughness
    uniforms.uFrostColor.value.set(layers.frost.color)
    uniforms.uFrostClearColor.value.set(layers.frost.clearColor)
    uniforms.uFrostClearTint.value = layers.frost.visible ? layers.frost.clearTint / 100 : 0

    const colorOpacity = layers.color.visible ? layers.color.opacity / 100 : 0
    material.color.set(layers.color.tint).lerp(WHITE, 1 - colorOpacity)
  })
}
