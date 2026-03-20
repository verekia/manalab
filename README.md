# Mana Lab

A schema-driven 3D scene editor for game development. Define your entity types, data schemas, and asset libraries in a single config file -- Mana Lab gives you a full visual editor with a Three.js viewport, property inspector, and JSON persistence.

Disclaimer: Vibe-coded.

## Features

- **Schema-driven** -- Define layer types and entity schemas in TypeScript. The editor UI generates automatically.
- **3D viewport** -- Place, select, move, rotate, and scale entities in a Three.js scene with orbit controls and transform gizmos.
- **Deeply nestable data** -- Arrays and objects nest arbitrarily. Array items with position fields become first-class 3D objects you can click and drag in the viewport.
- **Layer system** -- Organize entities into typed layers (decorations, colliders, quests, or your own). Toggle visibility, add/remove layers.
- **Inspector** -- Auto-generated property panel supporting `string`, `number`, `boolean`, `vec3`, `enum`, `assetRef`, `richtext`, `object`, `array`, and more.
- **Undo/redo** -- Full undo/redo stack for all document mutations.
- **JSON persistence** -- Scene data saves to JSON files on disk via Ctrl+S. No database required.
- **Stage editor** -- Configure lighting, backdrops, camera defaults, and grid from within the editor.

## Quick Start

```sh
# Install
bun add -d manalab

# Create a config file
touch manalab.config.ts

# Start the editor
bunx manalab
```

The editor opens at `http://localhost:7320`.

## Configuration

Create a `manalab.config.ts` in your project root:

```ts
import { defineConfig } from 'manalab'

export default defineConfig({
  assetLibrary: {
    decorations: {
      oak_tree: { label: 'Oak Tree' },
      rock: { label: 'Rock' },
    },
  },
  scenes: {
    main: {
      name: 'Main Scene',
      stage: {
        lighting: {
          ambientColor: '#c4a882',
          ambientIntensity: 0.6,
          sunColor: '#fff5e6',
          sunIntensity: 1.2,
          sunDirection: [-0.5, -1, -0.3],
        },
        backdrops: [],
        camera: {
          defaultPosition: [20, 15, 20],
          defaultTarget: [0, 0, 0],
        },
        grid: { size: 100, divisions: 100, visible: true },
      },
      layers: [
        {
          id: 'decorations',
          name: 'Decorations',
          type: 'decoration',
          visible: true,
          file: 'decorations.json',
        },
      ],
    },
  },
  layerTypes: {
    decoration: {
      label: 'Decoration',
      icon: '🌿',
      description: 'Visual props',
      renderMode: 'gltf',
      entitySchema: {
        asset: { type: 'assetRef', category: 'decorations', label: 'Asset' },
        position: { type: 'vec3', label: 'Position', default: [0, 0, 0] },
        rotation: { type: 'vec3', label: 'Rotation', default: [0, 0, 0] },
        scale: { type: 'vec3', label: 'Scale', default: [1, 1, 1] },
      },
    },
  },
})
```

Scene data is saved to `scene-data/` in your project directory.

## Render Modes

Each layer type specifies a `renderMode`:

| Mode        | Use Case                         | Viewport                                  |
| ----------- | -------------------------------- | ----------------------------------------- |
| `gltf`      | Decorations, props               | Placeholder meshes (glTF loading planned) |
| `wireframe` | Collision volumes                | Wireframe edges + translucent fill        |
| `markers`   | Quests, waypoints, abstract data | Sphere + pole marker                      |

## Nested Arrays & Sub-Items

Array fields with `itemPositionField` make each array item a selectable, draggable 3D object:

```ts
steps: {
  type: 'array',
  label: 'Steps',
  itemPositionField: 'waypoint',
  itemFields: {
    waypoint: { type: 'vec3', label: 'Waypoint', default: [0, 0, 0] },
    goal: { type: 'string', label: 'Goal', default: '' },
    newEnemies: {
      type: 'array',
      label: 'Enemies',
      itemPositionField: 'position',
      itemMeshType: 'enemy',
      itemFields: {
        position: { type: 'vec3', label: 'Position', default: [0, 0, 0] },
        type: { type: 'string', label: 'Type', default: '' },
      },
    },
  },
}
```

This nests arbitrarily -- enemies inside steps inside quests, each with their own 3D representation.

## Keyboard Shortcuts

| Key            | Action                      |
| -------------- | --------------------------- |
| `W`            | Translate mode              |
| `E`            | Rotate mode                 |
| `R`            | Scale mode                  |
| `F`            | Focus selected entity       |
| `Delete`       | Delete selected entity      |
| `Escape`       | Cancel placement / deselect |
| `Ctrl+S`       | Save                        |
| `Ctrl+Z`       | Undo                        |
| `Ctrl+Shift+Z` | Redo                        |
| `Ctrl+D`       | Duplicate selected entity   |

## Schema Field Types

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `string`   | Text input                              |
| `number`   | Number input with optional min/max/step |
| `boolean`  | Checkbox                                |
| `vec3`     | Three-component vector (X, Y, Z)        |
| `enum`     | Dropdown from fixed options             |
| `assetRef` | Dropdown referencing an asset category  |
| `richtext` | Multi-line textarea                     |
| `object`   | Nested fields rendered recursively      |
| `array`    | List of items with add/remove/reorder   |
| `ref`      | Entity reference (planned)              |
| `ref[]`    | Entity reference array (planned)        |
| `enum[]`   | Multi-select enum (planned)             |

## License

MIT
