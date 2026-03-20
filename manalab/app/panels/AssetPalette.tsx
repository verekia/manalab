import { EditorState } from '../state/types'
import { EditorAction } from '../state/actions'

interface AssetPaletteProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function AssetPalette({ state, dispatch }: AssetPaletteProps) {
  const { ui, present } = state
  const sceneDef = present.project.scenes[ui.currentSceneId]
  if (!sceneDef) return null

  const activeLayer = sceneDef.layers.find((l) => l.id === ui.activeLayerId)
  if (!activeLayer) return null

  const layerType = present.project.layerTypes[activeLayer.type]
  if (!layerType) return null

  if (layerType.renderMode === 'gltf') {
    // Decoration palette — show assets
    const assetSchema = layerType.entitySchema['asset']
    const category = assetSchema && 'category' in assetSchema ? assetSchema.category : 'decorations'
    const assets = present.project.assetLibrary[category] || {}

    return (
      <div className="panel-section">
        <div className="panel-header">PLACE {layerType.label.toUpperCase()}</div>
        <div className="palette-list">
          {Object.entries(assets).map(([key, asset]) => {
            const isActive =
              ui.placementTool?.type === 'decoration' &&
              'asset' in ui.placementTool &&
              ui.placementTool.asset === key
            return (
              <button
                key={key}
                className={`palette-item ${isActive ? 'active' : ''}`}
                onClick={() =>
                  dispatch({
                    type: 'SET_PLACEMENT_TOOL',
                    tool: isActive ? null : { type: 'decoration', asset: key },
                  })
                }
              >
                {asset.label}
              </button>
            )
          })}
        </div>
        {ui.placementTool && (
          <button
            className="palette-cancel"
            onClick={() => dispatch({ type: 'SET_PLACEMENT_TOOL', tool: null })}
          >
            Cancel Placement (Esc)
          </button>
        )}
      </div>
    )
  }

  if (layerType.renderMode === 'wireframe') {
    // Collider palette — show shapes
    const shapeSchema = layerType.entitySchema['shape']
    const shapes = shapeSchema && 'options' in shapeSchema ? shapeSchema.options : ['cylinder', 'box']

    return (
      <div className="panel-section">
        <div className="panel-header">PLACE {layerType.label.toUpperCase()}</div>
        <div className="palette-list">
          {shapes.map((shape) => {
            const isActive =
              ui.placementTool?.type === 'collider' &&
              'shape' in ui.placementTool &&
              ui.placementTool.shape === shape
            return (
              <button
                key={shape}
                className={`palette-item ${isActive ? 'active' : ''}`}
                onClick={() =>
                  dispatch({
                    type: 'SET_PLACEMENT_TOOL',
                    tool: isActive ? null : { type: 'collider', shape },
                  })
                }
              >
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </button>
            )
          })}
        </div>
        {ui.placementTool && (
          <button
            className="palette-cancel"
            onClick={() => dispatch({ type: 'SET_PLACEMENT_TOOL', tool: null })}
          >
            Cancel Placement (Esc)
          </button>
        )}
      </div>
    )
  }

  if (layerType.renderMode === 'markers') {
    const isActive = ui.placementTool?.type === 'marker'
    return (
      <div className="panel-section">
        <div className="panel-header">PLACE {layerType.label.toUpperCase()}</div>
        <div className="palette-list">
          <button
            className={`palette-item ${isActive ? 'active' : ''}`}
            onClick={() =>
              dispatch({
                type: 'SET_PLACEMENT_TOOL',
                tool: isActive ? null : { type: 'marker' },
              })
            }
          >
            New {layerType.label}
          </button>
        </div>
        {ui.placementTool && (
          <button
            className="palette-cancel"
            onClick={() => dispatch({ type: 'SET_PLACEMENT_TOOL', tool: null })}
          >
            Cancel Placement (Esc)
          </button>
        )}
      </div>
    )
  }

  return null
}
