"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/call", label: "Practice" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardNav() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-600/40 bg-slate-900/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/dashboard"
          className="font-display flex items-center gap-2.5 font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-400/15 text-sm font-bold text-sky-200">
            CA
          </span>
          <span>
            CloserArena{" "}
            <span className="text-muted text-sm font-normal">AI</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 sm:gap-1.5">
          {links.map((l) => {
            const active =
              path === l.href || path?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-sky-400/15 font-medium text-sky-100 ring-1 ring-sky-400/25"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="hidden text-xs text-muted transition-colors hover:text-foreground sm:block"
        >
          ← Marketing site
        </Link>
      </div>
    </header>
  );
}
