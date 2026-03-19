import { LayerTypeDef } from '../state/types'

export const decorationLayerType: LayerTypeDef = {
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
}
