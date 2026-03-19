import { LayerTypeDef } from '../state/types'

export const colliderLayerType: LayerTypeDef = {
  label: 'Collider',
  icon: '🔷',
  description: 'Physics collision volumes',
  renderMode: 'wireframe',
  entitySchema: {
    shape: { type: 'enum', options: ['cylinder', 'box'], label: 'Shape', default: 'cylinder' },
    position: { type: 'vec3', label: 'Position', default: [0, 0, 0] },
    rotation: { type: 'vec3', label: 'Rotation (rad)', default: [0, 0, 0] },
    dimensions: { type: 'vec3', label: 'Dimensions (r/w, h, r/d)', default: [1, 2, 1] },
  },
}
