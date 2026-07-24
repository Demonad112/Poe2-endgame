import type { ImportedCharacter } from "./types";

export type Severity = "critical" | "warning";

export interface Weakness {
  text: string;
  severity: Severity;
}

export interface BuildAssessment {
  /** 0-1, or null when DPS is unavailable and a fair score can't be given. */
  score: number;
  tier: "A" | "B" | "C" | "D";
  note: string;
  strengths: string[];
  weaknesses: Weakness[];
  /** True when no PoB DPS was available, so offense went unscored. */
  dpsUnknown: boolean;
}

// Rough endgame DPS bands. These are heuristics, not published benchmarks —
// no authoritative 0.5 community numbers were available when this was
// written, so the UI labels them as a rough guide rather than a verdict.
const DPS_STRONG = 1_000_000;
const DPS_OK = 300_000;
const DPS_LOW = 100_000;

// Combined life+ES+ward pool bands, following the thresholds poe2-mcp's
// ledger used (compute_strengths_weaknesses in mobile-app/api/analyze.py).
const POOL_GOOD = 6000;
const POOL_THIN = 4000;

export function assessBuild(character: ImportedCharacter): BuildAssessment {
  const { stats, pob } = character;
  const pool = stats.life + stats.energyShield + stats.ward;
  const elementalCapped =
    stats.fireResistance >= 75 &&
    stats.coldResistance >= 75 &&
    stats.lightningResistance >= 75;

  const strengths: string[] = [];
  const weaknesses: Weakness[] = [];

  // --- Defensive pool ---
  if (pool > POOL_GOOD) {
    strengths.push(
      `Healthy defensive pool (${pool.toLocaleString()} combined life + ES + ward)`
    );
  } else if (pool < POOL_THIN) {
    weaknesses.push({
      text: `Thin defensive pool — ${pool.toLocaleString()} combined life + ES + ward`,
      severity: "critical",
    });
  }

  // --- Resistances ---
  if (elementalCapped) {
    strengths.push("All three elemental resistances at 75% or above");
  } else {
    const uncapped = (
      [
        ["Fire", stats.fireResistance],
        ["Cold", stats.coldResistance],
        ["Lightning", stats.lightningResistance],
      ] as const
    )
      .filter(([, v]) => v < 75)
      .map(([n, v]) => `${n} ${v}%`);
    weaknesses.push({
      text: `Uncapped elemental resistance (${uncapped.join(", ")})`,
      severity: "critical",
    });
  }

  if (stats.chaosResistance < 0) {
    weaknesses.push({
      text: `Negative chaos resistance (${stats.chaosResistance}%)`,
      severity: "critical",
    });
  } else if (stats.chaosResistance < 30) {
    weaknesses.push({
      text: `Low chaos resistance (${stats.chaosResistance}%)`,
      severity: "warning",
    });
  }

  // --- Layered mitigation ---
  if (stats.evasionRating > 4000) {
    strengths.push(
      `${stats.evasionRating.toLocaleString()} evasion is a real mitigation layer`
    );
  }
  if (stats.ward > 0) {
    strengths.push(
      `${stats.ward.toLocaleString()} ward adds a recovering buffer over life/ES`
    );
  }
  if (stats.armour < 500 && stats.blockChance < 20) {
    weaknesses.push({
      text: "Little armour or block — leaning on evasion and resistances alone",
      severity: "warning",
    });
  }

  // --- One-shot risk (PoB max-hit-taken) ---
  // The lowest max hit is what actually kills you; a build can look healthy
  // on paper and still get deleted by its worst damage type.
  if (pob) {
    const hits = [
      ["Physical", pob.maxHitTaken.physical],
      ["Fire", pob.maxHitTaken.fire],
      ["Cold", pob.maxHitTaken.cold],
      ["Lightning", pob.maxHitTaken.lightning],
      ["Chaos", pob.maxHitTaken.chaos],
    ].filter(([, v]) => (v as number) > 0) as [string, number][];

    if (hits.length > 0) {
      const [weakestType, weakestHit] = hits.reduce((a, b) => (a[1] <= b[1] ? a : b));
      const best = hits.reduce((a, b) => (a[1] >= b[1] ? a : b))[1];
      if (best > 0 && weakestHit < best * 0.4) {
        weaknesses.push({
          text: `${weakestType} is the one-shot risk — max hit survivable is only ${weakestHit.toLocaleString()} vs ${best.toLocaleString()} at best`,
          severity: "warning",
        });
      }
    }
  }

  // --- Offense ---
  const dps = pob?.combinedDps ?? 0;
  const dpsUnknown = !pob || dps <= 0;
  if (!dpsUnknown) {
    if (dps >= DPS_STRONG) {
      strengths.push(`Strong damage — ${Math.round(dps).toLocaleString()} combined DPS`);
    } else if (dps < DPS_LOW) {
      weaknesses.push({
        text: `Low damage for endgame — ${Math.round(dps).toLocaleString()} combined DPS`,
        severity: "critical",
      });
    } else if (dps < DPS_OK) {
      weaknesses.push({
        text: `Modest damage — ${Math.round(dps).toLocaleString()} combined DPS may stall on pinnacle bosses`,
        severity: "warning",
      });
    }
  }

  // --- Score ---
  // Defence and offence are weighted evenly. When DPS is unknown the offence
  // half is dropped and the remainder is rescaled, so a build is never
  // silently punished for data we don't have.
  let defence = 0;
  if (pool > POOL_GOOD) defence += 0.3;
  else if (pool >= POOL_THIN) defence += 0.15;
  if (elementalCapped) defence += 0.15;
  if (stats.chaosResistance >= 30) defence += 0.05;

  let offence = 0;
  if (!dpsUnknown) {
    if (dps >= DPS_STRONG) offence = 0.5;
    else if (dps >= DPS_OK) offence = 0.35;
    else if (dps >= DPS_LOW) offence = 0.2;
    else offence = 0.05;
  }

  const raw = dpsUnknown ? defence / 0.5 : defence + offence;
  const score = Math.round(Math.min(1, Math.max(0, raw)) * 100) / 100;

  const tier = score >= 0.75 ? "A" : score >= 0.5 ? "B" : score >= 0.3 ? "C" : "D";

  let note: string;
  if (!elementalCapped) {
    note = "Uncapped elemental resistances are the biggest thing holding this back.";
  } else if (pool < POOL_THIN) {
    note = "Resistances are handled — the thin life/ES pool is the limiting factor.";
  } else if (dpsUnknown) {
    note =
      "Scored on defences only — this character had no Path of Building export to read DPS from.";
  } else if (dps < DPS_OK) {
    note = "Defences hold up; damage is the weaker half of this build.";
  } else {
    note = "No glaring gaps in defences or damage.";
  }

  if (strengths.length === 0) {
    strengths.push("No standout strengths detected yet");
  }
  if (weaknesses.length === 0) {
    weaknesses.push({ text: "No major gaps detected", severity: "warning" });
  }

  return { score, tier, note, strengths, weaknesses, dpsUnknown };
}
