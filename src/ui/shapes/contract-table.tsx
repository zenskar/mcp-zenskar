import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { ContractTable } from '../components/ContractTable'
import type { ContractTablePayload } from '../types'

const FALLBACK: ContractTablePayload = { contracts: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<ContractTablePayload>
        fallback={FALLBACK}
        readyMarker="contract-table:mounted"
        render={(data) => <ContractTable payload={data} />}
      />
    </StrictMode>
  )
}
