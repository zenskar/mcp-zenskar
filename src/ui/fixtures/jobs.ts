import type { JobTablePayload } from '../types';

export const jobFixture: JobTablePayload = {
  total: 6,
  cursor: { next: null, prev: null },
  status_counts: { completed: 3, running: 1, failed: 1, queued: 1 },
  jobs: [
    { id: 'job_001', type: 'invoice_generation', status: 'completed', started_at: '2026-05-05T08:00:00Z', completed_at: '2026-05-05T08:01:42Z', duration_ms: 102000, error: null, created_at: '2026-05-05T08:00:00Z' },
    { id: 'job_002', type: 'revenue_recognition', status: 'completed', started_at: '2026-05-04T22:00:00Z', completed_at: '2026-05-04T22:14:08Z', duration_ms: 848000, error: null, created_at: '2026-05-04T22:00:00Z' },
    { id: 'job_003', type: 'metric_aggregation', status: 'running', started_at: '2026-05-07T13:00:00Z', completed_at: null, duration_ms: null, error: null, created_at: '2026-05-07T13:00:00Z' },
    { id: 'job_004', type: 'invoice_email_dispatch', status: 'failed', started_at: '2026-05-06T09:00:00Z', completed_at: '2026-05-06T09:00:11Z', duration_ms: 11000, error: 'SMTP_AUTH_FAILED: rejected sender', created_at: '2026-05-06T09:00:00Z' },
    { id: 'job_005', type: 'cdc_export', status: 'completed', started_at: '2026-05-07T03:00:00Z', completed_at: '2026-05-07T03:08:22Z', duration_ms: 502000, error: null, created_at: '2026-05-07T03:00:00Z' },
    { id: 'job_006', type: 'dunning_run', status: 'queued', started_at: null, completed_at: null, duration_ms: null, error: null, created_at: '2026-05-07T13:30:00Z' },
  ],
};
