"use client";

import { useMemo } from "react";
import { farmingStrategies } from "@/data/strategies";
import { scoreStrategies, type QuizAnswers } from "@/lib/quiz";
import { useStrategySelection } from "@/hooks/useStrategySelection";
import { StrategyCard } from "./StrategyCard";
import type { InvestmentTier, RiskTier } from "@/lib/types";

const BUDGET_OPTIONS: { value: InvestmentTier; label: string }[] = [
  { value: "low", label: "Low — a few Divines" },
  { value: "medium", label: "Medium — willing to invest tablets" },
  { value: "high", label: "High — mirror-tier ready" },
];

const TANKINESS_OPTIONS: { value: RiskTier; label: string }[] = [
  { value: "low", label: "Squishy — I die if I look at it wrong" },
  { value: "medium", label: "Moderate — can handle some risk" },
  { value: "high", label: "Tanky — bring on the delirium fog" },
];

const STAGE_OPTIONS = [
  { value: "league-start", label: "League start / early progression" },
  { value: "late-game", label: "Late-game / fully juiced" },
] as const;

export function StrategyQuiz() {
  const { quizAnswers, setQuizAnswer } = useStrategySelection();
  const budget = quizAnswers.budget as InvestmentTier | undefined;
  const tankiness = quizAnswers.tankiness as RiskTier | undefined;
  const stage = quizAnswers.stage as QuizAnswers["stage"];

  const recommended = useMemo(() => {
    if (!budget && !tankiness && !stage) return [];
    return scoreStrategies(farmingStrategies, { budget, tankiness, stage }).slice(
      0,
      3
    );
  }, [budget, tankiness, stage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <QuizSelect
          label="Budget"
          value={quizAnswers.budget}
          options={BUDGET_OPTIONS}
          onChange={(v) => setQuizAnswer("budget", v)}
        />
        <QuizSelect
          label="Build tankiness"
          value={quizAnswers.tankiness}
          options={TANKINESS_OPTIONS}
          onChange={(v) => setQuizAnswer("tankiness", v)}
        />
        <QuizSelect
          label="League stage"
          value={quizAnswers.stage}
          options={STAGE_OPTIONS}
          onChange={(v) => setQuizAnswer("stage", v)}
        />
      </div>

      {recommended.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">
            Recommended for you
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommended.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuizSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
      >
        <option value="" disabled>
          Choose...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
