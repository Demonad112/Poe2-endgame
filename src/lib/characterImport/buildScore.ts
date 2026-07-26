import type { ImportedCharacter } from "./types";
import {
  CHAOS_CRITICAL,
  CHAOS_TARGET,
  DPS_LOW,
  DPS_OK,
  DPS_STRONG,
  ONE_SHOT_RATIO,
  POOL_GOOD,
  POOL_THIN,
  RES_CAP,
} from "./thresholds";
import {
  effectivePool,
  NO_KEYSTONE_EFFECTS,
  type KeystoneEffects,
} from "./keystoneEffects";

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

export function assessBuild(
  character: ImportedCharacter,
  keystones: KeystoneEffects = NO_KEYSTONE_EFFECTS
): BuildAssessment {
  const { stats, pob } = character;
  const { total: pool } = effectivePool(stats, keystones);
  const elementalCapped =
    stats.fireResistance >= RES_CAP &&
    stats.coldResistance >= RES_CAP &&
    stats.lightningResistance >= RES_CAP;

  const strengths: string[] = [];
  const weaknesses: Weakness[] = [];

  // --- Defensive pool ---
  // Named by what it actually contains: a keystone may have converted life or
  // energy shield away, in which case calling the total "life + ES + ward"
  // credits the build with a buffer it does not have.
  const poolParts = [
    keystones.lifeIsNegligible ? null : "life",
    keystones.esNotDefensive ? null : "ES",
    "ward",
  ].filter(Boolean);
  const poolLabel = `combined ${poolParts.join(" + ")}`;
  if (pool > POOL_GOOD) {
    strengths.push(
      `Healthy defensive pool (${pool.toLocaleString()} ${poolLabel})`
    );
  } else if (pool < POOL_THIN) {
    weaknesses.push({
      text: `Thin defensive pool — ${pool.toLocaleString()} ${poolLabel}`,
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
      .filter(([, v]) => v < RES_CAP)
      .map(([n, v]) => `${n} ${v}%`);
    weaknesses.push({
      text: `Uncapped elemental resistance (${uncapped.join(", ")})`,
      severity: "critical",
    });
  }

  // Chaos immunity makes any chaos resistance figure moot, high or low.
  if (keystones.chaosImmune) {
    strengths.push("Immune to chaos damage and bleeding — chaos resistance is moot");
  } else if (stats.chaosResistance < CHAOS_CRITICAL) {
    weaknesses.push({
      text: `Negative chaos resistance (${stats.chaosResistance}%)`,
      severity: "critical",
    });
  } else if (stats.chaosResistance < CHAOS_TARGET) {
    weaknesses.push({
      text: `Low chaos resistance (${stats.chaosResistance}%)`,
      severity: "warning",
    });
  }

  // --- Layered mitigation ---
  // Under Iron Reflexes evasion has become armour, so it neither avoids hits
  // nor leaves the build short on armour — both of the judgements below would
  // otherwise be backwards.
  const effectiveArmour = keystones.evasionIsArmour
    ? stats.armour + stats.evasionRating
    : stats.armour;
  if (stats.evasionRating > 4000) {
    strengths.push(
      keystones.evasionIsArmour
        ? `${stats.evasionRating.toLocaleString()} evasion converted to armour is a real mitigation layer`
        : `${stats.evasionRating.toLocaleString()} evasion is a real mitigation layer`
    );
  }
  if (stats.ward > 0) {
    strengths.push(
      `${stats.ward.toLocaleString()} ward adds a recovering buffer over life/ES`
    );
  }
  if (effectiveArmour < 500 && stats.blockChance < 20) {
    weaknesses.push({
      text: "Little armour or block — leaning on evasion and resistances alone",
      severity: "warning",
    });
  }

  // --- One-shot risk (PoB max-hit-taken) ---
  // A build can look healthy on paper and still get deleted by a damage type
  // it has no answer to. EVERY type under the threshold is reported, not just
  // the single lowest: on the test character chaos (3,808) and physical
  // (4,264) both sat under it, and naming only the minimum hid the physical
  // gap — the more dangerous of the two, since physical hits are far more
  // common in maps than chaos hits.
  if (pob) {
    const hits = (
      [
        ["Physical", pob.maxHitTaken.physical],
        ["Fire", pob.maxHitTaken.fire],
        ["Cold", pob.maxHitTaken.cold],
        ["Lightning", pob.maxHitTaken.lightning],
        ["Chaos", pob.maxHitTaken.chaos],
      ] as [string, number][]
    ).filter(([, v]) => v > 0);

    const best = hits.reduce((max, [, v]) => Math.max(max, v), 0);
    const atRisk = hits
      .filter(([type]) => !(keystones.chaosImmune && type === "Chaos"))
      .filter(([, v]) => v < best * ONE_SHOT_RATIO)
      .sort((a, b) => a[1] - b[1]);

    if (best > 0 && atRisk.length > 0) {
      const named = atRisk
        .map(([type, v]) => `${type} ${v.toLocaleString()}`)
        .join(", ");
      weaknesses.push({
        text:
          atRisk.length === 1
            ? `${atRisk[0][0]} is the one-shot risk — max hit survivable is only ${atRisk[0][1].toLocaleString()} vs ${best.toLocaleString()} at best`
            : `${atRisk.length} one-shot risks — ${named}, against ${best.toLocaleString()} at best`,
        severity: "warning",
      });
    }
  }

  // --- Offense ---
  // The DPS figure is whatever the character's PoB export was configured to
  // produce. On real exports that is typically NOT a boss calculation, so a
  // verdict about pinnacle bosses can't be drawn from it — the wording below
  // stays about the number itself, and the UI prints the actual config
  // alongside it (see pobConfig.ts / describePobConfig).
  const dps = pob?.combinedDps ?? 0;
  const dpsUnknown = !pob || dps <= 0;
  const versusBoss = pob?.config?.versusBoss ?? false;
  if (!dpsUnknown) {
    const shown = `${Math.round(dps).toLocaleString()} combined DPS`;
    const against = versusBoss ? "against a boss" : "against a non-boss enemy";
    if (dps >= DPS_STRONG) {
      strengths.push(`Strong damage — ${shown} ${against}`);
    } else if (dps < DPS_LOW) {
      weaknesses.push({
        text: `Low damage for endgame — ${shown} ${against}`,
        severity: "critical",
      });
    } else if (dps < DPS_OK) {
      weaknesses.push({
        text: `Modest damage — ${shown} ${against}`,
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
  // Chaos immunity earns the chaos credit outright — it's strictly better
  // than any resistance value, so scoring it as a miss would penalise it.
  if (keystones.chaosImmune || stats.chaosResistance >= CHAOS_TARGET)
    defence += 0.05;

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
    note = versusBoss
      ? "Defences hold up; damage is the weaker half of this build."
      : "Defences hold up; damage is the weaker half — though this export was not configured against a boss.";
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
