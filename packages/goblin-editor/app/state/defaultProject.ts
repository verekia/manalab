import { config } from 'virtual:goblin-config'
import { EditorProject, EditorState, DocumentState, LayerData } from './types'

export const defaultProject: EditorProject = {
  version: 1,
  ...config,
}

function buildInitialLayers(): Record<string, Record<string, LayerData>> {
  const sceneLayers: Record<string, Record<string, LayerData>> = {}

  for (const [sceneId, sceneDef] of Object.entries(defaultProject.scenes)) {
    sceneLayers[sceneId] = {}
    for (const layer of sceneDef.layers) {
      sceneLayers[sceneId][layer.id] = {
        scene: sceneId,
        layer: layer.id,
        type: layer.type,
        entities: [],
      }
    }
  }

  return sceneLayers
}

const defaultDoc: DocumentState = {
  project: defaultProject,
  sceneLayers: buildInitialLayers(),
}

const firstSceneId = Object.keys(defaultProject.scenes)[0] || ''
const firstScene = defaultProject.scenes[firstSceneId]
const firstLayerId = firstScene?.layers[0]?.id || ''

export const initialEditorState: EditorState = {
  past: [],
  present: defaultDoc,
  future: [],
  ui: {
    currentSceneId: firstSceneId,
    activeLayerId: firstLayerId,
    selectedEntityId: null,
    transformMode: 'translate',
    placementTool: null,
    showStageEditor: false,
    showExportDialog: false,
    dirty: false,
  },
}
