# Mana Lab

Schema-driven 3D scene editor for game development. Users define layer types, entity schemas, and asset libraries in a config file; the editor provides a Three.js viewport, inspector, entity list, and asset palette to place and edit entities visually. Data is saved as JSON files to disk.

## Repository Structure

Monorepo with two workspaces at the root:

- **`manalab`** — The editor library + CLI tool
- **`example`** — Example project using the editor

## Quick Start

```sh
cd manalab && bun run build   # Build the library (tsup)
cd example && bun run manalab # Start the editor (port 7320)
```

## Architecture

### Editor Package (`manalab`)

**Published surface** (`src/`):

- `src/types.ts` — All shared types (SchemaField union, Entity, LayerData, UIState, etc.)
- `src/config.ts` — `defineConfig()` helper for type-safe config files
- `src/index.ts` — Re-exports types
- `src/cli.ts` — CLI entry point: starts Vite dev server with the editor app
- `src/vite-plugin.ts` — Vite plugin that injects the user's `manalab.config.ts` as a virtual module

**Editor app** (`app/`):

State management (React `useReducer`, no external libs):

- `app/state/types.ts` — Re-exports from `src/types.ts`
- `app/state/actions.ts` — `EditorAction` discriminated union
- `app/state/editorReducer.ts` — Undo/redo stack, document mutations, UI state
- `app/state/defaultProject.ts` — Initial state from config

Panels:

- `app/App.tsx` — Root component, keyboard shortcuts, save/load, layout
- `app/panels/InspectorPanel.tsx` — Recursive `FieldEditor` for all schema field types including nested objects/arrays
- `app/panels/EntityList.tsx` — Entity rows with expandable sub-items
- `app/panels/AssetPalette.tsx` — Placement tools for gltf/wireframe/markers render modes
- `app/panels/LayerPanel.tsx` — Layer visibility and selection
- `app/panels/TopBar.tsx` — Transform mode, undo/redo, scene switching
- `app/panels/StageEditor.tsx` — Lighting, backdrops, camera, grid
- `app/panels/ExportDialog.tsx` — JSON export preview

Viewport:

- `app/viewport/ThreeViewport.tsx` — Three.js scene sync, raycasting, transform controls, sub-item mesh rendering
- `app/viewport/entityRenderers.ts` — Mesh factories: placeholders (gltf), wireframes (colliders), markers (quests), sub-item cubes, enemy capsules
- `app/viewport/stageRenderer.ts` — Lighting, backdrops, fog

Utilities:

- `app/lib/schemaDefaults.ts` — `getFieldDefault()`, `buildDefaultEntity()`, `buildArrayItemDefault()`
- `app/lib/idGen.ts` — Short random ID generator
- `app/lib/math.ts` — `roundVec3()`

### Example (`example`)

- `manalab.config.ts` — Defines asset library, scenes, layer types (decoration, collider, quest)
- `scene-data/*.json` — Persisted entity data per layer

## Key Concepts

**Layer types** define how entities are rendered and edited. Each has a `renderMode`:

- `gltf` — Decoration assets (placeholder meshes for now)
- `wireframe` — Collision volumes
- `markers` — Abstract entities like quests (orange sphere + pole)

**Entity schemas** are `Record<string, SchemaField>`. Supported field types: `string`, `number`, `boolean`, `vec3`, `enum`, `assetRef`, `richtext`, `ref`, `ref[]`, `enum[]`, `object`, `array`.

**Array fields** can have `itemPositionField` to make each item a 3D-positionable sub-item in the viewport. Optional `itemMeshType` controls rendering (e.g., `'enemy'` renders capsules). Arrays nest arbitrarily — e.g., quest steps contain enemy arrays.

**Sub-item selection** uses `SubItemPath` (array of `{field, index}` segments) to address nested items like `[{field:'steps', index:1}, {field:'newEnemies', index:0}]`. This path is used for viewport selection, inspector auto-expand, and transform dispatch.

**Undo/redo** wraps `DocumentState` (project config + all layer data). UI state changes are not undoable.

## Development Notes

- TypeScript strict mode, target ES2023
- Build with `tsup` (ESM only, DTS generation)
- No test framework currently
- The editor app runs via Vite dev server started by the CLI
- `app/state/types.ts` just re-exports `src/types.ts` — edit the source in `src/`
- Pre-existing TS5097 error in `app/main.tsx` (import with `.tsx` extension) — harmless, Vite handles it
- Right panel width is persisted in localStorage (`manalab-right-panel-width`)
