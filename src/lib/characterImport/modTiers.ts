import { BASE_PATH } from "@/lib/basePath";

/**
 * One tier of a modifier family, as published by RePoE.
 *
 * Rows are ordered by required item level ascending, so list position matches
 * power order and the display-tier ranking below is a simple count.
 */
export interface ModTierRow {
  /** The mod id this row IS, e.g. "LocalIncreasedEvasionAndEnergyShield5_". */
  d: string;
  /** In-game affix name for this tier, e.g. "Evanescent". */
  a: string | null;
  /** Required item level. */
  i: number;
  /** [statId, min, max] per stat the tier grants. */
  s: [string, number | null, number | null][];
}

export interface ModFamily {
  /** "prefix" | "suffix" */
  g: string;
  t: ModTierRow[];
}

export type ModTierTable = Record<string, ModFamily>;

/** A mod resolved to its place in the table. */
export interface ResolvedMod {
  familyKey: string;
  family: ModFamily;
  row: ModTierRow;
}

// 810 families / 2,903 tier rows extracted from RePoE's PoE2 dump by
// scripts/extract-mod-tiers.py. ~388KB raw, ~58KB over the wire once gzipped,
// and fetched only when a character is on screen so the other tools never pay
// for it.
//
// v2 replaced v1 because v1 was keyed by splitting a mod id into family and
// tier with a regex anchored on trailing digits. PoE2 ids like
// "LocalIncreasedEvasionAndEnergyShield5_" don't have their digits last, so
// those mods never resolved and their tiers went missing from the middle of
// otherwise-complete ladders — which made bestRowForIlvl report "already at
// the best tier" when a better one existed. v2 groups by RePoE's own `type`
// field and carries the mod id on every row, so nothing is parsed at all.
const ASSET_URL = `${BASE_PATH}/data/modTiers.v2.json`;

let cache: ModTierTable | null = null;
let index: Map<string, ResolvedMod> | null = null;
let inflight: Promise<ModTierTable | null> | null = null;

function buildIndex(table: ModTierTable): Map<string, ResolvedMod> {
  const map = new Map<string, ResolvedMod>();
  for (const [familyKey, family] of Object.entries(table)) {
    for (const row of family.t) {
      map.set(row.d, { familyKey, family, row });
    }
  }
  return map;
}

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
      index = buildIndex(cache);
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

/**
 * Look a mod id up directly. Replaces the old splitModId regex: the id is a
 * key, not something to parse.
 */
export function resolveMod(
  table: ModTierTable,
  modId: string
): ResolvedMod | null {
  // The index is built alongside the cache, but a table can also be passed in
  // by a test or a second table instance — rebuild lazily if it doesn't match.
  if (!index || cache !== table) index = buildIndex(table);
  return index.get(modId) ?? null;
}

/** Highest tier of a family an item of this level could roll. */
export function bestRowForIlvl(
  family: ModFamily,
  ilvl: number
): ModTierRow | null {
  const eligible = family.t.filter((row) => ilvl >= row.i);
  return eligible.length > 0 ? eligible[eligible.length - 1] : null;
}

/**
 * The tier number the game shows for a row.
 *
 * Path of Exile displays the strongest tier as T1 and counts downward, while
 * required item level climbs with power — so the two orderings are reversed.
 * Ranking by required item level rather than list position stays correct even
 * when a family's rows are unevenly spaced.
 */
export function displayTierOf(family: ModFamily, row: ModTierRow): number {
  return 1 + family.t.filter((other) => other.i > row.i).length;
}
