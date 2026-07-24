/** Compact large numbers (DPS especially) without losing readability. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toLocaleString();
}
