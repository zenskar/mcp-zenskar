import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { PaymentRow, PaymentTablePayload } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, shortId } from './format';

type SortKey = 'amount' | 'payment_date' | 'created_at' | 'type';
type SortDir = 'asc' | 'desc';

const TYPE_COLOR: Record<string, string> = {
  payment: 'bg-emerald-100 text-emerald-800',
  refund: 'bg-purple-100 text-purple-800',
  payment_reversal: 'bg-red-100 text-red-800',
  authorization: 'bg-blue-100 text-blue-800',
  tax_withheld: 'bg-slate-100 text-slate-700',
};

export function PaymentTable({ payload }: { payload: PaymentTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const cur = payload.default_currency || 'USD';

  const rows = useMemo(() => sortRows(payload.payments, sortKey, sortDir), [payload.payments, sortKey, sortDir]);

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const openPayment = (r: PaymentRow) => {
    if (!r.id) return;
    callHost('tools/call', { name: 'getPaymentById', arguments: { paymentId: r.id } })
      .then(() => notifyHost('ui/message', { text: `Opened payment ${r.external_id || r.id}.` }))
      .catch(() => notifyHost('ui/message', { text: `Run: getPaymentById paymentId=${r.id}` }));
  };

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">
          Payments <span className="text-muted font-normal">({payload.total.toLocaleString()})</span>
          {payload.scope ? <span className="text-muted font-normal text-sm"> · {payload.scope}</span> : null}
        </h2>
        <span className="text-xs text-muted">click row to open · headers sort</span>
      </header>

      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th>External ID</Th>
              <Th>Customer</Th>
              <Th>Invoice</Th>
              <Th sortable active={sortKey === 'type'} dir={sortDir} onClick={() => toggle('type')}>Type</Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th align="right" sortable active={sortKey === 'amount'} dir={sortDir} onClick={() => toggle('amount')}>Amount</Th>
              <Th sortable active={sortKey === 'payment_date'} dir={sortDir} onClick={() => toggle('payment_date')}>Date</Th>
              <Th sortable active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggle('created_at')}>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="py-8 text-center text-muted">No payments match.</td></tr>
            ) : rows.map((r, i) => {
              const isNegative = r.amount != null && r.amount < 0;
              const isRefund = r.type === 'refund' || r.type === 'payment_reversal';
              return (
                <tr
                  key={r.id || i}
                  className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer"
                  onClick={() => openPayment(r)}
                >
                  <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.external_id || <Dim>—</Dim>}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--brand-link)]">{shortId(r.customer_id, 10)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--brand-link)]">{shortId(r.invoice_id, 10)}</td>
                  <td className="px-3 py-2">
                    {r.type ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${TYPE_COLOR[r.type] || 'bg-slate-100 text-slate-700'}`}>{r.type}</span>
                    ) : <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.payment_method || <Dim>—</Dim>}</td>
                  <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                  <td className={`px-3 py-2 text-right tabular-nums ${isNegative || isRefund ? 'text-[var(--color-status-overdue)]' : ''}`}>
                    {fmtMoney(r.amount, r.currency || cur)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.payment_date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(payload.cursor?.next || payload.cursor?.prev) ? (
        <nav className="flex items-center gap-2 justify-end text-sm">
          <PaginateButton disabled={!payload.cursor?.prev} onClick={() => paginate(payload.cursor?.prev)}>← Prev</PaginateButton>
          <PaginateButton disabled={!payload.cursor?.next} onClick={() => paginate(payload.cursor?.next)}>Next →</PaginateButton>
        </nav>
      ) : null}
    </div>
  );
}

function paginate(cursor: string | null | undefined) {
  if (!cursor) return;
  callHost('tools/call', { name: 'listAllPayments', arguments: { cursor } })
    .catch(() => notifyHost('ui/message', { text: `Run: listAllPayments cursor=${cursor}` }));
}

function PaginateButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="px-3 py-1 rounded border border-border bg-bg hover:bg-[var(--brand-accent)] hover:text-[var(--brand-accent-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}

function Th({ children, sortable, active, dir, onClick, align = 'left' }:
  { children: React.ReactNode; sortable?: boolean; active?: boolean; dir?: SortDir; onClick?: () => void; align?: 'left' | 'right' }) {
  const cls = `px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-fg' : ''} ${active ? 'text-fg' : ''}`;
  return <th className={cls} onClick={onClick}>{children}{sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}</th>;
}

function sortRows(rows: PaymentRow[], key: SortKey, dir: SortDir): PaymentRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: PaymentRow): string | number | null => {
    switch (key) {
      case 'amount': return r.amount;
      case 'payment_date': return r.payment_date;
      case 'created_at': return r.created_at;
      case 'type': return r.type;
    }
  };
  return [...rows].sort((a, b) => {
    const av = get(a); const bv = get(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}
