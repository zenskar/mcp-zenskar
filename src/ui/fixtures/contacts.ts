import type { ContactTablePayload } from '../types'

export const contactFixture: ContactTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  contacts: [
    {
      id: 'ct_001',
      name: 'Jane Doe',
      email: 'jane@acme.example',
      customer_id: 'c_001',
      send_invoice: true,
      send_contract: true,
    },
    {
      id: 'ct_002',
      name: 'John Roe',
      email: 'john@acme.example',
      customer_id: 'c_001',
      send_invoice: true,
      send_contract: false,
    },
    {
      id: 'ct_003',
      name: 'Maria Garcia',
      email: 'maria@globex.example',
      customer_id: 'c_002',
      send_invoice: true,
      send_contract: true,
    },
    {
      id: 'ct_004',
      name: 'Vikram Patel',
      email: 'vikram@initech.example',
      customer_id: 'c_003',
      send_invoice: true,
      send_contract: true,
    },
    {
      id: 'ct_005',
      name: 'Sora Tanaka',
      email: null,
      customer_id: 'c_010',
      send_invoice: false,
      send_contract: false,
    },
  ],
}
