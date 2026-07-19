import Link from "next/link";

const CARDS = [
  {
    href: "/checklist",
    title: "Progression Checklist",
    description:
      "Step-by-step endgame roadmap from campaign end through the full 301-point Atlas tree, with benchmark gates and common-mistake warnings at each stage.",
  },
  {
    href: "/atlas",
    title: "Atlas Tree Planner",
    description:
      "Named cluster sequencing for early progression, the top-of-tree memory forks, and per-mechanic sub-tree priority lists.",
  },
  {
    href: "/dashboard",
    title: "Farming Dashboard",
    description:
      "Ranked farming strategies, a quick strategy-picker quiz, pinnacle boss requirements, and current meta builds.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          Path of Exile 2 — 0.5 Endgame Companion
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          A second-monitor reference for the &quot;Return of the Ancients&quot;
          endgame: track your progression, plan your Atlas allocation, and
          pick a farming loop.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <h2 className="font-semibold text-emerald-400">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
