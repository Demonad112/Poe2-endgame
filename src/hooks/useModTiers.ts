"use client";

import { useEffect, useState } from "react";
import {
  getCachedModTiers,
  loadModTiers,
  type ModTierTable,
} from "@/lib/characterImport/modTiers";

export interface ModTiersState {
  table: ModTierTable | null;
  /** Still fetching. Distinct from `failed`, which is terminal. */
  pending: boolean;
  failed: boolean;
}

/**
 * Lazily fetch the ~210KB affix tier table.
 *
 * Lives at the workspace level rather than inside the gear panel because the
 * unified analysis needs it to rank gear actions — the "Fix next" list has to
 * know about tier upgrades to place them against everything else.
 *
 * The fetch is a genuine side effect (network I/O), so a real useEffect is
 * correct here; the module-level cache in modTiers.ts means a remount does
 * not refetch, and the initial state reads that cache synchronously so an
 * already-loaded table never flashes a loading state.
 */
export function useModTiers(enabled: boolean): ModTiersState {
  const cached = getCachedModTiers();
  const [table, setTable] = useState<ModTierTable | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || table) return;
    let cancelled = false;
    loadModTiers().then((loaded) => {
      if (cancelled) return;
      if (loaded) setTable(loaded);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, table]);

  return { table, pending: enabled && !table && !failed, failed };
}
