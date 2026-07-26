import type { PobStats } from "@/lib/characterImport/types";
import { formatCompact } from "@/lib/characterImport/format";
import { describePobConfig } from "@/lib/characterImport/pobConfig";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function OffensePanel({ pob }: { pob: PobStats }) {
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
            ? "border-white/10 bg-black/20 text-slate-400"
            : "border-amber-500/25 bg-amber-500/[0.05] text-amber-100/80"
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
      </div>
    </div>
  );
}
