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
          className="rounded-md border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20"
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
