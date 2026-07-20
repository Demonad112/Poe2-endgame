"use client";

import type { MemoryFork } from "@/lib/types";
import { SourceFlag } from "@/components/shared/SourceFlag";
import { useAtlasProgress } from "@/hooks/useAtlasProgress";

export function MemoryForkBranch({ fork }: { fork: MemoryFork }) {
  const { isForkAllocated, toggleFork } = useAtlasProgress();
  const allocated = isForkAllocated(fork.id);

  return (
    <div
      className={`flex-1 rounded-lg border p-4 transition-all hover:-translate-y-0.5 ${
        allocated
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-indigo-500/30 bg-indigo-500/[0.06] hover:border-indigo-400/50 hover:shadow-[0_8px_24px_-10px_rgba(129,140,248,0.35)]"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={allocated}
          onChange={() => toggleFork(fork.id)}
          className="size-3.5 accent-emerald-500"
        />
        <h4 className="font-semibold text-indigo-300">{fork.title}</h4>
        <SourceFlag source={fork.source} />
      </label>
      <ul className="mt-2 ml-6 list-disc space-y-1 text-sm text-slate-300">
        {fork.nodes.map((node) => (
          <li key={node}>{node}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">{fork.description}</p>
    </div>
  );
}
