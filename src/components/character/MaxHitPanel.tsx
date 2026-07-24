import type { PobStats } from "@/lib/characterImport/types";
import { SectionTitle } from "@/components/shared/SectionTitle";

const TYPE_LABELS: { key: keyof PobStats["maxHitTaken"]; label: string }[] = [
  { key: "physical", label: "Physical" },
  { key: "fire", label: "Fire" },
  { key: "cold", label: "Cold" },
  { key: "lightning", label: "Lightning" },
  { key: "chaos", label: "Chaos" },
];

/**
 * Largest single hit survivable, per damage type. Averages hide one-shot
 * risk — a build can look healthy overall and still get deleted by its
 * worst type — so this ranks them and calls out the weakest.
 */
export function MaxHitPanel({ pob }: { pob: PobStats }) {
  const rows = TYPE_LABELS.map(({ key, label }) => ({
    label,
    value: pob.maxHitTaken[key],
  })).filter((r) => r.value > 0);

  if (rows.length === 0) return null;

  const highest = Math.max(...rows.map((r) => r.value));
  const lowest = Math.min(...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      <SectionTitle>Max hit survivable</SectionTitle>
      <p className="text-sm text-slate-400">
        The largest single hit of each damage type this character can take
        without dying. The smallest number is the one that gets you killed.
      </p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const isWeakest = row.value === lowest && rows.length > 1;
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
