// Ladder reference numbers, via the same proxy the character import uses.
//
// This exists to retire three invented constants. The damage verdict used to
// be graded against DPS_STRONG / DPS_OK / DPS_LOW — thresholds chosen with no
// evidence behind them. These are observed instead.
//
// What the data can and cannot support, measured rather than assumed:
// poe.ninja's builds search returns ONE page of 100 rows and ignores every
// pagination parameter (skip, offset, page, from, start all return the same
// page). Those rows are the top of the ladder and are almost entirely level
// 100. So this supports "the best builds of your class run X" and does NOT
// support "you are in the Nth percentile of players". Nothing here is allowed
// to phrase it the second way.

const PROXY_BASE = (
  process.env.NEXT_PUBLIC_NINJA_PROXY_BASE ||
  "https://poe2-endgame-ninja-proxy.vercel.app"
).replace(/\/+$/, "");

export interface LadderStat {
  n: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface LadderSummary {
  league: string;
  class: string | null;
  snapshot: string;
  /** Rows in the sample — one page, not the whole ladder. */
  sampleSize: number;
  /** Builds matching the filter in total. NOT the sample size. */
  totalInPool: number | null;
  levelRange: { min: number; max: number } | null;
  dps: LadderStat | null;
  ehp: LadderStat | null;
  pool: LadderStat | null;
  caveat: string;
}

/**
 * Fetch top-of-ladder figures for a league, optionally narrowed to one
 * ascendancy. Best-effort: any failure returns null and the page simply omits
 * the comparison rather than falling back to invented numbers.
 */
export async function fetchLadder(
  leagueSlug: string,
  ascendancy?: string
): Promise<LadderSummary | null> {
  if (!leagueSlug) return null;
  const params = new URLSearchParams({ league: leagueSlug });
  if (ascendancy) params.set("class", ascendancy);
  try {
    const res = await fetch(`${PROXY_BASE}/api/ladder?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LadderSummary;
    return data?.dps || data?.ehp ? data : null;
  } catch {
    return null;
  }
}

/**
 * poe.ninja's league slug, derived from the league name a character import
 * carries ("Runes of Aldur" -> "runesofaldur").
 */
export function leagueSlugOf(league: string): string {
  return league.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Where a character's damage sits against the sampled builds.
 *
 * Deliberately returns a band label rather than a percentile: with a
 * top-of-ladder sample, "below p25" means "under the weakest of the best",
 * which is a very different claim from "bottom quartile of players".
 */
export type LadderBand = "below" | "p25" | "median" | "p75" | "top";

export function bandFor(value: number, stat: LadderStat): LadderBand {
  if (value >= stat.max) return "top";
  if (value >= stat.p75) return "p75";
  if (value >= stat.median) return "median";
  if (value >= stat.p25) return "p25";
  return "below";
}

export const BAND_LABEL: Record<LadderBand, string> = {
  below: "below the sampled range",
  p25: "in the lower quarter of the sample",
  median: "around the middle of the sample",
  p75: "in the upper quarter of the sample",
  top: "at the top of the sample",
};
