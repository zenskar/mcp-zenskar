import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

// Build a single shape per invocation. The runner script (src/ui/server/build.mjs)
// iterates SHAPES and invokes vite once per shape so vite-plugin-singlefile can inline
// each entry without the multi-input/codeSplitting conflict.
const shape = process.env.UI_SHAPE || 'customer-table';

export default defineConfig(({ mode }) => ({
  root: 'src/ui',
  publicDir: false,
  plugins: [react(), tailwindcss(), viteSingleFile()],
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
}));
