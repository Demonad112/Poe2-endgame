import type { PobStats } from "./types";

/**
 * Break a DPS figure into the factors that produced it and name the one
 * that's out of line.
 *
 * Damage was the only part of this tool that diagnosed without prescribing:
 * resistance advice names an item, a modifier, a tier and an amount, while
 * the offence verdict said "modest" and stopped. Nothing here invents a
 * benchmark — each finding is arithmetic on PoB's own numbers, so it holds
 * regardless of what a "good" DPS figure is for a given patch.
 */

export interface DpsFactor {
  id: string;
  /** What is true, stated as a measurement. */
  finding: string;
  /** What to do about it. */
  action: string;
  severity: "important" | "opportunity";
  /** Ranking weight within the offence group. */
  score: number;
}

export interface DpsBreakdown {
  factors: DpsFactor[];
  /** How much crit multiplies damage over never critting, e.g. 1.07. */
  critMultiplierEffective: number | null;
  /** Share of combined DPS that is damage over time, 0-1. */
  dotShare: number;
}

/**
 * Crit's real contribution: a crit build's damage relative to the same build
 * never critting is 1 + chance x (multiplier - 1).
 *
 * This is what makes "5% crit chance" concrete. At 5% chance and 2.48x
 * damage, crit is worth 7% — so crit *multiplier* modifiers, which only
 * scale that 7%, are close to dead affixes. The same modifiers at 40% crit
 * chance would be worth having.
 */
function effectiveCritMultiplier(pob: PobStats): number | null {
  const chance = pob.critChance / 100;
  const mult = pob.critMultiplier;
  // PoB reports the multiplier as a factor where 2.48 means crits deal 248%
  // of a normal hit. A value at or below 1 means it wasn't populated.
  if (!Number.isFinite(chance) || !Number.isFinite(mult)) return null;
  if (mult <= 1 || chance <= 0) return null;
  return 1 + chance * (mult - 1);
}

/** Below this, crit is contributing so little that scaling it is not the lever. */
const CRIT_UNINVESTED = 1.15;
/** Above this, crit is a real part of the build and worth protecting. */
const CRIT_COMMITTED = 1.5;

export function analyseDps(
  pob: PobStats,
  /** True when the character's gear carries crit-scaling modifiers. */
  hasCritMods: boolean
): DpsBreakdown {
  const factors: DpsFactor[] = [];
  const critEff = effectiveCritMultiplier(pob);
  const dotShare =
    pob.combinedDps > 0 ? Math.min(1, pob.dotDps / pob.combinedDps) : 0;

  // --- Accuracy / hit chance -----------------------------------------------
  // The cheapest DPS in the game: every missed attack is damage that simply
  // didn't happen, and the gain is exactly computable.
  if (pob.hitChance > 0 && pob.hitChance < 100) {
    const gain = Math.round((100 / pob.hitChance - 1) * 100);
    if (gain >= 3) {
      factors.push({
        id: "dps-accuracy",
        finding: `You hit ${Math.round(pob.hitChance)}% of the time, so roughly ${Math.round(100 - pob.hitChance)}% of your attacks deal nothing.`,
        action: `Reaching 100% hit chance is worth about +${gain}% damage — more than most single modifier upgrades. Accuracy Rating on rings, gloves or amulet is the usual fix.`,
        severity: gain >= 10 ? "important" : "opportunity",
        score: 40 + Math.min(25, gain),
      });
    }
  }

  // --- Crit ----------------------------------------------------------------
  if (critEff !== null && dotShare < 0.6) {
    const pct = Math.round((critEff - 1) * 100);
    if (critEff < CRIT_UNINVESTED) {
      factors.push({
        id: "dps-crit-uninvested",
        finding: `Crit is uninvested: at ${pob.critChance.toFixed(1)}% chance and ${pob.critMultiplier.toFixed(2)}x damage, critical hits add only about ${pct}% to your damage.`,
        action: hasCritMods
          ? "Either commit to crit — chance is the half that's missing, and it scales the multiplier you already have — or drop the critical-damage modifiers on your gear, which are currently near-dead affixes, and re-roll them into flat or increased damage."
          : "Either commit to crit — you need chance and multiplier together for it to pay — or ignore it and scale flat and increased damage instead. Half-investing is the one option that never pays.",
        severity: "important",
        score: 54,
      });
    } else if (critEff >= CRIT_COMMITTED) {
      factors.push({
        id: "dps-crit-committed",
        finding: `Crit is carrying ${pct}% of your damage (${pob.critChance.toFixed(1)}% chance at ${pob.critMultiplier.toFixed(2)}x).`,
        action:
          "That's a real part of your damage, so critical-hit chance and critical-damage modifiers are worth protecting on any gear swap.",
        severity: "opportunity",
        score: 18,
      });
    }
  }

  // --- Damage over time ----------------------------------------------------
  // A DoT-driven build is scaled by ailment and duration modifiers, not by
  // hit damage or crit, so hit-focused advice would send it the wrong way.
  if (dotShare >= 0.6) {
    factors.push({
      id: "dps-dot",
      finding: `${Math.round(dotShare * 100)}% of your damage is damage over time, not hits.`,
      action:
        "Hit damage, critical chance and attack speed do comparatively little here — scale the ailment or degeneration effect itself instead.",
      severity: "opportunity",
      score: 24,
    });
  }

  factors.sort((a, b) => b.score - a.score);
  return { factors, critMultiplierEffective: critEff, dotShare };
}
