import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'tsdown'

const root = import.meta.dirname

export default defineConfig({
  entry: { server: 'src/server.js' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  shims: false,
  clean: false,
  noExternal: [/.*/],
  treeshake: true,
  sourcemap: false,
  minify: true,
  dts: false,
  hooks: {
    'build:done': () => {
      copyFileSync(
        resolve(root, 'src/mcp-config.json'),
        resolve(root, 'dist/mcp-config.json')
      )
    },
  },
})
