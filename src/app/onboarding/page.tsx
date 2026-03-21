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
    question: "What's your current close rate on sales calls?",
    options: [
      "Under 10%",
      "10–25%",
      "25–40%",
      "40–60%",
      "60%+",
    ],
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-2xl font-bold">{current.question}</h1>
          {isMulti && (
            <p className="text-sm text-muted mt-2">Select all that apply</p>
          )}
        </div>

        <div className="space-y-3">
          {current.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                isMulti && selectedMulti.includes(option)
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card hover:bg-card-hover text-foreground hover:border-muted"
              }`}
            >
              <span className="text-sm font-medium">{option}</span>
            </button>
          ))}
        </div>

        {isMulti && selectedMulti.length > 0 && (
          <button
            type="button"
            onClick={handleMultiNext}
            className="w-full mt-6 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
          >
            Continue
          </button>
        )}

        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="w-full mt-3 px-6 py-3 text-muted hover:text-foreground transition-colors text-sm"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
