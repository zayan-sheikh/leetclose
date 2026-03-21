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
  const color =
    score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-danger";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
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
  const [prospectLabel, setProspectLabel] = useState("Prospect");

  useEffect(() => {
    const stored = localStorage.getItem("closearena_last_call");
    if (!stored) return;
    const data = JSON.parse(stored) as CallData;
    setCallData(data);
    setProspectLabel(getPersonaById(data.personaId).firstName);
    const result = analyzeCallFull(data);
    setAnalysis(result);

    let userName = "Coach";
    try {
      const u = localStorage.getItem("closearena_user");
      if (u) userName = JSON.parse(u).name || JSON.parse(u).email || "Coach";
    } catch {
      /* ignore */
    }
    const prev = loadProgress();
    const next = applyCallToProgress(prev, result.scores, userName);
    saveProgress(next);
  }, []);

  if (!callData || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted">No call data found.</p>
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="px-6 py-2 bg-accent text-white rounded-lg"
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
      <div className="border-b border-border px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
          ← Dashboard
        </Link>
        <span className="text-xs text-muted">Results</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Call results</h1>
          <p className="text-muted">
            {minutes}m {seconds}s · {callData.messages.filter((m) => m.role === "user").length}{" "}
            coach turns · vs {prospectLabel}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-accent mb-4">
            <span className="text-3xl font-bold">{scores.overall}</span>
          </div>
          <p className="text-muted text-sm">Overall score</p>
          <p className="text-lg font-medium mt-1">
            Modeled close probability:{" "}
            <span className="text-accent">{scores.closeProbability}%</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold mb-2">Score breakdown</h2>
          <ScoreBar label="Rapport" score={scores.rapport} />
          <ScoreBar label="Discovery depth" score={scores.discovery} />
          <ScoreBar label="Pain extraction" score={scores.painExtraction} />
          <ScoreBar label="Emotional connection" score={scores.emotionalConnection} />
          <ScoreBar label="Control of the call" score={scores.callControl} />
          <ScoreBar label="Clarity of offer" score={scores.offerClarity} />
          <ScoreBar label="Confidence" score={scores.confidence} />
          <ScoreBar label="Objection handling" score={scores.objectionHandling} />
          <ScoreBar label="Closing strength" score={scores.closing} />
          <ScoreBar label="Payment ask timing" score={scores.paymentTiming} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-accent mb-2">AI coach summary</h2>
          <p className="text-sm text-foreground/90 leading-relaxed">{feedback.coachSummary}</p>
          <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
              Suggested retry challenge
            </p>
            <p className="text-sm">{feedback.retryChallenge}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-success mb-3">What you did well</h2>
            <ul className="space-y-2 text-sm text-foreground/80">
              {feedback.didWell.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-warning mb-3">What to improve</h2>
            <ul className="space-y-2 text-sm text-foreground/80">
              {feedback.missed.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {feedback.momentsAtRisk.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold mb-3">Moments where you may have lost momentum</h2>
            <ul className="space-y-2 text-sm text-foreground/80">
              {feedback.momentsAtRisk.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.objectionsMishandled.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold mb-3">Objections to tighten up</h2>
            <ul className="space-y-2 text-sm text-foreground/80">
              {feedback.objectionsMishandled.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3">Better lines to steal</h2>
          <ul className="space-y-2 text-sm text-foreground/80">
            {feedback.betterResponses.map((item, i) => (
              <li key={i} className="italic">
                “{item}”
              </li>
            ))}
          </ul>
        </div>

        {feedback.tips.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold mb-3">Pro tips</h2>
            <ul className="space-y-2 text-sm text-foreground/80">
              {feedback.tips.map((tip, i) => (
                <li key={i}>💡 {tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Transcript</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {callData.messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    msg.role === "user" ? "bg-accent text-white" : "bg-[#2a4a6a] text-white"
                  }`}
                >
                  {msg.role === "user" ? "Y" : prospectLabel.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-muted">
                    {msg.role === "user" ? "You" : prospectLabel}
                  </span>
                  <p className="text-sm text-foreground/90">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-3">Badges &amp; XP</h2>
          <p className="text-sm text-muted mb-3">
            +XP applied. Level {progress.level} · {progress.xp.toLocaleString()} XP ·{" "}
            {progress.streak} day streak
          </p>
          <div className="flex flex-wrap gap-2">
            {progress.badges.map((id) => {
              const b = BADGE_DEFS.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="text-xs px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/30"
                  title={b?.description}
                >
                  {b?.label ?? id}
                </span>
              );
            })}
            {progress.badges.length === 0 && (
              <span className="text-sm text-muted">Keep practicing to unlock badges.</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium"
          >
            Practice again
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-card border border-border rounded-xl font-medium"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
