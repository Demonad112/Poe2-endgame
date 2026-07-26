"use client";

import type { ReactNode } from "react";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Accordion } from "@/components/shared/Accordion";
import { useCharacterImport } from "@/hooks/useCharacterImport";
import { useModTiers } from "@/hooks/useModTiers";
import { usePassiveNodes } from "@/hooks/usePassiveNodes";
import { analyseCharacter } from "@/lib/characterImport/analysis";
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
import { LimitsDisclaimer } from "./LimitsDisclaimer";
import { formatCompact } from "@/lib/characterImport/format";

interface Panel {
  id: string;
  title: string;
  summary?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  content: ReactNode;
}

function CountBadge({ n, tone }: { n: number; tone: "warn" | "muted" }) {
  if (n <= 0) return null;
  return (
    <span
      className={`rounded border px-1.5 py-px text-[10px] font-medium ${
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : "border-white/15 bg-white/5 text-slate-400"
      }`}
    >
      {n}
    </span>
  );
}

export function CharacterWorkspace() {
  const { pinnedImport, setPinnedImport, clearPinnedImport } =
    useCharacterImport();
  // Only pay for these assets once a character is actually on screen.
  const { table, pending, failed } = useModTiers(Boolean(pinnedImport));
  const { table: passiveTable, pending: passivesPending } = usePassiveNodes(
    Boolean(pinnedImport)
  );

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
  tablePending,
  tableFailed,
  onClear,
}: {
  character: NonNullable<ReturnType<typeof useCharacterImport>["pinnedImport"]>;
  table: Parameters<typeof analyseCharacter>[1];
  passiveTable: Parameters<typeof analyseCharacter>[2];
  passivesPending: boolean;
  tablePending: boolean;
  tableFailed: boolean;
  onClear: () => void;
}) {
  const analysis = analyseCharacter(character, table, passiveTable);
  const { pob } = character;

  const uncapped = analysis.resistances.statuses.filter((s) => s.shortfall > 0);

  // Declared as data so the presentation can change in one place — swapping
  // these accordions for a tab strip means changing only the renderer below,
  // not how any panel is built.
  const panels: Panel[] = [
    {
      id: "assessment",
      title: "Build assessment",
      summary: `Tier ${analysis.assessment.tier} — ${analysis.assessment.note}`,
      content: <BuildScoreCard assessment={analysis.assessment} />,
    },
    ...(pob && pob.combinedDps > 0
      ? [
          {
            id: "offense",
            title: "Offense",
            summary: `${formatCompact(pob.combinedDps)} combined DPS${pob.mainSkill ? ` — ${pob.mainSkill}` : ""}`,
            content: <OffensePanel pob={pob} />,
          },
        ]
      : []),
    {
      id: "defenses",
      title: "Defenses",
      summary: `${analysis.pool.toLocaleString()} combined pool · ${character.ehp.toLocaleString()} EHP${character.ehpIsEstimate ? " (estimate)" : ""}`,
      badge: <CountBadge n={uncapped.length} tone="warn" />,
      content: <DefenseStatsPanel character={character} />,
    },
    ...(pob
      ? [
          {
            id: "max-hit",
            title: "Max hit survivable",
            summary: "Largest single hit absorbed, per damage type",
            content: <MaxHitPanel pob={pob} />,
          },
        ]
      : []),
    {
      id: "resistances",
      title: "Resistance tuning",
      summary: "Where each resistance comes from, and what to change",
      badge: (
        <CountBadge n={analysis.resistances.suggestions.length} tone="muted" />
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
      badge: <CountBadge n={analysis.gear?.questionable.length ?? 0} tone="warn" />,
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
        ? `${character.passivePointsAllocated} points · ${analysis.passives.keystones.length} keystones, ${analysis.passives.notables.length} notables`
        : `${character.passivePointsAllocated} points allocated`,
      badge: <CountBadge n={analysis.keystones.notes.length} tone="muted" />,
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
      id: "skills-gear",
      title: "Skills & gear",
      summary: `${character.skills.length} skill setup${character.skills.length === 1 ? "" : "s"} · ${character.gear.length} items, every modifier`,
      content: <SkillsGearPanel character={character} />,
    },
    {
      id: "limits",
      title: "Where these numbers come from",
      summary: "Sources, assumptions and known limits",
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
      <section className="flex items-start gap-4">
        <CharacterSummaryCard character={character} />
        <button
          onClick={onClear}
          className="shrink-0 rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
        >
          Clear
        </button>
      </section>

      <section>
        <FixNextPanel
          actions={analysis.actions}
          gearPending={tablePending}
        />
      </section>

      <section className="space-y-2">
        <SectionTitle>Full analysis</SectionTitle>
        {panels.map((panel) => (
          <Accordion
            key={panel.id}
            id={panel.id}
            title={panel.title}
            summary={panel.summary}
            badge={panel.badge}
            defaultOpen={panel.defaultOpen}
          >
            {panel.content}
          </Accordion>
        ))}
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
