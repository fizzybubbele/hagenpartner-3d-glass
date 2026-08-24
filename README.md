# Hagen Partner — 3D Glass Objects

Interaktive 3D-Brand-Elemente mit Glass-/Transmission-Effekt, angelehnt an [olivierlarose/3d-distorted-glass-effect](https://github.com/olivierlarose/3d-distorted-glass-effect), aber auf die Hagen-Partner-Formensprache zugeschnitten.

## Stack

- Next.js 14
- React Three Fiber + `@react-three/drei`
- `MeshTransmissionMaterial` für den Glas-Effekt
- SVG-Extrusion aus den Brand-Assets (`cross`, `icon_1`, `icon_2`, `icon_3`)

## Start

```bash
npm install
npm run dev
```

Preview: [http://localhost:3000](http://localhost:3000)

## Verfügbare Objekte

| ID | Quelle | Beschreibung |
|---|---|---|
| `cross` | `cross.svg` | Haupt-Cross-Element |
| `icon1` | `icon_1.svg` | Ring-Icon |
| `icon2` | `icon_2.svg` | Face-Icon |
| `icon3` | `icon_3.svg` | Grid-Icon |

Presets und Farben liegen in `src/lib/brand.js`.

## Website-Einbindung

### Option A: iframe (schnellste Integration)

```html
<iframe
  src="https://YOUR-DOMAIN/embed/cross?bg=transparent"
  title="Hagen Partner 3D Cross"
  loading="lazy"
  allow="fullscreen"
  style="width: 100%; height: 520px; border: 0;"
></iframe>
```

Parameter:

- `bg=transparent` — transparenter Hintergrund
- `interactive=false` — nur Auto-Rotation, kein Drag/Hover

Beispiele:

- `/embed/cross`
- `/embed/icon2?bg=transparent`
- `/embed/icon3?bg=transparent&interactive=false`

### Option B: React-Komponente in bestehender Next.js-Website

```jsx
import dynamic from 'next/dynamic'
import { glassPresets } from './lib/brand'

const GlassScene = dynamic(() => import('./components/Scene'), { ssr: false })

export function HeroGlass() {
  return (
    <div style={{ width: '100%', height: '520px' }}>
      <GlassScene preset={glassPresets.cross} background="transparent" />
    </div>
  )
}
```

Wichtig: WebGL-Komponenten immer mit `ssr: false` laden.

## Neue 3D-Objekte hinzufügen

1. SVG nach `public/brand/` legen
2. Preset in `src/lib/brand.js` ergänzen
3. Optional Tiefe (`depth`), Farbe (`tint`) und Rotationsgeschwindigkeit anpassen

Für komplexere Formen (verzerrte Meshes, GLB-Modelle) kann ein `.glb` wie im Referenzprojekt ergänzt werden.

## Deployment

Empfohlen: Vercel oder jede Node-Hosting-Umgebung mit WebGL-Support.

```bash
npm run build
npm start
```

## Performance-Hinweise

- `MeshTransmissionMaterial` ist GPU-intensiv — pro Viewport idealerweise ein Objekt
- Auf Mobile `dpr={[1, 1.5]}` testen
- Für statische Hero-Sections reicht oft `interactive=false`

## Nächste Schritte

- GLB-Export aus Blender/C4D für verzerrte 3D-Varianten
- Scroll-getriggerte Animation (GSAP / Lenis)
- CMS-Anbindung für Objekt-Auswahl pro Seite
