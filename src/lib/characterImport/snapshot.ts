import type { ImportedCharacter } from "./types";
import { effectivePool, type KeystoneEffects } from "./keystoneEffects";
import { isHealthy, RES_CAP, type ResistanceKey } from "./thresholds";

/**
 * A compact record of what a character's numbers were at one point in time.
 *
 * Every other panel answers "where are you now". None of them answered "is
 * what you did last week working", which is the question a player improving a
 * character actually repeats.
 *
 * Deliberately not a full ImportedCharacter: gear and mods make a stored
 * character tens of kilobytes, and keeping twenty of those would put real
 * pressure on a localStorage budget shared with checklist and Atlas progress.
 * These are the figures worth trending, and nothing else.
 */
export interface CharacterSnapshot {
  /** ISO timestamp of the import this came from. */
  at: string;
  /** account/name — history is per character, not per browser. */
  key: string;
  level: number;
  life: number;
  energyShield: number;
  ward: number;
  armour: number;
  evasion: number;
  /** Keystone-corrected defensive pool, matching what the page displays. */
  pool: number;
  ehp: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
  dps: number;
  /** Lowest max-hit-taken across damage types; 0 when unknown. */
  weakestHit: number;
  passives: number;
}

/** How many snapshots to keep per character before dropping the oldest. */
export const MAX_SNAPSHOTS = 20;

export function snapshotKey(character: ImportedCharacter): string {
  return `${character.account}/${character.name}`;
}

export function toSnapshot(
  character: ImportedCharacter,
  keystones: KeystoneEffects
): CharacterSnapshot {
  const { stats, pob } = character;
  const hits = pob
    ? [
        pob.maxHitTaken.physical,
        pob.maxHitTaken.fire,
        pob.maxHitTaken.cold,
        pob.maxHitTaken.lightning,
        pob.maxHitTaken.chaos,
      ].filter((v) => v > 0)
    : [];

  return {
    at: character.provenance.fetchedAt,
    key: snapshotKey(character),
    level: character.level,
    life: stats.life,
    energyShield: stats.energyShield,
    ward: stats.ward,
    armour: stats.armour,
    evasion: stats.evasionRating,
    pool: effectivePool(stats, keystones).total,
    ehp: character.ehp,
    fire: stats.fireResistance,
    cold: stats.coldResistance,
    lightning: stats.lightningResistance,
    chaos: stats.chaosResistance,
    dps: Math.round(pob?.combinedDps ?? 0),
    weakestHit: hits.length > 0 ? Math.min(...hits) : 0,
    passives: character.passivePointsAllocated,
  };
}

/** Whether a change in this metric is an improvement. */
type Direction = "higher" | "lower";

export interface MetricDelta {
  label: string;
  before: number;
  after: number;
  delta: number;
  /** True when the change moved in the helpful direction. */
  improved: boolean;
  /** Percent, formatted by the caller. Null when `before` was 0. */
  percent: number | null;
  /** Resistances read as percentages; everything else is a raw figure. */
  unit: "percent" | "raw";
}

const METRICS: {
  field: keyof CharacterSnapshot;
  label: string;
  dir: Direction;
  unit: "percent" | "raw";
}[] = [
  { field: "level", label: "Level", dir: "higher", unit: "raw" },
  { field: "pool", label: "Defensive pool", dir: "higher", unit: "raw" },
  { field: "ehp", label: "EHP", dir: "higher", unit: "raw" },
  { field: "life", label: "Life", dir: "higher", unit: "raw" },
  { field: "energyShield", label: "Energy Shield", dir: "higher", unit: "raw" },
  { field: "ward", label: "Ward", dir: "higher", unit: "raw" },
  { field: "evasion", label: "Evasion", dir: "higher", unit: "raw" },
  { field: "armour", label: "Armour", dir: "higher", unit: "raw" },
  { field: "dps", label: "Combined DPS", dir: "higher", unit: "raw" },
  {
    field: "weakestHit",
    label: "Weakest max hit",
    dir: "higher",
    unit: "raw",
  },
  { field: "fire", label: "Fire Resistance", dir: "higher", unit: "percent" },
  { field: "cold", label: "Cold Resistance", dir: "higher", unit: "percent" },
  {
    field: "lightning",
    label: "Lightning Resistance",
    dir: "higher",
    unit: "percent",
  },
  { field: "chaos", label: "Chaos Resistance", dir: "higher", unit: "percent" },
  { field: "passives", label: "Passive points", dir: "higher", unit: "raw" },
];

export interface SnapshotDiff {
  from: CharacterSnapshot;
  to: CharacterSnapshot;
  /** Only metrics that actually moved. */
  changes: MetricDelta[];
  /** Elemental resistances that newly reached cap between the two. */
  newlyCapped: string[];
  /** Elemental resistances that fell below cap between the two. */
  newlyUncapped: string[];
}

const ELEMENTS: { field: keyof CharacterSnapshot; type: ResistanceKey; label: string }[] = [
  { field: "fire", type: "fire", label: "Fire" },
  { field: "cold", type: "cold", label: "Cold" },
  { field: "lightning", type: "lightning", label: "Lightning" },
];

export function diffSnapshots(
  from: CharacterSnapshot,
  to: CharacterSnapshot
): SnapshotDiff {
  const changes: MetricDelta[] = [];

  for (const { field, label, dir, unit } of METRICS) {
    const before = from[field] as number;
    const after = to[field] as number;
    if (typeof before !== "number" || typeof after !== "number") continue;
    if (before === after) continue;
    const delta = after - before;
    changes.push({
      label,
      before,
      after,
      delta,
      improved: dir === "higher" ? delta > 0 : delta < 0,
      percent: before !== 0 ? (delta / Math.abs(before)) * 100 : null,
      unit,
    });
  }

  // Crossing the cap is worth calling out separately: going from 74% to 75%
  // is a one-point change that matters far more than a twenty-point change
  // somewhere in the middle of the range.
  const newlyCapped: string[] = [];
  const newlyUncapped: string[] = [];
  for (const { field, type, label } of ELEMENTS) {
    const before = from[field] as number;
    const after = to[field] as number;
    const wasCapped = isHealthy(type, before);
    const isCapped = isHealthy(type, after);
    if (!wasCapped && isCapped) newlyCapped.push(label);
    if (wasCapped && !isCapped) newlyUncapped.push(label);
  }

  return { from, to, changes, newlyCapped, newlyUncapped };
}

/** Cap for the resistance display in progress copy. */
export { RES_CAP };

/**
 * Append a snapshot, dropping a duplicate of the most recent one and trimming
 * to MAX_SNAPSHOTS. Re-importing without playing shouldn't fill the history
 * with identical rows.
 */
export function appendSnapshot(
  history: CharacterSnapshot[],
  next: CharacterSnapshot
): CharacterSnapshot[] {
  const mine = history.filter((s) => s.key === next.key);
  const others = history.filter((s) => s.key !== next.key);
  const last = mine[mine.length - 1];

  const unchanged =
    last &&
    (Object.keys(next) as (keyof CharacterSnapshot)[])
      .filter((k) => k !== "at")
      .every((k) => last[k] === next[k]);

  const updated = unchanged ? mine : [...mine, next].slice(-MAX_SNAPSHOTS);
  return [...others, ...updated];
}
