import type { EntitlementTablePayload } from '../types'

export const entitlementFixture: EntitlementTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  entitlements: [
    {
      id: 'ent_001',
      name: 'API Call Quota',
      entitlement_type: 'Quantity',
      units: 'calls',
      is_active: true,
      product_name: 'Pro Plan',
      created_at: '2024-09-15T08:00:00Z',
    },
    {
      id: 'ent_002',
      name: 'Storage Credits',
      entitlement_type: 'Credits',
      units: 'GB',
      is_active: true,
      product_name: 'Pro Plan',
      created_at: '2024-09-15T08:00:00Z',
    },
    {
      id: 'ent_003',
      name: 'Seats',
      entitlement_type: 'Quantity',
      units: 'seats',
      is_active: true,
      product_name: 'Team Plan',
      created_at: '2025-01-30T08:00:00Z',
    },
    {
      id: 'ent_004',
      name: 'Webhook Deliveries',
      entitlement_type: 'Quantity',
      units: 'deliveries',
      is_active: false,
      product_name: null,
      created_at: '2026-02-01T08:00:00Z',
    },
    {
      id: 'ent_005',
      name: 'Free Tier Credits',
      entitlement_type: 'Credits',
      units: null,
      is_active: false,
      product_name: 'Legacy Free',
      created_at: '2023-11-01T08:00:00Z',
    },
  ],
}
