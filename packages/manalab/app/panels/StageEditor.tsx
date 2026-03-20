import { useState, useEffect } from 'react'
import { EditorState, StageConfig, Vec3, StageBackdrop } from '../state/types'
import { EditorAction } from '../state/actions'

interface StageEditorProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function StageEditor({ state, dispatch }: StageEditorProps) {
  const { ui, present } = state
  const sceneId = ui.currentSceneId
  const sceneDef = present.project.scenes[sceneId]
  if (!sceneDef) return null

  const [stage, setStage] = useState<StageConfig>(JSON.parse(JSON.stringify(sceneDef.stage)))

  useEffect(() => {
    setStage(JSON.parse(JSON.stringify(sceneDef.stage)))
  }, [sceneId])

  const apply = () => {
    dispatch({ type: 'UPDATE_STAGE', sceneId, stage })
    dispatch({ type: 'TOGGLE_STAGE_EDITOR' })
  }

  const updateLighting = (key: string, value: unknown) => {
    setStage((s) => ({
      ...s,
      lighting: { ...s.lighting, [key]: value },
    }))
  }

  const updateCamera = (key: 'defaultPosition' | 'defaultTarget', value: Vec3) => {
    setStage((s) => ({
      ...s,
      camera: { ...s.camera, [key]: value },
    }))
  }

  const updateGrid = (key: string, value: unknown) => {
    setStage((s) => ({
      ...s,
      grid: { ...s.grid, [key]: value },
    }))
  }

  const updateBackdrop = (index: number, updates: Partial<StageBackdrop>) => {
    setStage((s) => ({
      ...s,
      backdrops: s.backdrops.map((bd, i) => (i === index ? { ...bd, ...updates } : bd)),
    }))
  }

  const colors = ['#e94560', '#4ecdc4', '#5c7cfa']
  const labels = ['X', 'Y', 'Z']

  const vec3Input = (value: Vec3, onChange: (v: Vec3) => void) => (
    <div className="vec3-row">
      {[0, 1, 2].map((i) => (
        <div key={i} className="vec3-input-group">
          <span className="vec3-label" style={{ color: colors[i] }}>{labels[i]}</span>
          <input
            type="number"
            className="vec3-input"
            value={value[i]}
            step={0.1}
            onChange={(e) => {
              const next = [...value] as Vec3
              next[i] = parseFloat(e.target.value) || 0
              onChange(next)
            }}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className="panel-section stage-editor">
      <div className="panel-header">STAGE SETTINGS</div>
      <div className="stage-editor-content">
        <div className="stage-group">
          <div className="stage-group-title">LIGHTING</div>
          <div className="stage-field">
            <label>Ambient Color</label>
            <input
              type="color"
              value={stage.lighting.ambientColor}
              onChange={(e) => updateLighting('ambientColor', e.target.value)}
            />
          </div>
          <div className="stage-field">
            <label>Ambient Intensity</label>
            <input
              type="number"
              className="inspector-input"
              value={stage.lighting.ambientIntensity}
              step={0.1}
              onChange={(e) => updateLighting('ambientIntensity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="stage-field">
            <label>Sun Color</label>
            <input
              type="color"
              value={stage.lighting.sunColor}
              onChange={(e) => updateLighting('sunColor', e.target.value)}
            />
          </div>
          <div className="stage-field">
            <label>Sun Intensity</label>
            <input
              type="number"
              className="inspector-input"
              value={stage.lighting.sunIntensity}
              step={0.1}
              onChange={(e) => updateLighting('sunIntensity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="stage-field">
            <label>Sun Direction</label>
            {vec3Input(stage.lighting.sunDirection, (v) => updateLighting('sunDirection', v))}
          </div>
        </div>

        <div className="stage-group">
          <div className="stage-group-title">BACKDROPS</div>
          {stage.backdrops.map((bd, i) => (
            <div key={bd.id} className="backdrop-card">
              <div className="backdrop-name">{bd.name} ({bd.type})</div>
              {bd.color && (
                <div className="stage-field">
                  <label>Color</label>
                  <input
                    type="color"
                    value={bd.color}
                    onChange={(e) => updateBackdrop(i, { color: e.target.value })}
                  />
                </div>
              )}
              {bd.opacity !== undefined && (
                <div className="stage-field">
                  <label>Opacity</label>
                  <input
                    type="number"
                    className="inspector-input"
                    value={bd.opacity}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(e) => updateBackdrop(i, { opacity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="stage-field">
                <label>Position</label>
                {vec3Input(bd.position, (v) => updateBackdrop(i, { position: v }))}
              </div>
              <div className="stage-field">
                <label>Scale</label>
                {vec3Input(bd.scale, (v) => updateBackdrop(i, { scale: v }))}
              </div>
            </div>
          ))}
        </div>

        <div className="stage-group">
          <div className="stage-group-title">CAMERA DEFAULTS</div>
          <div className="stage-field">
            <label>Position</label>
            {vec3Input(stage.camera.defaultPosition, (v) => updateCamera('defaultPosition', v))}
          </div>
          <div className="stage-field">
            <label>Target</label>
            {vec3Input(stage.camera.defaultTarget, (v) => updateCamera('defaultTarget', v))}
          </div>
        </div>

        <div className="stage-group">
          <div className="stage-group-title">GRID</div>
          <div className="stage-field">
            <label>
              <input
                type="checkbox"
                checked={stage.grid.visible}
                onChange={(e) => updateGrid('visible', e.target.checked)}
              />
              {' '}Visible
            </label>
          </div>
          <div className="stage-field">
            <label>Size</label>
            <input
              type="number"
              className="inspector-input"
              value={stage.grid.size}
              onChange={(e) => updateGrid('size', parseInt(e.target.value) || 50)}
            />
          </div>
          <div className="stage-field">
            <label>Divisions</label>
            <input
              type="number"
              className="inspector-input"
              value={stage.grid.divisions}
              onChange={(e) => updateGrid('divisions', parseInt(e.target.value) || 50)}
            />
          </div>
        </div>

        <button className="stage-apply-btn" onClick={apply}>
          Apply & Close
        </button>
      </div>
    </div>
  )
}
