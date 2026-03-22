"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="page-mesh-bg opacity-[0.85]" aria-hidden />

      {/* Nav */}
      <nav className="sticky top-0 z-20 mx-auto max-w-6xl px-4 pt-4">
        <div className="glass-panel flex items-center justify-between rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-[2px] shadow-[0_0_24px_-4px_var(--glow-cyan)]">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0c0c0e]">
                <span className="font-display text-sm font-bold text-cyan-300">
                  CA
                </span>
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              LeetClose{" "}
              <span className="text-muted text-sm font-medium">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="btn-primary-glow rounded-xl px-4 py-2 text-sm font-semibold text-white"
            >
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-14 text-center md:pt-20">
        <p className="label-overline mb-4">AI sales gym · fitness coaches</p>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-200 shadow-[0_0_32px_-8px_var(--glow-cyan)]">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          Live prospect simulation · voice + feedback
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-tight md:text-[3.25rem] md:leading-[1.05]">
          Practice sales calls until
          <br />
          <span className="text-gradient-brand">closing feels automatic</span>
        </h1>
        <p className="mx-auto mb-8 mt-5 max-w-2xl text-base text-muted md:text-lg">
          A premium AI practice floor: objections, tone control, transcripts,
          and scores — built like a SaaS product, paced like a game, structured
          like a Zoom session.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="btn-primary-glow rounded-xl px-8 py-4 text-lg font-semibold text-white"
          >
            Start free 3-day trial
          </button>
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="btn-secondary rounded-xl px-8 py-4 text-lg"
          >
            Try a demo call
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          No credit card for demo · Chrome recommended for voice
        </p>
      </section>

      {/* Stats strip — conversion + gaming HUD */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.9)]">
          {[
            { k: "Modes", v: "6+", d: "Training loops" },
            { k: "Objections", v: "40+", d: "Realistic pushback" },
            { k: "Feedback", v: "10+", d: "Scored dimensions" },
          ].map((s) => (
            <div
              key={s.k}
              className="bg-[#09090b]/90 px-3 py-4 text-center backdrop-blur-sm sm:px-5 sm:py-5"
            >
              <p className="font-hud text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                {s.k}
              </p>
              <p className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">
                {s.v}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product preview — matches in-call UI language */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p className="label-overline mb-3 text-center">Product preview</p>
        <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#08080a] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_-24px_rgba(34,211,238,0.12),0_24px_60px_-30px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0e0e12] px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-danger/75" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
            </div>
            <span className="font-hud text-[10px] uppercase tracking-widest text-zinc-500">
              LeetClose · practice session
            </span>
            <div className="w-10" />
          </div>
          <div className="flex min-h-[280px] items-center justify-center p-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 p-[3px] shadow-[0_0_48px_-10px_var(--glow-cyan)]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0c] ring-1 ring-white/10">
                    <span className="font-display text-3xl font-bold tracking-tight text-white">
                      SM
                    </span>
                  </div>
                </div>
                <span className="font-hud absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
                  AI prospect
                </span>
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-zinc-200">
                  Sarah Mitchell
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                  &quot;Hey — I can hear you. Walk me through what you actually
                  do for clients, and why now?&quot;
                </p>
              </div>
              <div className="flex h-8 items-end justify-center gap-1">
                {[3, 5, 7, 4, 6, 8, 5, 3, 6, 4, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-cyan-600/40 to-cyan-300/90 animate-shimmer-bar"
                    style={{
                      height: `${h * 3}px`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p className="label-overline mb-2 text-center">Why coaches use it</p>
        <h2 className="font-display mb-12 text-center text-2xl font-bold md:text-3xl">
          Reps that feel like the real call
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Live AI prospect",
              desc: "Natural back-and-forth with hesitation, pushback, and momentum shifts — not a chatbot monologue.",
              icon: "◇",
            },
            {
              title: "Objection engine",
              desc: "Price, partner, time, trust — practice the lines that actually move deals without sounding robotic.",
              icon: "◎",
            },
            {
              title: "Instant debrief",
              desc: "Scores, coach summary, and retry challenges so every session compounds.",
              icon: "◆",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="card-premium card-hover-glow p-6 pt-7"
            >
              <span className="font-hud text-lg text-cyan-400/90">
                {feature.icon}
              </span>
              <h3 className="font-display mt-3 text-lg font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Objections */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <p className="label-overline mb-2 text-center">Drills</p>
        <h2 className="font-display mb-4 text-center text-2xl font-bold">
          Objections that kill fitness deals
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted">
          Chip away at the phrases that stall your close — one rep at a time.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {[
            "Too expensive",
            "Need to think about it",
            "Ask my spouse",
            "Don't have time",
            "Tried it before",
            "Send me more info",
            "Want to wait",
            "Not sure it'll work",
          ].map((obj) => (
            <div
              key={obj}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3.5 text-center text-xs font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-cyan-400/35 hover:shadow-[0_0_24px_-8px_var(--glow-cyan)] md:text-sm"
            >
              &quot;{obj}&quot;
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
        <div className="card-premium relative overflow-hidden p-10 pt-11 md:p-14">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-500/18 blur-3xl"
            aria-hidden
          />
          <p className="label-overline mb-3">Start closing calmer</p>
          <h2 className="font-display relative mb-4 text-2xl font-bold md:text-3xl">
            Stop losing deals you should be closing
          </h2>
          <p className="relative mx-auto mb-8 max-w-lg text-sm text-muted md:text-base">
            Join coaches who treat practice like training: short sessions, clear
            feedback, visible progress.
          </p>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="btn-primary-glow relative rounded-xl px-8 py-4 text-lg font-semibold text-white"
          >
            Start free 3-day trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500">
              <span className="font-display text-[10px] font-bold text-white">
                CA
              </span>
            </div>
            <span className="text-sm text-muted">LeetClose AI</span>
          </div>
          <p className="text-center text-xs text-zinc-600 sm:text-right">
            Sleek dark UI · built for fast practice loops.
          </p>
        </div>
      </footer>
    </div>
  );
}
