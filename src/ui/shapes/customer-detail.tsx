import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { CustomerDetail } from '../components/CustomerDetail'
import type { CustomerDetailPayload } from '../types'

const FALLBACK: CustomerDetailPayload = {
  customer: { id: '', name: null, external_id: null, email: null },
}

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<CustomerDetailPayload>
        fallback={FALLBACK}
        readyMarker="customer-detail:mounted"
        render={(data) => <CustomerDetail payload={data} />}
      />
    </StrictMode>
  )
}
