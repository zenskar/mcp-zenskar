import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { JobTable } from '../components/JobTable'
import type { JobTablePayload } from '../types'

const FALLBACK: JobTablePayload = { jobs: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<JobTablePayload>
        fallback={FALLBACK}
        readyMarker="job-table:mounted"
        render={(data) => <JobTable payload={data} />}
      />
    </StrictMode>
  )
}
