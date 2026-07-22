"use client";

import type { AtlasCluster } from "@/lib/types";
import { SourceFlag } from "@/components/shared/SourceFlag";
import { useAtlasProgress } from "@/hooks/useAtlasProgress";

export function ClusterNode({ cluster }: { cluster: AtlasCluster }) {
  const { isClusterAllocated, toggleCluster } = useAtlasProgress();
  const allocated = isClusterAllocated(cluster.id);

  return (
    <li
      id={cluster.id}
      className={`scroll-mt-24 rounded-md border p-3 transition-all ${
        allocated
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
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
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-slate-400">
              {cluster.order}
            </span>
            <span
              className={`text-sm font-medium ${allocated ? "text-slate-400 line-through" : "text-slate-100"}`}
            >
              {cluster.name}
            </span>
            {cluster.killGated && (
              <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-400">
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
