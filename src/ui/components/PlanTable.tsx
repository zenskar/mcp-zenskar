import { useMemo, useState } from 'react'

import type { PlanRow, PlanTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDateTime, StatusPill } from './format'

type SortKey = 'name' | 'created_at'

export function PlanTable({ payload }: { payload: PlanTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.plans,
        (r) => (sortKey === 'name' ? r.name : r.created_at),
        sortDir
      ),
    [payload.plans, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<PlanRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'description',
      header: 'Description',
      className: 'text-muted-foreground text-xs',
      render: (r) => r.description || <Dim>—</Dim>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'plan_version',
      header: 'Version',
      align: 'right',
      render: (r) => r.plan_version ?? <Dim>—</Dim>,
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
      render: (r) => <ViewButton href={`/plansv2/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Plans"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No plans match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
