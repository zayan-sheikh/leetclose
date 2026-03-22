"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Profile" },
  { href: "/call", label: "Practice" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardNav() {
  const path = usePathname();

  return (
    <header className="frosted-surface sticky top-0 z-10 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/dashboard"
          className="font-display flex items-center gap-2.5 font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center text-sm font-bold text-foreground">
            <Image
              src="/iconwhite.svg"
              alt="LeetClose"
              width={36}
              height={36}
              className="h-full w-full dark:hidden"
            />
            <Image
              src="/iconwhite.svg"
              alt="LeetClose"
              width={36}
              height={36}
              className="hidden h-full w-full dark:block"
            />
          </span>
          <span>
            LeetClose <span className="text-muted text-sm font-normal">AI</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 sm:gap-1.5">
          {links.map((l) => {
            const active = path === l.href || path?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-card-hover font-medium text-foreground ring-1 ring-border"
                    : "text-muted hover:bg-card-hover hover:text-foreground"
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
