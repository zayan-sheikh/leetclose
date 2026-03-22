"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  const current = STEPS[step];
  const isMulti = current.multi;

  const handleSelect = (option: string) => {
    if (isMulti) {
      setSelectedMulti((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      const newAnswers = { ...answers, [current.key]: option };
      setAnswers(newAnswers);

      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        finishOnboarding(newAnswers);
      }
    }
  };

  const handleMultiNext = () => {
    const newAnswers = { ...answers, [current.key]: selectedMulti };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setSelectedMulti([]);
    } else {
      finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = (finalAnswers: Record<string, string | string[]>) => {
    localStorage.setItem("closearena_profile", JSON.stringify(finalAnswers));
    localStorage.setItem("closearena_onboarded", "true");
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="page-mesh-bg opacity-55" aria-hidden />
      <div className="relative w-full max-w-lg">
        <div className="card-premium p-6 pt-8 md:p-8">
          <p className="label-overline mb-4">Onboarding</p>
          <div className="mb-8 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_12px_-2px_var(--glow-cyan)]"
                    : "bg-white/[0.08]"
                }`}
              />
            ))}
          </div>

          <div className="mb-8 text-center">
            <p className="font-hud text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Step {step + 1} / {STEPS.length}
            </p>
            <h1 className="font-display mt-3 text-xl font-bold leading-snug tracking-tight md:text-2xl">
              {current.question}
            </h1>
            {isMulti && (
              <p className="mt-2 text-sm text-muted">Select all that apply</p>
            )}
          </div>

          <div className="space-y-2.5">
            {current.options.map((option) => {
              const selected = isMulti && selectedMulti.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition-all ${
                    selected
                      ? "border-cyan-400/45 bg-cyan-400/10 text-zinc-50 shadow-[0_0_24px_-10px_var(--glow-cyan)] ring-1 ring-cyan-400/20"
                      : "border-white/[0.08] bg-black/25 text-zinc-200 hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {isMulti && selectedMulti.length > 0 && (
            <button
              type="button"
              onClick={handleMultiNext}
              className="btn-primary-glow mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          )}

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-3 w-full py-2.5 text-sm text-muted transition-colors hover:text-zinc-200"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
