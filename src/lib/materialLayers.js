'use client'

import { useEffect, useRef } from 'react'
import { button, folder, useControls } from 'leva'
import { brandColors } from './brand'
import { registerMaterialPresetApplier } from './materialPresetBus'

const imagePatterns = ['Gradient', 'Grid', 'Rings', 'Noise']
const patternTypes = ['Checker', 'Stripes', 'Dots']
const matcapModes = ['Color', 'Mask']

// One-click preset approximating a frosted, grainy, iridescent foil-card
// look: fine noise grain, a soft directional matcap sheen, faint slow
// iridescence, and a frosted/chromatically-fringed glass transmission.
// Anything not listed here (Video, Depth, Normal, Toon, Outline, Displace,
// Pattern, Color, custom uploaded images, ...) is left untouched.
export const FOIL_HOLOGRAM_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': true,
  'image.opacity': 22,
  'image.pattern': 'Noise',
  'fresnel.visible': true,
  'fresnel.opacity': 18,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.5,
  'matcap.visible': true,
  'matcap.opacity': 60,
  'matcap.mode': 'Color',
  'matcap.tint': '#ffffff',
  'matcap.rotation': 0,
  'rainbow.visible': true,
  'rainbow.opacity': 22,
  'rainbow.speed': 0.05,
  'rainbow.scale': 2.5,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 0.6,
  'glass.roughness': 0.5,
  'glass.ior': 1.2,
  'glass.chromaticAberration': 0.12,
  'glass.anisotropy': 0.2,
  'glass.backside': true,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.3,
}

// One-click preset approximating a faceted crystal/gem look: a deep,
// saturated tint through the clear top half fading — via an irregular,
// cloud-like noise edge — into an opaque white frosted bottom half. Sharp,
// un-rounded facets are kept crisp (low Edges roundness) so each flat plane
// still reads as a distinct cut. Anything not listed here is left untouched.
export const ICE_CRYSTAL_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 16,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.5,
  'matcap.visible': true,
  'matcap.opacity': 12,
  'matcap.mode': 'Color',
  'matcap.tint': '#ffffff',
  'matcap.rotation': 0,
  'rainbow.visible': true,
  'rainbow.opacity': 10,
  'rainbow.speed': 0.05,
  'rainbow.scale': 2,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 0.9,
  'glass.roughness': 0.03,
  'glass.ior': 1.45,
  'glass.chromaticAberration': 0.08,
  'glass.anisotropy': 0.1,
  'glass.backside': true,
  'frost.visible': true,
  'frost.opacity': 100,
  'frost.start': -0.5,
  'frost.end': 0.15,
  'frost.noiseScale': 1.8,
  'frost.noiseStrength': 0.55,
  'frost.roughness': 0.95,
  'frost.color': '#ffffff',
  'frost.clearColor': '#15697f',
  'frost.clearTint': 100,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.1,
  'color.visible': false,
}

// Clear, colorless rock crystal / quartz: high IOR, sharp facets, no tint
// or frost band — just dense transmission and cool white edge sparkle.
export const BERGKRISTALL_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 22,
  'fresnel.color': '#f7fbff',
  'fresnel.power': 4.2,
  'matcap.visible': true,
  'matcap.opacity': 14,
  'matcap.mode': 'Color',
  'matcap.tint': '#ffffff',
  'matcap.rotation': 0,
  'rainbow.visible': false,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 1.15,
  'glass.roughness': 0.02,
  'glass.metalness': 0,
  'glass.ior': 1.54,
  'glass.chromaticAberration': 0.045,
  'glass.anisotropy': 0.05,
  'glass.backside': true,
  'frost.visible': false,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.45,
  'color.visible': false,
}

// Natural veiled quartz: polished clear tip fading into milky white
// inclusions/veils toward the base, faint prism glints, sharp facets.
export const VEILED_QUARTZ_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 20,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.8,
  'matcap.visible': true,
  'matcap.opacity': 16,
  'matcap.mode': 'Color',
  'matcap.tint': '#f4f7fa',
  'matcap.rotation': 0,
  'rainbow.visible': true,
  'rainbow.opacity': 12,
  'rainbow.speed': 0.03,
  'rainbow.scale': 2.4,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 1.05,
  'glass.roughness': 0.025,
  'glass.metalness': 0,
  'glass.ior': 1.54,
  'glass.chromaticAberration': 0.07,
  'glass.anisotropy': 0.08,
  'glass.backside': true,
  'frost.visible': true,
  'frost.opacity': 100,
  'frost.start': -0.7,
  'frost.end': 0.35,
  'frost.noiseScale': 2.8,
  'frost.noiseStrength': 0.75,
  'frost.roughness': 0.9,
  'frost.color': '#ffffff',
  'frost.clearColor': '#ffffff',
  'frost.clearTint': 0,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.35,
  'color.visible': false,
}

