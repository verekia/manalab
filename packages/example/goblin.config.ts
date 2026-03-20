import { defineConfig } from 'goblin-editor'

export default defineConfig({
  assetLibrary: {
    decorations: {
      oak_tree: { label: 'Oak Tree', tags: ['tree', 'forest'] },
      pine_tree: { label: 'Pine Tree', tags: ['tree', 'forest'] },
      rock_large: { label: 'Large Rock', tags: ['rock'] },
      rock_small: { label: 'Small Rock', tags: ['rock'] },
      bush: { label: 'Bush', tags: ['vegetation'] },
      palm_tree: { label: 'Palm Tree', tags: ['tree', 'tropical'] },
    },
  },
  scenes: {
    island_overworld: {
      name: 'Island Overworld',
      stage: {
        lighting: {
          ambientColor: '#c4a882',
          ambientIntensity: 0.6,
          sunColor: '#fff5e6',
          sunIntensity: 1.2,
          sunDirection: [-0.5, -1, -0.3],
        },
        backdrops: [
          {
            id: 'ocean_plane',
            name: 'Ocean',
            type: 'plane',
            size: [200, 200],
            color: '#1a6b8a',
            opacity: 0.85,
            position: [0, -0.2, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        ],
        camera: {
          defaultPosition: [20, 15, 20],
          defaultTarget: [0, 0, 0],
        },
        grid: {
          size: 100,
          divisions: 100,
          visible: true,
        },
      },
      layers: [
        {
          id: 'decorations',
          name: 'Decorations',
          type: 'decoration',
          visible: true,
          file: 'decorations.json',
        },
        {
          id: 'colliders',
          name: 'Colliders',
          type: 'collider',
          visible: true,
          file: 'colliders.json',
        },
        {
          id: 'quests',
          name: 'Quests',
          type: 'quest',
          visible: true,
          file: 'quests.json',
        },
      ],
    },
  },
  layerTypes: {
    decoration: {
      label: 'Decoration',
      icon: '🌿',
      description: 'Visual props and environment art',
      renderMode: 'gltf',
      entitySchema: {
        asset: { type: 'assetRef', category: 'decorations', label: 'Asset' },
        position: { type: 'vec3', label: 'Position', default: [0, 0, 0] },
        rotation: { type: 'vec3', label: 'Rotation (rad)', default: [0, 0, 0] },
        scale: { type: 'vec3', label: 'Scale', default: [1, 1, 1] },
      },
    },
    collider: {
      label: 'Collider',
      icon: '🔷',
      description: 'Physics collision volumes',
      renderMode: 'wireframe',
      entitySchema: {
        shape: {
          type: 'enum',
          options: ['cylinder', 'box'],
          label: 'Shape',
          default: 'cylinder',
        },
        position: { type: 'vec3', label: 'Position', default: [0, 0, 0] },
        rotation: { type: 'vec3', label: 'Rotation (rad)', default: [0, 0, 0] },
        dimensions: {
          type: 'vec3',
          label: 'Dimensions (r/w, h, r/d)',
          default: [1, 2, 1],
        },
      },
    },
    quest: {
      label: 'Quest',
      icon: '✨',
      description: 'Quest definitions with steps',
      renderMode: 'markers',
      entitySchema: {
        name: { type: 'string', label: 'Quest Name', default: 'New Quest' },
        position: { type: 'vec3', label: 'Start Point', default: [0, 0, 0] },
        endPoint: { type: 'vec3', label: 'End Point', default: [5, 0, 5] },
        steps: {
          type: 'array',
          label: 'Steps',
          itemPositionField: 'waypoint',
          itemFields: {
            waypoint: { type: 'vec3', label: 'Waypoint', default: [0, 0, 0] },
            goal: { type: 'string', label: 'Goal', default: '' },
            dialogue: { type: 'richtext', label: 'Dialogue', default: '' },
          },
        },
      },
    },
  },
})
