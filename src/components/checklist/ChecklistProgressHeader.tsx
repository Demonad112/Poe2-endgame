"use client";

import { ProgressBar } from "@/components/shared/ProgressBar";
import { useChecklistState } from "@/hooks/useChecklistState";

export function ChecklistProgressHeader() {
  const { completionPercent } = useChecklistState();

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <ProgressBar percent={completionPercent} label="Overall progression" />
    </div>
  );
}
