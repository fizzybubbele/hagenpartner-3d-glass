'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import styles from './page.module.css'
import {
  backgroundOptions,
  defaultAnimationSpeed,
  defaultBackground,
  defaultBackgroundText,
  defaultObjectId,
  defaultObjectScale,
  defaultTextColor,
  defaultTextFontWeight,
  defaultTextSize,
  formatBackgroundText,
  getReadableTextColor,
  getTextFontWeightOption,
  glassPresets,
  maxAnimationSpeed,
  maxTextFontWeight,
  minAnimationSpeed,
  minTextFontWeight,
  objectIds,
} from '@/lib/brand'
import { MATERIAL_PRESET_OPTIONS } from '@/lib/materialLayers'
import { applyMaterialPreset, resetMaterialLayers } from '@/lib/materialPresetBus'

const GlassScene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
})

const MaterialControls = dynamic(() => import('@/components/MaterialControls'), {
  ssr: false,
})

export default function Home() {
  const [activeId, setActiveId] = useState(defaultObjectId)
  const [showControls, setShowControls] = useState(true)
  const [showPresets, setShowPresets] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState(defaultBackground)
  const [backgroundText, setBackgroundText] = useState(defaultBackgroundText)
  const [textColor, setTextColor] = useState(defaultTextColor)
  const [textSize, setTextSize] = useState(defaultTextSize)
  const [textFontWeight, setTextFontWeight] = useState(defaultTextFontWeight)
  const [objectScale, setObjectScale] = useState(defaultObjectScale)
  const [animationSpeed, setAnimationSpeed] = useState(defaultAnimationSpeed)

  useEffect(() => {
    setTextColor((current) => getReadableTextColor(backgroundColor, current))
  }, [backgroundColor])

  const preset = useMemo(() => glassPresets[activeId], [activeId])
  const supportsObjectScale = preset.type === 'glb' || preset.type === 'procedural'
  const textWeightLabel = getTextFontWeightOption(textFontWeight).label
  const embedSnippet = `<iframe src="/embed/${activeId}?bg=${backgroundColor.replace('#', '')}&textColor=${textColor.replace('#', '')}&textSize=${textSize}&textWeight=${textFontWeight}&objectScale=${objectScale.toFixed(2)}&animationSpeed=${animationSpeed.toFixed(2)}" title="${preset.label}" loading="lazy" allow="fullscreen" style="width:100%;height:520px;border:0;"></iframe>`

  return (
    <>
      <MaterialControls hidden={!showControls} showPresets={showPresets} />
      <main className={styles.main}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>HAGENPARTNER</p>
        <h1>3D Glass Objects</h1>
        <p className={styles.lead}>
          Interaktive Brand-Elemente mit Transmission-Glas-Effekt. Für die Website per iframe
          oder React-Komponente einbindbar.
        </p>

        <div className={styles.meta}>
          <span className={styles.metaStatus}>
            <span className={styles.metaDot} />
            Live
          </span>
          <span>{activeId}</span>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Objekt</p>
          <div className={styles.objectList}>
            {objectIds.map((id) => (
              <button
                key={id}
                type="button"
                className={activeId === id ? styles.objectActive : styles.objectButton}
                onClick={() => setActiveId(id)}
              >
                {glassPresets[id].label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showControls}
              onChange={(event) => setShowControls(event.target.checked)}
            />
            Material-Controls (Leva)
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showPresets}
              onChange={(event) => setShowPresets(event.target.checked)}
            />
            Presets
          </label>
        </div>

        {showPresets && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Material-Presets</p>
            <div className={styles.presetList}>
              {MATERIAL_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => applyMaterialPreset(option.values)}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className={styles.presetReset}
                onClick={() => resetMaterialLayers()}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Hintergrundfarbe</p>
          <div className={styles.colorList}>
            {backgroundOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  backgroundColor === option.color
                    ? styles.colorActive
                    : styles.colorButton,
                  option.id === 'dark' ? styles.colorButtonDark : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ backgroundColor: option.color }}
                aria-label={option.label}
                title={`${option.label} (${option.color})`}
                onClick={() => setBackgroundColor(option.color)}
              />
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Hintergrundtext</span>
          <input
            className={styles.textInput}
            type="text"
            value={backgroundText}
            onChange={(event) => setBackgroundText(formatBackgroundText(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Schriftgröße [{textSize.toFixed(2)}]
          </span>
          <input
            className={styles.rangeInput}
            type="range"
            min="0.2"
            max="1.5"
            step="0.02"
            value={textSize}
            onChange={(event) => setTextSize(Number(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Schriftstärke [{textWeightLabel} · {textFontWeight}]
          </span>
          <input
            className={styles.rangeInput}
            type="range"
            min={minTextFontWeight}
            max={maxTextFontWeight}
            step="100"
            value={textFontWeight}
            onChange={(event) => setTextFontWeight(Number(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Schriftfarbe</span>
          <div className={styles.colorField}>
            <input
              className={styles.colorInput}
              type="color"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
            />
            <input
              className={styles.textInput}
              type="text"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
            />
          </div>
        </label>

        {supportsObjectScale && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Objekt-Größe [{objectScale.toFixed(2)}]
            </span>
            <input
              className={styles.rangeInput}
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={objectScale}
              onChange={(event) => setObjectScale(Number(event.target.value))}
            />
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Animationsgeschwindigkeit [{animationSpeed.toFixed(2)}×]
          </span>
          <input
            className={styles.rangeInput}
            type="range"
            min={minAnimationSpeed}
            max={maxAnimationSpeed}
            step="0.05"
            value={animationSpeed}
            onChange={(event) => setAnimationSpeed(Number(event.target.value))}
          />
        </label>

        <div className={styles.embedBox}>
          <p className={styles.embedTitle}>Embed Snippet</p>
          <code>{embedSnippet}</code>
        </div>
      </aside>

      <section className={styles.stage}>
        <span className={`${styles.reticle} ${styles.reticleTl}`} />
        <span className={`${styles.reticle} ${styles.reticleTr}`} />
        <span className={`${styles.reticle} ${styles.reticleBl}`} />
        <span className={`${styles.reticle} ${styles.reticleBr}`} />
        <div className={styles.stageTag}>
          Objekt <span>{preset.label}</span>
        </div>
        <GlassScene
          preset={preset}
          background={backgroundColor}
          backgroundText={backgroundText}
          textColor={textColor}
          textSize={textSize}
          textFontWeight={textFontWeight}
          objectScale={objectScale}
          animationSpeed={animationSpeed}
        />
      </section>
    </main>
    </>
  )
}
