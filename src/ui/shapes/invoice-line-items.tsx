import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { InvoiceLineItems } from '../components/InvoiceLineItems'
import type { InvoiceLineItemsPayload } from '../types'

const FALLBACK: InvoiceLineItemsPayload = { lines: [] }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<InvoiceLineItemsPayload>
        fallback={FALLBACK}
        readyMarker="invoice-line-items:mounted"
        render={(data) => <InvoiceLineItems payload={data} />}
      />
    </StrictMode>
  )
}
