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
 *
 * The threshold is drawn rather than described. It's already computed, so
 * rendering it as a dashed marker with the danger zone tinted lets two types
 * sitting inside it be seen instead of explained. Rows are sorted weakest
 * first so the risks are read before the reassurance.
 */
export function MaxHitPanel({ pob }: { pob: PobStats }) {
  const rows = TYPE_LABELS.map(({ key, label }) => ({
    label,
    value: pob.maxHitTaken[key],
  }))
    .filter((r) => r.value > 0)
    .sort((a, b) => a.value - b.value);

  if (rows.length === 0) return null;

  const highest = Math.max(...rows.map((r) => r.value));
  const riskThreshold = highest * ONE_SHOT_RATIO;
  const atRisk = rows.filter((r) => r.value < riskThreshold);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        The largest single hit of each damage type this character can take
        without dying.
      </p>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const isWeakest = rows.length > 1 && row.value < riskThreshold;
          const percent = highest > 0 ? (row.value / highest) * 100 : 0;
          return (
            <li
              key={row.label}
              className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3"
            >
              <span className="text-xs text-slate-500">{row.label}</span>
              <div className="relative h-2.5 overflow-hidden rounded-[3px] border border-[var(--hairline-soft)] bg-[var(--surface-well)]">
                <div
                  className="absolute inset-y-0 left-0 border-r border-dashed border-[var(--critical)]/80 bg-[var(--critical)]/15"
                  style={{ width: `${ONE_SHOT_RATIO * 100}%` }}
                />
                <div
                  className={`absolute inset-y-0 left-0 rounded-[2px] ${
                    isWeakest ? "bg-[var(--critical)]" : "bg-slate-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span
                className={`text-right text-sm font-medium tabular-nums ${
                  isWeakest ? "text-[var(--critical)]" : "text-slate-200"
                }`}
              >
                {row.value.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>
          <span className="text-[var(--critical)]">Dashed line</span> ={" "}
          {Math.round(riskThreshold).toLocaleString()} —{" "}
          {Math.round(ONE_SHOT_RATIO * 100)}% of the best type
        </span>
        {atRisk.length > 0 ? (
          <span>Anything left of it dies to a hit the others survive.</span>
        ) : (
          <span>No type lags far enough behind to stand out as a risk.</span>
        )}
      </p>
    </div>
  );
}
