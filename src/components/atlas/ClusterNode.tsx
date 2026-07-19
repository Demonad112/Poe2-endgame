"use client";

import type { AtlasCluster } from "@/lib/types";
import { SourceFlag } from "@/components/shared/SourceFlag";
import { useAtlasProgress } from "@/hooks/useAtlasProgress";

export function ClusterNode({ cluster }: { cluster: AtlasCluster }) {
  const { isClusterAllocated, toggleCluster } = useAtlasProgress();
  const allocated = isClusterAllocated(cluster.id);

  return (
    <li
      className={`rounded-md border p-3 transition-colors ${
        allocated
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={allocated}
          onChange={() => toggleCluster(cluster.id)}
          className="mt-1 size-3.5 accent-emerald-500"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-500">
              {cluster.order}
            </span>
            <span
              className={`text-sm font-medium ${allocated ? "text-slate-400 line-through" : "text-slate-100"}`}
            >
              {cluster.name}
            </span>
            {cluster.killGated && (
              <span className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-400">
                kill-gated
              </span>
            )}
            <SourceFlag source={cluster.source} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{cluster.description}</p>
        </div>
      </label>
    </li>
  );
}
