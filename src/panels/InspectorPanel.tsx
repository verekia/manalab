import { EditorState, Vec3, SchemaField, Entity, AssetCategory } from '../state/types'
import { EditorAction } from '../state/actions'
import { generateId } from '../lib/idGen'
import { useRef, useState, useEffect, useCallback } from 'react'

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
}

function FieldEditor({ fieldKey, fieldDef, value, onChange, assetLibrary }: FieldEditorProps) {
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
    default:
      return null
  }
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
