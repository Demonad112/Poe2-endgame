import type { CurrencyMilestone } from "@/lib/types";
import { SourceFlag } from "@/components/shared/SourceFlag";

export function CurrencyMilestones({
  milestones,
}: {
  milestones: CurrencyMilestone[];
}) {
  return (
    <ul className="space-y-2">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-100">
              {milestone.label}
            </span>
            <SourceFlag source={milestone.source} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{milestone.description}</p>
        </li>
      ))}
    </ul>
  );
}
