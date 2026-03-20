import { EditorState, DocumentState, UIState, LayerData, SubItemPath } from './types'
import { EditorAction } from './actions'

const MAX_HISTORY = 50

function cloneDoc(doc: DocumentState): DocumentState {
  return JSON.parse(JSON.stringify(doc))
}

function pushUndo(state: EditorState): EditorState {
  const past = [...state.past, cloneDoc(state.present)].slice(-MAX_HISTORY)
  return { ...state, past, future: [] }
}

function updateNestedItem(
  obj: Record<string, unknown>,
  path: SubItemPath,
  update: Record<string, unknown>,
): Record<string, unknown> {
  if (path.length === 0) return { ...obj, ...update }
  const [head, ...rest] = path
  const arr = [...(obj[head.field] as Record<string, unknown>[])]
  arr[head.index] = updateNestedItem(arr[head.index], rest, update)
  return { ...obj, [head.field]: arr }
}

function documentReducer(
  doc: DocumentState,
  action: EditorAction,
  _ui: UIState,
): DocumentState | null {
  switch (action.type) {
    case 'PLACE_ENTITY': {
      const { entity, layerId, sceneId } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: [...layer.entities, entity],
            },
          },
        },
      }
    }

    case 'DELETE_ENTITY': {
      const { entityId, layerId, sceneId } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: layer.entities.filter((e) => e.id !== entityId),
            },
          },
        },
      }
    }

    case 'DUPLICATE_ENTITY': {
      const { entityId, layerId, sceneId, newId } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      const source = layer.entities.find((e) => e.id === entityId)
      if (!source) return null
      const dup = { ...JSON.parse(JSON.stringify(source)), id: newId }
      if (Array.isArray(dup.position)) {
        dup.position = [dup.position[0] + 1, dup.position[1], dup.position[2] + 1]
      }
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: [...layer.entities, dup],
            },
          },
        },
      }
    }

    case 'UPDATE_ENTITY_FIELD': {
      const { entityId, layerId, sceneId, field, value } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: layer.entities.map((e) =>
                e.id === entityId ? { ...e, [field]: value } : e,
              ),
            },
          },
        },
      }
    }

    case 'TRANSFORM_ENTITY': {
      const { entityId, layerId, sceneId, position, rotation, scale } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: layer.entities.map((e) =>
                e.id === entityId ? { ...e, position, rotation, scale } : e,
              ),
            },
          },
        },
      }
    }

    case 'TRANSFORM_SUB_ITEM': {
      const { entityId, layerId, sceneId, path, positionField, position } = action
      const layer = doc.sceneLayers[sceneId]?.[layerId]
      if (!layer) return null
      return {
        ...doc,
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layerId]: {
              ...layer,
              entities: layer.entities.map((e) => {
                if (e.id !== entityId) return e
                return updateNestedItem(e, path, { [positionField]: position }) as typeof e
              }),
            },
          },
        },
      }
    }

    case 'ADD_LAYER': {
      const { layer, sceneId } = action
      const scene = doc.project.scenes[sceneId]
      if (!scene) return null
      const newLayerData: LayerData = {
        scene: sceneId,
        layer: layer.id,
        type: layer.type,
        entities: [],
      }
      return {
        project: {
          ...doc.project,
          scenes: {
            ...doc.project.scenes,
            [sceneId]: {
              ...scene,
              layers: [...scene.layers, layer],
            },
          },
        },
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: {
            ...doc.sceneLayers[sceneId],
            [layer.id]: newLayerData,
          },
        },
      }
    }

    case 'REMOVE_LAYER': {
      const { layerId, sceneId } = action
      const scene = doc.project.scenes[sceneId]
      if (!scene) return null
      const { [layerId]: _, ...restLayers } = doc.sceneLayers[sceneId] || {}
      return {
        project: {
          ...doc.project,
          scenes: {
            ...doc.project.scenes,
            [sceneId]: {
              ...scene,
              layers: scene.layers.filter((l) => l.id !== layerId),
            },
          },
        },
        sceneLayers: {
          ...doc.sceneLayers,
          [sceneId]: restLayers,
        },
      }
    }

    case 'UPDATE_STAGE': {
      const { sceneId, stage } = action
      const scene = doc.project.scenes[sceneId]
      if (!scene) return null
      return {
        ...doc,
        project: {
          ...doc.project,
          scenes: {
            ...doc.project.scenes,
            [sceneId]: { ...scene, stage },
          },
        },
      }
    }

    default:
      return null
  }
}

