import type { Metadata } from "next";
import { farmingStrategies } from "@/data/strategies";
import { pinnacleBosses } from "@/data/bosses";
import { metaBuilds } from "@/data/metaBuilds";
import { currencyMilestones } from "@/data/currencyMilestones";
import { commonMistakes } from "@/data/commonMistakes";
import { StrategyTable } from "@/components/dashboard/StrategyTable";
import { StrategyQuiz } from "@/components/dashboard/StrategyQuiz";
import { BossCard } from "@/components/dashboard/BossCard";
import { MetaBuildList } from "@/components/dashboard/MetaBuildList";
import { CurrencyMilestones } from "@/components/dashboard/CurrencyMilestones";
import { WarningPanel } from "@/components/shared/WarningPanel";

export const metadata: Metadata = {
  title: "Farming Dashboard — PoE2 Endgame Companion",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          Farming Dashboard
        </h1>
        <p className="mt-1 text-slate-400">
          Ranked strategies, a quick picker, pinnacle boss requirements, and
          current meta builds — numbers are community-derived and will drift
          across patches.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Which strategy should I run?
        </h2>
        <StrategyQuiz />
      </section>

      <WarningPanel mistakes={commonMistakes} stage="dashboard" />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Ranked farming strategies
        </h2>
        <StrategyTable strategies={farmingStrategies} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Pinnacle bosses
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pinnacleBosses.map((boss) => (
            <BossCard key={boss.id} boss={boss} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Current meta builds
        </h2>
        <MetaBuildList builds={metaBuilds} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-200">
          Currency milestones
        </h2>
        <CurrencyMilestones milestones={currencyMilestones} />
      </section>
    </div>
  );
}
