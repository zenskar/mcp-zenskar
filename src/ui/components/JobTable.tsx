import { useMemo, useState } from 'react';
import { callHost, notifyHost } from '../client/postMessage';
import type { JobRow, JobTablePayload } from '../types';
import { Dim, StatusPill, fmtDate, shortId } from './format';

type SortKey = 'started_at' | 'duration_ms' | 'status';
type SortDir = 'asc' | 'desc';

export function JobTable({ payload }: { payload: JobTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('started_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const rows = useMemo(() => sortRows(payload.jobs, sortKey, sortDir), [payload.jobs, sortKey, sortDir]);
  const toggle = (k: SortKey) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };
  const open = (r: JobRow) => fireTool('getJobById', { jobId: r.id }, `Opened job ${r.id}.`);
  const counts = payload.status_counts || {};

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold m-0">Jobs <span className="text-muted font-normal">({payload.total.toLocaleString()})</span></h2>
        <div className="flex gap-1.5 text-xs flex-wrap">
          {Object.entries(counts).map(([s, n]) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-row-hover">{s}: <span className="tabular-nums font-medium">{n}</span></span>
          ))}
        </div>
      </header>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th>ID</Th>
              <Th>Type</Th>
              <Th sortable active={sortKey === 'status'} dir={sortDir} onClick={() => toggle('status')}>Status</Th>
              <Th sortable active={sortKey === 'started_at'} dir={sortDir} onClick={() => toggle('started_at')}>Started</Th>
              <Th align="right" sortable active={sortKey === 'duration_ms'} dir={sortDir} onClick={() => toggle('duration_ms')}>Duration</Th>
              <Th>Error</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted">No jobs match.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-border hover:bg-[var(--brand-row-hover)] cursor-pointer" onClick={() => open(r)}>
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs">{shortId(r.id, 12)}</td>
                <td className="px-3 py-2 text-xs">{r.type || <Dim>—</Dim>}</td>
                <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">{r.started_at ? fmtDate(r.started_at) : <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs">{fmtDuration(r.duration_ms)}</td>
                <td className="px-3 py-2 text-xs text-[var(--color-status-overdue)] truncate max-w-xs">{r.error || <Dim>—</Dim>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager cursor={payload.cursor} tool="listJobs" />
    </div>
  );
}

function fmtDuration(ms: number | null): React.ReactNode {
  if (ms == null) return <Dim>—</Dim>;
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  if (m < 60) return `${m.toFixed(1)}m`;
  const h = m / 60;
  return `${h.toFixed(1)}h`;
}

function sortRows(rows: JobRow[], key: SortKey, dir: SortDir): JobRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const get = (r: JobRow): string | number | null => {
    switch (key) { case 'started_at': return r.started_at; case 'duration_ms': return r.duration_ms; case 'status': return r.status; }
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