// Polished clear glass with a milky cloud core and soft cyan/teal in the
// clear arms — closest match to the cloudy teal glass reference.
export const CLOUDY_TEAL_GLASS_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 14,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.2,
  'matcap.visible': true,
  'matcap.opacity': 18,
  'matcap.mode': 'Color',
  'matcap.tint': '#e8f7fa',
  'matcap.rotation': 0,
  'rainbow.visible': false,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 0.85,
  'glass.roughness': 0.03,
  'glass.ior': 1.48,
  'glass.chromaticAberration': 0.06,
  'glass.anisotropy': 0.08,
  'glass.backside': true,
  'frost.visible': true,
  'frost.opacity': 100,
  'frost.start': -0.35,
  'frost.end': 0.35,
  'frost.noiseScale': 2.2,
  'frost.noiseStrength': 0.7,
  'frost.roughness': 0.92,
  'frost.color': '#ffffff',
  'frost.clearColor': '#3db8c9',
  'frost.clearTint': 85,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.25,
  'color.visible': false,
}

// Dark tinted glass shell with a neon-green core sheen.
export const OBSIDIAN_NEON_CORE_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 28,
  'fresnel.color': '#9cff71',
  'fresnel.power': 2.8,
  'matcap.visible': true,
  'matcap.opacity': 72,
  'matcap.mode': 'Color',
  'matcap.tint': '#9cff71',
  'matcap.rotation': 0,
  'rainbow.visible': true,
  'rainbow.opacity': 18,
  'rainbow.speed': 0.04,
  'rainbow.scale': 2.2,
  'glass.visible': true,
  'glass.opacity': 88,
  'glass.thickness': 1.1,
  'glass.roughness': 0.06,
  'glass.ior': 1.52,
  'glass.chromaticAberration': 0.1,
  'glass.anisotropy': 0.12,
  'glass.backside': true,
  'frost.visible': false,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.35,
  'color.visible': true,
  'color.opacity': 78,
  'color.tint': '#0a1210',
}

// Even, matte acid-etched transmission glass.
export const ACID_ETCHED_FROST_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 12,
  'fresnel.color': '#ffffff',
  'fresnel.power': 2.2,
  'matcap.visible': false,
  'rainbow.visible': false,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 0.5,
  'glass.roughness': 0.62,
  'glass.ior': 1.35,
  'glass.chromaticAberration': 0.02,
  'glass.anisotropy': 0.05,
  'glass.backside': true,
  'frost.visible': true,
  'frost.opacity': 100,
  'frost.start': -1.2,
  'frost.end': 1.2,
  'frost.noiseScale': 3.2,
  'frost.noiseStrength': 0.28,
  'frost.roughness': 0.98,
  'frost.color': '#ffffff',
  'frost.clearColor': '#ffffff',
  'frost.clearTint': 0,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 0.9,
  'color.visible': false,
}

// Opaque jade green with soft rim highlights (SSS approximation).
export const JADE_SSS_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 36,
  'fresnel.color': '#d8ffe8',
  'fresnel.power': 2.4,
  'matcap.visible': true,
  'matcap.opacity': 68,
  'matcap.mode': 'Color',
  'matcap.tint': '#c8f5d8',
  'matcap.rotation': 0,
  'rainbow.visible': false,
  'glass.visible': true,
  'glass.opacity': 28,
  'glass.thickness': 0.35,
  'glass.roughness': 0.35,
  'glass.ior': 1.4,
  'glass.chromaticAberration': 0.02,
  'glass.anisotropy': 0.05,
  'glass.backside': false,
  'frost.visible': false,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.15,
  'color.visible': true,
  'color.opacity': 100,
  'color.tint': '#2f6b4f',
}

