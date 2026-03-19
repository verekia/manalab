import { EditorState, LayerRef } from '../state/types'
import { EditorAction } from '../state/actions'
import { generateId } from '../lib/idGen'

interface LayerPanelProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function LayerPanel({ state, dispatch }: LayerPanelProps) {
  const { ui, present } = state
  const sceneDef = present.project.scenes[ui.currentSceneId]
  if (!sceneDef) return null

  const layers = sceneDef.layers
  const layerDataMap = present.sceneLayers[ui.currentSceneId] || {}
  const layerTypes = present.project.layerTypes

  const addLayer = (typeKey: string) => {
    const typeDef = layerTypes[typeKey]
    if (!typeDef) return
    const name = prompt(`New ${typeDef.label} layer name:`)
    if (!name) return
    const id = `${typeKey}_${generateId()}`
    const layer: LayerRef = {
      id,
      name,
      type: typeKey,
      visible: true,
      file: `${ui.currentSceneId}/${id}.json`,
    }
    dispatch({ type: 'ADD_LAYER', layer, sceneId: ui.currentSceneId })
    dispatch({ type: 'SET_ACTIVE_LAYER', layerId: id })
  }

  return (
    <div className="panel-section">
      <div className="panel-header">LAYERS</div>
      <div className="layer-list">
        {layers.map((layer) => {
          const ld = layerDataMap[layer.id]
          const count = ld?.entities.length ?? 0
          const isActive = layer.id === ui.activeLayerId
          const typeDef = layerTypes[layer.type]

          return (
            <div
              key={layer.id}
              className={`layer-row ${isActive ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', layerId: layer.id })}
            >
              <button
                className="layer-vis-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', layerId: layer.id })
                }}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? '\u{1F441}' : '\u{1F6AB}'}
              </button>
              <span className="layer-icon">{typeDef?.icon || '?'}</span>
              <span className="layer-name">{layer.name}</span>
              <span className="layer-count">({count})</span>
            </div>
          )
        })}
      </div>
      <div className="layer-add-btns">
        {Object.entries(layerTypes).map(([key, def]) => (
          <button
            key={key}
            className="layer-add-btn"
            onClick={() => addLayer(key)}
          >
            + {def.label}
          </button>
        ))}
      </div>
    </div>
  )
}
