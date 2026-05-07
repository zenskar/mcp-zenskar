import type { RawMetricTablePayload } from '../types';

export const rawMetricFixture: RawMetricTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  raw_metrics: [
    { id: 'rm_001', name: 'API Calls', api_slug: 'api_calls', api_type: 'PUSH', status: 'active', description: 'Per-call billing event for /v1/* endpoints', created_at: '2024-09-15T08:00:00Z' },
    { id: 'rm_002', name: 'Storage Usage', api_slug: 'storage_gb', api_type: 'PUSH', status: 'active', description: 'GB-hours of object storage', created_at: '2024-09-15T08:00:00Z' },
    { id: 'rm_003', name: 'Pipeline Runs', api_slug: 'pipeline_runs', api_type: 'PULL', status: 'active', description: 'Successful CI pipeline runs per project', created_at: '2025-01-30T08:00:00Z' },
    { id: 'rm_004', name: 'Webhook Deliveries', api_slug: 'webhook_deliveries', api_type: 'PUSH', status: 'beta', description: 'Outbound webhook deliveries', created_at: '2026-02-01T08:00:00Z' },
    { id: 'rm_005', name: 'Legacy Page Views', api_slug: 'legacy_pageviews', api_type: 'PUSH', status: 'archived', description: 'Deprecated v1 pageview metric', created_at: '2023-11-01T08:00:00Z' },
  ],
};
