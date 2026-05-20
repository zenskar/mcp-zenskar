import type { EntityTablePayload } from '../types'

export const entityFixture: EntityTablePayload = {
  total: 4,
  cursor: { next: null, prev: null },
  entities: [
    {
      id: 'be_001',
      name: 'Acme Inc.',
      email: 'billing@acme.example',
      phone_number: '+14155550100',
      country: 'United States',
      is_default: true,
    },
    {
      id: 'be_002',
      name: 'Acme EU B.V.',
      email: null,
      phone_number: null,
      country: 'Netherlands',
      is_default: false,
    },
    {
      id: 'be_003',
      name: 'Acme India Pvt Ltd',
      email: null,
      phone_number: '+911234567890',
      country: 'India',
      is_default: false,
    },
    {
      id: 'be_004',
      name: 'Acme Sandbox',
      email: null,
      phone_number: null,
      country: 'United States',
      is_default: false,
    },
  ],
}
