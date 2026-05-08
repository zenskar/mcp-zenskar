import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { InvoiceTable } from '../components/InvoiceTable'
import type { InvoiceTablePayload } from '../types'

const FALLBACK: InvoiceTablePayload = { invoices: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<InvoiceTablePayload>
        fallback={FALLBACK}
        readyMarker="invoice-table:mounted"
        render={(data) => <InvoiceTable payload={data} />}
      />
    </StrictMode>
  )
}
