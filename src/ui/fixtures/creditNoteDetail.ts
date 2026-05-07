import type { CreditNoteDetailPayload } from '../types';

export const creditNoteDetailFixture: CreditNoteDetailPayload = {
  credit_note: {
    id: 'cn_001',
    external_id: 'CN-2026-007',
    customer_id: 'c_001',
    invoice_id: 'inv_001',
    status: 'issued',
    amount: 500,
    currency: 'USD',
    reason: 'Service outage credit (April 2026 incident)',
    issue_date: '2026-05-02',
    created_at: '2026-05-02T08:00:00Z',
    line_items_url: 'https://api.zenskar.example/credit_notes/cn_001/lines',
    business_entity_id: 'be_001',
    notes: 'Pro-rated for 18 hours of degraded service.',
  },
};
