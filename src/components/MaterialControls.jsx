'use client'

import { useEffect } from 'react'
import { Leva, useControls } from 'leva'

// Flat, sharp-edged, monospace theme so the Leva panel reads as part of the
// same technical dashboard as the rest of the UI rather than a bolted-on
// debug overlay.
const theme = {
  colors: {
    elevation1: '#050a08',
    elevation2: '#0a120e',
    elevation3: '#0d1712',
    accent1: '#9cff71',
    accent2: '#84e85e',
    accent3: '#b6ff96',
    highlight1: '#7f9186',
    highlight2: '#cfe7dd',
    highlight3: '#ffffff',
    vivid1: '#9cff71',
    folderWidgetColor: '#9cff71',
    folderTextColor: '#cfe7dd',
    toolTipBackground: '#0a120e',
    toolTipText: '#cfe7dd',
  },
  radii: { xs: '0px', sm: '0px', lg: '0px' },
  fonts: {
    mono: 'var(--font-geist-mono), ui-monospace, monospace',
    sans: 'var(--font-geist-mono), ui-monospace, monospace',
  },
  fontSizes: { root: '10.5px', toolTip: '10.5px' },
  borderWidths: { root: '1px', input: '1px', focus: '1px', hover: '1px', active: '1px', folder: '1px' },
  fontWeights: { label: '500', folder: '600', button: '500' },
}

// Hidden Leva value that the Material → Presets folder reads via `render`.
function ShowPresetsSync({ showPresets }) {
  // Function-schema form is required so useControls returns [values, set].
  const [, set] = useControls(() => ({
    __showPresets: { value: true, render: () => false },
  }))

  useEffect(() => {
    set({ __showPresets: showPresets })
  }, [showPresets, set])

  return null
}

export default function MaterialControls({ hidden = false, showPresets = true }) {
  return (
    <>
      <ShowPresetsSync showPresets={showPresets} />
      <Leva
        className="material-controls-panel"
        theme={theme}
        hidden={hidden}
        collapsed={false}
        flat
        titleBar={{ title: 'MATERIAL', drag: true, filter: false }}
        oneLineLabels
      />
    </>
  )
}
