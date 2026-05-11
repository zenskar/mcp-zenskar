import type { ContractDetailPayload } from '../types'

export const contractDetailFixture: ContractDetailPayload = {
  contract: {
    id: 'ctr_001',
    name: 'ACME Master Services Agreement',
    customer_id: 'c_001',
    status: 'active',
    currency: 'USD',
    start_date: '2024-11-02',
    end_date: '2026-11-01',
    created_at: '2024-11-02T08:00:00Z',
    description: 'Includes platform tier upgrade after Q2 2026.',
    custom_attributes: { signed_by: 'jane@acme.example', region: 'NA' },
    renewal_policy: 'auto-renew-12m',
    anchor_date: '2024-11-02',
    plan_id: 'plan_001',
  },
  phases: [
    {
      id: 'ph_1',
      name: 'Year 1 Standard',
      start_date: '2024-11-02',
      end_date: '2025-11-01',
      pricing_summary: 'Flat $9,450/mo + usage',
      product_count: 2,
    },
    {
      id: 'ph_2',
      name: 'Year 2 Expansion',
      start_date: '2025-11-02',
      end_date: '2026-05-01',
      pricing_summary: 'Flat $12,450/mo + usage',
      product_count: 3,
    },
    {
      id: 'ph_3',
      name: 'Year 2 Premium',
      start_date: '2026-05-02',
      end_date: '2026-11-01',
      pricing_summary: 'Flat $14,950/mo + premium add-ons',
      product_count: 4,
    },
  ],
}
