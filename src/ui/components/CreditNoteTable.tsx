import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { CreditNoteRow, CreditNoteTablePayload } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, shortId } from './format';

type SortKey = 'amount' | 'issue_date' | 'created_at' | 'status';
type SortDir = 'asc' | 'desc';

export function CreditNoteTable({ payload }: { payload: CreditNoteTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const cur = payload.default_currency || 'USD';

  const rows = useMemo(() => sortRows(payload.credit_notes, sortKey, sortDir), [payload.credit_notes, sortKey, sortDir]);

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const openCreditNote = (r: CreditNoteRow) => {
    if (!r.id) return;
    callHost('tools/call', { name: 'getCreditNoteById', arguments: { creditNoteId: r.id } })
      .then(() => notifyHost('ui/message', { text: `Opened credit note ${r.external_id || r.id}.` }))
      .catch(() => notifyHost('ui/message', { text: `Run: getCreditNoteById creditNoteId=${r.id}` }));
  };

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">
          Credit Notes <span className="text-muted font-normal">({payload.total.toLocaleString()})</span>
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
              <Th sortable active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')}>Status</Th>
              <Th align="right" sortable active={sortKey === 'amount'} dir={sortDir} onClick={() => toggle('amount')}>Amount</Th>
              <Th>Reason</Th>
              <Th sortable active={sortKey === 'issue_date'} dir={sortDir} onClick={() => toggle('issue_date')}>Issued</Th>
              <Th sortable active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggle('created_at')}>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-muted">No credit notes match.</td></tr>
            ) : rows.map((r, i) => (
              <tr
                key={r.id || i}
                className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer"
                onClick={() => openCreditNote(r)}
              >
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.external_id || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--brand-link)]">{shortId(r.customer_id, 10)}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--brand-link)]">{shortId(r.invoice_id, 10)}</td>
                <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--color-status-overdue)]">{fmtMoney(r.amount, r.currency || cur)}</td>
                <td className="px-3 py-2 text-xs max-w-[18rem] truncate" title={r.reason || ''}>{r.reason || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.issue_date)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
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
  callHost('tools/call', { name: 'listCreditNotes', arguments: { cursor } })
    .catch(() => notifyHost('ui/message', { text: `Run: listCreditNotes cursor=${cursor}` }));
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

function sortRows(rows: CreditNoteRow[], key: SortKey, dir: SortDir): CreditNoteRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: CreditNoteRow): string | number | null => {
    switch (key) {
      case 'amount': return r.amount;
      case 'issue_date': return r.issue_date;
      case 'created_at': return r.created_at;
      case 'status': return r.status;
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
