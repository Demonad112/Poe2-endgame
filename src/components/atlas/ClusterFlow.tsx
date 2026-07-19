import { atlasClusters, memoryForks } from "@/data/atlasTree";
import { ClusterNode } from "./ClusterNode";
import { MemoryForkBranch } from "./MemoryForkBranch";
import { MechanicSubTreeList } from "./MechanicSubTreeList";

export function ClusterFlow() {
  const earlyProgression = atlasClusters
    .filter((c) => c.group === "early-progression")
    .sort((a, b) => a.order - b.order);
  const general = atlasClusters
    .filter((c) => c.group === "general")
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-200">
          1. Early Progression Sequence
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Main-path allocation order, pre- and post-Arbiter of Ash/Divinity.
          Numbers are allocation sequence, not tree position.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {earlyProgression.map((cluster) => (
            <ClusterNode key={cluster.id} cluster={cluster} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-200">
          2. Memory Fork — Decision Point
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Unlocked after the first Arbiter of Divinity kill. Three parallel
          branches — allocate whichever fits your farming loop first.
        </p>
        <div className="flex flex-col gap-3 md:flex-row">
          {memoryForks.map((fork) => (
            <MemoryForkBranch key={fork.id} fork={fork} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-200">
          3. Mechanic Sub-Trees
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Commit to one mechanic at a time — payoff nodes sit deep. Switch
          tabs to see each mechanic&apos;s priority order.
        </p>
        <MechanicSubTreeList clusters={atlasClusters} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-200">
          4. General / Late-Game
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {general.map((cluster) => (
            <ClusterNode key={cluster.id} cluster={cluster} />
          ))}
        </ul>
      </section>
    </div>
  );
}
