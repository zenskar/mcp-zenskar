import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { InvoiceDetail } from '../components/InvoiceDetail';
import type { InvoiceDetailPayload } from '../types';

const FALLBACK: InvoiceDetailPayload = { invoice: { id: '', invoice_number: null, customer_id: null, status: null, invoice_total: null, amount_due: null, due_date: null, invoice_period_begin: null, invoice_period_end: null, external_id: null, created_at: null, payment_url: null } };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<InvoiceDetailPayload>
        fallback={FALLBACK}
        readyMarker="invoice-detail:mounted"
        render={(data) => <InvoiceDetail payload={data} />}
      />
    </StrictMode>
  );
}
