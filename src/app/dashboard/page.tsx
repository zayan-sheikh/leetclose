"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { TRAINING_MODES } from "@/lib/modes";
import { getAvailablePersonas, PERSONAS } from "@/lib/personas";
import {
  loadProgress,
  rankLabel,
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
      <div className="min-h-screen bg-background flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  const available = getAvailablePersonas(progress.unlockedPersonaIds);
  const lockedCount = PERSONAS.length - available.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-3xl font-bold mt-1">{name}</h1>
          <p className="text-muted mt-2 max-w-xl">
            Duolingo meets sales reps — pick a mode, run a call, earn XP, unlock
            harder prospects.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="XP" value={progress.xp.toLocaleString()} />
          <StatCard
            label="Level / Rank"
            value={`${progress.level} · ${rankLabel(progress.level)}`}
          />
          <StatCard label="Streak" value={`${progress.streak} day${progress.streak === 1 ? "" : "s"}`} />
          <StatCard label="Calls" value={String(progress.totalCalls)} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-4">Start practice</h2>
            <p className="text-sm text-muted mb-6">
              Configure on the call screen — or jump in with your last settings.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/call")}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium"
              >
                New practice call
              </button>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="px-6 py-3 bg-card border border-border rounded-xl font-medium hover:bg-card-hover"
              >
                Upgrade — $3/mo trial
              </button>
            </div>

            <h3 className="font-medium mt-8 mb-3 text-sm text-muted uppercase tracking-wide">
              Training modes
            </h3>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {TRAINING_MODES.map((m) => (
                <li
                  key={m.id}
                  className="bg-background/80 border border-border rounded-lg px-3 py-2"
                >
                  <span className="font-medium text-foreground">{m.label}</span>
                  <p className="text-muted text-xs mt-0.5">{m.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-3">Daily challenge</h2>
              <p className="text-sm text-muted mb-4">
                Score 65+ overall on any call today to complete the challenge.
              </p>
              <div
                className={`text-sm font-medium ${progress.dailyChallengeDone ? "text-success" : "text-warning"}`}
              >
                {progress.dailyChallengeDone ? "Completed today" : "Not completed yet"}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-3">Prospects</h2>
              <p className="text-sm text-muted mb-2">
                {available.length} unlocked · {lockedCount} locked (earn XP &amp; strong scores
                to unlock elite personas).
              </p>
              <ul className="text-xs text-muted space-y-1 max-h-40 overflow-y-auto">
                {PERSONAS.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span>{p.displayName}</span>
                    <span className={p.unlockedByDefault || progress.unlockedPersonaIds.includes(p.id) ? "text-success" : "text-muted"}>
                      {p.unlockedByDefault || progress.unlockedPersonaIds.includes(p.id) ? "Open" : "Locked"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-3">Tournament</h2>
              <p className="text-sm text-muted">
                Bracket-style tournaments are coming soon. For now, climb the{" "}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => router.push("/leaderboard")}
                >
                  leaderboard
                </button>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
