import { useMemo, useState } from 'react'

import type { ProductRow, ProductTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, fmtDate } from './format'

type SortKey = 'name' | 'created_at'

export function ProductTable({ payload }: { payload: ProductTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.products,
        (r) => (sortKey === 'name' ? r.name : r.created_at),
        sortDir
      ),
    [payload.products, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const columns: ColumnDef<ProductRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'sku',
      header: 'SKU',
      className: 'font-mono text-xs',
      render: (r) => r.sku || <Dim>—</Dim>,
    },
    {
      key: 'type',
      header: 'Type',
      className: 'text-xs',
      render: (r) => r.product_type || <Dim>—</Dim>,
    },
    {
      key: 'active',
      header: 'Active',
      className: 'text-xs',
      render: (r) =>
        r.is_active == null ? <Dim>—</Dim> : r.is_active ? 'yes' : 'no',
    },
    {
      key: 'description',
      header: 'Description',
      className: 'text-muted-foreground text-xs',
      render: (r) => r.description || <Dim>—</Dim>,
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
      render: (r) => <ViewButton href={`/products/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Products"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No products match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