function uiReducer(ui: UIState, action: EditorAction): UIState {
  switch (action.type) {
    case 'SWITCH_SCENE':
      return {
        ...ui,
        currentSceneId: action.sceneId,
        activeLayerId: '',
        selectedEntityId: null,
        selectedSubItem: null,
        placementTool: null,
      }
    case 'SET_ACTIVE_LAYER':
      return {
        ...ui,
        activeLayerId: action.layerId,
        selectedEntityId: null,
        selectedSubItem: null,
        placementTool: null,
      }
    case 'SET_TRANSFORM_MODE':
      return { ...ui, transformMode: action.mode }
    case 'SET_PLACEMENT_TOOL':
      return { ...ui, placementTool: action.tool, selectedEntityId: null, selectedSubItem: null }
    case 'SELECT_ENTITY':
      return {
        ...ui,
        selectedEntityId: action.entityId,
        selectedSubItem: null,
        placementTool: action.entityId ? null : ui.placementTool,
      }
    case 'SELECT_SUB_ITEM':
      return { ...ui, selectedSubItem: action.subItem }
    case 'TOGGLE_STAGE_EDITOR':
      return { ...ui, showStageEditor: !ui.showStageEditor }
    case 'TOGGLE_SUB_ITEM_VISIBILITY': {
      const path = action.path
      const hidden = ui.hiddenSubItems.includes(path)
        ? ui.hiddenSubItems.filter((p) => p !== path)
        : [...ui.hiddenSubItems, path]
      return { ...ui, hiddenSubItems: hidden }
    }
    case 'MARK_SAVED':
      return { ...ui, dirty: false }
    default:
      return ui
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  // Handle undo/redo
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state
    const prev = state.past[state.past.length - 1]
    return {
      past: state.past.slice(0, -1),
      present: prev,
      future: [cloneDoc(state.present), ...state.future],
      ui: { ...state.ui, dirty: true },
    }
  }

  if (action.type === 'REDO') {
    if (state.future.length === 0) return state
    const next = state.future[0]
    return {
      past: [...state.past, cloneDoc(state.present)],
      present: next,
      future: state.future.slice(1),
      ui: { ...state.ui, dirty: true },
    }
  }

  // Handle loading layer data from disk
  if (action.type === 'LOAD_LAYERS') {
    return {
      ...state,
      present: {
        ...state.present,
        sceneLayers: action.sceneLayers,
      },
      past: [],
      future: [],
      ui: { ...state.ui, dirty: false },
    }
  }

  // Handle mark saved
  if (action.type === 'MARK_SAVED') {
    return {
      ...state,
      ui: { ...state.ui, dirty: false },
    }
  }

  // Handle layer visibility toggle (in project, undoable)
  if (action.type === 'TOGGLE_LAYER_VISIBILITY') {
    const sceneId = state.ui.currentSceneId
    const scene = state.present.project.scenes[sceneId]
    if (!scene) return state
    const withUndo = pushUndo(state)
    return {
      ...withUndo,
      present: {
        ...withUndo.present,
        project: {
          ...withUndo.present.project,
          scenes: {
            ...withUndo.present.project.scenes,
            [sceneId]: {
              ...scene,
              layers: scene.layers.map((l) =>
                l.id === action.layerId ? { ...l, visible: !l.visible } : l,
              ),
            },
          },
        },
      },
      ui: { ...withUndo.ui, dirty: true },
    }
  }

  // Try document mutation
  const newDoc = documentReducer(state.present, action, state.ui)
  if (newDoc) {
    const withUndo = pushUndo(state)
    return {
      ...withUndo,
      present: newDoc,
      ui: { ...uiReducer(withUndo.ui, action), dirty: true },
    }
  }

  // UI-only actions
  return {
    ...state,
    ui: uiReducer(state.ui, action),
  }
}
