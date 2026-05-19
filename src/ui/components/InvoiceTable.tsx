import { useMemo, useState } from 'react'

import type { InvoiceRow, InvoiceTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import {
  Dim,
  daysBetween,
  fmtDate,
  fmtDateTime,
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

export function InvoiceTable({ payload }: { payload: InvoiceTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () =>
      sortByKey(
        payload.invoices,
        (r) => {
          switch (sortKey) {
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
        },
        sortDir
      ),
    [payload.invoices, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('desc')
    }
  }

  const overdueOf = (r: InvoiceRow): number | null => {
    if (!r.due_date || !r.amount_due || r.amount_due <= 0) return null
    const d = daysBetween(r.due_date)
    return d != null && d > 0 ? d : null
  }

  const columns: ColumnDef<InvoiceRow>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice',
      sortable: true,
      className: 'font-mono text-xs',
      render: (r) => r.invoice_number || <Dim>—</Dim>,
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'text-secondary font-mono text-xs',
      render: (r) => shortId(r.customer_id, 10),
    },
    {
      key: 'period',
      header: 'Period',
      className: 'text-xs whitespace-nowrap',
      render: (r) =>
        r.invoice_period_begin && r.invoice_period_end ? (
          `${r.invoice_period_begin.slice(0, 10)} → ${r.invoice_period_end.slice(0, 10)}`
        ) : (
          <Dim>—</Dim>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'invoice_total',
      header: 'Total',
      sortable: true,
      align: 'right',
      render: (r) => fmtMoney(r.invoice_total, cur),
    },
    {
      key: 'amount_due',
      header: 'Due',
      sortable: true,
      align: 'right',
      render: (r) => {
        const overdue = overdueOf(r)
        return (
          <span className={overdue != null ? 'text-destructive font-medium' : ''}>
            {fmtMoney(r.amount_due, cur)}
          </span>
        )
      },
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.due_date),
    },
    {
      key: 'overdue',
      header: 'Overdue',
      align: 'right',
      render: (r) => {
        const overdue = overdueOf(r)
        if (overdue == null)
          return <span className="text-muted-foreground"><Dim>—</Dim></span>
        return (
          <span className="text-destructive font-medium">{overdue}d</span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDateTime(r.created_at),
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/invoices/${r.id}/view`} />,
    },
  ]

  return (
    <DataTable
      title="Invoices"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No invoices match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
