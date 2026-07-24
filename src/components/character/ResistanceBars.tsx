import type { DefensiveStats } from "@/lib/characterImport/types";

const RES_FIELDS: {
  key: keyof Pick<
    DefensiveStats,
    "fireResistance" | "coldResistance" | "lightningResistance" | "chaosResistance"
  >;
  label: string;
}[] = [
  { key: "fireResistance", label: "Fire" },
  { key: "coldResistance", label: "Cold" },
  { key: "lightningResistance", label: "Lightning" },
  { key: "chaosResistance", label: "Chaos" },
];

export function ResistanceBars({ stats }: { stats: DefensiveStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {RES_FIELDS.map(({ key, label }) => {
        const value = stats[key];
        // Chaos resistance has no 75% soft cap in PoE2 — "good" here just
        // means non-negative, unlike the three elemental resistances.
        const healthy = key === "chaosResistance" ? value >= 0 : value >= 75;
        const clamped = Math.min(100, Math.max(0, value));
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>{label}</span>
              <span
                className={
                  healthy
                    ? "font-medium text-emerald-400"
                    : "font-medium text-red-300"
                }
              >
                {value}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${healthy ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${clamped}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
