"use client";

import { useEffect, useState } from "react";
import type { ImportedCharacter } from "@/lib/characterImport/types";
import { loadModTiers, type ModTierTable } from "@/lib/characterImport/modTiers";
import { auditGear } from "@/lib/characterImport/gearAudit";
import { SectionTitle } from "@/components/shared/SectionTitle";

export function GearAuditPanel({
  character,
}: {
  character: ImportedCharacter;
}) {
  // The affix table is a ~210KB asset, so it's fetched on demand rather than
  // bundled — a genuine side effect, hence a real useEffect.
  const [table, setTable] = useState<ModTierTable | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadModTiers().then((t) => {
      if (cancelled) return;
      if (t) setTable(t);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div>
        <SectionTitle>Gear audit</SectionTitle>
        <p className="text-sm text-slate-500">
          Couldn&apos;t load the affix tier data, so upgrade headroom
          isn&apos;t available right now.
        </p>
      </div>
    );
  }

  if (!table) {
    return (
      <div>
        <SectionTitle>Gear audit</SectionTitle>
        <p className="text-sm text-slate-500">Loading affix tiers…</p>
      </div>
    );
  }

  const audit = auditGear(character, table);
  const topUpgrades = audit.upgrades.slice(0, 8);

  return (
    <div className="space-y-4">
      <SectionTitle>Gear audit</SectionTitle>

      <p className="text-sm text-slate-400">
        Every rollable modifier on your gear, graded against the best tier its
        item level could roll. {audit.gradedCount} modifiers checked.
      </p>

      {topUpgrades.length === 0 ? (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm text-emerald-100/90">
          No tier upgrades available — every graded modifier is already at the
          best tier its item level allows.
        </p>
      ) : (
        <ul className="space-y-2">
          {topUpgrades.map((u, i) => (
            <li
              key={i}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
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
                className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm"
              >
                <p className="font-medium text-amber-100">
                  {q.text} on {q.itemName}{" "}
                  <span className="text-[11px] font-normal text-slate-500">
                    {q.itemSlot}
                  </span>
                </p>
                <p className="mt-0.5 text-amber-100/70">{q.reason}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Read as {audit.archetype === "unknown" ? "an unclassified" : `an ${audit.archetype}`} build
          {audit.weaponType ? ` wielding a ${audit.weaponType}` : ""} — {audit.archetypeBasis}.
          Only clear-cut mismatches are flagged, and attribute rolls are never
          flagged since they gate gem requirements.
        </p>
      </div>
    </div>
  );
}
