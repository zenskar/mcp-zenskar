import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { PaymentTable } from '../components/PaymentTable'
import type { PaymentTablePayload } from '../types'

const FALLBACK: PaymentTablePayload = { payments: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<PaymentTablePayload>
        fallback={FALLBACK}
        readyMarker="payment-table:mounted"
        render={(data) => <PaymentTable payload={data} />}
      />
    </StrictMode>
  )
}
