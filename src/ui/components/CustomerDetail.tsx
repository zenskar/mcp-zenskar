import type { CustomerDetailPayload } from '../types'
import { Field, Section } from './DetailScaffold'
import { Dim, fmtDate } from './format'

export function CustomerDetail({
  payload,
}: {
  payload: CustomerDetailPayload
}) {
  const c = payload.customer
  const addr = c.address || {}
  const addrLine = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.zipCode || addr.zip_code,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ')

  const ship = c.ship_to_address || {}
  const shipLine = [
    ship.line1,
    ship.line2,
    ship.city,
    ship.state,
    ship.zipCode || ship.zip_code,
    ship.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold">
            {c.name || <Dim>—</Dim>}
          </h2>
          <div className="text-secondary mt-0.5 font-mono text-xs">
            {c.id}
          </div>
        </div>
      </header>

      <Grid>
        <Field label="External ID">
          {c.external_id ? (
            <span className="font-mono text-xs">{c.external_id}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Email">{c.email || <Dim>—</Dim>}</Field>
        <Field label="Phone">{c.phone || <Dim>—</Dim>}</Field>
        <Field label="Business Entity">
          {c.business_entity_name ? (
            <div>
              <div>{c.business_entity_name}</div>
              {c.business_entity_id ? (
                <div className="text-muted-foreground font-mono text-[11px] break-all">
                  {c.business_entity_id}
                </div>
              ) : null}
            </div>
          ) : c.business_entity_id ? (
            <span className="text-secondary font-mono text-xs break-all">
              {c.business_entity_id}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Created">{fmtDate(c.created_at)}</Field>
        <Field label="Updated">{fmtDate(c.updated_at)}</Field>
      </Grid>

      {addrLine ? (
        <Section title="Primary Address">
          <div className="text-sm">{addrLine}</div>
        </Section>
      ) : null}

      {shipLine && shipLine !== addrLine ? (
        <Section title="Ship-to Address">
          <div className="text-sm">{shipLine}</div>
        </Section>
      ) : null}

      {c.communications_enabled != null || c.auto_charge_enabled != null ? (
        <Section title="Settings">
          <div className="flex flex-wrap gap-3 text-sm">
            <Toggle
              label="Communications"
              on={c.communications_enabled ?? null}
            />
            <Toggle label="Auto-charge" on={c.auto_charge_enabled ?? null} />
          </div>
        </Section>
      ) : null}

      {c.default_payment_method ? (
        <Section title="Payment Method">
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-muted rounded px-2 py-0.5 text-xs">
              {(c.default_payment_method.type || 'unknown').replace(/_/g, ' ')}
            </span>
            {c.default_payment_method.brand ? (
              <span>{c.default_payment_method.brand}</span>
            ) : null}
            {c.default_payment_method.last4 ? (
              <span className="font-mono">
                •••• {c.default_payment_method.last4}
              </span>
            ) : null}
            {c.default_payment_method.connector_name ? (
              <span className="text-muted-foreground text-xs">
                via {c.default_payment_method.connector_name}
              </span>
            ) : null}
          </div>
        </Section>
      ) : null}

      {c.tax_info && c.tax_info.length > 0 ? (
        <Section title="Tax Info">
          <div className="space-y-1">
            {c.tax_info.map((t, i) => (
              <div key={i} className="flex gap-3 text-sm">
                {t.tax_code ? (
                  <span className="bg-muted rounded px-2 py-0.5 text-xs">
                    {t.tax_code}
                  </span>
                ) : null}
                {t.tax_id ? (
                  <span className="font-mono text-xs">{t.tax_id}</span>
                ) : null}
                {t.country_code ? (
                  <span className="text-muted-foreground text-xs">
                    {t.country_code}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {c.contacts && c.contacts.length > 0 ? (
        <Section title={`Contacts (${c.contacts.length})`}>
          <div className="space-y-2">
            {c.contacts.map((ct, i) => (
              <div
                key={i}
                className="border-border flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">
                    {ct.name || <Dim>—</Dim>}
                  </div>
                  {ct.email ? (
                    <div className="text-muted-foreground text-xs">
                      {ct.email}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {ct.send_invoice ? (
                    <span className="bg-secondary/20 text-secondary ring-secondary/30 rounded-full px-2 py-0.5 text-xs ring-1">
                      invoice
                    </span>
                  ) : null}
                  {ct.send_contract ? (
                    <span className="bg-secondary/20 text-secondary ring-secondary/30 rounded-full px-2 py-0.5 text-xs ring-1">
                      contract
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {c.custom_data && Object.keys(c.custom_data).length > 0 ? (
        <Section title="Custom Data">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(c.custom_data).map(([k, v]) => (
              <div key={k} className="border-border rounded border px-2 py-1">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
      {children}
    </div>
  )
}

function Toggle({ label, on }: { label: string; on: boolean | null }) {
  if (on === null) return null
  const cls = on
    ? 'bg-secondary/20 text-secondary ring-1 ring-secondary/30'
    : 'bg-muted text-muted-foreground ring-1 ring-border'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {label}: {on ? 'on' : 'off'}
    </span>
  )
}
