"use client";

import { useState } from "react";
import type { Persona } from "@/lib/personas";
import type { TrainingMode } from "@/lib/modes";
import { CONSULTATIVE_CALL_PHASES } from "@/lib/sales-call-framework";

const LC_ORANGE = "#ffa116";

/** Keeps long persona briefs skimmable in the Description tab. */
function firstSentences(text: string, max: number): string {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, max).join(" ").trim() || text;
}

type TabId = "description" | "editorial" | "submissions";

function difficultyMeta(
  d: Persona["objectionDifficulty"]
): { label: string; className: string } {
  switch (d) {
    case "beginner":
      return {
        label: "Easy",
        className: "bg-cyan-500/20 text-cyan-900 ring-1 ring-cyan-400/45 dark:text-cyan-100",
      };
    case "intermediate":
      return {
        label: "Medium",
        className: "bg-amber-500/20 text-amber-800 ring-1 ring-amber-400/45 dark:text-amber-100",
      };
    case "advanced":
      return {
        label: "Hard",
        className: "bg-orange-500/20 text-orange-900 ring-1 ring-orange-400/45 dark:text-orange-100",
      };
    case "killer":
      return {
        label: "Hard",
        className: "bg-violet-500/20 text-violet-950 ring-1 ring-violet-400/45 dark:text-violet-100",
      };
    default:
      return {
        label: "Medium",
        className: "bg-zinc-500/20 text-zinc-200 ring-1 ring-zinc-400/30",
      };
  }
}

