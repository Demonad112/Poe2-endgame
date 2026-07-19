"use client";

import { ProgressBar } from "@/components/shared/ProgressBar";
import { useChecklistState } from "@/hooks/useChecklistState";

export function ChecklistProgressHeader() {
  const { completionPercent } = useChecklistState();

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <ProgressBar percent={completionPercent} label="Overall progression" />
    </div>
  );
}
