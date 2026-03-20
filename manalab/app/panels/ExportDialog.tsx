import { useState } from 'react'
import { EditorState } from '../state/types'
import { EditorAction } from '../state/actions'
import { exportLayerJSON, downloadAllLayers, downloadProjectZip } from '../export/exportScene'

interface ExportDialogProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export default function ExportDialog({ state, dispatch }: ExportDialogProps) {
  const { ui, present } = state
  const sceneId = ui.currentSceneId
  const sceneDef = present.project.scenes[sceneId]
  if (!sceneDef) return null

  const layerDataMap = present.sceneLayers[sceneId] || {}
  const [selectedLayers, setSelectedLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(sceneDef.layers.map((l) => [l.id, true]))
  )
  const [preview, setPreview] = useState<string | null>(null)

  const toggleLayer = (id: string) => {
    setSelectedLayers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handlePreview = () => {
    const selected = sceneDef.layers.filter((l) => selectedLayers[l.id])
    if (selected.length === 0) return
    const first = selected[0]
    const ld = layerDataMap[first.id]
    if (!ld) return
    setPreview(JSON.stringify(exportLayerJSON(sceneId, first.id, first.type, ld.entities), null, 2))
  }

  const handleDownload = () => {
    const selected = sceneDef.layers.filter((l) => selectedLayers[l.id])
    downloadAllLayers(sceneId, selected, layerDataMap)
  }

  const handleSaveProject = () => {
    downloadProjectZip(present.project, present.sceneLayers)
  }

  const handleCopy = () => {
    const selected = sceneDef.layers.filter((l) => selectedLayers[l.id])
    if (selected.length === 0) return
    const first = selected[0]
    const ld = layerDataMap[first.id]
    if (!ld) return
    const json = JSON.stringify(exportLayerJSON(sceneId, first.id, first.type, ld.entities), null, 2)
    navigator.clipboard.writeText(json)
  }

  const close = () => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">EXPORT</div>
        <div className="export-body">
          <div className="export-scene-name">Scene: {sceneDef.name}</div>

          <div className="export-layers-title">Layers to export:</div>
          {sceneDef.layers.map((layer) => {
            const ld = layerDataMap[layer.id]
            const count = ld?.entities.length ?? 0
            return (
              <label key={layer.id} className="export-layer-check">
                <input
                  type="checkbox"
                  checked={!!selectedLayers[layer.id]}
                  onChange={() => toggleLayer(layer.id)}
                />
                {layer.name} ({count} entities)
              </label>
            )
          })}

          <div className="export-actions">
            <button className="export-btn" onClick={handlePreview}>Preview</button>
            <button className="export-btn accent" onClick={handleDownload}>Download All</button>
            <button className="export-btn" onClick={handleCopy}>Copy to Clipboard</button>
          </div>

          <button className="export-btn save" onClick={handleSaveProject}>
            Save Full Project (ZIP)
          </button>

          {preview && (
            <pre className="export-preview">{preview}</pre>
          )}
        </div>
        <button className="modal-close" onClick={close}>Close</button>
      </div>
    </div>
  )
}
