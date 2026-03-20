import { Vec3, PlacementTool, Entity, StageConfig, LayerRef, LayerData } from './types'

// ── Action types ─────────────────────────────────────────
export type EditorAction =
  // Undo / redo
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // Scene
  | { type: 'SWITCH_SCENE'; sceneId: string }

  // Layers
  | { type: 'SET_ACTIVE_LAYER'; layerId: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; layerId: string }
  | { type: 'ADD_LAYER'; layer: LayerRef; sceneId: string }
  | { type: 'REMOVE_LAYER'; layerId: string; sceneId: string }

  // Entities
  | { type: 'PLACE_ENTITY'; entity: Entity; layerId: string; sceneId: string }
  | { type: 'DELETE_ENTITY'; entityId: string; layerId: string; sceneId: string }
  | { type: 'DUPLICATE_ENTITY'; entityId: string; layerId: string; sceneId: string; newId: string }
  | { type: 'UPDATE_ENTITY_FIELD'; entityId: string; layerId: string; sceneId: string; field: string; value: unknown }
  | { type: 'TRANSFORM_ENTITY'; entityId: string; layerId: string; sceneId: string; position: Vec3; rotation: Vec3; scale: Vec3 }

  // Load / save
  | { type: 'LOAD_LAYERS'; sceneLayers: Record<string, Record<string, LayerData>> }
  | { type: 'MARK_SAVED' }

  // Sub-items
  | { type: 'TRANSFORM_SUB_ITEM'; entityId: string; layerId: string; sceneId: string;
      arrayField: string; itemIndex: number; positionField: string; position: Vec3 }

  // UI (non-undoable)
  | { type: 'SET_TRANSFORM_MODE'; mode: 'translate' | 'rotate' | 'scale' }
  | { type: 'SET_PLACEMENT_TOOL'; tool: PlacementTool }
  | { type: 'SELECT_ENTITY'; entityId: string | null }
  | { type: 'SELECT_SUB_ITEM'; subItem: { field: string; index: number } | null }
  | { type: 'TOGGLE_STAGE_EDITOR' }
  | { type: 'TOGGLE_EXPORT_DIALOG' }
  | { type: 'TOGGLE_SUB_ITEM_VISIBILITY'; path: string }

  // Stage (undoable)
  | { type: 'UPDATE_STAGE'; sceneId: string; stage: StageConfig }
