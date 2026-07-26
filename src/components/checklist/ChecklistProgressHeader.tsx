"use client";

import { ProgressBar } from "@/components/shared/ProgressBar";
import { useChecklistState } from "@/hooks/useChecklistState";

export function ChecklistProgressHeader() {
  const { completionPercent } = useChecklistState();

  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
      <ProgressBar percent={completionPercent} label="Overall progression" />
    </div>
  );
}
