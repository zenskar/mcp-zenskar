import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { ProductTable } from '../components/ProductTable'
import type { ProductTablePayload } from '../types'

const FALLBACK: ProductTablePayload = { products: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<ProductTablePayload>
        fallback={FALLBACK}
        readyMarker="product-table:mounted"
        render={(data) => <ProductTable payload={data} />}
      />
    </StrictMode>
  )
}
