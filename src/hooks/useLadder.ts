"use client";

import { useEffect, useState } from "react";
import {
  fetchLadder,
  leagueSlugOf,
  type LadderSummary,
} from "@/lib/characterImport/ladderClient";

// One cache per league+class for the session. The figures are a snapshot that
// moves at most hourly and the proxy caches them at the edge anyway, so
// refetching on every remount would be pure waste.
const cache = new Map<string, LadderSummary | null>();

/**
 * Top-of-ladder reference figures for a character's league and ascendancy.
 *
 * Genuine network I/O, so a real useEffect is correct. A failure resolves to
 * null and the page omits every ladder-derived claim rather than falling back
 * to the invented thresholds this replaced.
 */
export function useLadder(
  league: string | undefined,
  ascendancy: string | undefined
): { ladder: LadderSummary | null; pending: boolean } {
  const key = league ? `${leagueSlugOf(league)}|${ascendancy ?? ""}` : "";
  const cached = key ? cache.get(key) : undefined;
  const [ladder, setLadder] = useState<LadderSummary | null>(cached ?? null);
  const [settled, setSettled] = useState(cached !== undefined);

  useEffect(() => {
    if (!key || cache.has(key)) return;
    let cancelled = false;
    fetchLadder(leagueSlugOf(league!), ascendancy).then((result) => {
      cache.set(key, result);
      if (cancelled) return;
      setLadder(result);
      setSettled(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key, league, ascendancy]);

  return { ladder, pending: Boolean(key) && !settled };
}
