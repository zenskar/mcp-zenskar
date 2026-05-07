export const DEFAULT_BRAND = Object.freeze({
  primary: '#ed765e',
  primaryFg: '#ffffff',
  accent: '#eef7ff',
  accentFg: '#1145bc',
  link: '#1145bc',
  ring: '#1145bc',
  bg: '#ffffff',
  fg: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  rowHover: '#f8fafc',
});

export function generateBrandStyle(brand) {
  const b = { ...DEFAULT_BRAND, ...(brand || {}) };
  return [
    '<style id="zenskar-brand">',
    ':root{',
    `--brand-primary:${b.primary};`,
    `--brand-primary-fg:${b.primaryFg};`,
    `--brand-accent:${b.accent};`,
    `--brand-accent-fg:${b.accentFg};`,
    `--brand-link:${b.link};`,
    `--brand-ring:${b.ring};`,
    `--brand-bg:${b.bg};`,
    `--brand-fg:${b.fg};`,
    `--brand-muted:${b.muted};`,
    `--brand-border:${b.border};`,
    `--brand-row-hover:${b.rowHover};`,
    '}',
    '</style>',
  ].join('');
}
