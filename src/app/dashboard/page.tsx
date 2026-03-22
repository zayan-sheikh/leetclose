"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { TRAINING_MODES } from "@/lib/modes";
import {
  getAvailablePersonas,
  isPersonaUnlocked,
  PERSONAS,
} from "@/lib/personas";
import {
  BADGE_DEFS,
  difficultyLadder,
  levelProgress,
  loadProgress,
  rankLabel,
  weeklyCupStats,
  type UserProgress,
} from "@/lib/gamification";

export default function DashboardPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("closearena_user");
    const onboarded = localStorage.getItem("closearena_onboarded");
    if (!user) {
      router.replace("/signup");
      return;
    }
    if (!onboarded) {
      router.replace("/onboarding");
      return;
    }
    try {
      const u = JSON.parse(user);
      setName(u.name || u.email || "Coach");
    } catch {
      setName("Coach");
    }
    setProgress(loadProgress());
  }, [router]);

  if (!progress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          Loading…
        </div>
      </div>
    );
  }

  const available = getAvailablePersonas(progress);
  const lockedCount = PERSONAS.length - available.length;
  const lv = levelProgress(progress.xp);
  const cup = weeklyCupStats(progress);
  const ladder = difficultyLadder(progress);
  const firstName = name.split(/\s+/)[0] ?? name;

  const panel =
    "rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
  const panelTitle = "font-display text-base font-semibold text-foreground";

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="mb-8 border-b border-border pb-8 sm:mb-10 sm:pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Dashboard
              </p>
              <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Hey <span className="text-accent">{firstName}</span>
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                Run reps, climb ranks, unlock harder prospects. One focused
                session beats ten vague roleplays.
              </p>
              <p className="mt-3 text-sm">
                <Link
                  href="/onboarding"
                  className="font-medium text-accent underline decoration-accent/45 underline-offset-2 transition-colors hover:text-foreground hover:decoration-accent/70"
                >
                  Update coaching profile
                </Link>
                <span className="text-muted"> · </span>
                <span className="text-muted">niche, objections, tone</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-ring bg-card px-3 py-1.5 font-hud text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {rankLabel(progress.level)}
              </span>
              <span className="rounded-lg border border-border bg-background px-3 py-1.5 font-hud text-[11px] text-muted">
                Level {progress.level}
              </span>
              {progress.streak >= 2 && (
                <span className="rounded-lg border border-amber-400/30 bg-amber-400/12 px-3 py-1.5 font-hud text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                  {progress.streak}d streak
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <div className="flex items-baseline justify-between text-xs text-muted">
              <span>
                {lv.isMax ? (
                  <span className="text-success/90">
                    Max level — keep grinding XP
                  </span>
                ) : (
                  <>
                    <span className="font-hud tabular-nums text-foreground">
                      {progress.xp.toLocaleString()}
                    </span>
                    {" XP · "}
                    {lv.xpIntoLevel.toLocaleString()} /{" "}
                    {lv.xpForNext.toLocaleString()} to level {lv.level + 1}
                  </>
                )}
              </span>
              <span className="font-hud tabular-nums text-foreground">
                {lv.pct}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#252a34]">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${lv.pct}%` }}
              />
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Total XP"
            value={progress.xp.toLocaleString()}
            accent="sky"
          />
          <StatTile
            label="Best score"
            value={String(progress.bestOverall)}
            accent="success"
          />
          <StatTile
            label="Streak"
            value={`${progress.streak} day${progress.streak === 1 ? "" : "s"}`}
            accent="amber"
          />
          <StatTile
            label="Calls logged"
            value={String(progress.totalCalls)}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className={`${panel} sm:p-7`}>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Practice floor
              </h2>
              <p className="mt-1 text-sm text-muted">
                Persona + mode on the next screen — your profile shapes how the
                AI pushes back.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/call")}
                  className="btn-primary-glow rounded-xl px-6 py-3 text-sm font-semibold text-white active:scale-[0.99]"
                >
                  Start practice call
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/leaderboard")}
                  className="rounded-xl border border-success/30 bg-success/8 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-success/12 dark:text-zinc-50"
                >
                  View leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="rounded-xl border border-border bg-background px-5 py-3 text-sm text-foreground transition-colors hover:border-ring"
                >
                  Upgrade
                </button>
              </div>

              <h3 className="font-hud mb-3 mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Training modes
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {TRAINING_MODES.map((m) => (
                  <li
                    key={m.id}
                    className="flex gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 transition-colors hover:border-ring"
                  >
                    <span
                      className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {m.label}
                      </span>
                      <p className="mt-0.5 text-xs leading-snug text-muted">
                        {m.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className={panel}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={panelTitle}>Daily challenge</h2>
                  <p className="mt-1 text-sm text-muted">
                    Hit{" "}
                    <strong className="font-medium text-success">65+</strong>{" "}
                    overall on any call today.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2.5 py-1 font-hud text-[10px] font-bold uppercase tracking-wide ${
                    progress.dailyChallengeDone
                      ? "border-success/30 bg-success/10 text-foreground dark:text-zinc-50"
                      : "border-amber-400/30 bg-amber-500/12 text-amber-900 dark:text-amber-100"
                  }`}
                >
                  {progress.dailyChallengeDone ? "Done" : "Open"}
                </span>
              </div>
            </div>

            <div className={panel}>
              <h2 className={panelTitle}>Weekly cup</h2>
              <p className="mt-1 text-sm text-muted">
                Solo tournament track: your scores this week. After{" "}
                <strong className="text-foreground">3 runs</strong>, we lock a
                cup average from your last three sessions.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 font-hud text-xs">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <dt className="text-muted">Runs</dt>
                  <dd className="mt-0.5 tabular-nums text-lg font-semibold text-foreground">
                    {cup.runs}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <dt className="text-muted">Cup avg</dt>
                  <dd className="mt-0.5 tabular-nums text-lg font-semibold text-foreground">
                    {cup.avgLast3 ?? "—"}
                  </dd>
                </div>
              </dl>
              {cup.runs > 0 && cup.avgLast3 == null && cup.runs < 3 && (
                <p className="mt-2 text-xs text-muted">
                  {3 - cup.runs} more call{3 - cup.runs === 1 ? "" : "s"} to
                  unlock cup average.
                </p>
              )}
              {cup.avgAll != null && (
                <p className="mt-2 text-xs text-muted">
                  Week average (all runs): {cup.avgAll}
                </p>
              )}
            </div>

            <div className={panel}>
              <h2 className={panelTitle}>Difficulty unlocks</h2>
              <p className="mt-1 text-sm text-muted">
                Prospect &quot;objection&quot; tiers — earn stronger scores to
                unlock.
              </p>
              <ol className="mt-4 space-y-2">
                {ladder.map((rung, i) => (
                  <li
                    key={rung.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                      rung.unlocked
                        ? "border-success/25 bg-success/[0.06]"
                        : "border-border bg-background/60"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-hud text-[11px] font-bold ${
                        rung.unlocked
                          ? "bg-success/15 text-foreground dark:text-zinc-50"
                          : "bg-[#262b35] text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`flex-1 text-sm font-medium ${rung.unlocked ? "text-foreground" : "text-muted"}`}
                    >
                      {rung.label}
                    </span>
                    {rung.unlocked ? (
                      <span className="font-hud text-[10px] font-semibold uppercase tracking-wide text-success/90">
                        Live
                      </span>
                    ) : (
                      <span className="font-hud text-[10px] uppercase tracking-wide text-muted">
                        Locked
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className={panel}>
              <h2 className={panelTitle}>Badges</h2>
              <p className="mt-1 text-sm text-muted">
                Earned from strong session scores and streaks.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {BADGE_DEFS.map((b) => {
                  const earned = progress.badges.includes(b.id);
                  return (
                    <li
                      key={b.id}
                      title={b.description}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        earned
                          ? "border-ring bg-[#2a2418] text-foreground"
                          : "border-border bg-background text-muted"
                      }`}
                    >
                      {earned ? "✓ " : ""}
                      {b.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={`${panel} border-dashed border-border`}>
              <h2 className={panelTitle}>Prospects</h2>
              <p className="mt-1 text-sm text-muted">
                <span className="tabular-nums text-foreground">
                  {available.length}
                </span>{" "}
                unlocked ·{" "}
                <span className="tabular-nums text-foreground">
                  {lockedCount}
                </span>{" "}
                locked
              </p>
              <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-xs">
                {PERSONAS.map((p) => {
                  const open = isPersonaUnlocked(p, progress);
                  const gate =
                    !open && p.unlockMinOverall != null
                      ? `${p.unlockMinOverall}+ best · ${p.unlockMinCalls ?? 0}+ calls`
                      : null;
                  return (
                    <li
                      key={p.id}
                      className="flex justify-between gap-2 border-b border-border py-1.5 last:border-0"
                    >
                      <span className={open ? "text-foreground" : "text-muted"}>
                        {p.displayName}
                      </span>
                      <span
                        className={`shrink-0 text-right ${open ? "text-success/85" : "text-muted"}`}
                        title={gate ?? undefined}
                      >
                        {open ? "Open" : (gate ?? "Locked")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sky" | "success" | "amber" | "violet";
}) {
  const border = {
    sky: "border-l-4 border-l-ring",
    success: "border-l-4 border-l-success/70",
    amber: "border-l-4 border-l-amber-300/55",
    violet: "border-l-4 border-l-violet-300/55",
  }[accent];
  const valueColor = {
    sky: "text-foreground",
    success: "text-foreground",
    amber: "text-foreground",
    violet: "text-foreground",
  }[accent];

  return (
    <div
      className={`rounded-2xl border border-border bg-card pl-4 pr-4 py-4 sm:py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${border}`}
    >
      <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p
        className={`font-display mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${valueColor}`}
      >
        {value}
      </p>
    </div>
  );
}
