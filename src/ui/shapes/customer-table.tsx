import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { CustomerTable } from '../components/CustomerTable'
import type { CustomerTablePayload } from '../types'

const FALLBACK: CustomerTablePayload = { customers: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<CustomerTablePayload>
        fallback={FALLBACK}
        readyMarker="customer-table:mounted"
        render={(data) => <CustomerTable payload={data} />}
      />
    </StrictMode>
  )
}
