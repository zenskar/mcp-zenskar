import { useMemo, useState } from 'react'

import type { AggregateRow, AggregateTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDate, shortId } from './format'

type SortKey = 'name' | 'created_at'

export function AggregateTable({
  payload,
}: {
  payload: AggregateTablePayload
}) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.aggregates,
        (r) => (sortKey === 'name' ? r.name : r.created_at),
        sortDir
      ),
    [payload.aggregates, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<AggregateRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'datasource',
      header: 'Datasource',
      className: 'text-muted-foreground font-mono text-xs',
      render: (r) => shortId(r.datasource, 12),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.created_at),
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/meters/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Aggregates"
      count={payload.total}
      scope={payload.scope}
      rightHint="aka billable metrics"
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No aggregates match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
