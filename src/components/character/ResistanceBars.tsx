import type { DefensiveStats, PobStats } from "@/lib/characterImport/types";
import {
  CHAOS_TARGET,
  isHealthy,
  RES_CAP,
  type ResistanceKey,
} from "@/lib/characterImport/thresholds";

const RES_FIELDS: {
  key: keyof Pick<
    DefensiveStats,
    "fireResistance" | "coldResistance" | "lightningResistance" | "chaosResistance"
  >;
  type: ResistanceKey;
  label: string;
}[] = [
  { key: "fireResistance", type: "fire", label: "Fire" },
  { key: "coldResistance", type: "cold", label: "Cold" },
  { key: "lightningResistance", type: "lightning", label: "Lightning" },
  { key: "chaosResistance", type: "chaos", label: "Chaos" },
];

/**
 * Resistance bars scaled to each resistance's own target rather than to a flat
 * 0-100.
 *
 * Against a 0-100 scale, 74% and 75% render as visually identical bars even
 * though one is capped and the other is not — the entire point of the display.
 * Scaling to the cap puts the meaningful boundary at the end of the track, and
 * hatching the overcap makes 24 points of headroom something you can see
 * rather than a grey "+24" beside the number.
 */
export function ResistanceBars({
  stats,
  pob,
}: {
  stats: DefensiveStats;
  pob?: PobStats;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 sm:grid-cols-4">
      {RES_FIELDS.map(({ key, type, label }) => {
        const value = stats[key];
        const target = type === "chaos" ? CHAOS_TARGET : RES_CAP;
        const healthy = isHealthy(type, value);
        const overCap = pob?.resistOverCap[type] ?? 0;

        const fillPct = Math.min(100, Math.max(0, (value / target) * 100));
        const tone = healthy
          ? "var(--good)"
          : type === "chaos"
            ? "var(--caution)"
            : "var(--critical)";

        const shortfall = Math.max(0, target - value);

        return (
          <div key={key}>
            <div className="mb-1 flex items-baseline justify-between gap-1 text-xs">
              <span className="tracking-wide text-slate-500 uppercase">
                {label}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: tone }}
              >
                {value}%
              </span>
            </div>

            <div className="relative h-[7px] overflow-hidden rounded-full border border-[var(--hairline-soft)] bg-[var(--surface-well)]">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${fillPct}%`, background: tone }}
              />
              {overCap > 0 && (
                // Headroom above the cap, drawn as hatching over the filled
                // track. It's insurance against resistance-reducing map mods,
                // so it deserves to be visible rather than a footnote.
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${fillPct}%`,
                    background:
                      "repeating-linear-gradient(115deg, rgba(255,255,255,0.35) 0 3px, transparent 3px 6px)",
                  }}
                />
              )}
            </div>

            <p className="mt-1 text-[10px] text-slate-500">
              {shortfall > 0 ? (
                <span style={{ color: tone }}>
                  {shortfall} under {type === "chaos" ? "target" : "cap"}
                </span>
              ) : overCap > 0 ? (
                <>+{overCap} over cap</>
              ) : (
                <>at {type === "chaos" ? "target" : "cap"}</>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
