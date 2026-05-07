import { callHost, notifyHost } from '../client/postMessage';
import type { ContractDetailPayload, ContractPhase } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, shortId } from './format';

export function ContractDetail({ payload }: { payload: ContractDetailPayload }) {
  const c = payload.contract;
  const phases = payload.phases || [];
  const today = new Date();

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
          <ActionButton onClick={() => fireTool('getContractAmendments', { contractId: c.id })}>Amendments</ActionButton>
          <ActionButton onClick={() => fireTool('listInvoices', { customer_id: c.customer_id, contract_id: c.id })}>Invoices</ActionButton>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md border border-border p-3">
        <Stat label="MRR" value={c.mrr ? fmtMoney(c.mrr.amount, c.mrr.currency) : <Dim>—</Dim>} />
        <Stat label="Total Value" value={c.total_value ? fmtMoney(c.total_value.amount, c.total_value.currency) : <Dim>—</Dim>} />
        <Stat label="Phases" value={c.phase_count != null ? c.phase_count.toString() : <Dim>—</Dim>} />
        <Stat label="Term" value={c.start_date && c.end_date ? <span className="text-sm">{c.start_date.slice(0, 10)} → {c.end_date.slice(0, 10)}</span> : <Dim>—</Dim>} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-border p-3">
        <Field label="Customer">{c.customer_id ? <span className="font-mono text-xs text-[var(--brand-link)]">{shortId(c.customer_id, 14)}</span> : <Dim>—</Dim>}</Field>
        <Field label="External ID">{c.external_id ? <span className="font-mono text-xs">{c.external_id}</span> : <Dim>—</Dim>}</Field>
        <Field label="Renewal Policy">{c.renewal_policy || <Dim>—</Dim>}</Field>
        <Field label="Created">{fmtDate(c.created_at)}</Field>
      </div>

      {phases.length > 0 ? (
        <Section title={`Phases (${phases.length})`}>
          <div className="space-y-2">
            {phases.map((ph, i) => <PhaseRow key={ph.id || i} phase={ph} index={i} today={today} />)}
          </div>
        </Section>
      ) : null}

      {c.custom_attributes && Object.keys(c.custom_attributes).length > 0 ? (
        <Section title="Custom Attributes">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(c.custom_attributes).map(([k, v]) => (
              <div key={k} className="border border-border rounded px-2 py-1">
                <div className="text-muted">{k}</div>
                <div className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {c.notes ? <Section title="Notes"><div className="text-sm">{c.notes}</div></Section> : null}
    </div>
  );
}

function PhaseRow({ phase, index, today }: { phase: ContractPhase; index: number; today: Date }) {
  const start = phase.start_date ? new Date(phase.start_date) : null;
  const end = phase.end_date ? new Date(phase.end_date) : null;
  const isCurrent = start && end && start <= today && today <= end;
  const ringCls = isCurrent ? 'ring-2 ring-[var(--brand-ring)]' : '';
  return (
    <div className={`rounded-md border border-border p-3 ${ringCls}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-medium text-sm">
          <span className="text-muted mr-2">#{index + 1}</span>
          {phase.name || <Dim>Untitled phase</Dim>}
          {isCurrent ? <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">current</span> : null}
        </div>
        <div className="text-xs text-muted whitespace-nowrap">
          {phase.start_date ? phase.start_date.slice(0, 10) : '—'} → {phase.end_date ? phase.end_date.slice(0, 10) : '—'}
        </div>
      </div>
      <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div><span className="text-muted">MRR:</span> <span className="tabular-nums">{phase.mrr ? fmtMoney(phase.mrr.amount, phase.mrr.currency) : '—'}</span></div>
        <div><span className="text-muted">Products:</span> <span className="tabular-nums">{phase.product_count ?? '—'}</span></div>
        {phase.pricing_summary ? <div className="col-span-full sm:col-span-1 text-muted">{phase.pricing_summary}</div> : null}
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
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
