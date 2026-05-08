import '../client/theme.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { Shell } from '../client/Shell'
import { ContactTable } from '../components/ContactTable'
import type { ContactTablePayload } from '../types'

const FALLBACK: ContactTablePayload = { contacts: [], total: 0 }

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<ContactTablePayload>
        fallback={FALLBACK}
        readyMarker="contact-table:mounted"
        render={(data) => <ContactTable payload={data} />}
      />
    </StrictMode>
  )
}
