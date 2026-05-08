import type { EntityTablePayload } from '../types'

export const entityFixture: EntityTablePayload = {
  total: 4,
  cursor: { next: null, prev: null },
  entities: [
    {
      id: 'be_001',
      name: 'Zenskar Inc.',
      code: 'ZK-US',
      country: 'US',
      default_currency: 'USD',
      status: 'active',
      created_at: '2023-09-01T08:00:00Z',
    },
    {
      id: 'be_002',
      name: 'Zenskar EU B.V.',
      code: 'ZK-EU',
      country: 'NL',
      default_currency: 'EUR',
      status: 'active',
      created_at: '2024-04-01T08:00:00Z',
    },
    {
      id: 'be_003',
      name: 'Zenskar India Pvt Ltd',
      code: 'ZK-IN',
      country: 'IN',
      default_currency: 'INR',
      status: 'active',
      created_at: '2023-11-01T08:00:00Z',
    },
    {
      id: 'be_004',
      name: 'Zenskar Sandbox',
      code: 'ZK-SB',
      country: 'US',
      default_currency: 'USD',
      status: 'sandbox',
      created_at: '2024-01-01T08:00:00Z',
    },
  ],
}
