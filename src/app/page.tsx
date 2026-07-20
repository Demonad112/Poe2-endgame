import Link from "next/link";
import { CURRENT_PATCH, LEAGUE_NAME } from "@/lib/constants";

const CARDS = [
  {
    href: "/checklist",
    title: "Progression Checklist",
    description:
      "Step-by-step endgame roadmap from campaign end through the full 301-point Atlas tree, with benchmark gates and common-mistake warnings at each stage.",
    icon: (
      <path
        d="M5 6h14M5 12h14M5 18h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/atlas",
    title: "Atlas Tree Planner",
    description:
      "Named cluster sequencing for early progression, the top-of-tree memory forks, and per-mechanic sub-tree priority lists.",
    icon: (
      <>
        <circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="5" cy="19" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="19" cy="19" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M12 5.8V11M12 11L5 17.3M12 11l7 6.3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/dashboard",
    title: "Farming Dashboard",
    description:
      "Ranked farming strategies, a quick strategy-picker quiz, pinnacle boss requirements, and current meta builds.",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="3.5" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="11" width="7" height="9.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3.5" y="14.5" width="7" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col items-start gap-4 py-6">
        <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--accent)] uppercase">
          Patch {CURRENT_PATCH} · {LEAGUE_NAME}
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          <span className="text-gradient-gold">Path of Exile 2</span>
          <br />
          <span className="text-slate-100">Endgame Companion</span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-400">
          A second-monitor reference for the &quot;Return of the Ancients&quot;
          endgame: track your progression, plan your Atlas allocation, and
          pick a farming loop.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_-8px_rgba(227,179,65,0.25)]"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-200 group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                {card.icon}
              </svg>
            </div>
            <h2 className="flex items-center gap-1.5 font-semibold text-slate-100">
              {card.title}
              <span className="translate-x-0 text-[var(--accent)] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                →
              </span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
