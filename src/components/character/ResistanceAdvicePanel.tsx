import type { ImportedCharacter } from "@/lib/characterImport/types";
import { analyseResistances } from "@/lib/characterImport/resistanceAdvice";
import { RESIST_LABEL } from "@/lib/characterImport/resistanceTiers";

export function ResistanceAdvicePanel({
  character,
}: {
  character: ImportedCharacter;
}) {
  const { statuses, suggestions, noItemData } = analyseResistances(character);

  return (
    <div className="space-y-4">

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((s) => {
          const good = s.shortfall === 0;
          return (
            <div
              key={s.type}
              className={`rounded-md border p-3 ${
                good
                  ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                  : "border-red-500/25 bg-red-500/[0.06]"
              }`}
            >
              <p className="flex items-baseline justify-between text-xs text-slate-400">
                <span>{RESIST_LABEL[s.type]}</span>
                <span
                  className={`text-base font-semibold ${good ? "text-emerald-300" : "text-red-300"}`}
                >
                  {s.current}%
                </span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {s.shortfall > 0
                  ? `${s.shortfall}% short`
                  : s.overCap > 0
                    ? `${s.overCap}% over cap`
                    : "at cap"}
                {s.fromGear > 0 && ` · ${s.fromGear}% from gear`}
              </p>
            </div>
          );
        })}
      </div>

      {noItemData ? (
        <p className="text-sm text-slate-500">
          This character&apos;s data didn&apos;t include per-item modifiers, so
          there&apos;s nothing to attribute resistances to.
        </p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-slate-400">
          Nothing to change — resistances are capped with no wasted surplus.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={`rounded-lg border p-3 ${
                s.severity === "critical"
                  ? "border-red-500/25 bg-red-500/[0.06]"
                  : "border-[var(--accent)]/25 bg-[var(--accent-soft)]"
              }`}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-slate-100">
                {s.title}
                {s.itemSlot && (
                  <span className="text-[11px] font-normal text-slate-500">
                    {s.itemSlot}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {s.detail}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        Tier ranges come from the game&apos;s own modifier table, cross-checked
        against{" "}
        <a
          href="https://repoe-fork.github.io/poe2/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-slate-300"
        >
          RePoE
        </a>{" "}
        and{" "}
        <a
          href="https://poe2db.tw/us/Modifiers"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-slate-300"
        >
          poe2db
        </a>
        . Totals are poe.ninja&apos;s and Path of Building&apos;s — gear data is
        used only to attribute where each resistance comes from, since the
        passive tree and act penalties also move these numbers.
      </p>
    </div>
  );
}
