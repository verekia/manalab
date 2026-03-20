#!/usr/bin/env node
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { manalabConfigPlugin } from './vite-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const editorRoot = path.resolve(__dirname, '..')

async function main() {
  const projectRoot = process.cwd()

  const hasConfig =
    fs.existsSync(path.resolve(projectRoot, 'manalab.config.ts')) ||
    fs.existsSync(path.resolve(projectRoot, 'manalab.config.js'))

  if (!hasConfig) {
    console.error(
      '\x1b[31mMana Lab: No manalab.config.ts or manalab.config.js found.\x1b[0m'
    )
    console.error('Create a manalab.config.ts in your project root to configure the editor.')
    process.exit(1)
  }

  const server = await createServer({
    root: editorRoot,
    plugins: [react(), manalabConfigPlugin(projectRoot)],
    server: {
      port: 7320,
      open: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'three'],
    },
  })

  await server.listen()
  console.log('\x1b[35m')
  console.log('  MANA LAB')
  console.log('\x1b[0m')
  server.printUrls()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
