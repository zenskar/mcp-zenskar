import { useMemo, useState } from 'react'

import type { JournalEntryRow, JournalTablePayload } from '../types'
import { Dim, fmtDate, fmtMoney, StatusPill } from './format'

type SortKey = 'posted_at' | 'event' | 'total_debit' | 'total_credit'
type SortDir = 'asc' | 'desc'

export function JournalTable({ payload }: { payload: JournalTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'
  const rows = useMemo(
    () => sortRows(payload.entries, sortKey, sortDir),
    [payload.entries, sortKey, sortDir]
  )
  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'posted_at' ? 'desc' : 'asc')
    }
  }
  const totals = useMemo(() => {
    let d = 0,
      c = 0
    for (const r of rows) {
      if (Number.isFinite(r.total_debit)) d += r.total_debit!
      if (Number.isFinite(r.total_credit)) c += r.total_credit!
    }
    return { d, c }
  }, [rows])

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Journal Entries{' '}
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
          Σ debit {fmtMoney(totals.d, cur)} · Σ credit {fmtMoney(totals.c, cur)}
        </span>
      </header>
      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th
                sortable
                active={sortKey === 'posted_at'}
                dir={sortDir}
                onClick={() => toggle('posted_at')}
              >
                Posted
              </Th>
              <Th
                sortable
                active={sortKey === 'event'}
                dir={sortDir}
                onClick={() => toggle('event')}
              >
                Event
              </Th>
              <Th>Status</Th>
              <Th align="right">Lines</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'total_debit'}
                dir={sortDir}
                onClick={() => toggle('total_debit')}
              >
                Σ Debit
              </Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'total_credit'}
                dir={sortDir}
                onClick={() => toggle('total_credit')}
              >
                Σ Credit
              </Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  No entries match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id || i} className="border-border border-t">
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.posted_at)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.event || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={r.status_type} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.line_count ?? <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.total_debit != null ? (
                      fmtMoney(r.total_debit, r.currency || cur)
                    ) : (
                      <Dim>—</Dim>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.total_credit != null ? (
                      fmtMoney(r.total_credit, r.currency || cur)
                    ) : (
                      <Dim>—</Dim>
                    )}
                  </td>
                  <td className="text-muted-foreground max-w-xs truncate px-3 py-2 text-xs">
                    {r.description || <Dim>—</Dim>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function sortRows(
  rows: JournalEntryRow[],
  key: SortKey,
  dir: SortDir
): JournalEntryRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: JournalEntryRow): string | number | null => {
    switch (key) {
      case 'posted_at':
        return r.posted_at
      case 'event':
        return r.event
      case 'total_debit':
        return r.total_debit
      case 'total_credit':
        return r.total_credit
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
