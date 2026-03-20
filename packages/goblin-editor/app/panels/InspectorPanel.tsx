import { EditorState, Vec3, SchemaField, ArrayField } from '../state/types'
import { EditorAction } from '../state/actions'
import { generateId } from '../lib/idGen'
import { getFieldDefault, buildArrayItemDefault } from '../lib/schemaDefaults'
import { useState, useEffect } from 'react'

interface InspectorProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function InspectorPanel({ state, dispatch }: InspectorProps) {
  const { ui, present } = state
  const sceneId = ui.currentSceneId
  const layerId = ui.activeLayerId
  const entityId = ui.selectedEntityId

  if (!entityId) {
    return (
      <div className="panel-section">
        <div className="panel-header">INSPECTOR</div>
        <div className="inspector-empty">Select an entity or click to place one.</div>
      </div>
    )
  }

  const sceneDef = present.project.scenes[sceneId]
  if (!sceneDef) return null

  const activeLayer = sceneDef.layers.find((l) => l.id === layerId)
  if (!activeLayer) return null

  const layerType = present.project.layerTypes[activeLayer.type]
  if (!layerType) return null

  const layerData = present.sceneLayers[sceneId]?.[layerId]
  if (!layerData) return null

  const entity = layerData.entities.find((e) => e.id === entityId)
  if (!entity) return null

  const updateField = (field: string, value: unknown) => {
    dispatch({
      type: 'UPDATE_ENTITY_FIELD',
      entityId,
      layerId,
      sceneId,
      field,
      value,
    })
  }

  const deleteEntity = () => {
    dispatch({ type: 'SELECT_ENTITY', entityId: null })
    dispatch({ type: 'DELETE_ENTITY', entityId, layerId, sceneId })
  }

  const duplicateEntity = () => {
    const newId = generateId()
    dispatch({ type: 'DUPLICATE_ENTITY', entityId, layerId, sceneId, newId })
    dispatch({ type: 'SELECT_ENTITY', entityId: newId })
  }

  return (
    <div className="panel-section">
      <div className="panel-header">INSPECTOR</div>
      <div className="inspector-content">
        <div className="inspector-row">
          <span className="inspector-label">ID</span>
          <span className="inspector-value-text">{entity.id}</span>
        </div>
        <div className="inspector-row">
          <span className="inspector-label">Layer</span>
          <span className="inspector-value-text">{activeLayer.name}</span>
        </div>

        <div className="inspector-divider" />

        {Object.entries(layerType.entitySchema).map(([fieldKey, fieldDef]) => (
          <FieldEditor
            key={fieldKey}
            fieldKey={fieldKey}
            fieldDef={fieldDef}
            value={entity[fieldKey]}
            onChange={(val) => updateField(fieldKey, val)}
            assetLibrary={present.project.assetLibrary}
            selectedSubItem={ui.selectedSubItem}
            entityId={entityId}
          />
        ))}

        <div className="inspector-divider" />

        <div className="inspector-actions">
          <button className="inspector-btn danger" onClick={deleteEntity}>
            Delete
          </button>
          <button className="inspector-btn" onClick={duplicateEntity}>
            Duplicate
          </button>
        </div>
      </div>
    </div>
  )
}

interface FieldEditorProps {
  fieldKey: string
  fieldDef: SchemaField
  value: unknown
  onChange: (value: unknown) => void
  assetLibrary: Record<string, Record<string, { label: string }>>
  selectedSubItem?: { field: string; index: number } | null
  entityId?: string
}

function FieldEditor({ fieldKey, fieldDef, value, onChange, assetLibrary, selectedSubItem, entityId }: FieldEditorProps) {
  switch (fieldDef.type) {
    case 'vec3':
      return <Vec3Editor label={fieldDef.label} value={value as Vec3} onChange={onChange} />
    case 'enum':
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <select
            className="inspector-select"
            value={(value as string) || fieldDef.default || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {fieldDef.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    case 'assetRef': {
      const category = fieldDef.category
      const assets = assetLibrary[category] || {}
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <select
            className="inspector-select"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {Object.entries(assets).map(([key, asset]) => (
              <option key={key} value={key}>{asset.label}</option>
            ))}
          </select>
        </div>
      )
    }
    case 'number':
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <input
            type="number"
            className="inspector-input"
            value={(value as number) ?? fieldDef.default ?? 0}
            min={fieldDef.min}
            max={fieldDef.max}
            step={fieldDef.step || 0.1}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      )
    case 'string':
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <input
            type="text"
            className="inspector-input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className="inspector-field">
          <label className="inspector-checkbox">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            {fieldDef.label}
          </label>
        </div>
      )
    case 'richtext':
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <textarea
            className="inspector-textarea"
            value={(value as string) || ''}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'object': {
      const objValue = (value as Record<string, unknown>) || {}
      return (
        <div className="inspector-field">
          <div className="inspector-field-label">{fieldDef.label}</div>
          <div className="inspector-nested">
            {Object.entries(fieldDef.fields).map(([subKey, subDef]) => (
              <FieldEditor
                key={subKey}
                fieldKey={subKey}
                fieldDef={subDef}
                value={objValue[subKey]}
                onChange={(subVal) => onChange({ ...objValue, [subKey]: subVal })}
                assetLibrary={assetLibrary}
              />
            ))}
          </div>
        </div>
      )
    }
    case 'array': {
      const arrValue = (value as Record<string, unknown>[]) || []
      const updateArray = (newArr: Record<string, unknown>[]) => onChange(newArr)
      return (
        <ArrayFieldEditor
          fieldKey={fieldKey}
          fieldDef={fieldDef}
          items={arrValue}
          onChange={updateArray}
          assetLibrary={assetLibrary}
          selectedSubItem={selectedSubItem}
          entityId={entityId}
        />
      )
    }
    default:
      return null
  }
}

