import { decorationLayerType } from './decorationSchema'
import { colliderLayerType } from './colliderSchema'
import { LayerTypeDef } from '../state/types'

export const layerTypeRegistry: Record<string, LayerTypeDef> = {
  decoration: decorationLayerType,
  collider: colliderLayerType,
}
