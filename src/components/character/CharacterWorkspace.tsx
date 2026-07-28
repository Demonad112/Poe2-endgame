"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Accordion } from "@/components/shared/Accordion";
import { useCharacterImport } from "@/hooks/useCharacterImport";
import { useModTiers } from "@/hooks/useModTiers";
import { usePassiveNodes } from "@/hooks/usePassiveNodes";
import { useLadder } from "@/hooks/useLadder";
import { analyseCharacter } from "@/lib/characterImport/analysis";
import { RESIST_LABEL } from "@/lib/characterImport/resistanceTiers";
import { ONE_SHOT_RATIO } from "@/lib/characterImport/thresholds";
import { ImportPanel } from "./ImportPanel";
import { CharacterSummaryCard } from "./CharacterSummaryCard";
import { FixNextPanel } from "./FixNextPanel";
import { DefenseStatsPanel } from "./DefenseStatsPanel";
import { OffensePanel } from "./OffensePanel";
import { MaxHitPanel } from "./MaxHitPanel";
import { ResistanceAdvicePanel } from "./ResistanceAdvicePanel";
import { GearAuditPanel } from "./GearAuditPanel";
import { BuildScoreCard } from "./BuildScoreCard";
import { PassiveTreeSummary } from "./PassiveTreeSummary";
import { SkillsGearPanel } from "./SkillsGearPanel";
import { AttributionPanel } from "./AttributionPanel";
import { LimitsDisclaimer } from "./LimitsDisclaimer";
import { formatCompact } from "@/lib/characterImport/format";
import { PanelControls } from "./PanelControls";
import { ProgressPanel } from "./ProgressPanel";
import {
  diffSnapshots,
  snapshotKey,
  toSnapshot,
  type CharacterSnapshot,
} from "@/lib/characterImport/snapshot";
import {
  DangerBar,
  NumberReadout,
  ResistancePips,
  StatusChip,
} from "./Instruments";

interface Panel {
  id: string;
  title: string;
  summary?: ReactNode;
  badge?: ReactNode;
  instrument?: ReactNode;
  defaultOpen?: boolean;
  content: ReactNode;
}

function CountBadge({
  n,
  tone,
  suffix,
}: {
  n: number;
  tone: "critical" | "caution" | "muted";
  suffix?: string;
}) {
  if (n <= 0) return null;
  return (
    <StatusChip tone={tone}>
      {n}
      {suffix ? ` ${suffix}` : ""}
    </StatusChip>
  );
}

export function CharacterWorkspace() {
  const { pinnedImport, history, setPinnedImport, recordSnapshot, clearPinnedImport } =
    useCharacterImport();
  // Only pay for these assets once a character is actually on screen.
  const { table, pending, failed } = useModTiers(Boolean(pinnedImport));
  const { table: passiveTable, pending: passivesPending } = usePassiveNodes(
    Boolean(pinnedImport)
  );
  const { ladder } = useLadder(pinnedImport?.league, pinnedImport?.ascendancy);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionTitle>Import a character</SectionTitle>
        <ImportPanel onImported={setPinnedImport} />
      </section>

      {pinnedImport && (
        <CharacterAnalysis
          key={`${pinnedImport.account}/${pinnedImport.name}`}
          character={pinnedImport}
          table={table}
          passiveTable={passiveTable}
          passivesPending={passivesPending}
          ladder={ladder}
          history={history}
          onSnapshot={recordSnapshot}
          tablePending={pending}
          tableFailed={failed}
          onClear={clearPinnedImport}
        />
      )}
    </div>
  );
}

