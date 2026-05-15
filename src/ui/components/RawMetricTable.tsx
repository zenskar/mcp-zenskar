import { useMemo, useState } from 'react'

import type { RawMetricRow, RawMetricTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDate } from './format'

type SortKey = 'name' | 'created_at'

export function RawMetricTable({
  payload,
}: {
  payload: RawMetricTablePayload
}) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.raw_metrics,
        (r) => (sortKey === 'name' ? r.name : r.created_at),
        sortDir
      ),
    [payload.raw_metrics, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<RawMetricRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'api_slug',
      header: 'API Slug',
      className: 'font-mono text-xs',
      render: (r) => r.api_slug || <Dim>—</Dim>,
    },
    {
      key: 'upload',
      header: 'Upload Enabled',
      className: 'text-xs',
      render: (r) =>
        r.usage_upload_enabled == null
          ? <Dim>—</Dim>
          : r.usage_upload_enabled
            ? 'yes'
            : 'no',
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
      render: (r) => <ViewButton href={`/meters/raw-metrics/${r.id}/view`} />,
    },
  ]

  return (
    <DataTable
      title="Raw Metrics"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No raw metrics match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
