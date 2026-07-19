"use client";

import { useMemo, useState } from "react";
import type { FarmingStrategy } from "@/lib/types";
import { Tag } from "@/components/shared/Tag";

type SortKey = "rank" | "investment" | "risk";
const TIER_ORDINAL: Record<string, number> = { low: 0, medium: 1, high: 2 };

export function StrategyTable({ strategies }: { strategies: FarmingStrategy[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");

  const sorted = useMemo(() => {
    return [...strategies].sort((a, b) => {
      if (sortKey === "rank") return a.rank - b.rank;
      return TIER_ORDINAL[a[sortKey]] - TIER_ORDINAL[b[sortKey]];
    });
  }, [strategies, sortKey]);

  const headerButton = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={`text-left font-medium ${
        sortKey === key ? "text-emerald-400" : "text-slate-400"
      }`}
    >
      {label}
      {sortKey === key ? " ▾" : ""}
    </button>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-800 bg-slate-900/60">
          <tr>
            <th className="px-3 py-2 text-left">{headerButton("rank", "Strategy")}</th>
            <th className="px-3 py-2 text-left">Mechanics</th>
            <th className="px-3 py-2 text-left">
              {headerButton("investment", "Investment")}
            </th>
            <th className="px-3 py-2 text-left">Expected return</th>
            <th className="px-3 py-2 text-left">{headerButton("risk", "Risk")}</th>
            <th className="px-3 py-2 text-left">LS / Late</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((strategy) => (
            <tr key={strategy.id} className="border-b border-slate-800/60">
              <td className="px-3 py-2 font-medium text-slate-100">
                {strategy.name}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {strategy.mechanics.map((m) => (
                    <Tag key={m} mechanic={m} />
                  ))}
                </div>
              </td>
              <td className="px-3 py-2 text-slate-300">{strategy.investment}</td>
              <td className="px-3 py-2 text-slate-400">
                {strategy.expectedReturn}
              </td>
              <td className="px-3 py-2 text-slate-300">{strategy.risk}</td>
              <td className="px-3 py-2 text-slate-400">
                {strategy.leagueStartViable ? "LS" : "—"} /{" "}
                {strategy.lateGameViable ? "Late" : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
