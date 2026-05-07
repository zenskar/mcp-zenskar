import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { EntityRow, EntityTablePayload } from '../types';
import { Dim, StatusPill, fmtDate } from './format';

type SortKey = 'name' | 'created_at';
type SortDir = 'asc' | 'desc';

export function EntityTable({ payload }: { payload: EntityTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const rows = useMemo(() => sortRows(payload.entities, sortKey, sortDir), [payload.entities, sortKey, sortDir]);
  const toggle = (k: SortKey) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } };
  const open = (r: EntityRow) => fireTool('getBusinessEntityById', { businessEntityId: r.id }, `Opened entity ${r.name || r.id}.`);

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">Business Entities <span className="text-muted font-normal">({payload.total.toLocaleString()})</span></h2>
      </header>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th sortable active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')}>Name</Th>
              <Th>Code</Th>
              <Th>Country</Th>
              <Th>Currency</Th>
              <Th>Status</Th>
              <Th sortable active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggle('created_at')}>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted">No entities.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer" onClick={() => open(r)}>
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{r.name || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.code || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-xs uppercase">{r.country || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-xs">{r.default_currency || <Dim>—</Dim>}</td>
                <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager cursor={payload.cursor} tool="listBusinessEntities" />
    </div>
  );
}

function sortRows(rows: EntityRow[], key: SortKey, dir: SortDir): EntityRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: EntityRow): string | null => { switch (key) { case 'name': return r.name; case 'created_at': return r.created_at; } };
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
