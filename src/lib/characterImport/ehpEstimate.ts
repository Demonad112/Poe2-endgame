import type { DefensiveStats } from "./types";

// Deliberately approximate. poe2-mcp's real EHP model
// (ehp_calculator.py/defense_calculator.py, ~1,900 lines) layers
// armor-vs-hit-size, evasion, and a capped block chance in a specific
// order — that hasn't been ported here yet. This weights the raw
// life+ES+ward pool by average elemental mitigation only, as a rough
// "how squishy is this" number. Always label it as an estimate in the UI —
// see LimitsDisclaimer.
export function estimateEhp(stats: DefensiveStats): number {
  const pool = stats.life + stats.energyShield + stats.ward;
  const avgResistance =
    (stats.fireResistance + stats.coldResistance + stats.lightningResistance) /
    3;
  const mitigation = 1 - Math.min(Math.max(avgResistance, 0), 90) / 100;
  if (mitigation <= 0) return pool;
  return Math.round(pool / mitigation);
}
