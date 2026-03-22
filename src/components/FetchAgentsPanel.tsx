"use client";

import { useEffect, useState } from "react";

type StatsBridge = {
  total_sessions?: number;
  top_mode_id?: string;
  top_mode_count?: number;
  top_persona_id?: string;
  stripe_practice_count?: number;
};

type ChallengeBridge = {
  date_utc?: string;
  challenge?: string;
};

function Dot({ up }: { up: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${up ? "bg-emerald-400" : "bg-zinc-600"}`}
      title={up ? "Reachable" : "Down"}
      aria-hidden
    />
  );
}

export default function FetchAgentsPanel() {
  const [agents, setAgents] = useState<{
    session: boolean;
    stats: boolean;
    challenge: boolean;
  } | null>(null);
  const [stats, setStats] = useState<StatsBridge | null>(null);
  const [challenge, setChallenge] = useState<ChallengeBridge | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [stRes, chRes, pingRes] = await Promise.all([
          fetch("/api/fetch-bridge/stats"),
          fetch("/api/fetch-bridge/challenge"),
          fetch("/api/fetch-bridge/status"),
        ]);
        const stJ = (await stRes.json()) as { ok?: boolean; bridge?: StatsBridge };
        const chJ = (await chRes.json()) as { ok?: boolean; bridge?: ChallengeBridge };
        const pingJ = (await pingRes.json()) as {
          agents?: { session: boolean; stats: boolean; challenge: boolean };
        };
        if (cancel) return;
        setTried(true);
        if (pingJ.agents) setAgents(pingJ.agents);
        if (stJ.ok && stJ.bridge) setStats(stJ.bridge);
        if (chJ.ok && chJ.bridge) setChallenge(chJ.bridge);
      } catch {
        if (!cancel) setTried(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!tried) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-5 sm:p-6`}>
        <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
          Fetch.ai agents
        </p>
        <p className="mt-2 text-sm text-muted">Checking local bridge…</p>
      </div>
    );
  }

  const anyUp = agents && (agents.session || agents.stats || agents.challenge);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
            Fetch.ai agents
          </p>
          <h2 className="font-display mt-1 text-lg font-semibold text-foreground">
            Local uAgent bridge
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Three small Python agents (no LLM): session recorder, stats over your JSONL log, and a
            daily micro-challenge. Run{" "}
            <code className="rounded bg-muted/40 px-1 font-mono text-[11px]">
              python run_all_agents.py
            </code>{" "}
            from <code className="font-mono text-[11px]">fetch-bridge/</code>.
          </p>
        </div>
      </div>

      {agents && (
        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
          <li className="flex items-center gap-2">
            <Dot up={agents.session} />
            <span>Session ·8765</span>
          </li>
          <li className="flex items-center gap-2">
            <Dot up={agents.stats} />
            <span>Stats ·8766</span>
          </li>
          <li className="flex items-center gap-2">
            <Dot up={agents.challenge} />
            <span>Challenge ·8767</span>
          </li>
        </ul>
      )}

      {!anyUp && (
        <p className="mt-4 text-sm text-amber-200/85">
          Agents not reachable — start the bridge or ignore this panel; the app works without it.
        </p>
      )}

      {stats && stats.total_sessions != null && stats.total_sessions > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground">
          <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
            Bridge session log
          </p>
          <p className="mt-2 text-muted">
            <span className="font-semibold text-foreground">{stats.total_sessions}</span> sessions
            recorded
            {stats.top_mode_id ? (
              <>
                {" "}
                · most common mode{" "}
                <span className="font-mono text-foreground">{stats.top_mode_id}</span> (
                {stats.top_mode_count})
              </>
            ) : null}
            {typeof stats.stripe_practice_count === "number" ? (
              <>
                {" "}
                · Stripe reps practiced:{" "}
                <span className="text-foreground">{stats.stripe_practice_count}</span>
              </>
            ) : null}
          </p>
        </div>
      )}

      {challenge?.challenge && (
        <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
          <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-accent">
            Today&apos;s challenge · {challenge.date_utc ?? "UTC"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{challenge.challenge}</p>
        </div>
      )}
    </div>
  );
}
