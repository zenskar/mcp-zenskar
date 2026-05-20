import type { JSX } from 'react'

import type { Money } from '../types'

export function Dim({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parseUTC(s: string | null | undefined): Date | null {
  if (!s) return null
  // Zenskar API returns timestamps without timezone suffix (e.g.
  // "2026-05-19T14:12:07.147536" or "2026-05-12 10:12:12.982899"). JS Date
  // parses those as local time, which drifts by the host offset. Normalize
  // separators and append Z so everything is interpreted as UTC.
  let normalized = s.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized += 'T00:00:00Z'
  } else if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
    normalized += 'Z'
  }
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

export function fmtDate(s: string | null | undefined): string | JSX.Element {
  const d = parseUTC(s)
  if (!d) return <Dim>—</Dim>
  return `${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCDate())}, ${d.getUTCFullYear()}`
}

export function fmtDateTime(
  s: string | null | undefined
): string | JSX.Element {
  const d = parseUTC(s)
  if (!d) return <Dim>—</Dim>
  const hours24 = d.getUTCHours()
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCDate())}, ${d.getUTCFullYear()} ${pad2(hours12)}:${pad2(d.getUTCMinutes())} ${meridiem}`
}

export function daysBetween(
  from: string | null | undefined,
  to: Date = new Date()
): number | null {
  const d = parseUTC(from)
  if (!d) return null
  return Math.floor((to.getTime() - d.getTime()) / 86400000)
}

// Zenskar API returns monetary amounts in minor units (cents). Convert at the
// render boundary so callers can pass raw API values directly.
export function fmtMoney(
  amount: number | null | undefined,
  currency: string = 'USD'
): string | JSX.Element {
  if (amount == null || !Number.isFinite(amount)) return <Dim>—</Dim>
  const dollars = amount / 100
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(dollars)
  } catch {
    return `${currency} ${dollars.toLocaleString()}`
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

const PILL_SUCCESS = 'bg-secondary/20 text-secondary ring-1 ring-secondary/30'
const PILL_WARNING = 'bg-primary/20 text-primary ring-1 ring-primary/30'
const PILL_DANGER =
  'bg-destructive/20 text-destructive ring-1 ring-destructive/30'
const PILL_NEUTRAL = 'bg-muted text-muted-foreground ring-1 ring-border'
const PILL_INFO = 'bg-accent text-accent-foreground ring-1 ring-border'
const PILL_SOFT_SUCCESS =
  'bg-secondary/12 text-secondary ring-1 ring-secondary/20'

export const STATUS_COLOR_MAP: Record<string, string> = {
  // Shared success/positive
  paid: PILL_SUCCESS,
  approved: PILL_SUCCESS,
  active: PILL_SUCCESS,
  success: PILL_SUCCESS,
  posted: PILL_SUCCESS,
  // Invoice / credit note / contract — in flight
  upcoming: PILL_WARNING,
  partially_paid: PILL_WARNING,
  in_progress: PILL_WARNING,
  paused: PILL_WARNING,
  // Errors / disputes
  failed: PILL_DANGER,
  disputed: PILL_DANGER,
  // Inactive / draft / terminal-neutral
  draft: PILL_NEUTRAL,
  void: PILL_NEUTRAL,
  voided: PILL_NEUTRAL,
  expired: PILL_NEUTRAL,
  archived: PILL_NEUTRAL,
  // Info / soft states
  issued: PILL_SOFT_SUCCESS,
  scheduled: PILL_SOFT_SUCCESS,
  refunded: PILL_INFO,
}

const STATUS_PILL_FALLBACK = PILL_NEUTRAL

export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return <Dim>—</Dim>
  const cls = STATUS_COLOR_MAP[status.toLowerCase()] || STATUS_PILL_FALLBACK
  const label = formatStatus(status)
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs ${cls}`}
    >
      {label}
    </span>
  )
}

function formatStatus(s: string): string {
  const spaced = s.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
