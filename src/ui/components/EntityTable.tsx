import { useMemo, useState } from 'react'

import type { EntityRow, EntityTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim } from './format'

type SortKey = 'name'

export function EntityTable({ payload }: { payload: EntityTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(
    () => sortByKey(payload.entities, (r) => r.name, sortDir),
    [payload.entities, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('asc')
    }
  }

  const columns: ColumnDef<EntityRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'email',
      header: 'Email',
      className: 'text-secondary text-xs',
      render: (r) => r.email || <Dim>—</Dim>,
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'font-mono text-xs',
      render: (r) => r.phone_number || <Dim>—</Dim>,
    },
    {
      key: 'country',
      header: 'Country',
      className: 'text-xs',
      render: (r) => r.country || <Dim>—</Dim>,
    },
    {
      key: 'default',
      header: 'Default',
      className: 'text-xs',
      render: (r) =>
        r.is_default == null ? <Dim>—</Dim> : r.is_default ? 'yes' : 'no',
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => (
        <ViewButton href={`/settings/tax-configuration/entity/${r.id}`} />
      ),
    },
  ]

  return (
    <DataTable
      title="Business Entities"
      count={payload.total}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No business entities to show."
      rightHint={null}
      rowKey={(r, i) => r.id || i}
    />
  )
}
