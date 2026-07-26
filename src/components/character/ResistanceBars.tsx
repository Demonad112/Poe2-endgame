import type { DefensiveStats, PobStats } from "@/lib/characterImport/types";
import { CHAOS_TARGET, isHealthy, RES_CAP } from "@/lib/characterImport/thresholds";

const RES_FIELDS: {
  key: keyof Pick<
    DefensiveStats,
    "fireResistance" | "coldResistance" | "lightningResistance" | "chaosResistance"
  >;
  overCapKey: keyof PobStats["resistOverCap"];
  label: string;
}[] = [
  { key: "fireResistance", overCapKey: "fire", label: "Fire" },
  { key: "coldResistance", overCapKey: "cold", label: "Cold" },
  { key: "lightningResistance", overCapKey: "lightning", label: "Lightning" },
  { key: "chaosResistance", overCapKey: "chaos", label: "Chaos" },
];

export function ResistanceBars({
  stats,
  pob,
}: {
  stats: DefensiveStats;
  pob?: PobStats;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {RES_FIELDS.map(({ key, overCapKey, label }) => {
        const value = stats[key];
        // Judged against the SHARED targets, so a bar can't render green
        // while the assessment calls the same number a weakness and the
        // advice panel says it's short — which is what 18% chaos used to do.
        const healthy = isHealthy(overCapKey, value);
        const target = overCapKey === "chaos" ? CHAOS_TARGET : RES_CAP;
        // Scale the bar against its own target rather than a flat 100, so
        // "how close am I" reads the same for chaos as for the elements.
        const clamped = Math.min(100, Math.max(0, (value / target) * 100));
        // Overcap is headroom against enemy resistance-reduction; worth
        // surfacing because a bare-75% resist can be stripped below cap.
        const overCap = pob?.resistOverCap[overCapKey] ?? 0;
        return (
          <div key={key}>
            <div className="mb-1 flex items-baseline justify-between gap-1 text-xs text-slate-400">
              <span>{label}</span>
              <span className="flex items-baseline gap-1">
                {overCap > 0 && (
                  <span className="text-[10px] text-slate-500">+{overCap}</span>
                )}
                <span
                  className={
                    healthy
                      ? "font-medium text-emerald-400"
                      : "font-medium text-red-300"
                  }
                >
                  {value}%
                </span>
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
