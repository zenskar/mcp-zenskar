import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { InvoiceRow, InvoiceTablePayload } from '../types'
import {
  daysBetween,
  Dim,
  fmtDate,
  fmtMoney,
  shortId,
  StatusPill,
} from './format'

type SortKey =
  | 'invoice_number'
  | 'invoice_total'
  | 'amount_due'
  | 'due_date'
  | 'created_at'
type SortDir = 'asc' | 'desc'

export function InvoiceTable({ payload }: { payload: InvoiceTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () => sortRows(payload.invoices, sortKey, sortDir),
    [payload.invoices, sortKey, sortDir]
  )

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Invoices{' '}
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
          headers sort
        </span>
      </header>

      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th
                sortable
                active={sortKey === 'invoice_number'}
                dir={sortDir}
                onClick={() => toggle('invoice_number')}
              >
                Invoice
              </Th>
              <Th>Customer</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'invoice_total'}
                dir={sortDir}
                onClick={() => toggle('invoice_total')}
              >
                Total
              </Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'amount_due'}
                dir={sortDir}
                onClick={() => toggle('amount_due')}
              >
                Due
              </Th>
              <Th
                sortable
                active={sortKey === 'due_date'}
                dir={sortDir}
                onClick={() => toggle('due_date')}
              >
                Due Date
              </Th>
              <Th align="right">Overdue</Th>
              <Th
                sortable
                active={sortKey === 'created_at'}
                dir={sortDir}
                onClick={() => toggle('created_at')}
              >
                Created
              </Th>
              <Th>View</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="text-muted-foreground py-8 text-center"
                >
                  No invoices match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const overdueDays =
                  r.due_date && r.amount_due && r.amount_due > 0
                    ? daysBetween(r.due_date)
                    : null
                const isOverdue = overdueDays != null && overdueDays > 0
                return (
                  <tr
                    key={r.id || i}
                    className="border-border hover:bg-muted/60 border-t"
                  >
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.invoice_number || <Dim>—</Dim>}
                    </td>
                    <td className="text-secondary px-3 py-2 font-mono text-xs">
                      {shortId(r.customer_id, 10)}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {r.invoice_period_begin && r.invoice_period_end ? (
                        `${r.invoice_period_begin.slice(0, 10)} → ${r.invoice_period_end.slice(0, 10)}`
                      ) : (
                        <Dim>—</Dim>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtMoney(r.invoice_total, cur)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${isOverdue ? 'text-destructive font-medium' : ''}`}
                    >
                      {fmtMoney(r.amount_due, cur)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.due_date)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                    >
                      {isOverdue ? `${overdueDays}d` : <Dim>—</Dim>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-secondary hover:text-secondary/80 text-xs underline"
                        onClick={() => openZenskarPath(`/invoices/${r.id}/view`)}
                      >
                        View
                      </button>
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
  rows: InvoiceRow[],
  key: SortKey,
  dir: SortDir
): InvoiceRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: InvoiceRow): string | number | null => {
    switch (key) {
      case 'invoice_number':
        return r.invoice_number
      case 'invoice_total':
        return r.invoice_total
      case 'amount_due':
        return r.amount_due
      case 'due_date':
        return r.due_date
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
