import type {
  ContractDetailPayload,
  ContractPhase,
  PhasePricing,
  PhasePricingFeature,
  PhasePricingMatrixRow,
} from '../types'
import { Field, Section } from './DetailScaffold'
import { Dim, fmtDate, StatusPill } from './format'

export function ContractDetail({
  payload,
}: {
  payload: ContractDetailPayload
}) {
  const c = payload.contract
  const phases = payload.phases || []
  const today = new Date()

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex min-w-0 items-center gap-2 text-lg font-semibold">
            <span className="min-w-0 truncate">{c.name || <Dim>—</Dim>}</span>
            {c.status ? <StatusPill status={c.status} /> : null}
          </h2>
          <div className="text-secondary mt-0.5 font-mono text-xs">{c.id}</div>
        </div>
        <div className="flex gap-2">
          {c.contract_link ? (
            <a
              href={c.contract_link}
              target="_blank"
              rel="noreferrer"
              className="border-border bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground rounded border px-3 py-1 text-xs transition-colors"
            >
              Open
            </a>
          ) : null}
        </div>
      </header>

      <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
        <Field label="Customer">
          {c.customer_name ? (
            <div>
              <div className="truncate text-sm">{c.customer_name}</div>
              {c.customer_id ? (
                <div className="text-muted-foreground font-mono text-xs break-all">
                  {c.customer_id}
                </div>
              ) : null}
            </div>
          ) : c.customer_id ? (
            <span className="text-secondary font-mono text-xs break-all">
              {c.customer_id}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Currency">
          {c.currency ? (
            <span className="font-mono text-xs">{c.currency}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Type">{c.contract_type || <Dim>—</Dim>}</Field>
        <Field label="Term">
          {c.start_date && c.end_date ? (
            <span className="text-sm">
              {c.start_date.slice(0, 10)} → {c.end_date.slice(0, 10)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Anchor Date">{fmtDate(c.anchor_date)}</Field>
        <Field label="Renewal Policy">{c.renewal_policy || <Dim>—</Dim>}</Field>
        <Field label="Plan">
          {c.plan_id ? (
            <span className="text-secondary font-mono text-xs break-all">
              {c.plan_id}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Created">{fmtDate(c.created_at)}</Field>
      </div>

      {c.description ? (
        <Section title="Description">
          <div className="text-sm">{c.description}</div>
        </Section>
      ) : null}

      {c.tags && c.tags.length > 0 ? (
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {c.tags.map((tag, i) => (
              <span
                key={i}
                className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {phases.length > 0 ? (
        <Section title={`Phases (${phases.length})`}>
          <div className="space-y-2">
            {phases.map((ph, i) => (
              <PhaseRow key={ph.id || i} phase={ph} index={i} today={today} />
            ))}
          </div>
        </Section>
      ) : null}

      {c.custom_attributes && Object.keys(c.custom_attributes).length > 0 ? (
        <Section title="Custom Attributes">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(c.custom_attributes).map(([k, v]) => (
              <div key={k} className="border-border rounded border px-2 py-1">
                <div className="text-muted-foreground">{k}</div>
                <div className="line-clamp-2 break-all font-mono">
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

function PhaseRow({
  phase,
  index,
  today,
}: {
  phase: ContractPhase
  index: number
  today: Date
}) {
  const start = phase.start_date ? new Date(phase.start_date) : null
  const end = phase.end_date ? new Date(phase.end_date) : null
  const isCurrent = start && end && start <= today && today <= end
  const ringCls = isCurrent ? 'ring-2 ring-ring' : ''
  const pricings = phase.pricings || []
  return (
    <div className={`border-border rounded-md border p-3 ${ringCls}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 text-sm font-medium">
          <span className="text-muted-foreground mr-2">#{index + 1}</span>
          <span className="wrap-break-word">
            {phase.name || <Dim>Untitled phase</Dim>}
          </span>
          {isCurrent ? (
            <span className="bg-secondary/20 text-secondary ring-secondary/30 ml-2 rounded-full px-2 py-0.5 text-xs ring-1">
              current
            </span>
          ) : null}
        </div>
        <div className="text-muted-foreground text-xs whitespace-nowrap">
          {phase.start_date ? phase.start_date.slice(0, 10) : '—'} →{' '}
          {phase.end_date ? phase.end_date.slice(0, 10) : '—'}
        </div>
      </div>
      {pricings.length > 0 ? (
        <div className="mt-2 space-y-2">
          {pricings.map((p, i) => (
            <PricingCard key={p.id || i} p={p} />
          ))}
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div>
            <span className="text-muted-foreground">Products:</span>{' '}
            <span className="tabular-nums">{phase.product_count ?? '—'}</span>
          </div>
          {phase.pricing_summary ? (
            <div className="text-muted-foreground col-span-full sm:col-span-2">
              {phase.pricing_summary}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function fmtCadence(iso: string): string {
  const m = iso.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/)
  if (!m) return iso
  const y = Number(m[1] || 0)
  const mo = Number(m[2] || 0)
  const w = Number(m[3] || 0)
  const d = Number(m[4] || 0)
  const parts: string[] = []
  if (y) parts.push(`${y} year${y > 1 ? 's' : ''}`)
  if (mo) parts.push(`${mo} month${mo > 1 ? 's' : ''}`)
  if (w) parts.push(`${w} week${w > 1 ? 's' : ''}`)
  if (d) parts.push(`${d} day${d > 1 ? 's' : ''}`)
  return parts.join(' ') || iso
}

function fmtPrice(
  amount: number | number[] | null | undefined,
  currency?: string | null
): string {
  if (Array.isArray(amount)) return '—'
  if (amount == null || !Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency || 'USD'} ${amount}`
  }
}

// ── Pricing card (mirrors PhaseCard → ProductPricingDetailsCardV2) ──

function PricingCard({ p }: { p: PhasePricing }) {
  const cur = p.currency
  const hasFeatures = p.features && p.features.length > 0
  return (
    <div className="border-border rounded-md border bg-card px-3 py-2.5">
      <div className="flex w-full flex-col gap-2.5">
        {/* Header: product name + type badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium">
              {p.product_name || <Dim>Unnamed product</Dim>}
            </span>
            {p.product_type ? (
              <span className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 text-xs font-medium uppercase">
                {p.product_type}
              </span>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {p.description ? (
          <div className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
            {p.description}
          </div>
        ) : null}

        <hr className="border-border m-0" />

        {/* Pricing summary */}
        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          <PriceDisplay p={p} />

          {/* Quantity */}
          {p.pricing_model !== 'flat_fee' ? (
            <LabelValue
              label={
                p.quantity_type === 'metered'
                  ? `Billable Metric${p.quantity_unit ? ` (${p.quantity_unit})` : ''}`
                  : 'Quantity'
              }
            >
              {p.quantity_type === 'fixed' && p.quantity_value != null ? (
                <span>
                  {p.quantity_value}
                  {p.quantity_unit ? ` ${p.quantity_unit}` : ''}
                </span>
              ) : p.quantity_type === 'metered' ? (
                <span className="truncate">
                  {p.meter_name || <Dim>No metric</Dim>}
                </span>
              ) : (
                <Dim>—</Dim>
              )}
            </LabelValue>
          ) : null}

          {/* Billing cadence */}
          {p.billing_cadence ? (
            <LabelValue
              label={`Billing Cadence (${p.is_recurring ? 'Recurring' : 'One Time'})`}
            >
              {p.billing_timing ? `${p.billing_timing} - ` : ''}Every{' '}
              {fmtCadence(p.billing_cadence)}
            </LabelValue>
          ) : null}

          {/* Product period */}
          {p.start_date ? (
            <LabelValue label="Product Period">
              {p.start_date.slice(0, 10)} →{' '}
              {p.end_date ? p.end_date.slice(0, 10) : 'Forever'}
            </LabelValue>
          ) : null}
        </div>

        {/* Features */}
        {hasFeatures ? <FeaturesSection features={p.features!} /> : null}
      </div>
    </div>
  )
}

function LabelValue({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      <div className="text-xs">{children}</div>
    </div>
  )
}

function pricingModelLabel(model?: string | null): string {
  if (!model) return 'Unknown'
  return model.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Price display per pricing type ──

function PriceDisplay({ p }: { p: PhasePricing }) {
  const cur = p.currency
  const curTag = cur ? ` (${cur})` : ''
  switch (p.pricing_model) {
    case 'flat_fee':
      return (
        <LabelValue label={`Flat Fee${curTag}`}>
          <span className="font-semibold tabular-nums">
            {fmtPrice(p.unit_amount, cur)}
          </span>
        </LabelValue>
      )
    case 'per_unit':
    case 'per_unit_pricing':
      return (
        <LabelValue label={`Per Unit Price${curTag}`}>
          <span className="font-semibold tabular-nums">
            {fmtPrice(p.unit_amount, cur)}
          </span>
        </LabelValue>
      )
    case 'percent':
    case 'percent_pricing':
      return (
        <LabelValue label={`Percent Pricing${curTag}`}>
          <span className="font-semibold tabular-nums">
            {p.unit_amount != null ? `${p.unit_amount}%` : '—'}
          </span>
        </LabelValue>
      )
    case 'package':
    case 'package_pricing':
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          <LabelValue label={`Package Price${curTag}`}>
            <span className="font-semibold tabular-nums">
              {fmtPrice(p.unit_amount, cur)}
            </span>
          </LabelValue>
          {p.package_size ? (
            <LabelValue label="Package Size">
              <span>{p.package_size}</span>
            </LabelValue>
          ) : null}
        </div>
      )
    case 'volume':
    case 'volume_pricing':
    case 'tiered':
    case 'tiered_pricing':
    case 'step':
    case 'step_pricing':
      return (
        <div className="w-full">
          <div className="text-muted-foreground mb-1 text-xs font-medium">
            {pricingModelLabel(p.pricing_model)} Price{curTag}
          </div>
          <TierTable tiers={p.tiers} currency={cur} />
        </div>
      )
    case 'volume_with_flat_fee':
    case 'tiered_with_flat_fee':
      return (
        <div className="w-full">
          <div className="text-muted-foreground mb-1 text-xs font-medium">
            {pricingModelLabel(p.pricing_model)} Price{curTag}
          </div>
          <TierTable tiers={p.tiers} currency={cur} showFlatFee />
        </div>
      )
    case 'matrix':
    case 'matrix_pricing':
      return (
        <div className="w-full">
          <div className="text-muted-foreground mb-1 text-xs font-medium">
            Matrix Pricing{curTag}
          </div>
          <MatrixTable matrix={p.matrix} currency={cur} />
          {p.unit_amount != null ? (
            <div className="text-muted-foreground mt-1.5 text-xs">
              Default price:{' '}
              <span className="font-semibold">
                {fmtPrice(p.unit_amount, cur)}
              </span>
            </div>
          ) : null}
        </div>
      )
    case 'custom':
    case 'custom_pricing':
      return (
        <LabelValue label="Custom Pricing">
          <span className="text-muted-foreground">Custom script</span>
        </LabelValue>
      )
    default:
      return p.unit_amount != null ? (
        <LabelValue label={`Price${curTag}`}>
          <span className="font-semibold tabular-nums">
            {fmtPrice(p.unit_amount, cur)}
          </span>
        </LabelValue>
      ) : (
        <Dim>—</Dim>
      )
  }
}

// ── Tier table ──

function TierTable({
  tiers,
  currency,
  showFlatFee,
}: {
  tiers?: PhasePricing['tiers']
  currency?: string | null
  showFlatFee?: boolean
}) {
  if (!tiers || tiers.length === 0)
    return <span className="text-muted-foreground text-xs">No tiers</span>
  return (
    <div className="max-h-48 overflow-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Pricing tiers</caption>
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left">
            <th scope="col" className="py-0.5 pr-2 font-medium">
              Min
            </th>
            <th scope="col" className="py-0.5 pr-2 font-medium">
              Max
            </th>
            <th scope="col" className="py-0.5 pr-2 text-right font-medium">
              Unit Price
            </th>
            {showFlatFee ? (
              <th scope="col" className="py-0.5 text-right font-medium">
                Flat Fee
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {tiers.map((t, i) => (
            <tr key={i} className="border-border/50 border-b last:border-0">
              <td className="py-0.5 pr-2 tabular-nums">
                {t.min_quantity ?? 0}
              </td>
              <td className="py-0.5 pr-2 tabular-nums">
                {t.max_quantity ?? '∞'}
              </td>
              <td className="py-0.5 pr-2 text-right tabular-nums">
                {fmtPrice(t.unit_amount, currency)}
              </td>
              {showFlatFee ? (
                <td className="py-0.5 text-right tabular-nums">
                  {t.flat_fee != null ? fmtPrice(t.flat_fee, currency) : '—'}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Matrix table ──

function MatrixTable({
  matrix,
  currency,
}: {
  matrix?: PhasePricingMatrixRow[] | null
  currency?: string | null
}) {
  if (!matrix || matrix.length === 0)
    return (
      <span className="text-muted-foreground text-xs">
        Matrix pricing (no data)
      </span>
    )
  return (
    <div className="max-h-48 overflow-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Matrix pricing dimensions</caption>
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left">
            <th scope="col" className="py-0.5 pr-2 font-medium">
              Dimension
            </th>
            <th scope="col" className="py-0.5 pr-2 font-medium">
              Alias
            </th>
            <th scope="col" className="py-0.5 text-right font-medium">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((r, i) => (
            <tr key={i} className="border-border/50 border-b last:border-0">
              <td className="py-0.5 pr-2">{r.dimension ?? '—'}</td>
              <td className="py-0.5 pr-2">{r.display_alias ?? '—'}</td>
              <td className="py-0.5 text-right tabular-nums">
                {fmtPrice(r.price, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Features (mirrors FeaturesSummaryV2) ──

function FeaturesSection({ features }: { features: PhasePricingFeature[] }) {
  const grouped = new Map<string, PhasePricingFeature[]>()
  for (const f of features) {
    const list = grouped.get(f.type) || []
    list.push(f)
    grouped.set(f.type, list)
  }
  return (
    <div className="mt-1 space-y-2">
      <div className="text-muted-foreground text-xs font-medium uppercase">
        Features
      </div>
      {Array.from(grouped.entries()).map(([type, items]) => (
        <div key={type} className="flex flex-wrap items-start gap-2">
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-xs">
            {type}
          </span>
          <div className="flex flex-col gap-0.5">
            {items.map((f, i) => (
              <div
                key={i}
                className="text-muted-foreground break-words text-xs"
              >
                {f.label ? (
                  <span className="mr-2 font-medium">{f.label}</span>
                ) : null}
                {f.summary}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
