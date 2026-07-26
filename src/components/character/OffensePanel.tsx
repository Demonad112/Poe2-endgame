import type { PobStats } from "@/lib/characterImport/types";
import { formatCompact } from "@/lib/characterImport/format";
import { describePobConfig } from "@/lib/characterImport/pobConfig";
import type { DpsBreakdown } from "@/lib/characterImport/dpsAdvice";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--hairline-soft)] bg-[var(--surface-well)] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

export function OffensePanel({
  pob,
  dps,
}: {
  pob: PobStats;
  dps: DpsBreakdown | null;
}) {
  return (
    <div className="space-y-4">

      <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent-soft)] p-4">
        <p className="text-xs tracking-wide text-[var(--accent)] uppercase">
          Combined DPS
        </p>
        <p className="mt-1 text-4xl font-bold text-slate-50">
          {formatCompact(pob.combinedDps)}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {pob.mainSkill ? (
            <>
              for <span className="text-slate-200">{pob.mainSkill}</span> — computed
              by Path of Building
            </>
          ) : (
            "computed by Path of Building"
          )}
        </p>
      </div>

      {/* A DPS number means nothing without the assumptions behind it. This
          export's own config is read and shown rather than assumed to be
          PoB's defaults, which it almost never is. */}
      <p
        className={`rounded-md border p-3 text-xs ${
          pob.config?.versusBoss
            ? "border-[var(--hairline-soft)] bg-[var(--surface-well)] text-slate-400"
            : "border-[var(--caution)]/30 bg-[var(--caution)]/[0.05] text-amber-50/80"
        }`}
      >
        {describePobConfig(pob.config)}
        {pob.config && !pob.config.versusBoss && (
          <>
            {" "}
            Single-target damage against a pinnacle boss will be different —
            re-check in Path of Building with a boss configured before judging
            this build&apos;s boss damage.
          </>
        )}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Hit damage" value={formatCompact(pob.averageDamage)} />
        <Metric label="Speed" value={`${pob.speed.toFixed(2)}/s`} />
        <Metric label="Crit chance" value={`${pob.critChance.toFixed(1)}%`} />
        <Metric label="Crit multiplier" value={`${pob.critMultiplier.toFixed(2)}x`} />
        <Metric label="Hit chance" value={`${Math.round(pob.hitChance)}%`} />
        {pob.dotDps > 1 && (
          <Metric label="Damage over time" value={formatCompact(pob.dotDps)} />
        )}
        {pob.accuracy > 0 && (
          <Metric label="Accuracy" value={pob.accuracy.toLocaleString()} />
        )}
        {dps?.critMultiplierEffective != null && (
          // What crit is actually worth, rather than two numbers the player
          // has to combine themselves: 5% chance at 2.48x is only +7% damage.
          <Metric
            label="Crit is worth"
            value={`+${Math.round((dps.critMultiplierEffective - 1) * 100)}%`}
          />
        )}
      </div>

      {dps && dps.factors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">
            What&apos;s limiting this
          </h3>
          <ul className="space-y-2">
            {dps.factors.map((f) => (
              <li
                key={f.id}
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-well)] p-3"
              >
                <p className="text-sm text-slate-200">{f.finding}</p>
                <p className="mt-1 text-sm text-slate-400">{f.action}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
