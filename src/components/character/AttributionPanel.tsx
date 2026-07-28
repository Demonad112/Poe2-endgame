import {
  STAT_LABEL,
  type AttributableStat,
  type ItemAttribution,
  type StatAttribution,
} from "@/lib/characterImport/breakdowns";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { StatusChip } from "./Instruments";

/**
 * Where every defensive number on the page actually comes from.
 *
 * This answers the question a player asks the moment they are told a
 * resistance is short: "short from what?". Until now the page could say a
 * number was low and could name an item that might host a fix, but it could
 * not say which items were already carrying the stat — so its upgrade advice
 * was blind to what an upgrade would cost.
 *
 * Every figure here is poe.ninja's own attribution, validated against the
 * character sheet before it is shown (see breakdowns.ts). Stats whose
 * attribution disagrees with the sheet are omitted entirely rather than
 * displayed with a caveat, because a breakdown that does not add up is not
 * evidence of anything.
 */

/** Order the stats the way a player reads their sheet, not by index. */
const DISPLAY_ORDER: AttributableStat[] = [
  "life",
  "energyShield",
  "ward",
  "armour",
  "evasionRating",
  "fireResistance",
  "coldResistance",
  "lightningResistance",
  "chaosResistance",
];

const SOURCE_LABEL: Record<string, string> = {
  character: "Character base",
  passive: "Passive tree",
  item: "Equipment",
  skill: "Skill",
  attribute: "Attributes",
  quest: "Quest rewards",
  conversion: "Conversion",
  unknown: "Unattributed",
};

function StatRow({ entry }: { entry: StatAttribution }) {
  // Group by where it came from rather than listing 13 individual modifiers —
  // "the passive tree gives you 40% of your life" is the shape of the answer,
  // and the per-item detail is available in the item view below.
  const groups = new Map<string, number>();
  for (const contribution of entry.contributions) {
    if (contribution.kind !== "flat") continue;
    groups.set(
      contribution.sourceKind,
      (groups.get(contribution.sourceKind) ?? 0) + contribution.value
    );
  }
  const rows = [...groups.entries()]
    .filter(([, value]) => value !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const magnitude = rows.reduce((sum, [, value]) => sum + Math.abs(value), 0);

  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h4 className="text-sm font-semibold text-slate-200">
          {STAT_LABEL[entry.stat]}
        </h4>
        <span className="font-mono text-sm tabular-nums text-slate-100">
          {entry.total.toLocaleString()}
        </span>
        {entry.increasedPercent !== 0 && (
          <span className="text-xs text-slate-500">
            {entry.base.toLocaleString()} base, {entry.increasedPercent}%
            increased
          </span>
        )}
        {entry.overcap > 0 && (
          <StatusChip tone="muted">{entry.overcap} over cap</StatusChip>
        )}
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {rows.map(([kind, value]) => (
          <li key={kind} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-slate-400">
              {SOURCE_LABEL[kind] ?? kind}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-well)]">
              <span
                className={`block h-full rounded-full ${value < 0 ? "bg-[var(--critical)]" : "bg-[var(--accent)]"}`}
                style={{
                  width: `${magnitude > 0 ? (Math.abs(value) / magnitude) * 100 : 0}%`,
                }}
              />
            </span>
            <span className="w-14 shrink-0 text-right font-mono tabular-nums text-slate-300">
              {value > 0 ? "+" : ""}
              {value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ItemRow({ item }: { item: ItemAttribution }) {
  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h4 className="text-sm font-semibold text-slate-200">
          {item.itemName}
        </h4>
        <span className="text-xs text-slate-500">{item.slot}</span>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
        {item.contributions.map((contribution) => (
          <li key={contribution.stat} className="font-mono tabular-nums">
            <span className="text-slate-500">
              {STAT_LABEL[contribution.stat]}{" "}
            </span>
            {contribution.flat > 0 && `+${contribution.flat.toLocaleString()}`}
            {contribution.flat > 0 && contribution.increased > 0 && " "}
            {contribution.increased > 0 && `+${contribution.increased}%`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AttributionPanel({
  attribution,
  itemAttribution,
}: {
  attribution: StatAttribution[];
  itemAttribution: ItemAttribution[];
}) {
  const shown = DISPLAY_ORDER.map((stat) =>
    attribution.find((a) => a.stat === stat && a.matchesSheet)
  ).filter((entry): entry is StatAttribution => Boolean(entry && entry.total !== 0));

  if (shown.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        This character&apos;s import didn&apos;t include a stat breakdown, so
        there&apos;s nothing to attribute. Re-importing usually fixes it —
        poe.ninja supplies the breakdown on current snapshots.
      </p>
    );
  }

  const omitted = attribution.filter((a) => !a.matchesSheet);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {shown.map((entry) => (
          <StatRow key={entry.stat} entry={entry} />
        ))}
      </div>

      {itemAttribution.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>By item</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {itemAttribution.map((item) => (
              <ItemRow key={item.itemName} item={item} />
            ))}
          </div>
        </div>
      )}

      {omitted.length > 0 && (
        <p className="text-xs leading-relaxed text-slate-500">
          {omitted.map((o) => STAT_LABEL[o.stat]).join(" and ")} is not shown:
          the modifiers on your character sum to a different number than your
          sheet reports, which is what a keystone override looks like. Rather
          than guess which is right, it is left out.
        </p>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Attribution is poe.ninja&apos;s own, cross-checked against your
        character sheet before being shown. Percentage increases are listed
        separately from flat values because they multiply the base rather than
        adding to it.
      </p>
    </div>
  );
}
