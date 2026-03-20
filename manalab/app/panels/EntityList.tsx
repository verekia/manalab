import { EditorState, ArrayField } from '../state/types'
import { EditorAction } from '../state/actions'
import { useState } from 'react'

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

  const layerType = present.project.layerTypes[activeLayer.type]
  const layerData = present.sceneLayers[sceneId]?.[layerId]
  if (!layerData) return null

  const arrayFieldsWithPosition = layerType
    ? Object.entries(layerType.entitySchema).filter(
        ([, def]) => def.type === 'array' && (def as ArrayField).itemPositionField
      )
    : []

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
          const label = (entity.name as string) || (entity.asset as string) || (entity.shape as string) || entity.id

          return (
            <EntityRow
              key={entity.id}
              entityId={entity.id}
              label={label}
              entity={entity}
              isSelected={isSelected}
              arrayFields={arrayFieldsWithPosition}
              ui={ui}
              dispatch={dispatch}
              onSelect={() => selectAndFocus(entity.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

interface EntityRowProps {
  entityId: string
  label: string
  entity: Record<string, unknown>
  isSelected: boolean
  arrayFields: [string, import('../state/types').SchemaField][]
  ui: EditorState['ui']
  dispatch: React.Dispatch<EditorAction>
  onSelect: () => void
}

function EntityRow({ entityId, label, entity, isSelected, arrayFields, ui, dispatch, onSelect }: EntityRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasSubItems = arrayFields.length > 0

  const pos = entity.position as [number, number, number] | undefined
  const posStr = pos ? `(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)})` : ''

  return (
    <>
      <div
        className={`entity-row ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
      >
        {hasSubItems && (
          <span
            className="array-item-chevron"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            style={{ cursor: 'pointer' }}
          >
            {expanded ? 'v' : '>'}
          </span>
        )}
        <span className="entity-label">{label}</span>
        <span className="entity-pos">{posStr}</span>
      </div>
      {expanded && isSelected && arrayFields.map(([fieldKey, fieldDef]) => {
        const arrDef = fieldDef as ArrayField
        const items = (entity[fieldKey] as Record<string, unknown>[]) || []
        return items.map((item, index) => {
          const path = `${entityId}:${fieldKey}:${index}`
          const isHidden = ui.hiddenSubItems.includes(path)
          const isSubSelected = ui.selectedSubItem?.[0]?.field === fieldKey && ui.selectedSubItem?.[0]?.index === index
          const summary = Object.values(item).find((v) => typeof v === 'string' && v) as string || `#${index}`

          return (
            <div
              key={path}
              className={`sub-item-row ${isSubSelected ? 'selected' : ''}`}
              onClick={() => {
                dispatch({ type: 'SELECT_ENTITY', entityId })
                dispatch({ type: 'SELECT_SUB_ITEM', subItem: [{ field: fieldKey, index }] })
              }}
            >
              <span className="sub-item-label">#{index} {summary}</span>
              <button
                className="sub-item-vis-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ type: 'TOGGLE_SUB_ITEM_VISIBILITY', path })
                }}
                title={isHidden ? 'Show' : 'Hide'}
              >
                {isHidden ? '-' : 'o'}
              </button>
            </div>
          )
        })
      })}
    </>
  )
}
