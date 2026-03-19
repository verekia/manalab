import type { EditorProject } from './types'

export type GoblinConfig = Omit<EditorProject, 'version'>

export function defineConfig(config: GoblinConfig): GoblinConfig {
  return config
}
