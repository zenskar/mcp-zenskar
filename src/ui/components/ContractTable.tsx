import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { ContractRow, ContractTablePayload } from '../types'
import {
  daysBetween,
  Dim,
  fmtDate,
  fmtMoney,
  shortId,
  StatusPill,
} from './format'

type SortKey = 'name' | 'start_date' | 'end_date' | 'mrr' | 'created_at'
type SortDir = 'asc' | 'desc'

export function ContractTable({ payload }: { payload: ContractTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () => sortRows(payload.contracts, sortKey, sortDir),
    [payload.contracts, sortKey, sortDir]
  )

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const openContract = (r: ContractRow) => {
    if (!r.id) return
    openZenskarPath(`/contractsv2/${r.id}/edit`)
  }

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Contracts{' '}
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
          click row to open in Zenskar · headers sort
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
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th align="right">Phases</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'mrr'}
                dir={sortDir}
                onClick={() => toggle('mrr')}
              >
                MRR
              </Th>
              <Th align="right">Total Value</Th>
              <Th
                sortable
                active={sortKey === 'start_date'}
                dir={sortDir}
                onClick={() => toggle('start_date')}
              >
                Start
              </Th>
              <Th
                sortable
                active={sortKey === 'end_date'}
                dir={sortDir}
                onClick={() => toggle('end_date')}
              >
                End
              </Th>
              <Th align="right">Days Left</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-muted-foreground py-8 text-center"
                >
                  No contracts match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const daysLeft = r.end_date
                  ? -1 * (daysBetween(r.end_date) ?? 0)
                  : null
                const expiringSoon =
                  daysLeft != null && daysLeft >= 0 && daysLeft <= 30
                const expired = daysLeft != null && daysLeft < 0
                return (
                  <tr
                    key={r.id || i}
                    className="border-border hover:bg-muted/60 cursor-pointer border-t"
                    onClick={() => openContract(r)}
                  >
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.name || <Dim>—</Dim>}
                    </td>
                    <td className="text-secondary px-3 py-2 font-mono text-xs">
                      {shortId(r.customer_id, 10)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.phase_count ?? <Dim>—</Dim>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtMoneyPair(r.mrr)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtMoneyPair(r.total_value)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.start_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.end_date)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${expired ? 'text-destructive font-medium' : expiringSoon ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                    >
                      {daysLeft == null ? (
                        <Dim>—</Dim>
                      ) : expired ? (
                        `${Math.abs(daysLeft)}d ago`
                      ) : (
                        `${daysLeft}d`
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

function fmtMoneyPair(m: { amount: number; currency: string } | null) {
  if (!m || !Number.isFinite(m.amount)) return <Dim>—</Dim>
  return fmtMoney(m.amount, m.currency || 'USD')
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

function sortRows(
  rows: ContractRow[],
  key: SortKey,
  dir: SortDir
): ContractRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: ContractRow): string | number | null => {
    switch (key) {
      case 'name':
        return r.name
      case 'start_date':
        return r.start_date
      case 'end_date':
        return r.end_date
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
