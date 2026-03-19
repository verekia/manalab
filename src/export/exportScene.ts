import { Entity, LayerRef, LayerData, EditorProject } from '../state/types'

export interface ExportedLayer {
  scene: string
  layer: string
  type: string
  entities: Entity[]
}

export function exportLayerJSON(
  sceneId: string,
  layerId: string,
  layerType: string,
  entities: Entity[]
): ExportedLayer {
  return {
    scene: sceneId,
    layer: layerId,
    type: layerType,
    entities: entities.map((e) => ({ ...e })),
  }
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAllLayers(
  sceneId: string,
  layers: LayerRef[],
  layerDataMap: Record<string, LayerData>
) {
  for (const layer of layers) {
    const ld = layerDataMap[layer.id]
    if (!ld) continue
    const exported = exportLayerJSON(sceneId, layer.id, layer.type, ld.entities)
    downloadJSON(exported, `${layer.id}.json`)
  }
}

export function downloadProjectZip(
  project: EditorProject,
  sceneLayers: Record<string, Record<string, LayerData>>
) {
  // Simple ZIP-less approach: download each file individually
  // For v1, just download editor.json and all layer files

  // Download editor.json (without entity data)
  downloadJSON(project, 'editor.json')

  // Download all layer data files
  for (const [sceneId, layers] of Object.entries(sceneLayers)) {
    for (const [layerId, layerData] of Object.entries(layers)) {
      const sceneDef = project.scenes[sceneId]
      const layerRef = sceneDef?.layers.find((l) => l.id === layerId)
      const type = layerRef?.type || layerData.type
      const exported = exportLayerJSON(sceneId, layerId, type, layerData.entities)
      downloadJSON(exported, `${sceneId}_${layerId}.json`)
    }
  }
}
