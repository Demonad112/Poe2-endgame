"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/checklist", label: "Checklist" },
  { href: "/atlas", label: "Atlas Tree" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
      <span className="mr-4 flex items-center font-semibold tracking-wide text-emerald-400">
        PoE2 Endgame Companion
      </span>
      {LINKS.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
