import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { CreditNoteTable } from '../components/CreditNoteTable';
import type { CreditNoteTablePayload } from '../types';

const FALLBACK: CreditNoteTablePayload = { credit_notes: [], total: 0 };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<CreditNoteTablePayload>
        fallback={FALLBACK}
        readyMarker="credit-note-table:mounted"
        render={(data) => <CreditNoteTable payload={data} />}
      />
    </StrictMode>
  );
}
