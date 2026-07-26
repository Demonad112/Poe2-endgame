import type { BuildAssessment } from "@/lib/characterImport/buildScore";

const TIER_STYLES: Record<string, string> = {
  A: "border-[var(--good)]/45 bg-[var(--good)]/10 text-[var(--good)]",
  B: "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]",
  C: "border-[var(--caution)]/45 bg-[var(--caution)]/10 text-[var(--caution)]",
  D: "border-[var(--critical)]/45 bg-[var(--critical)]/10 text-[var(--critical)]",
};

export function BuildScoreCard({
  assessment,
}: {
  assessment: BuildAssessment;
}) {

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div
          className={`flex size-16 shrink-0 items-center justify-center rounded-lg border text-3xl font-bold ${TIER_STYLES[assessment.tier]}`}
        >
          {assessment.tier}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-300">{assessment.note}</p>
          <p className="mt-1 text-xs text-slate-500">
            Score {assessment.score.toFixed(2)} / 1.00 ·{" "}
            {assessment.dpsUnknown
              ? "defences only, no DPS available"
              : "defences and damage weighted evenly"}{" "}
            · rough guide, not a published benchmark
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--good)]">
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {assessment.strengths.map((s) => (
              <li
                key={s}
                className="rounded-md border border-[var(--good)]/25 bg-[var(--good)]/[0.06] px-3 py-2 text-sm text-emerald-100/90"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--critical)]">
            Weaknesses
          </h3>
          <ul className="space-y-1.5">
            {assessment.weaknesses.map((w) => (
              <li
                key={w.text}
                className={`rounded-md border px-3 py-2 text-sm ${
                  w.severity === "critical"
                    ? "border-[var(--critical)]/30 bg-[var(--critical)]/[0.07] text-red-100/90"
                    : "border-[var(--caution)]/30 bg-[var(--caution)]/[0.06] text-amber-50/90"
                }`}
              >
                {w.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
