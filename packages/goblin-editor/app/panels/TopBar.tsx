import { EditorState } from '../state/types'
import { EditorAction } from '../state/actions'

interface TopBarProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  onSave: () => void
}

export default function TopBar({ state, dispatch, onSave }: TopBarProps) {
  const { ui, past, future, present } = state
  const scenes = Object.entries(present.project.scenes)

  return (
    <div className="topbar">
      <div className="topbar-title">GOBLIN EDITOR</div>

      <div className="topbar-group">
        <select
          className="topbar-select"
          value={ui.currentSceneId}
          onChange={(e) => dispatch({ type: 'SWITCH_SCENE', sceneId: e.target.value })}
        >
          {scenes.map(([id, scene]) => (
            <option key={id} value={id}>{scene.name}</option>
          ))}
        </select>
      </div>

      <div className="topbar-separator" />

      <div className="topbar-group">
        <button
          className={`topbar-btn ${ui.transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'translate' })}
          title="Translate (W)"
        >
          W Move
        </button>
        <button
          className={`topbar-btn ${ui.transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'rotate' })}
          title="Rotate (E)"
        >
          E Rot
        </button>
        <button
          className={`topbar-btn ${ui.transformMode === 'scale' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TRANSFORM_MODE', mode: 'scale' })}
          title="Scale (R)"
        >
          R Scl
        </button>
      </div>

      <div className="topbar-separator" />

      <div className="topbar-group">
        <button
          className="topbar-btn"
          disabled={past.length === 0}
          onClick={() => dispatch({ type: 'UNDO' })}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          className="topbar-btn"
          disabled={future.length === 0}
          onClick={() => dispatch({ type: 'REDO' })}
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
      </div>

      <div className="topbar-separator" />

      <div className="save-indicator-group">
        <span className={`save-indicator ${ui.dirty ? 'unsaved' : 'saved'}`}>
          {ui.dirty ? 'Unsaved changes' : 'Saved'}
        </span>
        {ui.dirty && (
          <button className="topbar-btn save-btn" onClick={onSave} title="Save (Ctrl+S)">
            Save
          </button>
        )}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-group">
        <button
          className={`topbar-btn ${ui.showStageEditor ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_STAGE_EDITOR' })}
        >
          Stage
        </button>
        <button
          className="topbar-btn accent"
          onClick={() => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })}
        >
          Export
        </button>
      </div>
    </div>
  )
}
