import type { JSX, ReactNode } from 'react'

const LABEL_CLS = 'text-muted-foreground text-[11px] tracking-wide uppercase'

export function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: ReactNode
  tone?: 'warn'
}): JSX.Element {
  const valueCls =
    tone === 'warn'
      ? 'text-2xl font-bold tabular-nums text-destructive'
      : 'text-2xl font-bold tabular-nums'
  return (
    <div>
      <div className={LABEL_CLS}>{label}</div>
      <div className={valueCls}>{value}</div>
    </div>
  )
}

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="space-y-1">
      <div className={LABEL_CLS}>{title}</div>
      {children}
    </section>
  )
}

export function DetailLabel({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return <div className={LABEL_CLS}>{children}</div>
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}): JSX.Element {
  return (
    <div>
      <div className={LABEL_CLS}>{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
