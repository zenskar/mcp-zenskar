import { useMemo, useState } from 'react'

import type { JournalEntryRow, JournalTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  sortByKey,
} from './DataTable'
import { Dim, fmtDateTime, fmtMoney, StatusPill } from './format'

type SortKey = 'posted_at' | 'event' | 'total_debit' | 'total_credit'

export function JournalTable({ payload }: { payload: JournalTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const cur = payload.default_currency || 'USD'

  const rows = useMemo(
    () =>
      sortByKey(
        payload.entries,
        (r) => {
          switch (sortKey) {
            case 'posted_at':
              return r.posted_at
            case 'event':
              return r.event
            case 'total_debit':
              return r.total_debit
            case 'total_credit':
              return r.total_credit
          }
        },
        sortDir
      ),
    [payload.entries, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'posted_at' ? 'desc' : 'asc')
    }
  }

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
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDateTime(r.posted_at),
    },
    {
      key: 'event',
      header: 'Event',
      sortable: true,
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
      sortable: true,
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
      sortable: true,
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
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No entries match."
      rowKey={(r, i) => r.id || i}
      hoverRows={false}
    />
  )
}
