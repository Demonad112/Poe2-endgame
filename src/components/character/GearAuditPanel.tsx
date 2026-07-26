import type { GearAudit } from "@/lib/characterImport/gearAudit";

/**
 * Presentation only — the audit itself is computed by the shared analysis
 * pass in analysis.ts, so the ordering here can't drift from the "Fix next"
 * list. Upgrades are still listed in the audit's own order (which reflects
 * how far each item sits from its item-level ceiling); which of them is worth
 * doing first is the ranked list's job, not this panel's.
 */
export function GearAuditPanel({
  audit,
  pending,
  failed,
}: {
  audit: GearAudit | null;
  pending: boolean;
  failed: boolean;
}) {
  if (failed) {
    return (
      <p className="text-sm text-slate-500">
        Couldn&apos;t load the affix tier data, so upgrade headroom isn&apos;t
        available right now.
      </p>
    );
  }

  if (!audit) {
    return (
      <p className="text-sm text-slate-500">
        {pending ? "Loading affix tiers…" : "Affix tiers unavailable."}
      </p>
    );
  }

  const topUpgrades = audit.upgrades.slice(0, 8);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Every rollable modifier on your gear, graded against the best tier its
        item level could roll. {audit.gradedCount} modifiers checked.
      </p>

      <p className="rounded-md border border-[var(--hairline-soft)] bg-[var(--surface-well)] p-3 text-xs text-slate-400">
        T1 is the <em>theoretical</em> best an item level allows, not a
        realistic crafting target — almost every real item sits several tiers
        below it on most affixes. Read these as headroom rather than defects,
        and take the ordering from &ldquo;Fix next&rdquo; above rather than
        from the size of the gap.
      </p>

      {topUpgrades.length === 0 ? (
        <p className="rounded-lg border border-[var(--good)]/30 bg-[var(--good)]/[0.06] p-3 text-sm text-emerald-100/90">
          No tier upgrades available — every graded modifier is already at the
          best tier its item level allows.
        </p>
      ) : (
        <ul className="space-y-2">
          {topUpgrades.map((u, i) => (
            <li
              key={i}
              className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3"
            >
              <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                <span className="font-medium text-slate-100">
                  {u.statLabel} on {u.itemName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {u.itemSlot} · ilvl {u.itemLevel}
                </span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span className="rounded border border-white/15 px-1.5 text-xs text-slate-300">
                  T{u.currentTier}
                </span>
                <span className="tabular-nums">{u.currentValue}</span>
                <span className="text-slate-600">→</span>
                <span className="rounded border border-[var(--accent)]/40 px-1.5 text-xs text-[var(--accent)]">
                  T{u.bestTier}
                </span>
                <span className="tabular-nums text-slate-300">
                  {u.bestMin}–{u.bestMax}
                </span>
                {u.affixName && (
                  <span className="text-xs text-slate-600">
                    &ldquo;{u.affixName}&rdquo;
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">
          Modifiers that may not be helping
        </h3>
        {audit.questionable.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nothing flagged — every modifier looks relevant to
            {audit.archetype === "unknown"
              ? " this build"
              : ` an ${audit.archetype} build`}
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {audit.questionable.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-[var(--caution)]/30 bg-[var(--caution)]/[0.06] p-3 text-sm"
              >
                <p className="font-medium text-amber-50">
                  {q.text} on {q.itemName}{" "}
                  <span className="text-[11px] font-normal text-slate-500">
                    {q.itemSlot}
                  </span>
                </p>
                <p className="mt-0.5 text-amber-50/70">{q.reason}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Read as{" "}
          {audit.archetype === "unknown"
            ? "an unclassified"
            : `an ${audit.archetype}`}{" "}
          build
          {audit.weaponType ? ` wielding a ${audit.weaponType}` : ""} —{" "}
          {audit.archetypeBasis}. Only clear-cut mismatches are flagged, and
          attribute rolls are never flagged since they gate gem requirements.
        </p>
      </div>
    </div>
  );
}
