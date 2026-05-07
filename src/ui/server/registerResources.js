import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resourceUriFor, SHAPES } from './registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_UI = resolve(__dirname, '..', '..', '..', 'dist', 'ui');

function loadShapeHtml(shape) {
  const file = resolve(DIST_UI, `${shape}.html`);
  if (!existsSync(file)) {
    return `<!doctype html><html><body style="font-family:sans-serif;padding:16px;">UI bundle missing: ${shape}.html. Run <code>pnpm run build:ui</code>.</body></html>`;
  }
  return readFileSync(file, 'utf8');
}

function collectUiOrigins() {
  const origins = new Set();
  const add = (value) => {
    if (!value) return;
    try { origins.add(new URL(value).origin); } catch {}
  };
  add(process.env.ZENSKAR_MCP_PUBLIC_BASE_URL || process.env.MCP_PUBLIC_BASE_URL);
  add(process.env.ZENSKAR_API_BASE_URL);
  add(process.env.ZENSKAR_APP_BASE_URL);
  return Array.from(origins);
}

function buildResourceUiMeta() {
  const meta = { prefersBorder: true };
  const cspOrigins = collectUiOrigins();
  if (cspOrigins.length > 0) {
    meta.csp = { connectDomains: cspOrigins, resourceDomains: cspOrigins };
  }
  return meta;
}

export function registerUIResources(server) {
  for (const shape of SHAPES) {
    const uri = resourceUriFor(shape);
    server.registerResource(
      `zenskar-${shape}`,
      uri,
      {},
      async () => ({
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
      })
    );
  }
}
