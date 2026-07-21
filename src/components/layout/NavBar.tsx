"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { OPEN_SEARCH_EVENT } from "./CommandPalette";

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <path
        d="M4 5.5h12M4 10h12M4 14.5h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="2" cy="5.5" r="1" fill="currentColor" />
      <circle cx="2" cy="10" r="1" fill="currentColor" />
      <circle cx="2" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}

function AtlasIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <circle cx="10" cy="3.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 5.1V9M10 9L4 14.4M10 9l6 5.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <rect x="3" y="3" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="9" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="12" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const LINKS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/checklist", label: "Checklist", icon: <ChecklistIcon /> },
  { href: "/atlas", label: "Atlas Tree", icon: <AtlasIcon /> },
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 flex items-center gap-1 border-b border-white/[0.06] bg-black/60 px-4 py-3 backdrop-blur-md">
      <Link href="/" className="mr-5 flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none">
          <path
            d="M12 2 L20 12 L12 22 L4 12 Z"
            stroke="var(--accent)"
            strokeWidth="1.5"
            fill="rgba(227,179,65,0.12)"
          />
          <path d="M12 6 L16 12 L12 18 L8 12 Z" fill="var(--accent)" opacity="0.8" />
        </svg>
        <span className="text-gradient-gold font-semibold tracking-wide">
          PoE2 Endgame Companion
        </span>
      </Link>
      <div className="flex gap-1">
        {LINKS.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        className="ml-auto flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 16l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="rounded border border-white/15 px-1 py-0.5 font-mono text-[10px] text-slate-500">
          ⌘K
        </kbd>
      </button>
    </nav>
  );
}
