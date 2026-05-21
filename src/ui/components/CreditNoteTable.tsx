import { useMemo, useState } from 'react'

import type { CreditNoteRow, CreditNoteTablePayload } from '../types'
import { type ColumnDef, DataTable, type SortDir, sortByKey } from './DataTable'
import { Dim, fmtDateTime, fmtMoney, shortId, StatusPill } from './format'

type SortKey = 'amount' | 'created_at' | 'status'

export function CreditNoteTable({
  payload,
}: {
  payload: CreditNoteTablePayload
}) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () =>
      sortByKey(
        payload.credit_notes,
        (r) => {
          switch (sortKey) {
            case 'amount':
              return r.amount
            case 'created_at':
              return r.created_at
            case 'status':
              return r.status
          }
        },
        sortDir
      ),
    [payload.credit_notes, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('desc')
    }
  }

  const columns: ColumnDef<CreditNoteRow>[] = [
    {
      key: 'number',
      header: 'Number',
      className: 'font-mono text-xs',
      render: (r) => r.credit_note_number || <Dim>—</Dim>,
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'text-xs',
      render: (r) =>
        r.customer_name ? (
          r.customer_name
        ) : (
          <span className="text-secondary font-mono">
            {shortId(r.customer_id, 10)}
          </span>
        ),
    },
    {
      key: 'invoice',
      header: 'Invoice',
      className: 'text-xs',
      render: (r) =>
        r.invoice_name ? (
          r.invoice_name
        ) : (
          <span className="text-secondary font-mono">
            {shortId(r.invoice_id, 10)}
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      className: 'text-destructive',
      render: (r) => fmtMoney(r.amount, r.currency || cur),
    },
    {
      key: 'repayment',
      header: 'Repayment',
      className: 'text-xs',
      render: (r) => r.repayment_method || <Dim>—</Dim>,
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
      title="Credit Notes"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No credit notes match."
      rowKey={(r, i) => r.id || i}
      hoverRows={false}
    />
  )
}
