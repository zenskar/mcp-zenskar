import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { EntityTable } from '../components/EntityTable';
import type { EntityTablePayload } from '../types';

const FALLBACK: EntityTablePayload = { entities: [], total: 0 };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<EntityTablePayload>
        fallback={FALLBACK}
        readyMarker="entity-table:mounted"
        render={(data) => <EntityTable payload={data} />}
      />
    </StrictMode>
  );
}
