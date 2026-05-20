import type { PlanTablePayload } from '../types'

export const planFixture: PlanTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  plans: [
    {
      id: 'plan_001',
      name: 'Starter Annual',
      description: 'Entry tier — annual commitment',
      status: 'active',
      plan_version: 1,
      created_at: '2024-08-01T08:00:00Z',
    },
    {
      id: 'plan_002',
      name: 'Growth Monthly',
      description: 'Monthly subscription',
      status: 'active',
      plan_version: 2,
      created_at: '2024-08-01T08:00:00Z',
    },
    {
      id: 'plan_003',
      name: 'Enterprise Custom',
      description: 'Custom multi-phase contract',
      status: 'active',
      plan_version: 3,
      created_at: '2024-08-01T08:00:00Z',
    },
    {
      id: 'plan_004',
      name: 'Pilot 90-day',
      description: null,
      status: 'draft',
      plan_version: null,
      created_at: '2026-04-15T08:00:00Z',
    },
    {
      id: 'plan_005',
      name: 'Legacy Tier 1',
      description: 'Sunset 2024',
      status: 'archived',
      plan_version: 1,
      created_at: '2023-02-01T08:00:00Z',
    },
  ],
}
