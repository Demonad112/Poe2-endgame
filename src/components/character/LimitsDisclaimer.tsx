import type { PobStats } from "@/lib/characterImport/types";
import { CHAOS_TARGET } from "@/lib/characterImport/thresholds";

/**
 * What the numbers on this page do and don't mean.
 *
 * This used to state that PoB figures came from "PoB's default config (no
 * custom boss/buff settings applied)". That was wrong on every real export
 * checked: the test character's carried 20 configuration inputs, seven of
 * them damage-relevant conditionals, with no boss setting at all — so the
 * DPS was simultaneously inflated by assumed conditions and not a boss
 * number, while the assessment used it to judge pinnacle-boss viability.
 * The config is readable, so it is now read and reported rather than assumed.
 */
export function LimitsDisclaimer({
  ehpIsEstimate,
  pob,
  passivePointsAllocated,
}: {
  ehpIsEstimate: boolean;
  pob?: PobStats;
  passivePointsAllocated: number;
}) {
  const config = pob?.config;
  const pobNodes = pob?.allocatedNodes?.length ?? 0;
  const nodesDisagree = pobNodes > 0 && pobNodes !== passivePointsAllocated;

  return (
    <div className="text-sm text-slate-400">
      <ul className="list-disc space-y-2 pl-5">
        {pob ? (
          <>
            <li>
              DPS, max-hit-taken and crit figures are Path of Building&apos;s
              own calculations, read from the export poe.ninja embeds, for the
              main skill group only.
            </li>
            <li>
              Those figures carry whatever configuration the export was saved
              with — buff mode, assumed conditions, and whether a boss was
              selected — which is stated in full next to the DPS number in
              Offense.
              {config && !config.versusBoss && (
                <>
                  {" "}
                  <span className="text-slate-300">
                    This export was not configured against a boss
                  </span>
                  , so nothing here draws a boss-viability conclusion from its
                  damage.
                </>
              )}
            </li>
          </>
        ) : (
          <li>
            This character had no readable Path of Building export, so DPS,
            max-hit-taken and crit stats aren&apos;t available — only what
            poe.ninja reports directly.
          </li>
        )}
        {ehpIsEstimate ? (
          <li>
            poe.ninja didn&apos;t supply an EHP, so the figure shown is a rough
            life+ES+ward-vs-resistance estimate, not a layered model.
          </li>
        ) : (
          <li>EHP is poe.ninja&apos;s own figure, not recalculated here.</li>
        )}
        <li>
          The &ldquo;Fix next&rdquo; ordering is an impact estimate made by
          this tool, not a measurement. It ranks categories against each other
          — an uncapped resistance above a tier upgrade, a tier upgrade on a
          stat your build uses above one on a stat it doesn&apos;t — and is
          more trustworthy about that ordering than about any single entry.
        </li>
        <li>
          The letter grade is a rough guide from thresholds we picked, not a
          published community benchmark. The {CHAOS_TARGET}% chaos resistance
          target is likewise a judgement call — chaos has no cap in PoE2 the
          way the elements do.
        </li>
        <li>
          Gear tier gaps are measured against the best tier an item level
          allows, which is a theoretical ceiling rather than a realistic
          crafting target.
        </li>
        <li>
          Passive tree is a point count only — node-by-node visualization is a
          planned follow-up. No ladder comparison yet.
          {nodesDisagree && (
            <>
              {" "}
              poe.ninja reports {passivePointsAllocated} allocated passives
              while the Path of Building export lists {pobNodes} nodes; the two
              count different things (PoB includes ascendancy and class-start
              nodes), so treat the figure as approximate.
            </>
          )}
        </li>
      </ul>
    </div>
  );
}
