"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { saveProgress, defaultProgress } from "@/lib/gamification";

export default function SettingsPage() {
  const router = useRouter();
  const [profileJson, setProfileJson] = useState("");
  const [saved, setSaved] = useState(false);
  const [fetchAgentsPing, setFetchAgentsPing] = useState<{
    session: boolean;
    stats: boolean;
    challenge: boolean;
  } | null>(null);

  useEffect(() => {
    const p = localStorage.getItem("closearena_profile");
    setProfileJson(p ? JSON.stringify(JSON.parse(p), null, 2) : "{}");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/fetch-bridge/status");
        const j = (await r.json()) as {
          agents?: { session: boolean; stats: boolean; challenge: boolean };
        };
        if (cancelled) return;
        if (j.agents) setFetchAgentsPing(j.agents);
      } catch {
        if (!cancelled)
          setFetchAgentsPing({ session: false, stats: false, challenge: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function saveProfile() {
    try {
      const parsed = JSON.parse(profileJson);
      localStorage.setItem("closearena_profile", JSON.stringify(parsed));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Invalid JSON");
    }
  }

  function resetProgress() {
    if (!confirm("Reset XP, streaks, badges, and unlocks?")) return;
    saveProgress(defaultProgress());
    localStorage.removeItem("closearena_leaderboard_entries");
    router.refresh();
    alert("Progress reset.");
  }

  function signOut() {
    localStorage.removeItem("closearena_user");
    localStorage.removeItem("closearena_onboarded");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-mesh-bg opacity-45" aria-hidden />
      <DashboardNav />
      <main className="relative mx-auto max-w-2xl space-y-8 px-4 py-10">
        <div>
          <p className="label-overline">Account</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted">
            MVP: profile lives in your browser (localStorage).
          </p>
        </div>

        <section className="card-premium p-6 pt-7">
          <h2 className="font-display text-base font-semibold">Coaching profile</h2>
          <p className="mt-2 text-sm text-muted">
            Change niche, objections, tone, and more in the same scrollable form as signup. Saved
            answers load automatically.
          </p>
          <Link
            href="/onboarding"
            className="btn-primary-glow mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Edit coaching profile
          </Link>

          <h3 className="font-display mt-8 text-sm font-semibold text-zinc-300">
            Advanced: raw JSON
          </h3>
          <p className="mt-2 text-sm text-muted">
            Keys used by the AI: coachType, offerName, offerPrice, weakObjections, niche,
            closeRate, practiceTone.
          </p>
          <textarea
            value={profileJson}
            onChange={(e) => setProfileJson(e.target.value)}
            className="input-premium mt-4 h-64 resize-y font-mono text-xs leading-relaxed"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveProfile}
              className="btn-primary-glow rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            >
              Save profile
            </button>
            {saved && (
              <span className="font-hud text-xs font-semibold uppercase tracking-wide text-success">
                Saved
              </span>
            )}
          </div>
        </section>

        <section className="card-premium p-6 pt-7">
          <h2 className="font-display text-base font-semibold">Fetch.ai uAgents (local)</h2>
          <p className="mt-2 text-sm text-muted">
            Three Python uAgents (no LLM): <strong className="text-foreground">session</strong>{" "}
            (records metadata after feedback), <strong className="text-foreground">stats</strong>{" "}
            (reads <code className="font-mono text-[11px]">fetch-bridge/data/sessions.jsonl</code>),{" "}
            <strong className="text-foreground">challenge</strong> (deterministic daily tip). Run{" "}
            <code className="rounded bg-muted/30 px-1 font-mono text-xs">python run_all_agents.py</code>{" "}
            in <code className="font-mono text-xs">fetch-bridge/</code>. Ports default to 8765–8767;
            override with <code className="font-mono text-xs">FETCH_BRIDGE_*_URL</code> in{" "}
            <code className="font-mono text-xs">.env</code> if needed. Agentverse optional.
          </p>
          {fetchAgentsPing === null ? (
            <p className="mt-4 text-sm text-muted">Checking agent ports…</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${fetchAgentsPing.session ? "bg-emerald-400" : "bg-zinc-600"}`}
                />
                Session recorder · :8765
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${fetchAgentsPing.stats ? "bg-emerald-400" : "bg-zinc-600"}`}
                />
                Stats aggregator · :8766
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${fetchAgentsPing.challenge ? "bg-emerald-400" : "bg-zinc-600"}`}
                />
                Daily challenge · :8767
              </li>
            </ul>
          )}
        </section>

        <section className="card-premium space-y-4 p-6 pt-7">
          <h2 className="font-display text-base font-semibold text-amber-200/90">
            Danger zone
          </h2>
          <button
            type="button"
            onClick={resetProgress}
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
          >
            Reset gamification
          </button>
          <button
            type="button"
            onClick={signOut}
            className="block rounded-xl border border-danger/35 bg-danger/10 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-danger/15"
          >
            Sign out (clear session)
          </button>
        </section>
      </main>
    </div>
  );
}