interface ArrayFieldEditorProps {
  fieldKey: string
  fieldDef: ArrayField
  items: Record<string, unknown>[]
  onChange: (items: Record<string, unknown>[]) => void
  assetLibrary: Record<string, Record<string, { label: string }>>
  selectedSubItem?: { field: string; index: number } | null
  entityId?: string
}

function ArrayFieldEditor({ fieldKey, fieldDef, items, onChange, assetLibrary, selectedSubItem, entityId }: ArrayFieldEditorProps) {
  const addItem = () => {
    const newItem = buildArrayItemDefault(fieldDef)
    onChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const newItems = [...items]
    ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]
    onChange(newItems)
  }

  const updateItem = (index: number, newItem: Record<string, unknown>) => {
    const newItems = [...items]
    newItems[index] = newItem
    onChange(newItems)
  }

  return (
    <div className="inspector-field">
      <div className="inspector-field-label">{fieldDef.label} ({items.length})</div>
      <div className="inspector-nested">
        {items.map((item, index) => (
          <ArrayItemEditor
            key={index}
            index={index}
            item={item}
            fieldDef={fieldDef}
            onChange={(newItem) => updateItem(index, newItem)}
            onRemove={() => removeItem(index)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            assetLibrary={assetLibrary}
            isSelected={selectedSubItem?.field === fieldKey && selectedSubItem?.index === index}
          />
        ))}
        <button className="array-add-btn" onClick={addItem}>
          + Add Item
        </button>
      </div>
    </div>
  )
}

interface ArrayItemEditorProps {
  index: number
  item: Record<string, unknown>
  fieldDef: ArrayField
  onChange: (item: Record<string, unknown>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  assetLibrary: Record<string, Record<string, { label: string }>>
  isSelected: boolean
}

function ArrayItemEditor({ index, item, fieldDef, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, assetLibrary, isSelected }: ArrayItemEditorProps) {
  const [collapsed, setCollapsed] = useState(!isSelected)

  useEffect(() => {
    if (isSelected) setCollapsed(false)
  }, [isSelected])

  const summary = Object.values(item).find((v) => typeof v === 'string' && v) as string || `Item ${index}`

  return (
    <div className={`array-item ${isSelected ? 'selected' : ''}`}>
      <div className="array-item-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="array-item-chevron">{collapsed ? '>' : 'v'}</span>
        <span className="array-item-title">#{index} {summary}</span>
        <div className="array-item-actions">
          {!isFirst && <button className="array-item-btn" onClick={(e) => { e.stopPropagation(); onMoveUp() }} title="Move up">^</button>}
          {!isLast && <button className="array-item-btn" onClick={(e) => { e.stopPropagation(); onMoveDown() }} title="Move down">v</button>}
          <button className="array-item-btn danger" onClick={(e) => { e.stopPropagation(); onRemove() }} title="Remove">x</button>
        </div>
      </div>
      {!collapsed && (
        <div className="array-item-body">
          {Object.entries(fieldDef.itemFields).map(([subKey, subDef]) => (
            <FieldEditor
              key={subKey}
              fieldKey={subKey}
              fieldDef={subDef}
              value={item[subKey]}
              onChange={(subVal) => onChange({ ...item, [subKey]: subVal })}
              assetLibrary={assetLibrary}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Vec3Editor({
  label,
  value,
  onChange,
}: {
  label: string
  value: Vec3 | undefined
  onChange: (v: Vec3) => void
}) {
  const v = value || [0, 0, 0]
  const colors = ['#e94560', '#4ecdc4', '#5c7cfa']
  const labels = ['X', 'Y', 'Z']

  const update = (idx: number, val: number) => {
    const next: Vec3 = [...v] as Vec3
    next[idx] = Math.round(val * 1000) / 1000
    onChange(next)
  }

  return (
    <div className="inspector-field">
      <div className="inspector-field-label">{label}</div>
      <div className="vec3-row">
        {[0, 1, 2].map((i) => (
          <div key={i} className="vec3-input-group">
            <span className="vec3-label" style={{ color: colors[i] }}>{labels[i]}</span>
            <input
              type="number"
              className="vec3-input"
              value={v[i]}
              step={0.1}
              onChange={(e) => update(i, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
