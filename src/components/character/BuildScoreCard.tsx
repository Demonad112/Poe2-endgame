import type { ImportedCharacter } from "@/lib/characterImport/types";
import { assessBuild } from "@/lib/characterImport/buildScore";
import { SectionTitle } from "@/components/shared/SectionTitle";

const TIER_STYLES: Record<string, string> = {
  A: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  B: "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]",
  C: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  D: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function BuildScoreCard({
  character,
}: {
  character: ImportedCharacter;
}) {
  const assessment = assessBuild(character);

  return (
    <div className="space-y-4">
      <SectionTitle>Assessment</SectionTitle>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
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
          <h3 className="mb-2 text-sm font-semibold text-emerald-300">
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {assessment.strengths.map((s) => (
              <li
                key={s}
                className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-sm text-emerald-100/90"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-red-300">
            Weaknesses
          </h3>
          <ul className="space-y-1.5">
            {assessment.weaknesses.map((w) => (
              <li
                key={w.text}
                className={`rounded-md border px-3 py-2 text-sm ${
                  w.severity === "critical"
                    ? "border-red-500/25 bg-red-500/[0.07] text-red-100/90"
                    : "border-amber-500/25 bg-amber-500/[0.06] text-amber-100/90"
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
