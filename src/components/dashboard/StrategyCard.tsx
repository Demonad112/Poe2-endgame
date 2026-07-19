"use client";

import type { FarmingStrategy } from "@/lib/types";
import { Tag } from "@/components/shared/Tag";
import { SourceFlag } from "@/components/shared/SourceFlag";
import { useStrategySelection } from "@/hooks/useStrategySelection";

const TIER_STYLES: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

export function StrategyCard({ strategy }: { strategy: FarmingStrategy }) {
  const { pinnedStrategyId, pinStrategy } = useStrategySelection();
  const pinned = pinnedStrategyId === strategy.id;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 ${
        pinned
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100">{strategy.name}</h3>
        <button
          onClick={() => pinStrategy(pinned ? undefined : strategy.id)}
          className={`shrink-0 rounded-md border px-2 py-1 text-xs ${
            pinned
              ? "border-emerald-500/50 text-emerald-300"
              : "border-slate-700 text-slate-400 hover:border-slate-500"
          }`}
        >
          {pinned ? "★ Pinned" : "☆ Pin"}
        </button>
      </div>

      {strategy.mechanics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {strategy.mechanics.map((m) => (
            <Tag key={m} mechanic={m} />
          ))}
        </div>
      )}

      <p className="text-sm text-slate-400">{strategy.atlasSetup}</p>
      <p className="text-sm text-slate-300">{strategy.expectedReturn}</p>

      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
        <span>
          Investment:{" "}
          <span className={TIER_STYLES[strategy.investment]}>
            {strategy.investment}
          </span>
        </span>
        <span>
          Risk:{" "}
          <span className={TIER_STYLES[strategy.risk]}>{strategy.risk}</span>
        </span>
        {strategy.leagueStartViable && (
          <span className="text-slate-500">League-start viable</span>
        )}
        {strategy.lateGameViable && (
          <span className="text-slate-500">Late-game viable</span>
        )}
        <SourceFlag source={strategy.source} />
      </div>
    </div>
  );
}
