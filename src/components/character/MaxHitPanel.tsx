import type { PobStats } from "@/lib/characterImport/types";
import { ONE_SHOT_RATIO } from "@/lib/characterImport/thresholds";

const TYPE_LABELS: { key: keyof PobStats["maxHitTaken"]; label: string }[] = [
  { key: "physical", label: "Physical" },
  { key: "fire", label: "Fire" },
  { key: "cold", label: "Cold" },
  { key: "lightning", label: "Lightning" },
  { key: "chaos", label: "Chaos" },
];

/**
 * Largest single hit survivable, per damage type.
 *
 * Every type under ONE_SHOT_RATIO of the best is flagged, not just the single
 * lowest. Marking only the minimum hid a near-identical physical gap behind a
 * chaos one on the test character, and physical hits are far more common —
 * "the smallest number is the one that kills you" is only true when nothing
 * else is sitting right next to it.
 */
export function MaxHitPanel({ pob }: { pob: PobStats }) {
  const rows = TYPE_LABELS.map(({ key, label }) => ({
    label,
    value: pob.maxHitTaken[key],
  })).filter((r) => r.value > 0);

  if (rows.length === 0) return null;

  const highest = Math.max(...rows.map((r) => r.value));
  const riskThreshold = highest * ONE_SHOT_RATIO;
  const atRiskCount = rows.filter((r) => r.value < riskThreshold).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        The largest single hit of each damage type this character can take
        without dying.{" "}
        {atRiskCount > 0 ? (
          <>
            Anything under{" "}
            <span className="tabular-nums text-slate-300">
              {Math.round(riskThreshold).toLocaleString()}
            </span>{" "}
            — {Math.round(ONE_SHOT_RATIO * 100)}% of the best — is marked as a
            one-shot risk.
          </>
        ) : (
          "No type lags far enough behind the others to stand out as a one-shot risk."
        )}
      </p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const isWeakest = rows.length > 1 && row.value < riskThreshold;
          const percent = highest > 0 ? (row.value / highest) * 100 : 0;
          return (
            <li key={row.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-slate-400">
                {row.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${
                    isWeakest ? "bg-red-500" : "bg-slate-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span
                className={`w-24 shrink-0 text-right text-sm font-medium tabular-nums ${
                  isWeakest ? "text-red-300" : "text-slate-200"
                }`}
              >
                {row.value.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
