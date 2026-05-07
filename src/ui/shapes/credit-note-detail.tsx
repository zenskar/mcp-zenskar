import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { CreditNoteDetail } from '../components/CreditNoteDetail';
import type { CreditNoteDetailPayload } from '../types';

const FALLBACK: CreditNoteDetailPayload = { credit_note: { id: '', external_id: null, customer_id: null, invoice_id: null, status: null, amount: null, currency: null, reason: null, issue_date: null, created_at: null } };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<CreditNoteDetailPayload>
        fallback={FALLBACK}
        readyMarker="credit-note-detail:mounted"
        render={(data) => <CreditNoteDetail payload={data} />}
      />
    </StrictMode>
  );
}
