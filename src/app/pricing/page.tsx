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
      <div className="page-mesh-bg opacity-45" aria-hidden />
      <DashboardNav />
      <main className="relative mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="label-overline mb-3">Pricing</p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Train like your income depends on it
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted md:text-base">
          3-day free trial, then keep full access for less than a protein shake per
          week — sharp product, zero fluff.
        </p>

        <div className="card-premium mx-auto mt-12 max-w-md p-8 pt-9 text-left">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-white">$3</span>
            <span className="text-muted">/month intro</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="text-zinc-600 line-through">$11/mo</span>
            <span className="ml-2 text-zinc-300">
              list — lock intro pricing when you start your trial.
            </span>
          </p>
          <ul className="mb-8 mt-6 space-y-2.5 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-cyan-400">✓</span>
              Unlimited AI practice calls
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">✓</span>
              Objection &amp; closing modes
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">✓</span>
              Performance breakdowns + transcripts
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">✓</span>
              XP, streaks, and prospect unlocks
            </li>
          </ul>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="btn-primary-glow w-full rounded-xl py-4 text-base font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Start free 3-day trial"}
          </button>
          {err && (
            <p className="mt-4 text-center text-sm text-amber-400/95">{err}</p>
          )}
          <p className="mt-4 text-center font-hud text-[10px] uppercase tracking-wider text-zinc-600">
            Secure checkout · Stripe · Cancel anytime
          </p>
        </div>
      </main>
    </div>
  );
}
