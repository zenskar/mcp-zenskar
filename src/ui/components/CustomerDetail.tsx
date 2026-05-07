import { callHost, notifyHost } from '../client/postMessage';
import type { CustomerDetailPayload } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, shortId } from './format';

export function CustomerDetail({ payload }: { payload: CustomerDetailPayload }) {
  const c = payload.customer;
  const addr = c.address || {};
  const addrLine = [addr.line1, addr.line2, addr.city, addr.state, addr.zipCode || addr.zip_code, addr.country]
    .filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold m-0 flex items-center gap-2">
            {c.name || <Dim>—</Dim>}
            {c.status ? <StatusPill status={c.status} /> : null}
          </h2>
          <div className="text-xs text-muted font-mono mt-0.5">{c.id}</div>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={() => fireTool('listInvoices', { customer_id: c.id })}>Invoices</ActionButton>
          <ActionButton onClick={() => fireTool('listContracts', { customer_id: c.id })}>Contracts</ActionButton>
          <ActionButton onClick={() => fireTool('listCustomerAddresses', { customerId: c.id })}>Addresses</ActionButton>
        </div>
      </header>

      <Grid>
        <Field label="External ID">{c.external_id ? <span className="font-mono text-xs">{c.external_id}</span> : <Dim>—</Dim>}</Field>
        <Field label="Email">{c.email || <Dim>—</Dim>}</Field>
        <Field label="Phone">{c.phone || <Dim>—</Dim>}</Field>
        <Field label="Business Entity">{c.business_entity_id ? <span className="font-mono text-xs">{shortId(c.business_entity_id, 12)}</span> : <Dim>—</Dim>}</Field>
        <Field label="Created">{fmtDate(c.created_at)}</Field>
        <Field label="Last Activity">{fmtDate(c.last_activity_at)}</Field>
      </Grid>

      <Grid cols={3}>
        <Stat label="Invoices" value={c.invoice_count != null ? c.invoice_count.toLocaleString() : <Dim>—</Dim>} />
        <Stat label="MRR" value={c.mrr ? fmtMoney(c.mrr.amount, c.mrr.currency) : <Dim>—</Dim>} />
        <Stat
          label="Outstanding"
          value={c.outstanding ? fmtMoney(c.outstanding.amount, c.outstanding.currency) : <Dim>—</Dim>}
          tone={c.outstanding && c.outstanding.amount > 0 ? 'warn' : 'ok'}
        />
      </Grid>

      {addrLine ? (
        <Section title="Primary Address">
          <div className="text-sm">{addrLine}</div>
        </Section>
      ) : null}

      {(c.communications_enabled != null || c.auto_charge_enabled != null) ? (
        <Section title="Settings">
          <div className="flex gap-3 flex-wrap text-sm">
            <Toggle label="Communications" on={c.communications_enabled ?? null} />
            <Toggle label="Auto-charge" on={c.auto_charge_enabled ?? null} />
          </div>
        </Section>
      ) : null}

      {c.custom_data && Object.keys(c.custom_data).length > 0 ? (
        <Section title="Custom Data">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(c.custom_data).map(([k, v]) => (
              <div key={k} className="border border-border rounded px-2 py-1">
                <div className="text-muted">{k}</div>
                <div className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function fireTool(name: string, args: Record<string, unknown>) {
  callHost('tools/call', { name, arguments: args })
    .catch(() => notifyHost('ui/message', { text: `Run: ${name} ${JSON.stringify(args)}` }));
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1 text-xs rounded border border-border bg-bg hover:bg-[var(--brand-accent)] hover:text-[var(--brand-accent-fg)] transition-colors">
      {children}
    </button>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-3 rounded-md border border-border p-3`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'ok' | 'warn' }) {
  const cls = tone === 'warn' ? 'text-[var(--color-status-overdue)]' : '';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted">{title}</div>
      {children}
    </section>
  );
}

function Toggle({ label, on }: { label: string; on: boolean | null }) {
  if (on === null) return <span className="text-muted text-xs">{label}: <Dim>?</Dim></span>;
  const cls = on ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{label}: {on ? 'on' : 'off'}</span>;
}
