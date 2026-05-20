import type { AggregateTablePayload } from '../types'

export const aggregateFixture: AggregateTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  aggregates: [
    {
      id: 'agg_001',
      name: 'Monthly API Calls',
      datasource: '00000000-0000-0000-0000-000000000000',
      created_at: '2024-09-20T08:00:00Z',
    },
    {
      id: 'agg_002',
      name: 'Peak Storage',
      datasource: '00000000-0000-0000-0000-000000000000',
      created_at: '2024-09-20T08:00:00Z',
    },
    {
      id: 'agg_003',
      name: 'Daily Pipeline Runs',
      datasource: '00000000-0000-0000-0000-000000000000',
      created_at: '2025-02-01T08:00:00Z',
    },
    {
      id: 'agg_004',
      name: 'Webhook Errors',
      datasource: '00000000-0000-0000-0000-000000000000',
      created_at: '2026-02-05T08:00:00Z',
    },
    {
      id: 'agg_005',
      name: 'Legacy Aggregator',
      datasource: '00000000-0000-0000-0000-000000000000',
      created_at: '2023-11-02T08:00:00Z',
    },
  ],
}
