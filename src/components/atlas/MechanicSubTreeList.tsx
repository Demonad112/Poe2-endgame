"use client";

import { useState } from "react";
import type { AtlasCluster, Mechanic } from "@/lib/types";
import { MECHANIC_LABELS } from "@/lib/constants";
import { Tag } from "@/components/shared/Tag";
import { ClusterNode } from "./ClusterNode";

const MECHANICS: Mechanic[] = ["abyss", "breach", "expedition", "ritual", "delirium"];

export function MechanicSubTreeList({ clusters }: { clusters: AtlasCluster[] }) {
  const [active, setActive] = useState<Mechanic>("abyss");

  const activeNodes = clusters
    .filter((c) => c.group === "mechanic-subtree" && c.mechanic === active)
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {MECHANICS.map((mechanic) => (
          <button
            key={mechanic}
            onClick={() => setActive(mechanic)}
            className={`rounded-md px-1 py-1 transition-opacity ${
              active === mechanic ? "opacity-100" : "opacity-50 hover:opacity-80"
            }`}
          >
            <Tag mechanic={mechanic} />
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Priority order for {MECHANIC_LABELS[active]}. Guide-wide rule: don&apos;t
        run this mechanic&apos;s own tablets while questing it — it slows down
        finishing the quest.
      </p>
      <ul className="space-y-2">
        {activeNodes.map((cluster) => (
          <ClusterNode key={cluster.id} cluster={cluster} />
        ))}
      </ul>
    </div>
  );
}
