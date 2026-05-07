export const STUB_MAX = 200;

function pluralize(noun, count) {
  if (count === 1) return noun;
  if (noun.endsWith('y')) return noun.slice(0, -1) + 'ies';
  return noun + 's';
}

export function stub(noun, count, scope) {
  const c = Number.isFinite(count) ? count : 0;
  const base = `Rendered ${c} ${pluralize(noun, c)}`;
  const text = scope ? `${base} for ${scope}.` : `${base}.`;
  return text.length > STUB_MAX ? text.slice(0, STUB_MAX - 1) + '…' : text;
}
