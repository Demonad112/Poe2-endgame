import type {
  CharacterSnapshot,
  MetricDelta,
} from "@/lib/characterImport/snapshot";
import { diffSnapshots } from "@/lib/characterImport/snapshot";

function formatValue(v: number, unit: MetricDelta["unit"]): string {
  return unit === "percent" ? `${v}%` : v.toLocaleString();
}

function formatDelta(d: MetricDelta): string {
  const sign = d.delta > 0 ? "+" : "";
  return d.unit === "percent"
    ? `${sign}${d.delta}%`
    : `${sign}${d.delta.toLocaleString()}`;
}

function Row({ d }: { d: MetricDelta }) {
  const tone = d.improved ? "text-[var(--good)]" : "text-[var(--critical)]";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-[var(--hairline-soft)] py-1.5 last:border-b-0">
      <span className="text-sm text-slate-300">{d.label}</span>
      <span className="flex items-baseline gap-2 text-sm tabular-nums">
        <span className="text-slate-500">{formatValue(d.before, d.unit)}</span>
        <span className="text-slate-600">→</span>
        <span className="text-slate-200">{formatValue(d.after, d.unit)}</span>
        <span className={`w-20 text-right font-medium ${tone}`}>
          {formatDelta(d)}
          {d.percent !== null && Math.abs(d.percent) >= 1 && d.unit === "raw" && (
            <span className="ml-1 text-[10px] opacity-70">
              {d.percent > 0 ? "+" : ""}
              {Math.round(d.percent)}%
            </span>
          )}
        </span>
      </span>
    </li>
  );
}

/**
 * What changed since the last import of this character.
 *
 * Every other panel answers "where are you now". None of them answered "is
 * what you did last week working" — which is the question someone actually
 * improving a character keeps asking, and the one that makes the rest of the
 * page worth revisiting.
 */
export function ProgressPanel({
  history,
  currentKey,
}: {
  history: CharacterSnapshot[];
  currentKey: string;
}) {
  const mine = history.filter((s) => s.key === currentKey);

  if (mine.length < 2) {
    return (
      <div className="space-y-2 text-sm text-slate-400">
        <p>
          Nothing to compare yet — this is the{" "}
          {mine.length === 1 ? "first" : "only"} snapshot of this character.
        </p>
        <p className="text-xs text-slate-500">
          Import it again after playing and this will show what moved. Snapshots
          are stored in this browser only, hold no gear or modifiers, and the
          last {20} are kept.
        </p>
      </div>
    );
  }

  const latest = mine[mine.length - 1];
  const previous = mine[mine.length - 2];
  const first = mine[0];

  const sincePrev = diffSnapshots(previous, latest);
  const sinceFirst = diffSnapshots(first, latest);

  const when = (iso: string) => {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString() : "unknown";
  };

  return (
    <div className="space-y-5">
      {(sincePrev.newlyCapped.length > 0 ||
        sincePrev.newlyUncapped.length > 0) && (
        // Crossing the cap is a one-point change that matters more than a
        // twenty-point change in the middle of the range, so it gets its own
        // line rather than being buried in the metric list.
        <div className="space-y-1.5">
          {sincePrev.newlyCapped.length > 0 && (
            <p className="rounded-md border border-[var(--good)]/30 bg-[var(--good)]/[0.06] p-3 text-sm text-[var(--good)]">
              {sincePrev.newlyCapped.join(" and ")} reached the 75% cap.
            </p>
          )}
          {sincePrev.newlyUncapped.length > 0 && (
            <p className="rounded-md border border-[var(--critical)]/30 bg-[var(--critical)]/[0.06] p-3 text-sm text-[var(--critical)]">
              {sincePrev.newlyUncapped.join(" and ")} dropped below the 75% cap.
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-300">
          Since your last import
        </h3>
        <p className="mb-2 text-xs text-slate-500">{when(previous.at)}</p>
        {sincePrev.changes.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nothing tracked here moved between these two imports.
          </p>
        ) : (
          <ul>
            {sincePrev.changes.map((d) => (
              <Row key={d.label} d={d} />
            ))}
          </ul>
        )}
      </div>

      {mine.length > 2 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-300">
            Since the first snapshot
          </h3>
          <p className="mb-2 text-xs text-slate-500">
            {when(first.at)} · {mine.length} snapshots
          </p>
          {sinceFirst.changes.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nothing tracked here has moved.
            </p>
          ) : (
            <ul>
              {sinceFirst.changes.map((d) => (
                <Row key={d.label} d={d} />
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Snapshots are stored in this browser only and hold no gear or
        modifiers — just the figures above. A change here reflects everything
        that moved between imports, not only what you deliberately changed.
      </p>
    </div>
  );
}
