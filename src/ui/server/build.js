#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..', '..')
const DIST_UI = resolve(ROOT, 'dist', 'ui')
const TMP = resolve(ROOT, 'dist', 'ui-tmp')

const SHAPES = ['app']

mkdirSync(DIST_UI, { recursive: true })

for (const shape of SHAPES) {
  console.log(`\n== building ${shape} ==`)
  const res = spawnSync(
    'npx',
    ['--no-install', 'vite', 'build', '--config', 'vite.config.ts'],
    {
      cwd: ROOT,
      env: { ...process.env, UI_SHAPE: shape },
      stdio: 'inherit',
    }
  )
  if (res.status !== 0) {
    console.error(`build failed for ${shape}`)
    process.exit(res.status || 1)
  }

  // vite-plugin-singlefile + root: 'src/ui' produces TMP/shapes/<shape>.html
  const candidates = [
    resolve(TMP, 'shapes', `${shape}.html`),
    resolve(TMP, `${shape}.html`),
  ]
  const src = candidates.find((p) => existsSync(p))
  if (!src) {
    console.error(`output not found for ${shape}; looked in:`, candidates)
    process.exit(1)
  }
  const dst = resolve(DIST_UI, `${shape}.html`)
  if (existsSync(dst)) rmSync(dst)
  renameSync(src, dst)

  const fs = await import('node:fs')
  const html = fs.readFileSync(dst, 'utf8')
  console.log(`✓ ${shape}.html (${(html.length / 1024).toFixed(1)} KB)`)
}

rmSync(TMP, { recursive: true, force: true })
console.log(`\nemitted ${SHAPES.length} shapes → ${DIST_UI}`)
