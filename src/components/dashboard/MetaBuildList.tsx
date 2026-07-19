import type { MetaBuild } from "@/lib/types";
import { SourceFlag } from "@/components/shared/SourceFlag";

const BUDGET_LABELS: Record<string, string> = {
  "league-start": "League-start",
  mid: "Mid-budget",
  high: "High-budget",
};

export function MetaBuildList({ builds }: { builds: MetaBuild[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {builds.map((build) => (
        <li
          key={build.id}
          className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-100">{build.name}</span>
            <span className="text-xs text-slate-500">{build.ascendancy}</span>
            {build.playratePercent !== undefined && (
              <span className="rounded border border-emerald-500/40 px-1.5 py-0.5 text-xs text-emerald-300">
                ~{build.playratePercent}% playrate
              </span>
            )}
            <span className="text-xs text-slate-500">
              {BUDGET_LABELS[build.budgetTier]}
            </span>
            <SourceFlag source={build.source} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{build.role}</p>
        </li>
      ))}
    </ul>
  );
}
