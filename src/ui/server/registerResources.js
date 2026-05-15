import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resourceUriFor, SHAPES } from './registry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Dev: src/ui/server -> ../../../dist/ui. Bundled prod: dist/server -> ./ui.
const DIST_UI_CANDIDATES = [
  resolve(__dirname, '..', '..', '..', 'dist', 'ui'),
  resolve(__dirname, 'ui'),
]

function loadShapeHtml(shape) {
  for (const base of DIST_UI_CANDIDATES) {
    const file = resolve(base, `${shape}.html`)
    if (existsSync(file)) return readFileSync(file, 'utf8')
  }
  return `<!doctype html><html><body style="font-family:sans-serif;padding:16px;">UI bundle missing: ${shape}.html. Run <code>npm run build:ui</code>.</body></html>`
}

function collectUiOrigins() {
  const origins = new Set()
  const add = (value) => {
    if (!value) return
    try {
      origins.add(new URL(value).origin)
    } catch {}
  }
  add(
    process.env.ZENSKAR_MCP_PUBLIC_BASE_URL || process.env.MCP_PUBLIC_BASE_URL
  )
  add(process.env.ZENSKAR_API_BASE_URL)
  add(process.env.ZENSKAR_APP_BASE_URL)
  return Array.from(origins)
}

function buildResourceUiMeta() {
  const meta = { prefersBorder: true }
  const cspOrigins = collectUiOrigins()
  if (cspOrigins.length > 0) {
    meta.csp = { connectDomains: cspOrigins, resourceDomains: cspOrigins }
  }
  return meta
}

export function registerUIResources(server) {
  // Single shared bundle (Phase 2): one HTML resource serves all shapes.
  for (const shape of SHAPES) {
    const uri = resourceUriFor(shape)
    server.registerResource(`zenskar-app`, uri, {}, async () => ({
      contents: [
        {
          uri,
          mimeType: 'text/html;profile=mcp-app',
          text: loadShapeHtml(shape),
          _meta: {
            'openai/widgetPrefersBorder': true,
            ui: buildResourceUiMeta(),
          },
        },
      ],
    }))
  }
}
