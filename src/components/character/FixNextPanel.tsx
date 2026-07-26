import type { Action, ActionSeverity } from "@/lib/characterImport/analysis";
import { SectionTitle } from "@/components/shared/SectionTitle";

const SEVERITY_STYLE: Record<
  ActionSeverity,
  { border: string; chip: string; label: string }
> = {
  critical: {
    border: "border-red-500/30 bg-red-500/[0.06]",
    chip: "border-red-500/40 bg-red-500/10 text-red-300",
    label: "Critical",
  },
  important: {
    border: "border-amber-500/30 bg-amber-500/[0.05]",
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    label: "Important",
  },
  opportunity: {
    border: "border-white/10 bg-white/[0.03]",
    chip: "border-white/15 bg-white/5 text-slate-400",
    label: "Optional",
  },
};

/** How many actions to surface before deferring to the panels below. */
const SHOWN = 5;

/**
 * The answer to "what do I do next?", which the page previously never gave —
 * it presented eight panels of findings at equal weight and left ranking them
 * to the player. Everything here comes from one shared analysis pass, so the
 * ordering is consistent with (and cannot contradict) the detail below.
 */
export function FixNextPanel({
  actions,
  gearPending,
}: {
  actions: Action[];
  gearPending: boolean;
}) {
  const shown = actions.slice(0, SHOWN);
  const remaining = actions.length - shown.length;

  return (
    <div className="space-y-3">
      <SectionTitle>Fix next</SectionTitle>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-4 text-sm text-emerald-100/90">
          Nothing stands out as worth fixing — resistances are handled, no
          damage type is a one-shot risk, and no graded modifier is far from
          what its item level allows.
        </p>
      ) : (
        <ol className="space-y-2">
          {shown.map((action, i) => {
            const style = SEVERITY_STYLE[action.severity];
            return (
              <li
                key={action.id}
                className={`rounded-lg border p-3 sm:p-4 ${style.border}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xs font-semibold text-slate-300 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 className="font-semibold text-slate-100">
                        {action.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-medium tracking-wide uppercase ${style.chip}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-300">
                      {action.detail}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{action.why}</p>
                    <p className="mt-1.5 text-[11px] text-slate-600">
                      {action.itemSlot ? `${action.itemSlot} · ` : ""}Detail in{" "}
                      <span className="text-slate-500">{action.evidence}</span>{" "}
                      below
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs text-slate-500">
        {remaining > 0 && (
          <>
            {remaining} further suggestion{remaining === 1 ? "" : "s"} in the
            sections below.{" "}
          </>
        )}
        {gearPending
          ? "Gear modifier grading is still loading, so gear actions may not be listed yet."
          : "Ranked by estimated impact on this character — a judgement call, not a measurement."}
      </p>
    </div>
  );
}
