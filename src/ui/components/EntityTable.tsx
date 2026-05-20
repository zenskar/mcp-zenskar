import type { EntityRow, EntityTablePayload } from '../types'
import { type ColumnDef, DataTable, ViewButton } from './DataTable'
import { Dim } from './format'

export function EntityTable({ payload }: { payload: EntityTablePayload }) {
  const columns: ColumnDef<EntityRow>[] = [
    {
      key: 'name',
      header: 'Name',
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
      rows={payload.entities}
      emptyMessage="No business entities to show."
      rightHint={null}
      rowKey={(r, i) => r.id || i}
    />
  )
}
