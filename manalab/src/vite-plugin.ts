import type { Plugin, ViteDevServer } from 'vite'
import path from 'path'
import fs from 'fs'

export function manalabConfigPlugin(projectRoot: string): Plugin {
  const sceneDataDir = path.resolve(projectRoot, 'scene-data')

  return {
    name: 'manalab-config',

    resolveId(id) {
      if (id === 'virtual:manalab-config') {
        return '\0virtual:manalab-config'
      }
    },

    load(id) {
      if (id === '\0virtual:manalab-config') {
        const tsPath = path.resolve(projectRoot, 'manalab.config.ts')
        const jsPath = path.resolve(projectRoot, 'manalab.config.js')
        const configPath = fs.existsSync(tsPath) ? tsPath : jsPath

        if (!fs.existsSync(configPath)) {
          throw new Error(
            `Mana Lab: No manalab.config.ts or manalab.config.js found in ${projectRoot}`
          )
        }

        return `export { default as config } from '${configPath}'`
      }
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        // GET /api/load-layer?file=decorations.json
        if (req.method === 'GET' && req.url.startsWith('/api/load-layer')) {
          const url = new URL(req.url, 'http://localhost')
          const file = url.searchParams.get('file')
          if (!file) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing file parameter' }))
            return
          }

          const filePath = path.resolve(sceneDataDir, file)

          // Prevent path traversal
          if (!filePath.startsWith(sceneDataDir)) {
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid path' }))
            return
          }

          if (fs.existsSync(filePath)) {
            try {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(data))
            } catch {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ entities: [] }))
            }
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ entities: [] }))
          }
          return
        }

        // POST /api/save-layers
        if (req.method === 'POST' && req.url === '/api/save-layers') {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { layers } = JSON.parse(body) as {
                layers: Array<{ file: string; data: unknown }>
              }

              for (const layer of layers) {
                const filePath = path.resolve(sceneDataDir, layer.file)

                // Prevent path traversal
                if (!filePath.startsWith(sceneDataDir)) continue

                const dir = path.dirname(filePath)
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true })
                }

                fs.writeFileSync(filePath, JSON.stringify(layer.data, null, 2) + '\n')
              }

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        next()
      })
    },
  }
}
