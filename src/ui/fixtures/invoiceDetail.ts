import type { InvoiceDetailPayload } from '../types';

export const invoiceDetailFixture: InvoiceDetailPayload = {
  invoice: {
    id: 'inv_001',
    invoice_number: 'INV-2026-0142',
    customer_id: 'c_001',
    status: 'open',
    invoice_total: 1845.5,
    amount_due: 1845.5,
    paid_amount: 0,
    due_date: '2026-05-30',
    invoice_period_begin: '2026-04-01',
    invoice_period_end: '2026-04-30',
    external_id: 'EXT-INV-XYZ',
    created_at: '2026-05-01T09:00:00Z',
    payment_url: 'https://app.zenskar.example/pay/inv_001',
    currency: 'USD',
    business_entity_id: 'be_001',
    notes: 'Net 30 — wire transfer preferred.',
    custom_data: { po_number: 'PO-44215' },
  },
  line_items: [
    { name: 'Platform subscription', description: 'Monthly recurring fee', pricing_model: 'flat-fee', subtotal: { value: 1200, unit: 'USD', display: '$1,200.00' }, quantity: { value: 1, unit: null, display: '1' }, price: null, service_start_date: '2026-04-01', service_end_date: '2026-04-30', is_billed: true },
    { name: 'API requests', description: 'Per-1k usage', pricing_model: 'per-unit', subtotal: { value: 645.5, unit: 'USD', display: '$645.50' }, quantity: { value: 12910, unit: 'unit', display: '12,910 units' }, price: { value: 0.05, unit: 'USD/unit' }, service_start_date: '2026-04-01', service_end_date: '2026-04-30', is_billed: true },
  ],
};
