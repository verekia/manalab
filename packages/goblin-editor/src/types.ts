// ── Vec3 & primitive helpers ──────────────────────────────
export type Vec3 = [number, number, number]

// ── Schema field descriptors ─────────────────────────────
export interface SchemaFieldBase {
  label: string
  default?: unknown
}
export interface Vec3Field extends SchemaFieldBase {
  type: 'vec3'
  default?: Vec3
}
export interface EnumField extends SchemaFieldBase {
  type: 'enum'
  options: string[]
  default?: string
}
export interface AssetRefField extends SchemaFieldBase {
  type: 'assetRef'
  category: string
}
export interface NumberField extends SchemaFieldBase {
  type: 'number'
  min?: number
  max?: number
  step?: number
  default?: number
}
export interface StringField extends SchemaFieldBase {
  type: 'string'
  default?: string
}
export interface BooleanField extends SchemaFieldBase {
  type: 'boolean'
  default?: boolean
}
export interface RichTextField extends SchemaFieldBase {
  type: 'richtext'
  default?: string
}
export interface RefField extends SchemaFieldBase {
  type: 'ref'
}
export interface RefArrayField extends SchemaFieldBase {
  type: 'ref[]'
}
export interface EnumArrayField extends SchemaFieldBase {
  type: 'enum[]'
  options: string[]
}

export interface ObjectField extends SchemaFieldBase {
  type: 'object'
  fields: Record<string, SchemaField>
  default?: Record<string, unknown>
}

export interface ArrayField extends SchemaFieldBase {
  type: 'array'
  itemFields: Record<string, SchemaField>
  itemPositionField?: string
  itemMeshType?: string
  default?: Record<string, unknown>[]
}

export type SubItemPath = Array<{ field: string; index: number }>

export type SchemaField =
  | Vec3Field
  | EnumField
  | AssetRefField
  | NumberField
  | StringField
  | BooleanField
  | RichTextField
  | RefField
  | RefArrayField
  | EnumArrayField
  | ObjectField
  | ArrayField

export type EntitySchema = Record<string, SchemaField>

// ── Layer type definition ────────────────────────────────
export interface LayerTypeDef {
  label: string
  icon: string
  description: string
  renderMode: 'gltf' | 'wireframe' | 'markers'
  entitySchema: EntitySchema
}

// ── Asset library ────────────────────────────────────────
export interface AssetEntry {
  label: string
  glb?: string
  thumbnail?: string
  tags?: string[]
}

export type AssetCategory = Record<string, AssetEntry>

// ── Stage configuration ──────────────────────────────────
export interface StageLighting {
  ambientColor: string
  ambientIntensity: number
  sunColor: string
  sunIntensity: number
  sunDirection: Vec3
}

export interface StageBackdrop {
  id: string
  name: string
  type: 'glb' | 'plane' | 'box' | 'sphere'
  src?: string
  size?: [number, number]
  color?: string
  opacity?: number
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export interface StageCamera {
  defaultPosition: Vec3
  defaultTarget: Vec3
}

export interface StageGrid {
  size: number
  divisions: number
  visible: boolean
}

export interface StageConfig {
  lighting: StageLighting
  backdrops: StageBackdrop[]
  camera: StageCamera
  grid: StageGrid
}

// ── Layer reference (in project file) ────────────────────
export interface LayerRef {
  id: string
  name: string
  type: string
  visible: boolean
  file: string
}

// ── Scene definition ─────────────────────────────────────
export interface SceneDef {
  name: string
  stage: StageConfig
  layers: LayerRef[]
}

// ── Editor project file (editor.json) ────────────────────
export interface EditorProject {
  version: number
  assetLibrary: Record<string, AssetCategory>
  scenes: Record<string, SceneDef>
  layerTypes: Record<string, LayerTypeDef>
}

// ── Entity data ──────────────────────────────────────────
export interface Entity {
  id: string
  [key: string]: unknown
}

export interface LayerData {
  scene: string
  layer: string
  type: string
  entities: Entity[]
}

// ── Placement tool ───────────────────────────────────────
export type PlacementTool =
  | { type: 'decoration'; asset: string }
  | { type: 'collider'; shape: string }
  | { type: 'marker' }
  | null

// ── UI state ─────────────────────────────────────────────
export interface UIState {
  currentSceneId: string
  activeLayerId: string
  selectedEntityId: string | null
  selectedSubItem: SubItemPath | null
  transformMode: 'translate' | 'rotate' | 'scale'
  placementTool: PlacementTool
  showStageEditor: boolean
  showExportDialog: boolean
  hiddenSubItems: string[]
  dirty: boolean
}

// ── Undoable document state ──────────────────────────────
export interface DocumentState {
  project: EditorProject
  sceneLayers: Record<string, Record<string, LayerData>>
}

// ── Full editor state ────────────────────────────────────
export interface EditorState {
  past: DocumentState[]
  present: DocumentState
  future: DocumentState[]
  ui: UIState
}
