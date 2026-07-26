import type { ImportedCharacter } from "@/lib/characterImport/types";

export function PassiveTreeSummary({
  character,
}: {
  character: ImportedCharacter;
}) {
  const pobNodes = character.pob?.allocatedNodes?.length ?? 0;
  const disagree = pobNodes > 0 && pobNodes !== character.passivePointsAllocated;

  return (
    <div className="space-y-2 text-sm text-slate-400">
      <p>
        <span className="font-medium text-slate-200">
          {character.passivePointsAllocated}
        </span>{" "}
        passive points allocated, as reported by poe.ninja.
      </p>
      {disagree && (
        // Two sources for one number that don't match. Saying so is cheaper
        // than silently picking one and presenting it as fact.
        <p className="rounded-md border border-white/10 bg-black/20 p-3 text-xs">
          The Path of Building export for this character lists{" "}
          <span className="text-slate-300">{pobNodes}</span>{" "}
          allocated nodes instead. The two count different things — PoB&apos;s set includes
          ascendancy and class-start nodes that aren&apos;t skill points — so
          neither is wrong, but treat the headline figure as approximate.
        </p>
      )}
      <p className="text-xs text-slate-500">
        Node-by-node detail (notables, keystones, jewel sockets) is a planned
        follow-up. The node ids are already carried in the Path of Building
        export, so it needs a name lookup rather than new data plumbing.
      </p>
    </div>
  );
}
