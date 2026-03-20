import type { EditorProject } from './types'

export type ManalabConfig = Omit<EditorProject, 'version'>

export function defineConfig(config: ManalabConfig): ManalabConfig {
  return config
}
