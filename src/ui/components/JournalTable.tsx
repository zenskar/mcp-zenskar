import { useMemo } from 'react'

import type { JournalEntryRow, JournalTablePayload } from '../types'
import { type ColumnDef, DataTable } from './DataTable'
import { Dim, fmtDateTime, fmtMoney, StatusPill } from './format'

export function JournalTable({ payload }: { payload: JournalTablePayload }) {
  const cur = payload.default_currency || 'USD'
  const rows = payload.entries

  const totals = useMemo(() => {
    let d = 0
    let c = 0
    for (const r of rows) {
      if (Number.isFinite(r.total_debit)) d += r.total_debit!
      if (Number.isFinite(r.total_credit)) c += r.total_credit!
    }
    return { d, c }
  }, [rows])

  const totalsHint = (
    <>
      Σ debit {fmtMoney(totals.d, cur)} · Σ credit {fmtMoney(totals.c, cur)}
    </>
  )

  const columns: ColumnDef<JournalEntryRow>[] = [
    {
      key: 'posted_at',
      header: 'Posted',
      className: 'whitespace-nowrap',
      render: (r) => fmtDateTime(r.posted_at),
    },
    {
      key: 'event',
      header: 'Event',
      className: 'text-xs',
      render: (r) => r.event || <Dim>—</Dim>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status_type} />,
    },
    {
      key: 'lines',
      header: 'Lines',
      align: 'right',
      render: (r) => r.line_count ?? <Dim>—</Dim>,
    },
    {
      key: 'total_debit',
      header: 'Σ Debit',
      align: 'right',
      render: (r) =>
        r.total_debit != null ? (
          fmtMoney(r.total_debit, r.currency || cur)
        ) : (
          <Dim>—</Dim>
        ),
    },
    {
      key: 'total_credit',
      header: 'Σ Credit',
      align: 'right',
      render: (r) =>
        r.total_credit != null ? (
          fmtMoney(r.total_credit, r.currency || cur)
        ) : (
          <Dim>—</Dim>
        ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'text-muted-foreground max-w-xs truncate text-xs',
      render: (r) => r.description || <Dim>—</Dim>,
    },
  ]

  return (
    <DataTable
      title="Journal Entries"
      count={payload.total}
      scope={payload.scope}
      rightHint={totalsHint}
      columns={columns}
      rows={rows}
      emptyMessage="No entries match."
      rowKey={(r, i) => r.id || i}
      hoverRows={false}
    />
  )
}
