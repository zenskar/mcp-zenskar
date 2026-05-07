import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { JournalTable } from '../components/JournalTable';
import type { JournalTablePayload } from '../types';

const FALLBACK: JournalTablePayload = { entries: [], total: 0 };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<JournalTablePayload>
        fallback={FALLBACK}
        readyMarker="journal-table:mounted"
        render={(data) => <JournalTable payload={data} />}
      />
    </StrictMode>
  );
}
