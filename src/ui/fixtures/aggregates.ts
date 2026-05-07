import type { AggregateTablePayload } from '../types';

export const aggregateFixture: AggregateTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  aggregates: [
    { id: 'agg_001', name: 'Monthly API Calls', datasource: 'api_calls', status: 'active', formula: 'SUM(usage_amount)', unit: 'requests', last_run_at: '2026-05-07T03:00:00Z', created_at: '2024-09-20T08:00:00Z' },
    { id: 'agg_002', name: 'Peak Storage', datasource: 'storage_gb', status: 'active', formula: 'MAX(usage_amount)', unit: 'GB', last_run_at: '2026-05-07T03:00:00Z', created_at: '2024-09-20T08:00:00Z' },
    { id: 'agg_003', name: 'Daily Pipeline Runs', datasource: 'pipeline_runs', status: 'active', formula: 'COUNT(*)', unit: 'runs', last_run_at: '2026-05-07T00:00:00Z', created_at: '2025-02-01T08:00:00Z' },
    { id: 'agg_004', name: 'Webhook Errors', datasource: 'webhook_deliveries', status: 'active', formula: 'COUNT_IF(status=\'failed\')', unit: 'errors', last_run_at: '2026-05-07T03:00:00Z', created_at: '2026-02-05T08:00:00Z' },
    { id: 'agg_005', name: 'Legacy Aggregator', datasource: 'legacy_pageviews', status: 'paused', formula: 'SUM(usage_amount)', unit: 'views', last_run_at: '2025-08-01T03:00:00Z', created_at: '2023-11-02T08:00:00Z' },
  ],
};
