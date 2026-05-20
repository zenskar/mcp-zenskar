import type { RawMetricTablePayload } from '../types'

export const rawMetricFixture: RawMetricTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  raw_metrics: [
    {
      id: 'rm_001',
      name: 'API Calls',
      api_slug: 'api_calls',
      usage_upload_enabled: true,
      created_at: '2024-09-15T08:00:00Z',
    },
    {
      id: 'rm_002',
      name: 'Storage Usage',
      api_slug: 'storage_gb',
      usage_upload_enabled: true,
      created_at: '2024-09-15T08:00:00Z',
    },
    {
      id: 'rm_003',
      name: 'Pipeline Runs',
      api_slug: 'pipeline_runs',
      usage_upload_enabled: true,
      created_at: '2025-01-30T08:00:00Z',
    },
    {
      id: 'rm_004',
      name: 'Webhook Deliveries',
      api_slug: 'webhook_deliveries',
      usage_upload_enabled: false,
      created_at: '2026-02-01T08:00:00Z',
    },
    {
      id: 'rm_005',
      name: 'Legacy Page Views',
      api_slug: 'legacy_pageviews',
      usage_upload_enabled: false,
      created_at: '2023-11-01T08:00:00Z',
    },
  ],
}
