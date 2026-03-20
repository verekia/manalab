import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { editorReducer } from './state/editorReducer'
import { initialEditorState } from './state/defaultProject'
import { generateId } from './lib/idGen'
import { exportLayerJSON } from './export/exportScene'
import ThreeViewport from './viewport/ThreeViewport'
import TopBar from './panels/TopBar'
import LayerPanel from './panels/LayerPanel'
import AssetPalette from './panels/AssetPalette'
import EntityList from './panels/EntityList'
import InspectorPanel from './panels/InspectorPanel'
import StageEditor from './panels/StageEditor'
import ExportDialog from './panels/ExportDialog'
import type { LayerData } from './state/types'
import './App.css'

async function loadLayersFromDisk(
  project: typeof initialEditorState.present.project
): Promise<Record<string, Record<string, LayerData>>> {
  const sceneLayers: Record<string, Record<string, LayerData>> = {}

  for (const [sceneId, sceneDef] of Object.entries(project.scenes)) {
    sceneLayers[sceneId] = {}
    for (const layer of sceneDef.layers) {
      try {
        const res = await fetch(`/api/load-layer?file=${encodeURIComponent(layer.file)}`)
        const data = await res.json()
        sceneLayers[sceneId][layer.id] = {
          scene: data.scene || sceneId,
          layer: data.layer || layer.id,
          type: data.type || layer.type,
          entities: data.entities || [],
        }
      } catch {
        sceneLayers[sceneId][layer.id] = {
          scene: sceneId,
          layer: layer.id,
          type: layer.type,
          entities: [],
        }
      }
    }
  }

  return sceneLayers
}

async function saveLayersToDisk(
  project: typeof initialEditorState.present.project,
  sceneLayers: Record<string, Record<string, LayerData>>
): Promise<boolean> {
  const layers: Array<{ file: string; data: unknown }> = []

  for (const [sceneId, sceneDef] of Object.entries(project.scenes)) {
    for (const layer of sceneDef.layers) {
      const ld = sceneLayers[sceneId]?.[layer.id]
      if (!ld) continue
      const exported = exportLayerJSON(sceneId, layer.id, layer.type, ld.entities)
      layers.push({ file: layer.file, data: exported })
    }
  }

  try {
    const res = await fetch('/api/save-layers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layers }),
    })
    const result = await res.json()
    return result.ok === true
  } catch {
    return false
  }
}

const RIGHT_PANEL_KEY = 'goblin-right-panel-width'
const DEFAULT_RIGHT_WIDTH = 320
const MIN_RIGHT_WIDTH = 220
const MAX_RIGHT_WIDTH = 600

export default function App() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)
  const savingRef = useRef(false)
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem(RIGHT_PANEL_KEY)
    return saved ? Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, parseInt(saved, 10))) : DEFAULT_RIGHT_WIDTH
  })
  const draggingRef = useRef(false)

  // Load layer data from disk on mount
  useEffect(() => {
    loadLayersFromDisk(state.present.project).then((sceneLayers) => {
      dispatch({ type: 'LOAD_LAYERS', sceneLayers })
    })
  }, [])

  // Save handler
  const handleSave = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    const ok = await saveLayersToDisk(state.present.project, state.present.sceneLayers)
    savingRef.current = false
    if (ok) {
      dispatch({ type: 'MARK_SAVED' })
    }
  }, [state.present.project, state.present.sceneLayers])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSave()
      } else if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
      } else if (ctrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
      } else if (e.key === 'w' || e.key === 'W') {
        dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'translate' })
      } else if (e.key === 'e' || e.key === 'E') {
        dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'rotate' })
      } else if (e.key === 'r' || e.key === 'R') {
        dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'scale' })
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.ui.selectedEntityId) {
          dispatch({
            type: 'DELETE_ENTITY',
            entityId: state.ui.selectedEntityId,
            layerId: state.ui.activeLayerId,
            sceneId: state.ui.currentSceneId,
          })
          dispatch({ type: 'SELECT_ENTITY', entityId: null })
        }
      } else if (e.key === 'Escape') {
        if (state.ui.placementTool) {
          dispatch({ type: 'SET_PLACEMENT_TOOL', tool: null })
        } else {
          dispatch({ type: 'SELECT_ENTITY', entityId: null })
        }
      } else if (ctrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        if (state.ui.selectedEntityId) {
          const newId = generateId()
          dispatch({
            type: 'DUPLICATE_ENTITY',
            entityId: state.ui.selectedEntityId,
            layerId: state.ui.activeLayerId,
            sceneId: state.ui.currentSceneId,
            newId,
          })
          dispatch({ type: 'SELECT_ENTITY', entityId: newId })
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (state.ui.selectedEntityId) {
          window.dispatchEvent(new CustomEvent('focus-entity', { detail: state.ui.selectedEntityId }))
        }
      }
    },
    [state.ui, handleSave]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    const startX = e.clientX
    const startWidth = rightWidth

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      const newWidth = Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, startWidth + delta))
      setRightWidth(newWidth)
    }

    const onMouseUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setRightWidth((w) => {
        localStorage.setItem(RIGHT_PANEL_KEY, String(w))
        return w
      })
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [rightWidth])

  // Entity count for status bar
  const sceneId = state.ui.currentSceneId
  const layerId = state.ui.activeLayerId
  const layerData = state.present.sceneLayers[sceneId]?.[layerId]
  const entityCount = layerData?.entities.length ?? 0

  return (
    <div className="editor-root">
      <TopBar state={state} dispatch={dispatch} onSave={handleSave} />

      <div className="editor-body">
        <div className="left-panel">
          <LayerPanel state={state} dispatch={dispatch} />
          <AssetPalette state={state} dispatch={dispatch} />
          <EntityList state={state} dispatch={dispatch} />
        </div>

        <div className="viewport-container">
          <ThreeViewport state={state} dispatch={dispatch} />
        </div>

        <div className="right-panel-wrapper" style={{ width: rightWidth, minWidth: rightWidth }}>
          <div className="right-panel-resize-handle" onMouseDown={onResizeStart} />
          <div className="right-panel">
            {state.ui.showStageEditor ? (
              <StageEditor state={state} dispatch={dispatch} />
            ) : (
              <InspectorPanel state={state} dispatch={dispatch} />
            )}
          </div>
        </div>
      </div>

      <div className="status-bar">
        <span>Entities: {entityCount}</span>
        <span>Mode: {state.ui.transformMode}</span>
        {state.ui.placementTool && (
          <span>
            Placing: {state.ui.placementTool.type === 'decoration'
              ? state.ui.placementTool.asset
              : state.ui.placementTool.type === 'collider'
              ? state.ui.placementTool.shape
              : 'New marker'}
          </span>
        )}
      </div>

      {state.ui.showExportDialog && (
        <ExportDialog state={state} dispatch={dispatch} />
      )}
    </div>
  )
}
