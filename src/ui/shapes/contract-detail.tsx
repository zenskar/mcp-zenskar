import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { ContractDetail } from '../components/ContractDetail'
import type { ContractDetailPayload } from '../types'

const FALLBACK: ContractDetailPayload = {
  contract: {
    id: '',
    external_id: null,
    customer_id: null,
    name: null,
    status: null,
    start_date: null,
    end_date: null,
    mrr: null,
    total_value: null,
    phase_count: null,
    created_at: null,
  },
  phases: [],
}

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<ContractDetailPayload>
        fallback={FALLBACK}
        readyMarker="contract-detail:mounted"
        render={(data) => <ContractDetail payload={data} />}
      />
    </StrictMode>
  )
}
