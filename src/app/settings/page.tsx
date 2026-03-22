"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { saveProgress, defaultProgress } from "@/lib/gamification";

export default function SettingsPage() {
  const router = useRouter();
  const [profileJson, setProfileJson] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem("closearena_profile");
    setProfileJson(p ? JSON.stringify(JSON.parse(p), null, 2) : "{}");
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
          <h2 className="font-display text-base font-semibold">Coaching profile JSON</h2>
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
              <span className="font-hud text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Saved
              </span>
            )}
          </div>
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
            className="block rounded-xl border border-rose-500/35 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/15"
          >
            Sign out (clear session)
          </button>
        </section>
      </main>
    </div>
  );
}
