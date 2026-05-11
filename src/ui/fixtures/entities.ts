import type { EntityTablePayload } from '../types'

export const entityFixture: EntityTablePayload = {
  total: 4,
  cursor: { next: null, prev: null },
  entities: [
    {
      id: 'be_001',
      name: 'Zenskar Inc.',
      email: 'billing@zenskar.com',
      phone_number: '+14155550100',
      country: 'United States',
      is_default: true,
    },
    {
      id: 'be_002',
      name: 'Zenskar EU B.V.',
      email: null,
      phone_number: null,
      country: 'Netherlands',
      is_default: false,
    },
    {
      id: 'be_003',
      name: 'Zenskar India Pvt Ltd',
      email: null,
      phone_number: '+911234567890',
      country: 'India',
      is_default: false,
    },
    {
      id: 'be_004',
      name: 'Zenskar Sandbox',
      email: null,
      phone_number: null,
      country: 'United States',
      is_default: false,
    },
  ],
}
