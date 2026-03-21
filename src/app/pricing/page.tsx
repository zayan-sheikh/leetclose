"use client";

import { useState } from "react";
import DashboardNav from "@/components/DashboardNav";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(
        data.message ||
          "Stripe is not configured. Add keys to .env (see .env.example)."
      );
    } catch {
      setErr("Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-accent text-sm font-medium mb-3">Low-friction trial</p>
        <h1 className="text-4xl font-bold mb-4">Train like your income depends on it</h1>
        <p className="text-muted max-w-lg mx-auto mb-10">
          3-day free trial, then keep full access for less than a protein shake per week.
        </p>

        <div className="bg-card border border-border rounded-2xl p-10 text-left max-w-md mx-auto shadow-xl">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold">$3</span>
            <span className="text-muted">/month intro</span>
          </div>
          <p className="text-sm text-muted mb-6">
            <span className="line-through text-muted">$11/month</span>
            <span className="ml-2 text-foreground">normally — you lock intro pricing at signup.</span>
          </p>
          <ul className="space-y-2 text-sm text-foreground/90 mb-8">
            <li>✓ Unlimited AI practice calls</li>
            <li>✓ Objection &amp; closing modes</li>
            <li>✓ Performance breakdowns + transcripts</li>
            <li>✓ XP, streaks, and prospect unlocks</li>
          </ul>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl font-semibold text-lg"
          >
            {loading ? "Redirecting…" : "Start free 3-day trial"}
          </button>
          {err && (
            <p className="text-sm text-warning mt-4 text-center">{err}</p>
          )}
          <p className="text-xs text-muted text-center mt-4">
            Secure checkout powered by Stripe. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
