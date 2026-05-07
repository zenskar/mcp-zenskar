import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { ContractRow, ContractTablePayload } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, shortId, daysBetween } from './format';

type SortKey = 'name' | 'start_date' | 'end_date' | 'mrr' | 'created_at';
type SortDir = 'asc' | 'desc';

export function ContractTable({ payload }: { payload: ContractTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => sortRows(payload.contracts, sortKey, sortDir), [payload.contracts, sortKey, sortDir]);

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc'); }
  };

  const openContract = (r: ContractRow) => {
    if (!r.id) return;
    callHost('tools/call', { name: 'getContractById', arguments: { contractId: r.id } })
      .then(() => notifyHost('ui/message', { text: `Opened contract ${r.name || r.id}.` }))
      .catch(() => notifyHost('ui/message', { text: `Run: getContractById contractId=${r.id}` }));
  };

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">
          Contracts <span className="text-muted font-normal">({payload.total.toLocaleString()})</span>
          {payload.scope ? <span className="text-muted font-normal text-sm"> · {payload.scope}</span> : null}
        </h2>
        <span className="text-xs text-muted">click row to open · headers sort</span>
      </header>

      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th sortable active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')}>Name</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th align="right">Phases</Th>
              <Th align="right" sortable active={sortKey === 'mrr'} dir={sortDir} onClick={() => toggle('mrr')}>MRR</Th>
              <Th align="right">Total Value</Th>
              <Th sortable active={sortKey === 'start_date'} dir={sortDir} onClick={() => toggle('start_date')}>Start</Th>
              <Th sortable active={sortKey === 'end_date'} dir={sortDir} onClick={() => toggle('end_date')}>End</Th>
              <Th align="right">Days Left</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="py-8 text-center text-muted">No contracts match.</td></tr>
            ) : rows.map((r, i) => {
              const daysLeft = r.end_date ? -1 * (daysBetween(r.end_date) ?? 0) : null;
              const expiringSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 30;
              const expired = daysLeft != null && daysLeft < 0;
              return (
                <tr
                  key={r.id || i}
                  className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer"
                  onClick={() => openContract(r)}
                >
                  <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{r.name || <Dim>—</Dim>}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--brand-link)]">{shortId(r.customer_id, 10)}</td>
                  <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.phase_count ?? <Dim>—</Dim>}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyPair(r.mrr)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyPair(r.total_value)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.start_date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.end_date)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${expired ? 'text-[var(--color-status-overdue)] font-medium' : expiringSoon ? 'text-amber-700 font-medium' : 'text-muted'}`}>
                    {daysLeft == null ? <Dim>—</Dim> : expired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                  </td>
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

function fmtMoneyPair(m: { amount: number; currency: string } | null) {
  if (!m || !Number.isFinite(m.amount)) return <Dim>—</Dim>;
  return fmtMoney(m.amount, m.currency || 'USD');
}

function paginate(cursor: string | null | undefined) {
  if (!cursor) return;
  callHost('tools/call', { name: 'listContracts', arguments: { cursor } })
    .catch(() => notifyHost('ui/message', { text: `Run: listContracts cursor=${cursor}` }));
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

function sortRows(rows: ContractRow[], key: SortKey, dir: SortDir): ContractRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: ContractRow): string | number | null => {
    switch (key) {
      case 'name': return r.name;
      case 'start_date': return r.start_date;
      case 'end_date': return r.end_date;
      case 'mrr': return r.mrr?.amount ?? null;
      case 'created_at': return r.created_at;
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
