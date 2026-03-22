"use client";

import { useEffect, useState } from "react";
import DashboardNav from "@/components/DashboardNav";
import { getMergedLeaderboard, loadProgress } from "@/lib/gamification";

interface Row {
  name: string;
  score: number;
  xp: number;
  isYou?: boolean;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let name = "You";
    try {
      const u = localStorage.getItem("closearena_user");
      if (u) name = JSON.parse(u).name || JSON.parse(u).email || "You";
    } catch {
      /* ignore */
    }
    const p = loadProgress();
    setRows(getMergedLeaderboard(name, p.bestOverall, p.xp));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="page-mesh-bg opacity-45" aria-hidden />
      <DashboardNav />
      <main className="relative mx-auto max-w-2xl px-4 py-10">
        <p className="label-overline">Rankings</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted">
          Demo board + your local bests. Wire a backend later for global ranks and
          seasons.
        </p>

        <div className="card-premium mt-8 overflow-hidden p-0">
          <div className="grid grid-cols-[40px_1fr_72px_72px] gap-2 border-b border-white/[0.08] bg-black/40 px-4 py-3 font-hud text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[48px_1fr_80px_80px]">
            <span>#</span>
            <span>Coach</span>
            <span className="text-right">Best</span>
            <span className="text-right">XP</span>
          </div>
          {rows.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className={`grid grid-cols-[40px_1fr_72px_72px] gap-2 border-b border-white/[0.05] px-4 py-3 text-sm last:border-0 sm:grid-cols-[48px_1fr_80px_80px] ${
                r.isYou ? "bg-cyan-500/[0.07]" : ""
              }`}
            >
              <span className="font-hud text-zinc-500">{i + 1}</span>
              <span className="min-w-0 truncate font-medium text-zinc-100">
                {r.name}
                {r.isYou ? (
                  <span className="ml-2 font-hud text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                    You
                  </span>
                ) : null}
              </span>
              <span className="text-right font-hud tabular-nums text-zinc-200">{r.score}</span>
              <span className="text-right font-hud tabular-nums text-zinc-500">{r.xp}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
