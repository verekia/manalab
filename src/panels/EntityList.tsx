import { EditorState, Entity } from '../state/types'
import { EditorAction } from '../state/actions'

interface EntityListProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function EntityList({ state, dispatch }: EntityListProps) {
  const { ui, present } = state
  const sceneId = ui.currentSceneId
  const layerId = ui.activeLayerId

  const sceneDef = present.project.scenes[sceneId]
  if (!sceneDef) return null

  const activeLayer = sceneDef.layers.find((l) => l.id === layerId)
  if (!activeLayer) return null

  const layerData = present.sceneLayers[sceneId]?.[layerId]
  if (!layerData) return null

  const selectAndFocus = (entityId: string) => {
    dispatch({ type: 'SELECT_ENTITY', entityId })
    window.dispatchEvent(new CustomEvent('focus-entity', { detail: entityId }))
  }

  return (
    <div className="panel-section">
      <div className="panel-header">ENTITIES ({activeLayer.name})</div>
      <div className="entity-list">
        {layerData.entities.length === 0 && (
          <div className="entity-list-empty">No entities yet</div>
        )}
        {layerData.entities.map((entity) => {
          const isSelected = entity.id === ui.selectedEntityId
          const label = (entity.asset as string) || (entity.shape as string) || entity.id
          const pos = entity.position as [number, number, number] | undefined
          const posStr = pos ? `(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)})` : ''

          return (
            <div
              key={entity.id}
              className={`entity-row ${isSelected ? 'selected' : ''}`}
              onClick={() => selectAndFocus(entity.id)}
            >
              <span className="entity-label">{label}</span>
              <span className="entity-pos">{posStr}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
