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
      <DashboardNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted text-sm mb-8">
          Demo board + your local best scores. Connect a backend later for global ranks.
        </p>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_80px_80px] gap-2 px-4 py-3 border-b border-border text-xs text-muted uppercase">
            <span>#</span>
            <span>Coach</span>
            <span className="text-right">Best</span>
            <span className="text-right">XP</span>
          </div>
          {rows.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className={`grid grid-cols-[48px_1fr_80px_80px] gap-2 px-4 py-3 text-sm border-b border-border/60 last:border-0 ${
                r.isYou ? "bg-accent/10" : ""
              }`}
            >
              <span className="text-muted">{i + 1}</span>
              <span className="font-medium">
                {r.name}
                {r.isYou ? (
                  <span className="text-accent text-xs ml-2">(you)</span>
                ) : null}
              </span>
              <span className="text-right tabular-nums">{r.score}</span>
              <span className="text-right tabular-nums text-muted">{r.xp}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
