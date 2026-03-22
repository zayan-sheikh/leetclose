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

function difficultyMeta(d: Persona["objectionDifficulty"]): {
  label: string;
  className: string;
} {
  switch (d) {
    case "beginner":
      return {
        label: "Easy",
        className: "bg-[#1f2a36] text-foreground ring-1 ring-border",
      };
    case "intermediate":
      return {
        label: "Medium",
        className: "bg-[#2a2418] text-foreground ring-1 ring-ring/60",
      };
    case "advanced":
      return {
        label: "Hard",
        className: "bg-[#33271f] text-foreground ring-1 ring-border",
      };
    case "killer":
      return {
        label: "Hard",
        className: "bg-[#2a2433] text-foreground ring-1 ring-border",
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
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* LeetCode-style tab row */}
      <div className="flex shrink-0 border-b border-border bg-background/90">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent"
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-5 lg:py-5">
        {/* Title block — like problem number + name */}
        <div className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              {mode.label}
            </h2>
            {variant === "active" && (
              <span
                className="rounded border border-success/40 bg-success/15 px-1.5 py-0.5 text-xs font-medium text-success"
                title="Session in progress"
              >
                ✓ Live
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.className}`}
            >
              {diff.label}
            </span>
            <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
              Tier {persona.trainingTier}/5 · {persona.archetypeLabel}
            </span>
            <button
              type="button"
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted"
            >
              Topics
            </button>
            <span className="rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted">
              {mode.id}
            </span>
            <span className="rounded-full border border-ring bg-[#2a2418] px-2.5 py-0.5 text-xs font-medium text-accent">
              vs {persona.firstName}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Prospect: {persona.displayName}
          </p>
        </div>

        {tab === "description" && (
          <div className="space-y-4 pt-5">
            <p className="text-sm leading-snug text-muted">
              Pushback happens in the live call. Likely lines:{" "}
              <span className="text-foreground">Constraints</span> · tone:{" "}
              <span className="text-foreground">Objectives</span>.
            </p>

            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-medium text-foreground">
                {persona.archetypeLabel}.
              </span>{" "}
              {firstSentences(persona.backgroundStory, 2)} Trying to{" "}
              {persona.nicheGoal}.
            </p>

            <p className="border-l-2 border-ring pl-3 text-sm leading-snug italic text-muted">
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
              <p className="mt-2 text-sm leading-relaxed text-muted">
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
              <ul className="mt-2 list-none space-y-2.5 text-sm text-foreground">
                {mode.goals.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-muted">{i + 1}.</span>
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
              <ul className="mt-2 list-none space-y-2.5 text-sm text-foreground">
                {persona.practiceObjectives.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-muted">{i + 1}.</span>
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
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="font-hud text-[10px] uppercase tracking-wider text-muted">
                    {k}
                  </span>
                  <span className="text-xs font-medium capitalize text-foreground">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <span className="font-hud text-[10px] uppercase tracking-wider text-muted">
                Personality
              </span>
              <p className="mt-1 text-sm text-foreground">
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
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                The prospect is prompted to follow this consultative arc.
                Question-based selling and solid diagnosis before the offer earn
                warmer, more honest responses — NEPQ-style layering is rewarded;
                pitch-first behavior is resisted.
              </p>
              <ol className="mt-2.5 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-foreground">
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
              <ul className="mt-2 list-none space-y-2 text-sm text-foreground">
                {persona.practiceConstraints.map((c, i) => (
                  <li key={i} className="flex gap-2 leading-snug">
                    <span className="font-mono text-muted">·</span>
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
              <ul className="mt-2 space-y-1.5 border-l-2 border-amber-400/50 pl-3 text-sm text-foreground">
                {persona.likelyObjections.map((o, i) => (
                  <li key={i} className="leading-snug">
                    &quot;{o}&quot;
                  </li>
                ))}
              </ul>
            </div>
            {variant === "setup" && (
              <div className="rounded-lg border border-dashed border-ring bg-[#2a2418] p-3">
                <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Hint
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  Configure the workspace on the right, then hit{" "}
                  <span className="font-semibold text-foreground">
                    Join call
                  </span>
                  .
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
