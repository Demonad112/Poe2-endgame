"use client";

import { SectionTitle } from "@/components/shared/SectionTitle";
import { useCharacterImport } from "@/hooks/useCharacterImport";
import { ImportPanel } from "./ImportPanel";
import { CharacterSummaryCard } from "./CharacterSummaryCard";
import { DefenseStatsPanel } from "./DefenseStatsPanel";
import { PassiveTreeSummary } from "./PassiveTreeSummary";
import { SkillsGearPanel } from "./SkillsGearPanel";
import { LimitsDisclaimer } from "./LimitsDisclaimer";

export function CharacterWorkspace() {
  const { pinnedImport, setPinnedImport, clearPinnedImport } =
    useCharacterImport();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle>Import a character</SectionTitle>
        <ImportPanel onImported={setPinnedImport} />
      </section>

      {pinnedImport && (
        <>
          <section className="flex items-start gap-4">
            <CharacterSummaryCard character={pinnedImport} />
            <button
              onClick={clearPinnedImport}
              className="shrink-0 rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
            >
              Clear
            </button>
          </section>

          <section>
            <DefenseStatsPanel character={pinnedImport} />
          </section>

          <section>
            <PassiveTreeSummary character={pinnedImport} />
          </section>

          <section>
            <SkillsGearPanel character={pinnedImport} />
          </section>

          <LimitsDisclaimer />

          <p className="text-xs text-slate-500">
            Imported {new Date(pinnedImport.provenance.fetchedAt).toLocaleString()}{" "}
            via{" "}
            {pinnedImport.provenance.importMethod === "live-fetch"
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
      )}
    </div>
  );
}
