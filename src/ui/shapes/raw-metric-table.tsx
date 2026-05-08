import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { RawMetricTable } from '../components/RawMetricTable'
import type { RawMetricTablePayload } from '../types'

const FALLBACK: RawMetricTablePayload = { raw_metrics: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<RawMetricTablePayload>
        fallback={FALLBACK}
        readyMarker="raw-metric-table:mounted"
        render={(data) => <RawMetricTable payload={data} />}
      />
    </StrictMode>
  )
}