// Strong thin-film iridescence over clear low-roughness glass.
export const THIN_FILM_IRIDESCENCE_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 20,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.0,
  'matcap.visible': true,
  'matcap.opacity': 28,
  'matcap.mode': 'Color',
  'matcap.tint': '#ffffff',
  'matcap.rotation': 0,
  'rainbow.visible': true,
  'rainbow.opacity': 82,
  'rainbow.speed': 0.06,
  'rainbow.scale': 2.6,
  'glass.visible': true,
  'glass.opacity': 100,
  'glass.thickness': 0.55,
  'glass.roughness': 0.02,
  'glass.ior': 1.4,
  'glass.chromaticAberration': 0.1,
  'glass.anisotropy': 0.15,
  'glass.backside': true,
  'frost.visible': false,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 1.35,
  'color.visible': false,
}

// Near-opaque liquid chrome — metal + env reflections, matcap accent, no glass/frost.
export const CHROME_LIQUID_PRESET = {
  'edges.visible': true,
  'edges.opacity': 50,
  'image.visible': false,
  'fresnel.visible': true,
  'fresnel.opacity': 16,
  'fresnel.color': '#ffffff',
  'fresnel.power': 3.6,
  'matcap.visible': true,
  'matcap.opacity': 62,
  'matcap.mode': 'Color',
  'matcap.tint': '#ffffff',
  'matcap.rotation': 0,
  'rainbow.visible': false,
  'glass.visible': false,
  'glass.opacity': 0,
  'glass.thickness': 0.2,
  'glass.roughness': 0.1,
  'glass.metalness': 1,
  'glass.ior': 1.5,
  'glass.chromaticAberration': 0,
  'glass.anisotropy': 0,
  'glass.backside': false,
  'frost.visible': false,
  'lighting.visible': true,
  'lighting.opacity': 100,
  'lighting.envMapIntensity': 2.4,
  'color.visible': true,
  'color.opacity': 100,
  'color.tint': '#e8eaed',
}

// Startup + Reset defaults match Veiled Quartz (edges roundness fixed at 50).
export const defaultMaterialLayers = {
  image: { visible: false, opacity: 40, pattern: 'Gradient', image: undefined },
  fresnel: { visible: true, opacity: 20, color: '#ffffff', power: 3.8 },
  matcap: {
    visible: true,
    opacity: 16,
    tint: '#f4f7fa',
    rotation: 0,
    mode: 'Color',
    image: undefined,
  },
  rainbow: { visible: true, opacity: 12, speed: 0.03, scale: 2.4 },
  glass: {
    visible: true,
    opacity: 100,
    thickness: 1.05,
    roughness: 0.025,
    metalness: 0,
    ior: 1.54,
    chromaticAberration: 0.07,
    anisotropy: 0.08,
    backside: true,
  },
  frost: {
    visible: true,
    opacity: 100,
    start: -0.7,
    end: 0.35,
    noiseScale: 2.8,
    noiseStrength: 0.75,
    roughness: 0.9,
    color: '#ffffff',
    clearColor: '#ffffff',
    clearTint: 0,
  },
  edges: { visible: true, opacity: 50 },
  lighting: { visible: true, opacity: 100, envMapIntensity: 1.35 },
  color: { visible: false, opacity: 100, tint: brandColors.green },
  video: { visible: false, opacity: 60, url: '' },
  depth: { visible: false, opacity: 50, near: 1, far: 6, colorNear: '#ffffff', colorFar: '#000000' },
  normal: { visible: false, opacity: 60 },
  toon: { visible: false, opacity: 70, steps: 4 },
  outline: { visible: false, opacity: 80, color: '#000000', thickness: 0.3, width: 0.1 },
  displace: { visible: false, opacity: 40, scale: 1.5, speed: 0.3, strength: 0.12 },
  pattern: {
    visible: false,
    opacity: 50,
    type: 'Checker',
    scale: 8,
    colorA: '#ffffff',
    colorB: '#161616',
  },
}

function mergeLayerDefaults(overrides = {}) {
  const merged = {}
  for (const key of Object.keys(defaultMaterialLayers)) {
    merged[key] = { ...defaultMaterialLayers[key], ...overrides[key] }
  }
  return merged
}

