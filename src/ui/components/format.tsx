import type { JSX } from 'react';
import type { Money } from '../types';

export function Dim({ children }: { children: React.ReactNode }) {
  return <span className="text-muted">{children}</span>;
}

export function fmtDate(s: string | null | undefined): string | JSX.Element {
  if (!s) return <Dim>—</Dim>;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return <Dim>—</Dim>;
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string | null | undefined, to: Date = new Date()): number | null {
  if (!from) return null;
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((to.getTime() - d.getTime()) / 86400000);
}

export function fmtMoney(amount: number | null | undefined, currency: string = 'USD'): string | JSX.Element {
  if (amount == null || !Number.isFinite(amount)) return <Dim>—</Dim>;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function fmtMoneyObj(m: Money | null | undefined): string | JSX.Element {
  if (!m) return <Dim>—</Dim>;
  if (m.display) return m.display;
  if (m.value == null) return <Dim>—</Dim>;
  return fmtMoney(m.value, m.unit || 'USD');
}

export function shortId(id: string | null | undefined, len = 8): string | JSX.Element {
  if (!id) return <Dim>—</Dim>;
  return id.length <= len ? id : id.slice(0, len) + '…';
}

const STATUS_COLOR_MAP: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  approved: 'bg-emerald-100 text-emerald-800',
  active: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-slate-100 text-slate-700',
  open: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  void: 'bg-slate-200 text-slate-700',
  voided: 'bg-slate-200 text-slate-700',
  churned: 'bg-slate-200 text-slate-700',
  paused: 'bg-amber-100 text-amber-800',
  refunded: 'bg-purple-100 text-purple-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return <Dim>—</Dim>;
  const cls = STATUS_COLOR_MAP[status.toLowerCase()] || 'bg-slate-100 text-slate-700';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${cls}`}>{status}</span>;
}
