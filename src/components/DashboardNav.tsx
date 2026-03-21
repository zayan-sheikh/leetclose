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
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm">
            CA
          </span>
          <span>
            CloserArena <span className="text-muted font-normal text-sm">AI</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                path === l.href || path?.startsWith(l.href + "/")
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="text-xs text-muted hover:text-foreground hidden sm:block"
        >
          ← Marketing site
        </Link>
      </div>
    </header>
  );
}
