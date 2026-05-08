import { resolve } from 'node:path'

import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single shared bundle (Phase 2 of bundle reduction). The runner script
// (src/ui/server/build.mjs) invokes vite once with UI_SHAPE=app.
const shape = process.env.UI_SHAPE || 'app'

export default defineConfig(({ mode }) => ({
  root: 'src/ui',
  publicDir: false,
  plugins: [preact(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: '../../dist/ui-tmp',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: { [shape]: resolve(__dirname, `src/ui/shapes/${shape}.html`) },
    },
    target: 'es2022',
    minify: mode === 'production',
    sourcemap: false,
  },
  server: { port: 5173, open: '/dev/index.html' },
}))
