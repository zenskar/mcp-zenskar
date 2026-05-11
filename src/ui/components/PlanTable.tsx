import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { PlanRow, PlanTablePayload } from '../types'
import { Dim, fmtDate, fmtMoney, StatusPill } from './format'

type SortKey = 'name' | 'phase_count' | 'mrr' | 'created_at'
type SortDir = 'asc' | 'desc'

export function PlanTable({ payload }: { payload: PlanTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const rows = useMemo(
    () => sortRows(payload.plans, sortKey, sortDir),
    [payload.plans, sortKey, sortDir]
  )
  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }
  const open = (r: PlanRow) => {
    if (!r.id) return
    openZenskarPath(`/plansv2/${r.id}/edit`)
  }

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Plans{' '}
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
          click row → details · headers sort
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
              <Th>External ID</Th>
              <Th>Status</Th>
              <Th>Currency</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'phase_count'}
                dir={sortDir}
                onClick={() => toggle('phase_count')}
              >
                Phases
              </Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'mrr'}
                dir={sortDir}
                onClick={() => toggle('mrr')}
              >
                MRR
              </Th>
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
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  No plans match.
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
                    {r.external_id || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.currency || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.phase_count ?? <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.mrr ? (
                      fmtMoney(r.mrr.amount, r.mrr.currency)
                    ) : (
                      <Dim>—</Dim>
                    )}
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
    </div>
  )
}

function sortRows(rows: PlanRow[], key: SortKey, dir: SortDir): PlanRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: PlanRow): string | number | null => {
    switch (key) {
      case 'name':
        return r.name
      case 'phase_count':
        return r.phase_count
      case 'mrr':
        return r.mrr?.amount ?? null
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
