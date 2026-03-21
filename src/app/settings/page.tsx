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
      <DashboardNav />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted text-sm mt-1">
            MVP: profile is stored in your browser (localStorage).
          </p>
        </div>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Coaching profile JSON</h2>
          <p className="text-sm text-muted mb-3">
            Keys used by the AI: coachType, offerName, offerPrice, weakObjections, niche,
            closeRate, practiceTone.
          </p>
          <textarea
            value={profileJson}
            onChange={(e) => setProfileJson(e.target.value)}
            className="w-full h-64 bg-background border border-border rounded-xl p-4 font-mono text-sm"
          />
          <button
            type="button"
            onClick={saveProfile}
            className="mt-3 px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium"
          >
            Save profile
          </button>
          {saved && <span className="ml-3 text-sm text-success">Saved</span>}
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Danger zone</h2>
          <button
            type="button"
            onClick={resetProgress}
            className="px-5 py-2 bg-warning/20 text-warning rounded-lg text-sm font-medium border border-warning/30"
          >
            Reset gamification
          </button>
          <button
            type="button"
            onClick={signOut}
            className="block px-5 py-2 bg-danger/20 text-danger rounded-lg text-sm font-medium border border-danger/30"
          >
            Sign out (clear session flags)
          </button>
        </section>
      </main>
    </div>
  );
}
