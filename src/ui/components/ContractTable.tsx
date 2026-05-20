import { useMemo, useState } from 'react'

import type { ContractRow, ContractTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, daysBetween, fmtDate, shortId, StatusPill } from './format'

type SortKey = 'name' | 'start_date' | 'end_date' | 'created_at'

export function ContractTable({ payload }: { payload: ContractTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.contracts,
        (r) => {
          switch (sortKey) {
            case 'name':
              return r.name
            case 'start_date':
              return r.start_date
            case 'end_date':
              return r.end_date
            case 'created_at':
              return r.created_at ?? null
          }
        },
        sortDir
      ),
    [payload.contracts, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<ContractRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'text-secondary font-mono text-xs',
      render: (r) => shortId(r.customer_id, 10),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'currency',
      header: 'Currency',
      className: 'font-mono text-xs',
      render: (r) => r.currency || <Dim>—</Dim>,
    },
    {
      key: 'start_date',
      header: 'Start',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.start_date),
    },
    {
      key: 'end_date',
      header: 'End',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.end_date),
    },
    {
      key: 'days_left',
      header: 'Days Left',
      align: 'right',
      render: (r) => {
        const daysLeft = r.end_date ? -1 * (daysBetween(r.end_date) ?? 0) : null
        if (daysLeft == null) return <Dim>—</Dim>
        const expired = daysLeft < 0
        const expiringSoon = !expired && daysLeft <= 30
        const cls = expired
          ? 'text-destructive font-medium'
          : expiringSoon
            ? 'text-primary font-medium'
            : 'text-muted-foreground'
        return (
          <span className={cls}>
            {expired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
          </span>
        )
      },
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/contractsv2/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Contracts"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No contracts match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
