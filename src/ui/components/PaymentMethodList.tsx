import type { PaymentMethodListPayload, PaymentMethodRow } from '../types';
import { Dim, fmtDate, shortId } from './format';

export function PaymentMethodList({ payload }: { payload: PaymentMethodListPayload }) {
  const list = payload.payment_methods || [];
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">Payment Methods <span className="text-muted font-normal">({list.length})</span>
          {payload.customer_id ? <span className="text-muted font-mono text-xs"> · {shortId(payload.customer_id, 12)}</span> : null}</h2>
      </header>
      {list.length === 0 ? (
        <div className="text-center text-muted py-8 border border-border rounded-md">No payment methods saved.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((m, i) => <PaymentMethodCard key={m.id || i} method={m} />)}
        </div>
      )}
    </div>
  );
}

function PaymentMethodCard({ method: m }: { method: PaymentMethodRow }) {
  const isCard = (m.type || '').toLowerCase().includes('card');
  return (
    <article className={`rounded-md border p-3 space-y-1 ${m.is_default ? 'border-[var(--brand-ring)] ring-1 ring-[var(--brand-ring)]' : 'border-border'}`}>
      <header className="flex items-baseline justify-between gap-2">
        <div className="font-medium text-sm flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs bg-row-hover">{(m.type || 'unknown').replace(/_/g, ' ')}</span>
          {m.brand ? <span className="text-muted">{m.brand}</span> : null}
        </div>
        {m.is_default ? <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">default</span> : null}
      </header>
      <div className="font-mono text-sm">
        {m.last4 ? `•••• ${m.last4}` : <Dim>—</Dim>}
      </div>
      <div className="text-xs text-muted flex gap-3">
        {isCard && m.exp_month && m.exp_year ? <span>exp {String(m.exp_month).padStart(2, '0')}/{String(m.exp_year).slice(-2)}</span> : null}
        {m.created_at ? <span>added {fmtDate(m.created_at)}</span> : null}
      </div>
    </article>
  );
}
