import { useMemo, useState } from 'react'

import type { JobRow, JobTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDateTime, StatusPill } from './format'

type SortKey = 'name' | 'created_at' | 'status'

export function JobTable({ payload }: { payload: JobTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.jobs,
        (r) => {
          switch (sortKey) {
            case 'name':
              return r.name
            case 'created_at':
              return r.created_at
            case 'status':
              return r.status
          }
        },
        sortDir
      ),
    [payload.jobs, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('desc')
    }
  }

  const counts = payload.status_counts || {}
  const statusChips = (
    <div className="flex flex-wrap gap-1.5 text-xs">
      {Object.entries(counts).map(([s, n]) => (
        <span key={s} className="bg-muted rounded-full px-2 py-0.5">
          {s}: <span className="font-medium tabular-nums">{n}</span>
        </span>
      ))}
    </div>
  )

  const columns: ColumnDef<JobRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'type',
      header: 'Type',
      className: 'text-xs',
      render: (r) => r.job_type || <Dim>—</Dim>,
    },
    {
      key: 'resource',
      header: 'Resource',
      className: 'text-xs',
      render: (r) => r.resource || <Dim>—</Dim>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'description',
      header: 'Description',
      className: 'text-muted-foreground max-w-xs truncate text-xs',
      render: (r) => r.description || <Dim>—</Dim>,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'text-xs whitespace-nowrap',
      render: (r) => fmtDateTime(r.created_at),
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/jobs/${r.id}/view`} />,
    },
  ]

  return (
    <DataTable
      title="Jobs"
      count={payload.total}
      rightHint={statusChips}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No jobs match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
