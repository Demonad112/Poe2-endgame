import type { Metadata } from "next";
import { ClusterFlow } from "@/components/atlas/ClusterFlow";
import { AtlasSequenceTracker } from "@/components/atlas/AtlasSequenceTracker";
import { WarningPanel } from "@/components/shared/WarningPanel";
import { commonMistakes } from "@/data/commonMistakes";

export const metadata: Metadata = {
  title: "Atlas Tree Planner — PoE2 Endgame Companion",
};

export default function AtlasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          Atlas Tree Planner
        </h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          No real node-graph data exists for the 301-point Atlas tree in the
          source guides, so this is an ordered/grouped flow of the named
          clusters and sequencing they describe — not a pixel-accurate
          recreation of the in-game tree layout.
        </p>
      </div>

      <AtlasSequenceTracker />
      <WarningPanel mistakes={commonMistakes} stage="atlas" />
      <ClusterFlow />
    </div>
  );
}
