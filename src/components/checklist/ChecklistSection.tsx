import type { BenchmarkGate, RoadmapPhase, RoadmapStep } from "@/lib/types";
import { ROADMAP_PHASE_LABELS } from "@/lib/constants";
import { ChecklistStep } from "./ChecklistStep";

export function ChecklistSection({
  phase,
  steps,
  benchmarkGates,
}: {
  phase: RoadmapPhase;
  steps: RoadmapStep[];
  benchmarkGates: BenchmarkGate[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-200">
        {ROADMAP_PHASE_LABELS[phase] ?? phase}
      </h2>
      <ul className="space-y-3">
        {steps.map((step) => (
          <ChecklistStep
            key={step.id}
            step={step}
            gates={benchmarkGates.filter((g) =>
              step.benchmarkGateIds?.includes(g.id)
            )}
          />
        ))}
      </ul>
    </section>
  );
}
