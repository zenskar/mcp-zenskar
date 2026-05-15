import { defineConfig } from 'tsdown'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  entry: ['src/server.js'],
  outDir: 'dist',
  format: 'esm',
  target: 'node20',
  platform: 'node',
  minify: true,
  deps: {
    alwaysBundle: [/.*/],
  },
  outExtensions: () => ({ js: '.mjs' }),
  hooks: {
    'build:done': () => {
      copyFileSync('src/mcp-config.json', 'dist/mcp-config.json')
    },
  },
})
