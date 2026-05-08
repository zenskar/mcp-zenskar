import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { AggregateTable } from '../components/AggregateTable'
import type { AggregateTablePayload } from '../types'

const FALLBACK: AggregateTablePayload = { aggregates: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<AggregateTablePayload>
        fallback={FALLBACK}
        readyMarker="aggregate-table:mounted"
        render={(data) => <AggregateTable payload={data} />}
      />
    </StrictMode>
  )
}
