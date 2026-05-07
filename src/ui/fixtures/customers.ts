import type { CustomerTablePayload } from '../types';

export const customerFixture: CustomerTablePayload = {
  total: 12,
  scope: 'recently created',
  cursor: { next: 'eyJjdXJzb3IiOiJuZXh0In0=', prev: null },
  customers: [
    { id: 'c_001', name: 'ACME Corp', external_id: 'ACME-100', email: 'billing@acme.example', invoice_count: 4, mrr: { amount: 12450, currency: 'USD' }, outstanding: { amount: 2400, currency: 'USD' }, status: 'active', last_activity_at: '2026-05-04T10:30:00Z', created_at: '2024-11-02T08:00:00Z' },
    { id: 'c_002', name: 'Globex Inc', external_id: 'GLOBEX-44', email: 'finance@globex.example', invoice_count: 2, mrr: { amount: 4800, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'active', last_activity_at: '2026-05-05T14:00:00Z', created_at: '2025-02-19T08:00:00Z' },
    { id: 'c_003', name: 'Initech', external_id: 'INI-12', email: 'ap@initech.example', invoice_count: 1, mrr: { amount: 1200, currency: 'USD' }, outstanding: { amount: 1200, currency: 'USD' }, status: 'active', last_activity_at: '2026-04-30T09:00:00Z', created_at: '2025-04-22T08:00:00Z' },
    { id: 'c_004', name: 'Hooli', external_id: 'HOO-7', email: null, invoice_count: 0, mrr: null, outstanding: { amount: 0, currency: 'USD' }, status: 'churned', last_activity_at: '2026-01-12T11:00:00Z', created_at: '2024-03-10T08:00:00Z' },
    { id: 'c_005', name: 'Aaron Smayling', external_id: 'AS10045140', email: 'aaron@example.com', invoice_count: 1, mrr: { amount: 199, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'active', last_activity_at: '2026-05-01T10:00:00Z', created_at: '2026-04-28T08:00:00Z' },
    { id: 'c_006', name: 'Astrea Jones', external_id: 'AJ10960140', email: 'astrea@example.com', invoice_count: 2, mrr: { amount: 398, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'active', last_activity_at: '2026-05-02T10:00:00Z', created_at: '2026-04-28T08:00:00Z' },
    { id: 'c_007', name: 'Test Ashmi', external_id: null, email: null, invoice_count: 8, mrr: { amount: 17700, currency: 'INR' }, outstanding: { amount: 4500, currency: 'INR' }, status: 'active', last_activity_at: '2026-05-05T08:00:00Z', created_at: '2026-05-05T08:00:00Z' },
    { id: 'c_008', name: 'meowconda', external_id: null, email: null, invoice_count: 1, mrr: { amount: 99, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'paused', last_activity_at: '2026-05-05T11:00:00Z', created_at: '2026-05-05T11:00:00Z' },
    { id: 'c_009', name: 'XXXX LLC', external_id: 'XXXX-LLC-TURVO-AMENDMENT-4', email: null, invoice_count: 3, mrr: { amount: 8900, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'active', last_activity_at: '2026-04-30T08:00:00Z', created_at: '2026-04-30T08:00:00Z' },
    { id: 'c_010', name: 'Soylent', external_id: 'SOY-9', email: 'billing@soylent.example', invoice_count: 5, mrr: { amount: 22500, currency: 'EUR' }, outstanding: { amount: 11200, currency: 'EUR' }, status: 'active', last_activity_at: '2026-04-25T08:00:00Z', created_at: '2024-08-13T08:00:00Z' },
    { id: 'c_011', name: 'Vehement Capital', external_id: 'VC-22', email: 'ops@vehement.example', invoice_count: 2, mrr: { amount: 7800, currency: 'USD' }, outstanding: { amount: 0, currency: 'USD' }, status: 'active', last_activity_at: '2026-05-03T08:00:00Z', created_at: '2025-09-04T08:00:00Z' },
    { id: 'c_012', name: 'Cyberdyne Systems', external_id: 'CYB-1', email: 'ar@cyberdyne.example', invoice_count: 0, mrr: null, outstanding: { amount: 920, currency: 'USD' }, status: 'churned', last_activity_at: '2025-12-01T08:00:00Z', created_at: '2024-06-01T08:00:00Z' },
  ],
};
