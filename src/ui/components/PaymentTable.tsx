import { useMemo, useState } from 'react'

import type { PaymentRow, PaymentTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  sortByKey,
} from './DataTable'
import { Dim, fmtDate, fmtDateTime, fmtMoney, shortId, StatusPill } from './format'

type SortKey = 'amount' | 'payment_date' | 'created_at' | 'type'

const TYPE_COLOR: Record<string, string> = {
  payment: 'bg-secondary/20 text-secondary ring-1 ring-secondary/30',
  refund: 'bg-accent text-accent-foreground ring-1 ring-border',
  payment_reversal:
    'bg-destructive/20 text-destructive ring-1 ring-destructive/30',
  authorization: 'bg-primary/20 text-primary ring-1 ring-primary/30',
  tax_withheld: 'bg-muted text-muted-foreground ring-1 ring-border',
}
const TYPE_FALLBACK = 'bg-muted text-muted-foreground ring-1 ring-border'

export function PaymentTable({ payload }: { payload: PaymentTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () =>
      sortByKey(
        payload.payments,
        (r) => {
          switch (sortKey) {
            case 'amount':
              return r.amount
            case 'payment_date':
              return r.payment_date
            case 'created_at':
              return r.created_at
            case 'type':
              return r.type
          }
        },
        sortDir
      ),
    [payload.payments, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('desc')
    }
  }

  const columns: ColumnDef<PaymentRow>[] = [
    {
      key: 'external_id',
      header: 'External ID',
      className: 'font-mono text-xs',
      render: (r) => r.external_id || <Dim>—</Dim>,
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'text-secondary font-mono text-xs',
      render: (r) => shortId(r.customer_id, 10),
    },
    {
      key: 'invoice',
      header: 'Invoice',
      className: 'text-secondary font-mono text-xs',
      render: (r) => shortId(r.invoice_id, 10),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) =>
        r.type ? (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs ${TYPE_COLOR[r.type] || TYPE_FALLBACK}`}
          >
            {r.type}
          </span>
        ) : (
          <Dim>—</Dim>
        ),
    },
    {
      key: 'method',
      header: 'Method',
      className: 'text-xs',
      render: (r) => r.payment_method || <Dim>—</Dim>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (r) => {
        const negative = r.amount != null && r.amount < 0
        const refund = r.type === 'refund' || r.type === 'payment_reversal'
        return (
          <span className={negative || refund ? 'text-destructive' : ''}>
            {fmtMoney(r.amount, r.currency || cur)}
          </span>
        )
      },
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.payment_date),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDateTime(r.created_at),
    },
  ]

  return (
    <DataTable
      title="Payments"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No payments match."
      rowKey={(r, i) => r.id || i}
      hoverRows={false}
    />
  )
}
