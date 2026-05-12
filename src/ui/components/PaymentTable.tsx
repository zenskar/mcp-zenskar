import { useMemo, useState } from 'react'

import type { PaymentRow, PaymentTablePayload } from '../types'
import { Dim, fmtDate, fmtMoney, shortId, StatusPill } from './format'

type SortKey = 'amount' | 'payment_date' | 'created_at' | 'type'
type SortDir = 'asc' | 'desc'

const TYPE_COLOR: Record<string, string> = {
  payment: 'bg-secondary/15 text-secondary ring-1 ring-secondary/30',
  refund: 'bg-accent text-accent-foreground ring-1 ring-border',
  payment_reversal:
    'bg-destructive/15 text-destructive ring-1 ring-destructive/30',
  authorization: 'bg-primary/15 text-primary ring-1 ring-primary/30',
  tax_withheld: 'bg-muted text-muted-foreground ring-1 ring-border',
}
const TYPE_FALLBACK = 'bg-muted text-muted-foreground ring-1 ring-border'

export function PaymentTable({ payload }: { payload: PaymentTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () => sortRows(payload.payments, sortKey, sortDir),
    [payload.payments, sortKey, sortDir]
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
          Payments{' '}
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
        <span className="text-muted-foreground text-xs">headers sort</span>
      </header>

      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th>External ID</Th>
              <Th>Customer</Th>
              <Th>Invoice</Th>
              <Th
                sortable
                active={sortKey === 'type'}
                dir={sortDir}
                onClick={() => toggle('type')}
              >
                Type
              </Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'amount'}
                dir={sortDir}
                onClick={() => toggle('amount')}
              >
                Amount
              </Th>
              <Th
                sortable
                active={sortKey === 'payment_date'}
                dir={sortDir}
                onClick={() => toggle('payment_date')}
              >
                Date
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
                  colSpan={10}
                  className="text-muted-foreground py-8 text-center"
                >
                  No payments match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const isNegative = r.amount != null && r.amount < 0
                const isRefund =
                  r.type === 'refund' || r.type === 'payment_reversal'
                return (
                  <tr key={r.id || i} className="border-border border-t">
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.external_id || <Dim>—</Dim>}
                    </td>
                    <td className="text-secondary px-3 py-2 font-mono text-xs">
                      {shortId(r.customer_id, 10)}
                    </td>
                    <td className="text-secondary px-3 py-2 font-mono text-xs">
                      {shortId(r.invoice_id, 10)}
                    </td>
                    <td className="px-3 py-2">
                      {r.type ? (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${TYPE_COLOR[r.type] || TYPE_FALLBACK}`}
                        >
                          {r.type}
                        </span>
                      ) : (
                        <Dim>—</Dim>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.payment_method || <Dim>—</Dim>}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${isNegative || isRefund ? 'text-destructive' : ''}`}
                    >
                      {fmtMoney(r.amount, r.currency || cur)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.payment_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.created_at)}
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
  rows: PaymentRow[],
  key: SortKey,
  dir: SortDir
): PaymentRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: PaymentRow): string | number | null => {
    switch (key) {
      case 'amount':
        return r.amount
      case 'payment_date':
        return r.payment_date
      case 'created_at':
        return r.created_at
      case 'type':
        return r.type
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
