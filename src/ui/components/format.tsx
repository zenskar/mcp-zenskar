import type { JSX } from 'react'

import type { Money } from '../types'

export function Dim({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>
}

export function fmtDate(s: string | null | undefined): string | JSX.Element {
  if (!s) return <Dim>—</Dim>
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return <Dim>—</Dim>
  return d.toISOString().slice(0, 10)
}

export function daysBetween(
  from: string | null | undefined,
  to: Date = new Date()
): number | null {
  if (!from) return null
  const d = new Date(from)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((to.getTime() - d.getTime()) / 86400000)
}

export function fmtMoney(
  amount: number | null | undefined,
  currency: string = 'USD'
): string | JSX.Element {
  if (amount == null || !Number.isFinite(amount)) return <Dim>—</Dim>
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export function fmtMoneyObj(m: Money | null | undefined): string | JSX.Element {
  if (!m) return <Dim>—</Dim>
  if (m.display) return m.display
  if (m.value == null) return <Dim>—</Dim>
  return fmtMoney(m.value, m.unit || 'USD')
}

export function shortId(
  id: string | null | undefined,
  len = 8
): string | JSX.Element {
  if (!id) return <Dim>—</Dim>
  return id.length <= len ? id : id.slice(0, len) + '…'
}

const PILL_SUCCESS = 'bg-secondary/15 text-secondary ring-1 ring-secondary/30'
const PILL_WARNING = 'bg-primary/15 text-primary ring-1 ring-primary/30'
const PILL_DANGER =
  'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
const PILL_NEUTRAL = 'bg-muted text-muted-foreground ring-1 ring-border'
const PILL_INFO = 'bg-accent text-accent-foreground ring-1 ring-border'
const PILL_SOFT_SUCCESS =
  'bg-secondary/8 text-secondary ring-1 ring-secondary/20'

export const STATUS_COLOR_MAP: Record<string, string> = {
  paid: PILL_SUCCESS,
  approved: PILL_SUCCESS,
  active: PILL_SUCCESS,
  open: PILL_WARNING,
  pending: PILL_WARNING,
  paused: PILL_WARNING,
  overdue: PILL_DANGER,
  failed: PILL_DANGER,
  draft: PILL_NEUTRAL,
  void: PILL_NEUTRAL,
  voided: PILL_NEUTRAL,
  churned: PILL_NEUTRAL,
  refunded: PILL_INFO,
  scheduled: PILL_SOFT_SUCCESS,
}

const STATUS_PILL_FALLBACK = PILL_NEUTRAL

export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return <Dim>—</Dim>
  const cls = STATUS_COLOR_MAP[status.toLowerCase()] || STATUS_PILL_FALLBACK
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  )
}
