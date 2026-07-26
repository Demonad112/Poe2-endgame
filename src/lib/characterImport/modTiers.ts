import { BASE_PATH } from "@/lib/basePath";

/** One tier of a modifier family: tier number, item level, stat ranges. */
export interface ModTierRow {
  t: number;
  i: number;
  /** [statId, min, max] per stat the tier grants. */
  s: [string, number | null, number | null][];
}

export interface ModFamily {
  /** "prefix" | "suffix" */
  g: string;
  /** In-game affix name, e.g. "of the Whelpling". */
  n: string | null;
  t: ModTierRow[];
}

export type ModTierTable = Record<string, ModFamily>;

// ~210KB of affix tiers for 567 families, extracted from RePoE's PoE2 dump
// (repoe-fork.github.io/poe2). Kept out of the JS bundle and fetched only
// when a character is on screen, so the other tools never pay for it.
const ASSET_URL = `${BASE_PATH}/data/modTiers.v1.json`;

let cache: ModTierTable | null = null;
let inflight: Promise<ModTierTable | null> | null = null;

export function getCachedModTiers(): ModTierTable | null {
  return cache;
}

export async function loadModTiers(): Promise<ModTierTable | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(ASSET_URL, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) return null;
      cache = (await res.json()) as ModTierTable;
      return cache;
    } catch {
      // Audit is an enhancement — failing to load it must not break import.
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Split "LocalIncreasedEnergyShield8" into its family and tier number. */
export function splitModId(
  modId: string
): { family: string; tier: number } | null {
  const m = /^(.*?)(\d+)$/.exec(modId);
  if (!m || !m[1]) return null;
  return { family: m[1], tier: Number(m[2]) };
}

/** Highest tier of a family an item of this level could roll. */
export function bestRowForIlvl(
  family: ModFamily,
  ilvl: number
): ModTierRow | null {
  const eligible = family.t.filter((row) => ilvl >= row.i);
  return eligible.length > 0 ? eligible[eligible.length - 1] : null;
}

export function rowForTier(family: ModFamily, tier: number): ModTierRow | null {
  return family.t.find((row) => row.t === tier) ?? null;
}

/**
 * The tier number the game shows for a row.
 *
 * Internal ids climb with item level (LocalIncreasedEnergyShield8 is stronger
 * than ...7), but Path of Exile displays the strongest tier as T1 and counts
 * downward, so the two orderings are reversed. Ranking by required item level
 * rather than list position stays correct when a family's numbering has gaps.
 */
export function displayTierOf(family: ModFamily, row: ModTierRow): number {
  return 1 + family.t.filter((other) => other.i > row.i).length;
}
