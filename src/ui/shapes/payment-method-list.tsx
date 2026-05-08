import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { PaymentMethodList } from '../components/PaymentMethodList'
import type { PaymentMethodListPayload } from '../types'

const FALLBACK: PaymentMethodListPayload = { payment_methods: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<PaymentMethodListPayload>
        fallback={FALLBACK}
        readyMarker="payment-method-list:mounted"
        render={(data) => <PaymentMethodList payload={data} />}
      />
    </StrictMode>
  )
}
