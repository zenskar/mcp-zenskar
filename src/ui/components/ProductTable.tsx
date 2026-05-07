import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { ProductRow, ProductTablePayload } from '../types';
import { Dim, StatusPill, fmtDate } from './format';

type SortKey = 'name' | 'pricing_count' | 'created_at';
type SortDir = 'asc' | 'desc';

export function ProductTable({ payload }: { payload: ProductTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const rows = useMemo(() => sortRows(payload.products, sortKey, sortDir), [payload.products, sortKey, sortDir]);
  const toggle = (k: SortKey) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc'); } };
  const open = (r: ProductRow) => fireTool('getProductPricings', { productId: r.id }, `Opened product ${r.name || r.id}.`);

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">Products <span className="text-muted font-normal">({payload.total.toLocaleString()})</span>
          {payload.scope ? <span className="text-muted font-normal text-sm"> · {payload.scope}</span> : null}</h2>
        <span className="text-xs text-muted">click row → pricings · headers sort</span>
      </header>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th sortable active={sortKey === 'name'} dir={sortDir} onClick={() => toggle('name')}>Name</Th>
              <Th>SKU / External</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th align="right" sortable active={sortKey === 'pricing_count'} dir={sortDir} onClick={() => toggle('pricing_count')}>Pricings</Th>
              <Th sortable active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggle('created_at')}>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted">No products match.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer" onClick={() => open(r)}>
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{r.name || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.external_id || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-xs text-muted">{r.description || <Dim>—</Dim>}</td>
                <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                <td className="px-3 py-2 text-right tabular-nums">{r.pricing_count ?? <Dim>—</Dim>}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager cursor={payload.cursor} tool="listProducts" />
    </div>
  );
}

function sortRows(rows: ProductRow[], key: SortKey, dir: SortDir): ProductRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: ProductRow): string | number | null => {
    switch (key) { case 'name': return r.name; case 'pricing_count': return r.pricing_count; case 'created_at': return r.created_at; }
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