function CharacterAnalysis({
  character,
  table,
  passiveTable,
  passivesPending,
  ladder,
  history,
  onSnapshot,
  tablePending,
  tableFailed,
  onClear,
}: {
  character: NonNullable<ReturnType<typeof useCharacterImport>["pinnedImport"]>;
  table: Parameters<typeof analyseCharacter>[1];
  passiveTable: Parameters<typeof analyseCharacter>[2];
  passivesPending: boolean;
  ladder: Parameters<typeof analyseCharacter>[3];
  history: CharacterSnapshot[];
  onSnapshot: (s: CharacterSnapshot) => void;
  tablePending: boolean;
  tableFailed: boolean;
  onClear: () => void;
}) {
  const analysis = analyseCharacter(character, table, passiveTable, ladder);
  const { pob } = character;
  const key = snapshotKey(character);

  // Record the character's numbers once per import, and only after the
  // passive table has settled: keystones can change the defensive pool
  // (Chaos Inoculation drops life, Eldritch Battery drops energy shield), so
  // snapshotting early would persist a figure the page never displayed.
  //
  // Writing to localStorage is a real side effect, not derived state, so a
  // useEffect is the right tool. The ref keeps it to one write per import
  // even though the effect's inputs settle across several renders.
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (passivesPending) return;
    const stamp = `${key}@${character.provenance.fetchedAt}`;
    if (recorded.current === stamp) return;
    recorded.current = stamp;
    onSnapshot(toSnapshot(character, analysis.keystones));
  });

  // Only the three elements have a cap to be under. Chaos has no cap in PoE2 —
  // its shortfall is measured against a judgement-call target — so counting it
  // here would report "2 uncapped" for a character with one uncapped element.
  const uncapped = analysis.resistances.statuses.filter(
    (s) => s.type !== "chaos" && s.shortfall > 0
  );

  // Same figures the Max hit panel renders, so the collapsed readout and the
  // open panel can never disagree about what is at risk.
  const maxHit = (() => {
    if (!pob) return null;
    const hits = (
      [
        ["Physical", pob.maxHitTaken.physical],
        ["Fire", pob.maxHitTaken.fire],
        ["Cold", pob.maxHitTaken.cold],
        ["Lightning", pob.maxHitTaken.lightning],
        ["Chaos", pob.maxHitTaken.chaos],
      ] as [string, number][]
    ).filter(([, v]) => v > 0);
    if (hits.length === 0) return null;
    const best = hits.reduce((m, [, v]) => Math.max(m, v), 0);
    const [weakestLabel, weakest] = hits.reduce((a, b) => (a[1] <= b[1] ? a : b));
    return {
      best,
      weakest,
      weakestLabel,
      atRisk: hits.filter(([, v]) => v < best * ONE_SHOT_RATIO).length,
    };
  })();

  // Headline for the collapsed Progress row: how many figures moved since the
  // previous import, and whether the movement was net helpful.
  const mySnapshots = history.filter((s) => s.key === key);
  const progressDiff =
    mySnapshots.length >= 2
      ? diffSnapshots(
          mySnapshots[mySnapshots.length - 2],
          mySnapshots[mySnapshots.length - 1]
        )
      : null;
  const progressSummary = progressDiff
    ? `${progressDiff.changes.length} figure${progressDiff.changes.length === 1 ? "" : "s"} moved since your last import`
    : "Import again after playing to see what moved";
  const progressInstrument = progressDiff ? (
    progressDiff.newlyUncapped.length > 0 ? (
      <StatusChip tone="critical">Dropped below cap</StatusChip>
    ) : progressDiff.newlyCapped.length > 0 ? (
      <StatusChip tone="good">Capped</StatusChip>
    ) : progressDiff.changes.length > 0 ? (
      <StatusChip
        tone={
          progressDiff.changes.filter((c) => c.improved).length >=
          progressDiff.changes.length / 2
            ? "good"
            : "caution"
        }
      >
        {progressDiff.changes.filter((c) => c.improved).length}/
        {progressDiff.changes.length} up
      </StatusChip>
    ) : undefined
  ) : (
    <StatusChip>{mySnapshots.length || 0} snapshot{mySnapshots.length === 1 ? "" : "s"}</StatusChip>
  );

  // Headline figures for the attribution accordion's collapsed summary: the
  // share of the defensive pool that equipment is responsible for, and how
  // many resistances are carrying surplus over the cap.
  //
  // The share is of the BASE value, before percentage increases multiply it —
  // which is also the share of the final number, since the increases scale
  // every flat source alike. It is worded as "base" anyway, so a build whose
  // energy shield is entirely gear-supplied but tree-multiplied doesn't read
  // as though the tree contributes nothing.
  const attributed = analysis.attribution.filter((a) => a.matchesSheet);
  const poolAttribution = attributed.filter(
    (a) => a.stat === "life" || a.stat === "energyShield"
  );
  const poolFromGear = poolAttribution.reduce(
    (sum, entry) =>
      sum +
      entry.contributions
        .filter((c) => c.kind === "flat" && c.sourceKind === "item")
        .reduce((inner, c) => inner + c.value, 0),
    0
  );
  const poolBase = poolAttribution.reduce((sum, entry) => sum + entry.base, 0);
  const gearShare =
    poolBase > 0 ? Math.round((poolFromGear / poolBase) * 100) : null;
  const overcapped = attributed.filter(
    (a) => a.overcap > 0 && a.stat !== "chaosResistance"
  );

  // Declared as data so the presentation can change in one place — swapping
  // these accordions for a tab strip means changing only the renderer below,
  // not how any panel is built.
  const panels: Panel[] = [
    {
      id: "assessment",
      title: "Build assessment",
      summary: analysis.assessment.note,
      instrument: (
        <StatusChip
          tone={
            analysis.assessment.tier === "A"
              ? "good"
              : analysis.assessment.tier === "B"
                ? "accent"
                : analysis.assessment.tier === "C"
                  ? "caution"
                  : "critical"
          }
        >
          Tier {analysis.assessment.tier}
        </StatusChip>
      ),
      content: <BuildScoreCard assessment={analysis.assessment} />,
    },
    ...(pob && pob.combinedDps > 0
      ? [
          {
            id: "offense",
            title: "Offense",
            summary: [
              pob.mainSkill,
              `${pob.speed.toFixed(2)}/s`,
              `${pob.critChance.toFixed(1)}% crit`,
              pob.config?.versusBoss ? "vs boss" : "not vs boss",
            ]
              .filter(Boolean)
              .join(" · "),
            instrument: (
              <NumberReadout
                value={formatCompact(pob.combinedDps)}
                tone="accent"
              />
            ),
            content: (
              <OffensePanel
                pob={pob}
                dps={analysis.dps}
                ladder={analysis.ladder}
              />
            ),
          },
        ]
      : []),
    {
      id: "defenses",
      title: "Defenses",
      summary: `${analysis.pool.toLocaleString()} combined pool · ${character.ehp.toLocaleString()} EHP${character.ehpIsEstimate ? " (estimate)" : ""}`,
      badge: (
        <CountBadge n={uncapped.length} tone="critical" suffix="uncapped" />
      ),
      instrument: <ResistancePips statuses={analysis.resistances.statuses} />,
      content: <DefenseStatsPanel character={character} />,
    },
    ...(attributed.length > 0
      ? [
          {
            id: "attribution",
            title: "Where it comes from",
            summary: [
              gearShare !== null
                ? `Equipment supplies ${gearShare}% of your base life and energy shield`
                : null,
              overcapped.length > 0
                ? `${overcapped.length} resistance${overcapped.length === 1 ? "" : "s"} over cap`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            badge:
              overcapped.length > 0 ? (
                <CountBadge
                  n={overcapped.length}
                  tone="muted"
                  suffix="over cap"
                />
              ) : undefined,
            content: (
              <AttributionPanel
                attribution={analysis.attribution}
                itemAttribution={analysis.itemAttribution}
              />
            ),
          },
        ]
      : []),
    ...(pob
      ? [
          {
            id: "max-hit",
            title: "Max hit survivable",
            summary: maxHit
              ? `Weakest: ${maxHit.weakestLabel} ${maxHit.weakest.toLocaleString()}`
              : "Largest single hit absorbed, per damage type",
            badge: maxHit ? (
              <CountBadge n={maxHit.atRisk} tone="critical" suffix="at risk" />
            ) : undefined,
            instrument: maxHit ? (
              <DangerBar weakest={maxHit.weakest} best={maxHit.best} />
            ) : undefined,
            content: <MaxHitPanel pob={pob} />,
          },
        ]
      : []),
    {
      id: "resistances",
      title: "Resistance tuning",
      summary: analysis.resistances.statuses
        .map((r) =>
          r.shortfall > 0
            ? `${RESIST_LABEL[r.type]} ${r.shortfall} short`
            : r.overCap > 0
              ? `${RESIST_LABEL[r.type]} +${r.overCap}`
              : `${RESIST_LABEL[r.type]} ok`
        )
        .join(" · "),
      instrument: (
        <CountBadge
          n={analysis.resistances.suggestions.length}
          tone="muted"
          suffix="actions"
        />
      ),
      content: <ResistanceAdvicePanel character={character} />,
    },
    {
      id: "gear-audit",
      title: "Gear audit",
      summary: analysis.gear
        ? `${analysis.gear.gradedCount} modifiers graded against the best tier their item level allows`
        : tableFailed
          ? "Affix tier data unavailable"
          : "Loading affix tiers…",
      instrument: (
        <CountBadge
          n={analysis.gear?.questionable.length ?? 0}
          tone="caution"
          suffix="not helping"
        />
      ),
      content: (
        <GearAuditPanel
          audit={analysis.gear}
          pending={tablePending}
          failed={tableFailed}
        />
      ),
    },
    {
      id: "passives",
      title: "Passive tree",
      summary: analysis.passives
        ? [
            character.ascendancy,
            `${analysis.passives.notables.length} notables`,
            analysis.passives.keystones.length > 0
              ? `${analysis.passives.keystones.length} keystones`
              : "no keystones",
          ]
            .filter(Boolean)
            .join(" · ")
        : `${character.passivePointsAllocated} points allocated`,
      instrument: (
        <NumberReadout value={String(character.passivePointsAllocated)} />
      ),
      content: (
        <PassiveTreeSummary
          character={character}
          passives={analysis.passives}
          keystones={analysis.keystones}
          pending={passivesPending}
        />
      ),
    },
    {
      id: "progress",
      title: "Progress",
      summary: progressSummary,
      instrument: progressInstrument,
      content: <ProgressPanel history={history} currentKey={key} />,
    },
    {
      id: "skills-gear",
      title: "Skills & gear",
      summary: `${character.skills.length} skill setup${character.skills.length === 1 ? "" : "s"} · ${character.gear.length} items, every modifier`,
      instrument: pob?.mainSkill ? (
        <StatusChip>{pob.mainSkill}</StatusChip>
      ) : undefined,
      content: <SkillsGearPanel character={character} />,
    },
    {
      id: "limits",
      title: "Where these numbers come from",
      summary: "Sources, assumptions and known limits",
      instrument:
        pob && !pob.config?.versusBoss ? (
          <StatusChip>Not vs boss</StatusChip>
        ) : undefined,
      content: (
        <LimitsDisclaimer
          ehpIsEstimate={character.ehpIsEstimate}
          pob={pob}
          passivePointsAllocated={character.passivePointsAllocated}
        />
      ),
    },
  ];

  return (
    <>
      <CharacterSummaryCard
        character={character}
        assessment={analysis.assessment}
        pool={analysis.pool}
        onClear={onClear}
      />

      <section>
        <FixNextPanel
          actions={analysis.actions}
          gearPending={tablePending}
        />
      </section>

      <section>
        <SectionTitle>
          Full analysis
          <PanelControls targetId="full-analysis" />
        </SectionTitle>
        <div id="full-analysis" className="flex flex-col gap-1.5">
          {panels.map((panel) => (
            <Accordion
              key={panel.id}
              id={panel.id}
              title={panel.title}
              summary={panel.summary}
              badge={panel.badge}
              instrument={panel.instrument}
              defaultOpen={panel.defaultOpen}
            >
              {panel.content}
            </Accordion>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Imported {new Date(character.provenance.fetchedAt).toLocaleString()} via{" "}
        {character.provenance.importMethod === "live-fetch"
          ? "live poe.ninja fetch"
          : "pasted JSON"}
        . Character-import logic in this tool is adapted from the{" "}
        <a
          href="https://github.com/Demonad112/poe2-mcp"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-slate-300"
        >
          poe2-mcp
        </a>{" "}
        project.
      </p>
    </>
  );
}
