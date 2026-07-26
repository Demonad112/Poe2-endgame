import type { Action, ActionSeverity } from "@/lib/characterImport/analysis";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { StatusChip, type Tone } from "./Instruments";

const SEVERITY: Record<
  ActionSeverity,
  { stripe: string; tone: Tone; label: string }
> = {
  critical: {
    stripe: "bg-[var(--critical)]",
    tone: "critical",
    label: "Critical",
  },
  important: {
    stripe: "bg-[var(--caution)]",
    tone: "caution",
    label: "Important",
  },
  opportunity: { stripe: "bg-[var(--hairline)]", tone: "muted", label: "Optional" },
};

/** How many actions to surface before deferring to the panels below. */
const SHOWN = 5;

/**
 * The answer to "what do I do next?", which the page previously never gave —
 * it presented eight panels of findings at equal weight and left ranking them
 * to the player. Everything here comes from one shared analysis pass, so the
 * ordering is consistent with (and cannot contradict) the detail below.
 *
 * Severity is encoded in form as well as colour: a full-height stripe down the
 * left edge survives a colour-vision deficiency and reads at a glance in
 * peripheral vision, which a tinted background does not.
 *
 * These are numbered because the order genuinely means "do this first". The
 * accordions below are deliberately not — they're a set of references you jump
 * between, and numbering them would imply a sequence that isn't real.
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
        <p className="rounded-lg border border-[var(--good)]/25 bg-[var(--good)]/[0.06] p-4 text-sm text-[var(--good)]">
          Nothing stands out as worth fixing — resistances are handled, no
          damage type is a one-shot risk, and no graded modifier is far from
          what its item level allows.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {shown.map((action, i) => {
            const sev = SEVERITY[action.severity];
            return (
              <li
                key={action.id}
                className="grid grid-cols-[3px_1.9rem_1fr] items-start overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[var(--lift)]"
              >
                <span className={`h-full ${sev.stripe}`} aria-hidden="true" />
                <span className="pt-3 pl-2.5 font-mono text-xs font-bold text-slate-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 py-2.5 pr-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-100">
                      {action.title}
                    </h3>
                    <StatusChip tone={sev.tone}>{sev.label}</StatusChip>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                    {action.detail}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {action.why}
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    {action.itemSlot ? `${action.itemSlot} · ` : ""}detail in{" "}
                    <span className="text-slate-500">{action.evidence}</span>
                  </p>
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
