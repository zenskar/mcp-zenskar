import type { CreditNoteDetailPayload } from '../types'

export const creditNoteDetailFixture: CreditNoteDetailPayload = {
  credit_note: {
    id: 'cn_001',
    credit_note_number: 'CN-2026-007',
    customer_id: 'c_001',
    invoice_id: 'inv_001',
    status: 'issued',
    amount: 500,
    currency: 'USD',
    repayment_method: 'invoice_adjusted',
    created_at: '2026-05-02T08:00:00Z',
    line_items_url: 'https://api.zenskar.example/credit_notes/cn_001/lines',
    credits_returned: 0,
    custom_data: {
      refund_reason: 'Service outage credit (April 2026 incident)',
      tax_calculated: true,
    },
  },
}
