"use client";

import { useEffect, useState } from "react";
import {
  getCachedPassiveNodes,
  loadPassiveNodes,
  type PassiveNodeTable,
} from "@/lib/characterImport/passiveNodes";

/**
 * Lazily fetch the ~126KB named-passive-node table.
 *
 * Mirrors useModTiers: the analysis needs it up front, because allocated
 * keystones can invalidate conclusions drawn elsewhere (chaos resistance
 * advice under Chaos Inoculation, energy shield as a pool under Eldritch
 * Battery), so it can't be deferred to the panel that renders passives.
 */
export function usePassiveNodes(enabled: boolean): {
  table: PassiveNodeTable | null;
  pending: boolean;
} {
  const cached = getCachedPassiveNodes();
  const [table, setTable] = useState<PassiveNodeTable | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || table) return;
    let cancelled = false;
    loadPassiveNodes().then((loaded) => {
      if (cancelled) return;
      if (loaded) setTable(loaded);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, table]);

  return { table, pending: enabled && !table && !failed };
}