export default function CallProblemPanel({
  persona,
  mode,
  variant,
}: {
  persona: Persona;
  mode: TrainingMode;
  variant: "setup" | "active";
}) {
  const [tab, setTab] = useState<TabId>("description");
  const diff = difficultyMeta(persona.objectionDifficulty);

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "editorial", label: "Objectives" },
    { id: "submissions", label: "Constraints" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fbff] dark:bg-[#121c2e]">
      {/* LeetCode-style tab row */}
      <div className="flex shrink-0 border-b border-sky-200/70 bg-white/90 dark:border-white/[0.08] dark:bg-[#0f172a]/95">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-sky-950 dark:text-white"
                : "text-sky-600/80 hover:text-sky-800 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-sky-600 dark:bg-[#ffa116]"
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-5 lg:py-5">
        {/* Title block — like problem number + name */}
        <div className="border-b border-sky-200/50 pb-4 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight text-sky-950 dark:text-zinc-50">
              {mode.label}
            </h2>
            {variant === "active" && (
              <span
                className="rounded border border-success/40 bg-success/15 px-1.5 py-0.5 text-xs font-medium text-cyan-950 dark:text-success"
                title="Session in progress"
              >
                ✓ Live
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.className}`}>
              {diff.label}
            </span>
            <span className="rounded-full border border-sky-300/60 bg-white/70 px-2.5 py-0.5 text-xs font-medium text-sky-900 dark:border-white/12 dark:bg-white/10 dark:text-zinc-300">
              Tier {persona.trainingTier}/5 · {persona.archetypeLabel}
            </span>
            <button
              type="button"
              className="rounded-full border border-sky-300/80 bg-sky-100/80 px-2.5 py-0.5 text-xs font-medium text-sky-900 dark:border-white/15 dark:bg-white/10 dark:text-zinc-300"
            >
              Topics
            </button>
            <span className="rounded-full border border-sky-200 bg-white/60 px-2.5 py-0.5 font-mono text-[10px] text-sky-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-400">
              {mode.id}
            </span>
            <span className="rounded-full border border-sky-300/50 bg-sky-100/60 px-2.5 py-0.5 text-xs font-medium text-sky-900 dark:border-sky-500/35 dark:bg-sky-500/12 dark:text-sky-200">
              vs {persona.firstName}
            </span>
          </div>
          <p className="mt-3 text-sm text-sky-800 dark:text-zinc-400">
            Prospect: {persona.displayName}
          </p>
        </div>

        {tab === "description" && (
          <div className="space-y-4 pt-5">
            <p className="text-sm leading-snug text-sky-800 dark:text-zinc-400">
              Pushback happens in the live call. Likely lines:{" "}
              <span className="text-sky-950 dark:text-zinc-200">Constraints</span> · tone:{" "}
              <span className="text-sky-950 dark:text-zinc-200">Objectives</span>.
            </p>

            <p className="text-sm leading-relaxed text-sky-950 dark:text-zinc-300">
              <span className="font-medium text-sky-950 dark:text-zinc-100">
                {persona.archetypeLabel}.
              </span>{" "}
              {firstSentences(persona.backgroundStory, 2)} Trying to {persona.nicheGoal}.
            </p>

            <p className="border-l-2 border-sky-400/40 pl-3 text-sm leading-snug italic text-sky-800 dark:border-sky-500/35 dark:text-zinc-400">
              &ldquo;{persona.initialGreeting}&rdquo;
            </p>
          </div>
        )}

        {tab === "editorial" && (
          <div className="space-y-5 pt-5">
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Mode focus
              </p>
              <p className="mt-2 text-sm leading-relaxed text-sky-900/90 dark:text-zinc-400">
                {mode.description}
              </p>
            </div>
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Your objectives
              </p>
              <ul className="mt-2 list-none space-y-2.5 text-sm text-sky-950 dark:text-zinc-300">
                {mode.goals.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-sky-400 dark:text-zinc-600">{i + 1}.</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Matchup objectives ({persona.firstName})
              </p>
              <ul className="mt-2 list-none space-y-2.5 text-sm text-sky-950 dark:text-zinc-300">
                {persona.practiceObjectives.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-sky-400 dark:text-zinc-600">{i + 1}.</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "submissions" && (
          <div className="space-y-5 pt-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Budget", persona.budgetSensitivity],
                ["Urgency", persona.urgencyLevel],
                ["Trust", persona.trustLevel],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sky-200/60 bg-white/60 px-3 py-2 dark:border-white/[0.08] dark:bg-black/25"
                >
                  <span className="font-hud text-[10px] uppercase tracking-wider text-sky-500 dark:text-zinc-500">
                    {k}
                  </span>
                  <span className="text-xs font-medium capitalize text-sky-950 dark:text-zinc-200">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-sky-200/60 bg-white/60 p-3 dark:border-white/[0.08] dark:bg-black/25">
              <span className="font-hud text-[10px] uppercase tracking-wider text-sky-500 dark:text-zinc-500">
                Personality
              </span>
              <p className="mt-1 text-sm text-sky-900 dark:text-zinc-300">
                {persona.personalityType}
              </p>
            </div>
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Sales framework (AI + you)
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-sky-800 dark:text-zinc-500">
                The prospect is prompted to follow this consultative arc. Question-based selling and
                solid diagnosis before the offer earn warmer, more honest responses — NEPQ-style
                layering is rewarded; pitch-first behavior is resisted.
              </p>
              <ol className="mt-2.5 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-sky-900 dark:text-zinc-400">
                {CONSULTATIVE_CALL_PHASES.map((phase, i) => (
                  <li key={i}>{phase}</li>
                ))}
              </ol>
            </div>
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Coach constraints
              </p>
              <ul className="mt-2 list-none space-y-2 text-sm text-sky-900 dark:text-zinc-400">
                {persona.practiceConstraints.map((c, i) => (
                  <li key={i} className="flex gap-2 leading-snug">
                    <span className="font-mono text-sky-400/80 dark:text-zinc-600">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="font-hud text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: LC_ORANGE }}
              >
                Watch for
              </p>
              <ul className="mt-2 space-y-1.5 border-l-2 border-amber-400/50 pl-3 text-sm text-sky-900 dark:text-zinc-400">
                {persona.likelyObjections.map((o, i) => (
                  <li key={i} className="leading-snug">
                    &quot;{o}&quot;
                  </li>
                ))}
              </ul>
            </div>
            {variant === "setup" && (
              <div className="rounded-lg border border-dashed border-sky-300 bg-sky-100/40 p-3 dark:border-sky-500/30 dark:bg-sky-950/20">
                <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-zinc-500">
                  Hint
                </p>
                <p className="mt-1 text-xs leading-relaxed text-sky-800 dark:text-zinc-500">
                  Configure the workspace on the right, then hit{" "}
                  <span className="font-semibold text-sky-950 dark:text-zinc-300">Join call</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
