"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SECTIONS = [
  {
    question: "What type of coach are you?",
    options: [
      "Online Fitness Coach",
      "Personal Trainer",
      "Nutrition Coach",
      "Health & Wellness Coach",
      "Transformation Coach",
    ],
    key: "coachType",
  },
  {
    question: "What do you sell?",
    options: [
      "1-on-1 Coaching Program",
      "Group Coaching Program",
      "Online Course + Coaching",
      "Hybrid (Online + In-Person)",
      "Mentorship / Mastermind",
    ],
    key: "offerName",
  },
  {
    question: "What's your offer price?",
    options: [
      "$500 - $1,000",
      "$1,000 - $2,000",
      "$2,000 - $3,000",
      "$3,000 - $5,000",
      "$5,000+",
    ],
    key: "offerPrice",
  },
  {
    question: "What niche are you in?",
    options: [
      "Fat loss / body recomposition",
      "Muscle building",
      "Hybrid athletes",
      "Busy professionals",
      "Postpartum / moms",
      "General population online",
    ],
    key: "niche",
  },
  {
    question: "Which objections do you struggle with most?",
    hint: "Select all that apply",
    options: [
      "Too expensive",
      "I need to think about it",
      "I need to ask my spouse",
      "I don't have time",
      "I've tried coaching before",
      "Can you send me more info?",
      "I want to wait",
      "I'm not sure this will work",
    ],
    key: "weakObjections",
    multi: true,
  },
  {
    question: "What's your current close rate on sales calls?",
    options: ["Under 10%", "10–25%", "25–40%", "40–60%", "60%+"],
    key: "closeRate",
  },
  {
    question: "What tone do you want to practice with?",
    options: [
      "Warm & consultative",
      "Direct & confident",
      "Calm authority",
      "High-energy motivator",
      "Clinical / precise",
    ],
    key: "practiceTone",
  },
];

type ProfileKey = (typeof SECTIONS)[number]["key"];

type ProfileAnswers = Record<ProfileKey, string | string[]>;

function loadProfileFromStorage(): Partial<ProfileAnswers> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("closearena_profile");
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    const next: Partial<ProfileAnswers> = {};
    for (const s of SECTIONS) {
      const v = p[s.key];
      if (v == null) continue;
      if (s.multi && Array.isArray(v))
        next[s.key] = v.filter((x): x is string => typeof x === "string");
      else if (s.multi && typeof v === "string") next[s.key] = [v];
      else if (!s.multi && typeof v === "string") next[s.key] = v;
    }
    return next;
  } catch {
    return {};
  }
}

function optionButtonClass(selected: boolean) {
  return `w-full rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition-all ${
    selected
      ? "border-cyan-400/45 bg-cyan-400/10 text-zinc-50 shadow-[0_0_24px_-10px_var(--glow-cyan)] ring-1 ring-cyan-400/20"
      : "border-white/[0.08] bg-black/25 text-zinc-200 hover:border-white/15 hover:bg-white/[0.04]"
  }`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<ProfileAnswers>>({});
  const [hydrated, setHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers(loadProfileFromStorage());
    setHydrated(true);
  }, []);

  const setSingle = (key: ProfileKey, option: string) => {
    setSubmitError(null);
    setAnswers((prev) => ({ ...prev, [key]: option }));
  };

  const toggleMulti = (option: string) => {
    setSubmitError(null);
    setAnswers((prev) => {
      const cur = Array.isArray(prev.weakObjections) ? prev.weakObjections : [];
      const next = cur.includes(option)
        ? cur.filter((o) => o !== option)
        : [...cur, option];
      return { ...prev, weakObjections: next };
    });
  };

  const buildPayload = (): ProfileAnswers | null => {
    const payload = {} as ProfileAnswers;
    for (const s of SECTIONS) {
      if (s.multi) {
        const arr = Array.isArray(answers.weakObjections) ? answers.weakObjections : [];
        if (arr.length === 0) return null;
        payload[s.key] = arr;
      } else {
        const v = answers[s.key];
        if (typeof v !== "string" || !v) return null;
        payload[s.key] = v;
      }
    }
    return payload;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Please answer every section, including at least one objection.");
      return;
    }
    localStorage.setItem("closearena_profile", JSON.stringify(payload));
    localStorage.setItem("closearena_onboarded", "true");
    router.push("/dashboard");
  };

  const hasExistingProfile = hydrated && Object.keys(answers).length > 0;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="page-mesh-bg opacity-55" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-4 py-10 pb-32 md:py-14 md:pb-36">
        <div className="card-premium p-6 pt-8 md:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label-overline">
                {hasExistingProfile ? "Update profile" : "Onboarding"}
              </p>
              <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-zinc-50 md:text-3xl">
                Coaching profile
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Scroll through and tap your answers, then save at the bottom.
              </p>
            </div>
            {hasExistingProfile && (
              <Link
                href="/dashboard"
                className="shrink-0 text-xs font-medium text-sky-400/90 transition-colors hover:text-sky-300"
              >
                ← Back to dashboard
              </Link>
            )}
          </div>
          {hasExistingProfile && (
            <p className="mb-8 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm leading-relaxed text-zinc-300">
              Your saved profile is pre-filled. Change anything you need—the AI uses these details on
              practice calls.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            {SECTIONS.map((section, idx) => {
              const isMulti = "multi" in section && section.multi;
              return (
                <section
                  key={section.key}
                  id={`onboarding-${section.key}`}
                  className="scroll-mt-24 border-t border-white/[0.06] pt-10 first:border-t-0 first:pt-0"
                >
                  <p className="font-hud text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    {idx + 1} / {SECTIONS.length}
                  </p>
                  <h2 className="font-display mt-2 text-lg font-semibold leading-snug text-zinc-100 md:text-xl">
                    {section.question}
                  </h2>
                  {"hint" in section && section.hint && (
                    <p className="mt-1.5 text-sm text-muted">{section.hint}</p>
                  )}
                  <div className="mt-4 space-y-2.5">
                    {section.options.map((option) => {
                      if (isMulti) {
                        const selected =
                          Array.isArray(answers.weakObjections) &&
                          answers.weakObjections.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleMulti(option)}
                            className={optionButtonClass(selected)}
                          >
                            {option}
                          </button>
                        );
                      }
                      const selected = answers[section.key] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSingle(section.key, option)}
                          className={optionButtonClass(selected)}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {submitError && (
              <p className="text-sm font-medium text-amber-200/90" role="alert">
                {submitError}
              </p>
            )}

            <div className="sticky bottom-0 -mx-6 border-t border-white/[0.08] bg-[var(--background)]/90 px-6 py-5 backdrop-blur-md md:-mx-8 md:px-8">
              <button
                type="submit"
                className="btn-primary-glow w-full rounded-xl py-3.5 text-sm font-semibold text-white"
              >
                Save & continue to dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
