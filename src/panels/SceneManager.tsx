import { EditorState } from '../state/types'
import { EditorAction } from '../state/actions'

interface SceneManagerProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

// Scene management is handled via the TopBar scene selector for v1.
// This component is a placeholder for future scene create/rename/delete UI.
export default function SceneManager({ state, dispatch }: SceneManagerProps) {
  const scenes = Object.entries(state.present.project.scenes)

  return (
    <div className="panel-section">
      <div className="panel-header">SCENES</div>
      <div className="palette-list">
        {scenes.map(([id, scene]) => (
          <button
            key={id}
            className={`palette-item ${id === state.ui.currentSceneId ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SWITCH_SCENE', sceneId: id })}
          >
            {scene.name}
          </button>
        ))}
      </div>
    </div>
  )
}
