import type { ImportedCharacter } from "@/lib/characterImport/types";
import type { ResolvedPassives } from "@/lib/characterImport/passiveNodes";
import type { KeystoneEffects } from "@/lib/characterImport/keystoneEffects";

function NodeChip({ name }: { name: string }) {
  return (
    <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-slate-300">
      {name}
    </span>
  );
}

export function PassiveTreeSummary({
  character,
  passives,
  keystones,
  pending,
}: {
  character: ImportedCharacter;
  passives: ResolvedPassives | null;
  keystones: KeystoneEffects;
  pending: boolean;
}) {
  const pobNodes = character.pob?.allocatedNodes?.length ?? 0;
  const disagree = pobNodes > 0 && pobNodes !== character.passivePointsAllocated;

  return (
    <div className="space-y-4 text-sm text-slate-400">
      <p>
        <span className="font-medium text-slate-200">
          {character.passivePointsAllocated}
        </span>{" "}
        passive points allocated, as reported by poe.ninja.
      </p>

      {pending && <p className="text-slate-500">Loading passive node names…</p>}

      {passives && (
        <>
          {passives.keystones.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-300">
                Keystones
              </h3>
              <ul className="space-y-2">
                {passives.keystones.map((node) => (
                  <li
                    key={node.n}
                    className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent-soft)] p-3"
                  >
                    <p className="font-medium text-[var(--accent)]">{node.n}</p>
                    <ul className="mt-1 space-y-0.5">
                      {node.s.map((stat, i) => (
                        <li key={i} className="text-xs text-slate-300">
                          {stat}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {keystones.notes.length > 0 && (
            // The point of reading keystones at all: several of them change
            // how the rest of this page should be read, and the analysis
            // above already accounts for them.
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-300">
                What these change about the analysis
              </h3>
              <ul className="space-y-1.5">
                {keystones.notes.map((note) => (
                  <li
                    key={note.keystone}
                    className="rounded-md border border-white/10 bg-black/20 p-3 text-xs"
                  >
                    <span className="font-medium text-slate-300">
                      {note.keystone}:
                    </span>{" "}
                    {note.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {passives.ascendancy.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-300">
                Ascendancy
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {passives.ascendancy.map((node) => (
                  <NodeChip key={node.n} name={node.n} />
                ))}
              </div>
            </div>
          )}

          {passives.notables.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-300">
                Notables{" "}
                <span className="font-normal text-slate-500">
                  ({passives.notables.length})
                </span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {passives.notables.map((node) => (
                  <NodeChip key={node.n} name={node.n} />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            {passives.namedCount} of {passives.totalCount}{" "}
            allocated nodes are named passives; the remainder are small nodes,
            which carry only incremental stats and aren&apos;t listed.
          </p>
        </>
      )}

      {disagree && (
        // Two sources for one number that don't match. Saying so is cheaper
        // than silently picking one and presenting it as fact.
        <p className="rounded-md border border-white/10 bg-black/20 p-3 text-xs">
          The Path of Building export lists{" "}
          <span className="text-slate-300">{pobNodes}</span>{" "}
          allocated nodes against poe.ninja&apos;s{" "}
          {character.passivePointsAllocated}. The two count different things —
          PoB&apos;s set includes ascendancy and class-start nodes that
          aren&apos;t skill points — so neither is wrong, but treat the
          headline figure as approximate.
        </p>
      )}

      {!passives && !pending && (
        <p className="text-xs text-slate-500">
          Node names are unavailable for this character — either the import
          carried no Path of Building export, or the passive node data
          couldn&apos;t be loaded.
        </p>
      )}
    </div>
  );
}
