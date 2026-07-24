import type { ImportedCharacter } from "@/lib/characterImport/types";
import { SectionTitle } from "@/components/shared/SectionTitle";

export function PassiveTreeSummary({
  character,
}: {
  character: ImportedCharacter;
}) {
  return (
    <div>
      <SectionTitle>Passive tree</SectionTitle>
      <p className="text-sm text-slate-400">
        <span className="font-medium text-slate-200">
          {character.passivePointsAllocated}
        </span>{" "}
        passive points allocated. Node-by-node visualization (notables,
        keystones, jewel sockets) is a planned follow-up — see below.
      </p>
    </div>
  );
}
