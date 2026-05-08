#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SHAPES_DIR = resolve(ROOT, 'src', 'ui', 'shapes')

const SHAPES = [
  'customer-table',
  'invoice-table',
  'invoice-line-items',
  'payment-table',
  'credit-note-table',
  'contract-table',
  'customer-detail',
  'invoice-detail',
  'contract-detail',
  'credit-note-detail',
  'product-table',
  'plan-table',
  'journal-table',
  'job-table',
  'contact-table',
  'raw-metric-table',
  'aggregate-table',
  'address-list',
  'payment-method-list',
  'entity-table',
]

function template(shape) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${shape}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${shape}.tsx"></script>
  </body>
</html>
`
}

export function genAllShapeHtml() {
  mkdirSync(SHAPES_DIR, { recursive: true })
  for (const shape of SHAPES) {
    writeFileSync(resolve(SHAPES_DIR, `${shape}.html`), template(shape), 'utf8')
  }
  return SHAPES.length
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const count = genAllShapeHtml()
  console.log(`generated ${count} shape stubs in ${SHAPES_DIR}`)
}

export { SHAPES }
