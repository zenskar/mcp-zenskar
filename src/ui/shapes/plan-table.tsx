import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { PlanTable } from '../components/PlanTable';
import type { PlanTablePayload } from '../types';

const FALLBACK: PlanTablePayload = { plans: [], total: 0 };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<PlanTablePayload>
        fallback={FALLBACK}
        readyMarker="plan-table:mounted"
        render={(data) => <PlanTable payload={data} />}
      />
    </StrictMode>
  );
}
