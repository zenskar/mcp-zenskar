import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { JournalEntryRow, JournalTablePayload } from '../types';
import { Dim, fmtDate, fmtMoney, shortId } from './format';

type SortKey = 'date' | 'account_name' | 'debit' | 'credit';
type SortDir = 'asc' | 'desc';

export function JournalTable({ payload }: { payload: JournalTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const cur = payload.default_currency || 'USD';
  const rows = useMemo(() => sortRows(payload.entries, sortKey, sortDir), [payload.entries, sortKey, sortDir]);
  const toggle = (k: SortKey) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir(k === 'date' ? 'desc' : 'asc'); } };
  const open = (r: JournalEntryRow) => fireTool('getJournalEntry', { entryId: r.id }, `Opened entry ${r.entry_number || r.id}.`);

  const totals = useMemo(() => {
    let d = 0, c = 0;
    for (const r of rows) { if (Number.isFinite(r.debit)) d += r.debit!; if (Number.isFinite(r.credit)) c += r.credit!; }
    return { d, c };
  }, [rows]);

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">Journal Entries <span className="text-muted font-normal">({payload.total.toLocaleString()})</span>
          {payload.scope ? <span className="text-muted font-normal text-sm"> · {payload.scope}</span> : null}</h2>
        <span className="text-xs text-muted">Σ debit {fmtMoney(totals.d, cur)} · Σ credit {fmtMoney(totals.c, cur)}</span>
      </header>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th>Entry</Th>
              <Th sortable active={sortKey === 'date'} dir={sortDir} onClick={() => toggle('date')}>Date</Th>
              <Th sortable active={sortKey === 'account_name'} dir={sortDir} onClick={() => toggle('account_name')}>Account</Th>
              <Th align="right" sortable active={sortKey === 'debit'} dir={sortDir} onClick={() => toggle('debit')}>Debit</Th>
              <Th align="right" sortable active={sortKey === 'credit'} dir={sortDir} onClick={() => toggle('credit')}>Credit</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted">No entries match.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer" onClick={() => open(r)}>
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.entry_number || shortId(r.id, 8)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.date)}</td>
                <td className="px-3 py-2">
                  <div className="text-sm">{r.account_name || <Dim>—</Dim>}</div>
                  {r.account_id ? <div className="text-xs text-muted font-mono">{shortId(r.account_id, 12)}</div> : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.debit != null ? fmtMoney(r.debit, r.currency || cur) : <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.credit != null ? fmtMoney(r.credit, r.currency || cur) : <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-xs text-muted">{r.description || <Dim>—</Dim>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager cursor={payload.cursor} tool="listJournalEntries" />
    </div>
  );
}

function sortRows(rows: JournalEntryRow[], key: SortKey, dir: SortDir): JournalEntryRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: JournalEntryRow): string | number | null => {
    switch (key) { case 'date': return r.date; case 'account_name': return r.account_name; case 'debit': return r.debit; case 'credit': return r.credit; }
  };
  return [...rows].sort((a, b) => {
    const av = get(a); const bv = get(b);
    if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
    if (av < bv) return -1 * mult; if (av > bv) return 1 * mult; return 0;
  });
}

function fireTool(name: string, args: Record<string, unknown>, ok?: string) {
  callHost('tools/call', { name, arguments: args })
    .then(() => ok ? notifyHost('ui/message', { text: ok }) : undefined)
    .catch(() => notifyHost('ui/message', { text: `Run: ${name} ${JSON.stringify(args)}` }));
}

function Pager({ cursor, tool }: { cursor?: { next?: string | null; prev?: string | null }; tool: string }) {
  if (!cursor || (!cursor.next && !cursor.prev)) return null;
  const go = (c: string | null | undefined) => { if (!c) return; fireTool(tool, { cursor: c }); };
  return (
    <nav className="flex items-center gap-2 justify-end text-sm">
      <PagerButton disabled={!cursor.prev} onClick={() => go(cursor.prev)}>← Prev</PagerButton>
      <PagerButton disabled={!cursor.next} onClick={() => go(cursor.next)}>Next →</PagerButton>
    </nav>
  );
}

function PagerButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick}
    className="px-3 py-1 rounded border border-border bg-bg hover:bg-[var(--brand-accent)] hover:text-[var(--brand-accent-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{children}</button>;
}

function Th({ children, sortable, active, dir, onClick, align = 'left' }: { children: React.ReactNode; sortable?: boolean; active?: boolean; dir?: SortDir; onClick?: () => void; align?: 'left' | 'right' }) {
  const cls = `px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-fg' : ''} ${active ? 'text-fg' : ''}`;
  return <th className={cls} onClick={onClick}>{children}{sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}</th>;
}