// Flatten nested layer defaults into the dotted Leva paths used by `set()`.
export function buildMaterialResetPreset(overrides = {}) {
  const defaults = mergeLayerDefaults(overrides)
  const flat = {}
  for (const [layer, props] of Object.entries(defaults)) {
    for (const [key, value] of Object.entries(props)) {
      // Skip undefined image uploads so Reset doesn't wipe custom textures
      // with an explicit undefined write (Leva may reject / noop).
      if (value === undefined) continue
      flat[`${layer}.${key}`] = value
    }
  }
  return flat
}

export const MATERIAL_PRESET_OPTIONS = [
  { id: 'veiledQuartz', label: 'Veiled Quartz', values: VEILED_QUARTZ_PRESET },
  { id: 'rockCrystal', label: 'Rock Crystal', values: BERGKRISTALL_PRESET },
  { id: 'cloudyTeal', label: 'Cloudy Teal Glass', values: CLOUDY_TEAL_GLASS_PRESET },
  { id: 'obsidianNeon', label: 'Obsidian Neon Core', values: OBSIDIAN_NEON_CORE_PRESET },
  { id: 'acidEtched', label: 'Acid-Etched Frost', values: ACID_ETCHED_FROST_PRESET },
  { id: 'jadeSss', label: 'Jade SSS', values: JADE_SSS_PRESET },
  { id: 'thinFilm', label: 'Thin-Film Iridescence', values: THIN_FILM_IRIDESCENCE_PRESET },
  { id: 'chromeLiquid', label: 'Chrome Liquid', values: CHROME_LIQUID_PRESET },
  { id: 'foil', label: 'Foil / Hologram', values: FOIL_HOLOGRAM_PRESET },
  { id: 'iceCrystal', label: 'Ice Crystal', values: ICE_CRYSTAL_PRESET },
]

