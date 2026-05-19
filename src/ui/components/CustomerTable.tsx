import { useMemo, useState } from 'react'

import type { CustomerRow, CustomerTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDateTime } from './format'

type SortKey = 'name' | 'created_at'

export function CustomerTable({ payload }: { payload: CustomerTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.customers,
        (r) => (sortKey === 'name' ? r.name : (r.created_at ?? null)),
        sortDir
      ),
    [payload.customers, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (c) => c.name || <Dim>—</Dim>,
    },
    {
      key: 'external_id',
      header: 'External ID',
      className: 'font-mono text-xs',
      render: (c) => c.external_id || <Dim>—</Dim>,
    },
    {
      key: 'email',
      header: 'Email',
      className: 'text-secondary',
      render: (c) => c.email || <Dim>—</Dim>,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (c) => fmtDateTime(c.created_at),
    },
    {
      key: 'view',
      header: 'View',
      render: (c) => <ViewButton href={`/customers/${c.id}/view`} />,
    },
  ]

  return (
    <DataTable
      title="Customers"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No customers match."
      rowKey={(c, i) => c.id || i}
    />
  )
}
