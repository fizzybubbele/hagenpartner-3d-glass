// Tiny bridge so the sidebar can apply Leva material presets without prop-drilling
// through the R3F Canvas tree. The active material hook registers its `set`
// plus a reset builder that includes any object-specific overrides.

let applier = null

export function registerMaterialPresetApplier({ set, buildReset }) {
  applier = { set, buildReset }
  return () => {
    if (applier?.set === set) applier = null
  }
}

export function applyMaterialPreset(values) {
  applier?.set?.(values)
}

export function resetMaterialLayers() {
  if (!applier) return
  applier.set(applier.buildReset())
}