// Mirrors the Spline-style "Material" layer stack: every layer exposes a
// top-level opacity + visibility toggle (always visible, like the reference
// panel), with layer-specific parameters tucked into a collapsed "Advanced"
// sub-folder so the panel doesn't get overwhelming.
export function useMaterialLayerControls(label, overrides = {}) {
  const defaults = mergeLayerDefaults(overrides)
  const overridesRef = useRef(overrides)
  overridesRef.current = overrides
  const setRef = useRef(null)

  const [values, set] = useControls(label, () => ({
    Presets: folder(
      {
        'preset.veiledQuartz': {
          label: 'Veiled Quartz',
          ...button(() => setRef.current?.(VEILED_QUARTZ_PRESET)),
        },
        'preset.rockCrystal': {
          label: 'Rock Crystal',
          ...button(() => setRef.current?.(BERGKRISTALL_PRESET)),
        },
        'preset.cloudyTeal': {
          label: 'Cloudy Teal Glass',
          ...button(() => setRef.current?.(CLOUDY_TEAL_GLASS_PRESET)),
        },
        'preset.obsidianNeon': {
          label: 'Obsidian Neon Core',
          ...button(() => setRef.current?.(OBSIDIAN_NEON_CORE_PRESET)),
        },
        'preset.acidEtched': {
          label: 'Acid-Etched Frost',
          ...button(() => setRef.current?.(ACID_ETCHED_FROST_PRESET)),
        },
        'preset.jadeSss': {
          label: 'Jade SSS',
          ...button(() => setRef.current?.(JADE_SSS_PRESET)),
        },
        'preset.thinFilm': {
          label: 'Thin-Film Iridescence',
          ...button(() => setRef.current?.(THIN_FILM_IRIDESCENCE_PRESET)),
        },
        'preset.chromeLiquid': {
          label: 'Chrome Liquid',
          ...button(() => setRef.current?.(CHROME_LIQUID_PRESET)),
        },
        'preset.foil': {
          label: 'Foil / Hologram',
          ...button(() => setRef.current?.(FOIL_HOLOGRAM_PRESET)),
        },
        'preset.iceCrystal': {
          label: 'Ice Crystal',
          ...button(() => setRef.current?.(ICE_CRYSTAL_PRESET)),
        },
        'preset.reset': {
          label: 'Reset',
          ...button(() => setRef.current?.(buildMaterialResetPreset(overridesRef.current))),
        },
      },
      // Driven by the sidebar "Presets" checkbox via a hidden Leva bridge
      // control (`__showPresets`) so toggling never remounts the layer schema.
      { render: (get) => get('__showPresets') !== false },
    ),
    Image: folder({
      'image.visible': { label: 'visible', value: defaults.image.visible },
      'image.opacity': {
        label: 'opacity',
        value: defaults.image.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'image.image': { label: 'custom image', image: defaults.image.image },
          'image.pattern': {
            label: 'pattern',
            value: defaults.image.pattern,
            options: imagePatterns,
          },
        },
        { collapsed: true },
      ),
    }),
    Video: folder({
      'video.visible': { label: 'visible', value: defaults.video.visible },
      'video.opacity': {
        label: 'opacity',
        value: defaults.video.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'video.url': { label: 'url', value: defaults.video.url },
        },
        { collapsed: true },
      ),
    }),
    Pattern: folder({
      'pattern.visible': { label: 'visible', value: defaults.pattern.visible },
      'pattern.opacity': {
        label: 'opacity',
        value: defaults.pattern.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'pattern.type': { label: 'type', value: defaults.pattern.type, options: patternTypes },
          'pattern.scale': {
            label: 'scale',
            value: defaults.pattern.scale,
            min: 1,
            max: 32,
            step: 1,
          },
          'pattern.colorA': { label: 'color A', value: defaults.pattern.colorA },
          'pattern.colorB': { label: 'color B', value: defaults.pattern.colorB },
        },
        { collapsed: true },
      ),
    }),
    Depth: folder({
      'depth.visible': { label: 'visible', value: defaults.depth.visible },
      'depth.opacity': {
        label: 'opacity',
        value: defaults.depth.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'depth.near': { label: 'near', value: defaults.depth.near, min: 0, max: 10, step: 0.1 },
          'depth.far': { label: 'far', value: defaults.depth.far, min: 0.5, max: 20, step: 0.1 },
          'depth.colorNear': { label: 'color near', value: defaults.depth.colorNear },
          'depth.colorFar': { label: 'color far', value: defaults.depth.colorFar },
        },
        { collapsed: true },
      ),
    }),
    Normal: folder({
      'normal.visible': { label: 'visible', value: defaults.normal.visible },
      'normal.opacity': {
        label: 'opacity',
        value: defaults.normal.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
    }),
    Fresnel: folder({
      'fresnel.visible': { label: 'visible', value: defaults.fresnel.visible },
      'fresnel.opacity': {
        label: 'opacity',
        value: defaults.fresnel.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'fresnel.color': { label: 'color', value: defaults.fresnel.color },
          'fresnel.power': {
            label: 'power',
            value: defaults.fresnel.power,
            min: 0.5,
            max: 6,
            step: 0.1,
          },
        },
        { collapsed: true },
      ),
    }),
    Matcap: folder({
      'matcap.visible': { label: 'visible', value: defaults.matcap.visible },
      'matcap.opacity': {
        label: 'opacity',
        value: defaults.matcap.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'matcap.image': { label: 'custom image', image: defaults.matcap.image },
          'matcap.mode': { label: 'mode', value: defaults.matcap.mode, options: matcapModes },
          'matcap.rotation': {
            label: 'rotation',
            value: defaults.matcap.rotation,
            min: 0,
            max: 360,
            step: 1,
          },
          'matcap.tint': { label: 'tint', value: defaults.matcap.tint },
        },
        { collapsed: true },
      ),
    }),
    Rainbow: folder({
      'rainbow.visible': { label: 'visible', value: defaults.rainbow.visible },
      'rainbow.opacity': {
        label: 'opacity',
        value: defaults.rainbow.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'rainbow.speed': {
            label: 'speed',
            value: defaults.rainbow.speed,
            min: 0,
            max: 1,
            step: 0.01,
          },
          'rainbow.scale': {
            label: 'scale',
            value: defaults.rainbow.scale,
            min: 0.1,
            max: 4,
            step: 0.1,
          },
        },
        { collapsed: true },
      ),
    }),
    Toon: folder({
      'toon.visible': { label: 'visible', value: defaults.toon.visible },
      'toon.opacity': {
        label: 'opacity',
        value: defaults.toon.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'toon.steps': { label: 'steps', value: defaults.toon.steps, min: 2, max: 10, step: 1 },
        },
        { collapsed: true },
      ),
    }),
    Outline: folder({
      'outline.visible': { label: 'visible', value: defaults.outline.visible },
      'outline.opacity': {
        label: 'opacity',
        value: defaults.outline.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'outline.color': { label: 'color', value: defaults.outline.color },
          'outline.thickness': {
            label: 'thickness',
            value: defaults.outline.thickness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          'outline.width': {
            label: 'softness',
            value: defaults.outline.width,
            min: 0.01,
            max: 0.5,
            step: 0.01,
          },
        },
        { collapsed: true },
      ),
    }),
    Edges: folder({
      'edges.visible': { label: 'visible', value: defaults.edges.visible },
      'edges.opacity': {
        label: 'roundness',
        value: defaults.edges.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
    }),
    Glass: folder({
      'glass.visible': { label: 'visible', value: defaults.glass.visible },
      'glass.opacity': {
        label: 'opacity',
        value: defaults.glass.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'glass.thickness': {
            label: 'thickness',
            value: defaults.glass.thickness,
            min: 0,
            max: 3,
            step: 0.05,
          },
          'glass.roughness': {
            label: 'roughness',
            value: defaults.glass.roughness,
            min: 0,
            max: 1,
            step: 0.05,
          },
          'glass.metalness': {
            label: 'metalness',
            value: defaults.glass.metalness,
            min: 0,
            max: 1,
            step: 0.05,
            // Only meaningful when Glass is off (opaque metal); glass
            // materials force metalness to 0 in the mesh props.
            render: (get) => get('glass.visible') === false,
          },
          'glass.ior': {
            label: 'ior',
            value: defaults.glass.ior,
            min: 1,
            max: 2.4,
            step: 0.01,
          },
          'glass.chromaticAberration': {
            label: 'chromatic aberration',
            value: defaults.glass.chromaticAberration,
            min: 0,
            max: 0.2,
            step: 0.005,
          },
          'glass.anisotropy': {
            label: 'anisotropy',
            value: defaults.glass.anisotropy,
            min: 0,
            max: 1,
            step: 0.05,
          },
          'glass.backside': { label: 'backside', value: defaults.glass.backside },
        },
        { collapsed: true },
      ),
    }),
    Frost: folder({
      'frost.visible': { label: 'visible', value: defaults.frost.visible },
      'frost.opacity': {
        label: 'opacity',
        value: defaults.frost.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'frost.start': {
            label: 'start (bottom)',
            value: defaults.frost.start,
            min: -2,
            max: 2,
            step: 0.05,
          },
          'frost.end': {
            label: 'end (top)',
            value: defaults.frost.end,
            min: -2,
            max: 2,
            step: 0.05,
          },
          'frost.noiseScale': {
            label: 'noise scale',
            value: defaults.frost.noiseScale,
            min: 0.1,
            max: 8,
            step: 0.1,
          },
          'frost.noiseStrength': {
            label: 'noise strength',
            value: defaults.frost.noiseStrength,
            min: 0,
            max: 1,
            step: 0.01,
          },
          'frost.roughness': {
            label: 'roughness',
            value: defaults.frost.roughness,
            min: 0,
            max: 1,
            step: 0.05,
          },
          'frost.color': { label: 'frost color', value: defaults.frost.color },
          'frost.clearColor': { label: 'clear tint color', value: defaults.frost.clearColor },
          'frost.clearTint': {
            label: 'clear tint strength',
            value: defaults.frost.clearTint,
            min: 0,
            max: 100,
            step: 1,
          },
        },
        { collapsed: true },
      ),
    }),
    Lighting: folder({
      'lighting.visible': { label: 'visible', value: defaults.lighting.visible },
      'lighting.opacity': {
        label: 'opacity',
        value: defaults.lighting.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'lighting.envMapIntensity': {
            label: 'env intensity',
            value: defaults.lighting.envMapIntensity,
            min: 0,
            max: 3,
            step: 0.05,
          },
        },
        { collapsed: true },
      ),
    }),
    Color: folder({
      'color.visible': { label: 'visible', value: defaults.color.visible },
      'color.opacity': {
        label: 'opacity',
        value: defaults.color.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'color.tint': { label: 'tint', value: defaults.color.tint },
        },
        { collapsed: true },
      ),
    }),
    Displace: folder({
      'displace.visible': { label: 'visible', value: defaults.displace.visible },
      'displace.opacity': {
        label: 'opacity',
        value: defaults.displace.opacity,
        min: 0,
        max: 100,
        step: 1,
      },
      Advanced: folder(
        {
          'displace.scale': {
            label: 'scale',
            value: defaults.displace.scale,
            min: 0.1,
            max: 5,
            step: 0.1,
          },
          'displace.speed': {
            label: 'speed',
            value: defaults.displace.speed,
            min: 0,
            max: 2,
            step: 0.05,
          },
          'displace.strength': {
            label: 'strength',
            value: defaults.displace.strength,
            min: 0,
            max: 0.5,
            step: 0.01,
          },
        },
        { collapsed: true },
      ),
    }),
  }))

  setRef.current = set

  useEffect(
    () =>
      registerMaterialPresetApplier({
        set,
        buildReset: () => buildMaterialResetPreset(overridesRef.current),
      }),
    [set],
  )

  return {
    image: {
      visible: values['image.visible'],
      opacity: values['image.opacity'],
      pattern: values['image.pattern'],
      image: values['image.image'],
    },
    video: {
      visible: values['video.visible'],
      opacity: values['video.opacity'],
      url: values['video.url'],
    },
    pattern: {
      visible: values['pattern.visible'],
      opacity: values['pattern.opacity'],
      type: values['pattern.type'],
      scale: values['pattern.scale'],
      colorA: values['pattern.colorA'],
      colorB: values['pattern.colorB'],
    },
    depth: {
      visible: values['depth.visible'],
      opacity: values['depth.opacity'],
      near: values['depth.near'],
      far: values['depth.far'],
      colorNear: values['depth.colorNear'],
      colorFar: values['depth.colorFar'],
    },
    normal: {
      visible: values['normal.visible'],
      opacity: values['normal.opacity'],
    },
    fresnel: {
      visible: values['fresnel.visible'],
      opacity: values['fresnel.opacity'],
      color: values['fresnel.color'],
      power: values['fresnel.power'],
    },
    matcap: {
      visible: values['matcap.visible'],
      opacity: values['matcap.opacity'],
      tint: values['matcap.tint'],
      rotation: values['matcap.rotation'],
      mode: values['matcap.mode'],
      image: values['matcap.image'],
    },
    rainbow: {
      visible: values['rainbow.visible'],
      opacity: values['rainbow.opacity'],
      speed: values['rainbow.speed'],
      scale: values['rainbow.scale'],
    },
    toon: {
      visible: values['toon.visible'],
      opacity: values['toon.opacity'],
      steps: values['toon.steps'],
    },
    outline: {
      visible: values['outline.visible'],
      opacity: values['outline.opacity'],
      color: values['outline.color'],
      thickness: values['outline.thickness'],
      width: values['outline.width'],
    },
    glass: {
      visible: values['glass.visible'],
      opacity: values['glass.opacity'],
      thickness: values['glass.thickness'],
      roughness: values['glass.roughness'],
      metalness: values['glass.metalness'],
      ior: values['glass.ior'],
      chromaticAberration: values['glass.chromaticAberration'],
      anisotropy: values['glass.anisotropy'],
      backside: values['glass.backside'],
    },
    frost: {
      visible: values['frost.visible'],
      opacity: values['frost.opacity'],
      start: values['frost.start'],
      end: values['frost.end'],
      noiseScale: values['frost.noiseScale'],
      noiseStrength: values['frost.noiseStrength'],
      roughness: values['frost.roughness'],
      color: values['frost.color'],
      clearColor: values['frost.clearColor'],
      clearTint: values['frost.clearTint'],
    },
    edges: {
      visible: values['edges.visible'],
      opacity: values['edges.opacity'],
    },
    lighting: {
      visible: values['lighting.visible'],
      opacity: values['lighting.opacity'],
      envMapIntensity: values['lighting.envMapIntensity'],
    },
    color: {
      visible: values['color.visible'],
      opacity: values['color.opacity'],
      tint: values['color.tint'],
    },
    displace: {
      visible: values['displace.visible'],
      opacity: values['displace.opacity'],
      scale: values['displace.scale'],
      speed: values['displace.speed'],
      strength: values['displace.strength'],
    },
  }
}
