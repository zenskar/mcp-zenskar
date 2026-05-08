import { useMemo, useState } from 'react'

import { callHost, notifyHost } from '../client/postMessage'
import type { RawMetricRow, RawMetricTablePayload } from '../types'
import { Dim, fmtDate, StatusPill } from './format'

type SortKey = 'name' | 'created_at'
type SortDir = 'asc' | 'desc'

export function RawMetricTable({
  payload,
}: {
  payload: RawMetricTablePayload
}) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const rows = useMemo(
    () => sortRows(payload.raw_metrics, sortKey, sortDir),
    [payload.raw_metrics, sortKey, sortDir]
  )
  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }
  const open = (r: RawMetricRow) =>
    fireTool(
      'getRawMetricById',
      { rawMetricId: r.id },
      `Opened raw metric ${r.name || r.id}.`
    )

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Raw Metrics{' '}
          <span className="text-muted-foreground font-normal">
            ({payload.total.toLocaleString()})
          </span>
          {payload.scope ? (
            <span className="text-muted-foreground text-sm font-normal">
              {' '}
              · {payload.scope}
            </span>
          ) : null}
        </h2>
        <span className="text-muted-foreground text-xs">
          click row → details
        </span>
      </header>
      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th
                sortable
                active={sortKey === 'name'}
                dir={sortDir}
                onClick={() => toggle('name')}
              >
                Name
              </Th>
              <Th>API Slug</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Description</Th>
              <Th
                sortable
                active={sortKey === 'created_at'}
                dir={sortDir}
                onClick={() => toggle('created_at')}
              >
                Created
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No raw metrics match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.id || i}
                  className="border-border hover:bg-muted/60 cursor-pointer border-t"
                  onClick={() => open(r)}
                >
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.name || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.api_slug || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.api_type || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    {r.description || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager cursor={payload.cursor} tool="listRawMetrics" />
    </div>
  )
}

function sortRows(
  rows: RawMetricRow[],
  key: SortKey,
  dir: SortDir
): RawMetricRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: RawMetricRow): string | null => {
    switch (key) {
      case 'name':
        return r.name
      case 'created_at':
        return r.created_at
    }
  }
  return [...rows].sort((a, b) => {
    const av = get(a)
    const bv = get(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return -1 * mult
    if (av > bv) return 1 * mult
    return 0
  })
}

function fireTool(name: string, args: Record<string, unknown>, ok?: string) {
  callHost('tools/call', { name, arguments: args })
    .then(() => (ok ? notifyHost('ui/message', { text: ok }) : undefined))
    .catch(() =>
      notifyHost('ui/message', { text: `Run: ${name} ${JSON.stringify(args)}` })
    )
}

function Pager({
  cursor,
  tool,
}: {
  cursor?: { next?: string | null; prev?: string | null }
  tool: string
}) {
  if (!cursor || (!cursor.next && !cursor.prev)) return null
  const go = (c: string | null | undefined) => {
    if (!c) return
    fireTool(tool, { cursor: c })
  }
  return (
    <nav className="flex items-center justify-end gap-2 text-sm">
      <PagerButton disabled={!cursor.prev} onClick={() => go(cursor.prev)}>
        ← Prev
      </PagerButton>
      <PagerButton disabled={!cursor.next} onClick={() => go(cursor.next)}>
        Next →
      </PagerButton>
    </nav>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border-border bg-background hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function Th({
  children,
  sortable,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  children: React.ReactNode
  sortable?: boolean
  active?: boolean
  dir?: SortDir
  onClick?: () => void
  align?: 'left' | 'right'
}) {
  const cls = `px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} ${active ? 'text-foreground' : ''}`
  return (
    <th className={cls} onClick={onClick}>
      {children}
      {sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  )
}
