"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  analyzeCallFull,
  type CallData,
  type ExtendedFeedback,
  type FullScores,
} from "@/lib/call-analysis";
import {
  applyCallToProgress,
  loadProgress,
  saveProgress,
  BADGE_DEFS,
} from "@/lib/gamification";
import { getPersonaById } from "@/lib/personas";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const bar =
    score >= 70
      ? "bg-gradient-to-r from-sky-500 to-cyan-500 shadow-[0_0_16px_-4px_var(--glow-success)]"
      : score >= 40
        ? "bg-gradient-to-r from-amber-600 to-warning shadow-[0_0_14px_-4px_rgba(232,197,71,0.35)]"
        : "bg-gradient-to-r from-danger to-orange-600 shadow-[0_0_14px_-4px_var(--glow-danger)]";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-hud tabular-nums text-sm font-semibold text-zinc-100">
          {score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/[0.05]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [callData, setCallData] = useState<CallData | null>(null);
  const [analysis, setAnalysis] = useState<{
    scores: FullScores;
    feedback: ExtendedFeedback;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prospectLabel, setProspectLabel] = useState("Prospect");

  useEffect(() => {
    let done = false;

    const hydrateFromStorage = () => {
      const stored = localStorage.getItem("closearena_last_call");
      if (!stored) return false;

      try {
        const data = JSON.parse(stored) as CallData;
        setCallData(data);
        setProspectLabel(getPersonaById(data.personaId).firstName);

        const result = analyzeCallFull(data);
        setAnalysis(result);

        let userName = "Coach";
        try {
          const u = localStorage.getItem("closearena_user");
          if (u)
            userName = JSON.parse(u).name || JSON.parse(u).email || "Coach";
        } catch {
          /* ignore */
        }

        const prev = loadProgress();
        const next = applyCallToProgress(prev, result.scores, userName);
        saveProgress(next);
        done = true;
        setIsLoading(false);
        return true;
      } catch {
        return false;
      }
    };

    if (hydrateFromStorage()) return;

    const pollId = window.setInterval(() => {
      if (done) return;
      hydrateFromStorage();
    }, 400);

    const timeoutId = window.setTimeout(() => {
      if (!done) setIsLoading(false);
    }, 12000);

    return () => {
      done = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background">
        <div className="page-mesh-bg opacity-50" aria-hidden />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <p className="text-sm text-muted">Loading your call feedback...</p>
        </div>
      </div>
    );
  }

  if (!callData || !analysis) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background">
        <div className="page-mesh-bg opacity-50" aria-hidden />
        <div className="relative text-center">
          <p className="text-muted">No call data found.</p>
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="btn-primary-glow mt-5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
          >
            Start a call
          </button>
        </div>
      </div>
    );
  }

  const { scores, feedback } = analysis;
  const minutes = Math.floor(callData.duration / 60);
  const seconds = callData.duration % 60;
  const progress = loadProgress();

  return (
    <div className="min-h-screen bg-background">
      <div className="page-mesh-bg opacity-40" aria-hidden />
      <header className="relative flex items-center justify-between border-b border-white/[0.06] bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl">
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-cyan-300"
        >
          ← Dashboard
        </Link>
        <span className="font-hud text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Session report
        </span>
      </header>

      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <p className="label-overline">Debrief</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">
            Call results
          </h1>
          <p className="mt-2 text-sm text-muted">
            {minutes}m {seconds}s ·{" "}
            {callData.messages.filter((m) => m.role === "user").length} coach
            turns · vs {prospectLabel}
          </p>
        </div>

        <div className="card-premium mb-6 p-8 pt-9 text-center">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-2 border-cyan-400/35 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-[0_0_40px_-12px_var(--glow-cyan)]">
            <span className="font-display text-4xl font-bold text-white">
              {scores.overall}
            </span>
          </div>
          <p className="font-hud text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Overall score
          </p>
          <p className="mt-2 text-base font-medium text-zinc-200">
            Modeled close probability:{" "}
            <span className="text-cyan-400">{scores.closeProbability}%</span>
          </p>
        </div>

        <div className="card-premium mb-6 space-y-4 p-6 pt-7">
          <h2 className="font-display text-base font-semibold">
            Score breakdown
          </h2>
          <ScoreBar label="Rapport" score={scores.rapport} />
          <ScoreBar label="Discovery depth" score={scores.discovery} />
          <ScoreBar label="Pain extraction" score={scores.painExtraction} />
          <ScoreBar
            label="Emotional connection"
            score={scores.emotionalConnection}
          />
          <ScoreBar label="Control of the call" score={scores.callControl} />
          <ScoreBar label="Clarity of offer" score={scores.offerClarity} />
          <ScoreBar label="Confidence" score={scores.confidence} />
          <ScoreBar
            label="Objection handling"
            score={scores.objectionHandling}
          />
          <ScoreBar label="Closing strength" score={scores.closing} />
          <ScoreBar label="Payment ask timing" score={scores.paymentTiming} />
        </div>

        <div className="card-premium mb-6 p-6 pt-7">
          <h2 className="font-display text-base font-semibold text-cyan-300/95">
            AI coach summary
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            {feedback.coachSummary}
          </p>
          <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-4">
            <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">
              Suggested retry challenge
            </p>
            <p className="mt-1.5 text-sm text-zinc-200">
              {feedback.retryChallenge}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="card-premium p-6 pt-7">
            <h2 className="font-display text-base font-semibold text-success/95">
              What you did well
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {feedback.didWell.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="card-premium p-6 pt-7">
            <h2 className="font-display text-base font-semibold text-amber-400/95">
              What to improve
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {feedback.missed.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {feedback.momentsAtRisk.length > 0 && (
          <div className="card-premium mb-6 p-6 pt-7">
            <h2 className="font-display text-base font-semibold">
              Momentum risks
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {feedback.momentsAtRisk.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.objectionsMishandled.length > 0 && (
          <div className="card-premium mb-6 p-6 pt-7">
            <h2 className="font-display text-base font-semibold">
              Objections to tighten
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {feedback.objectionsMishandled.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-premium mb-6 p-6 pt-7">
          <h2 className="font-display text-base font-semibold">
            Better lines to steal
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {feedback.betterResponses.map((item, i) => (
              <li key={i} className="italic text-zinc-300">
                “{item}”
              </li>
            ))}
          </ul>
        </div>

        {feedback.tips.length > 0 && (
          <div className="card-premium mb-6 p-6 pt-7">
            <h2 className="font-display text-base font-semibold">Pro tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {feedback.tips.map((tip, i) => (
                <li key={i}>
                  <span className="text-cyan-500/90">▸</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-premium mb-6 p-6 pt-7">
          <h2 className="font-display mb-4 text-base font-semibold">
            Transcript
          </h2>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {callData.messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-cyan-600 to-indigo-600 text-white"
                      : "border border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  {msg.role === "user" ? "Y" : prospectLabel.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="font-hud text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {msg.role === "user" ? "You" : prospectLabel}
                  </span>
                  <p className="text-sm text-zinc-300">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium mb-8 p-6 pt-7">
          <h2 className="font-display text-base font-semibold">
            Badges &amp; XP
          </h2>
          <p className="mt-2 text-sm text-muted">
            +XP applied · Level {progress.level} ·{" "}
            <span className="font-hud text-zinc-300">
              {progress.xp.toLocaleString()} XP
            </span>{" "}
            · {progress.streak} day streak
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {progress.badges.map((id) => {
              const b = BADGE_DEFS.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/95"
                  title={b?.description}
                >
                  {b?.label ?? id}
                </span>
              );
            })}
            {progress.badges.length === 0 && (
              <span className="text-sm text-muted">
                Keep practicing to unlock badges.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="btn-primary-glow rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Practice again
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="btn-secondary rounded-xl px-6 py-3 text-sm"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
