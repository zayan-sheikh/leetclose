"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CallData {
  messages: { role: string; content: string; timestamp: number }[];
  duration: number;
  timestamp: number;
}

interface Scores {
  overall: number;
  discovery: number;
  painExtraction: number;
  objectionHandling: number;
  confidence: number;
  closing: number;
}

interface Feedback {
  didWell: string[];
  missed: string[];
  tips: string[];
}

function analyzeCall(data: CallData): { scores: Scores; feedback: Feedback } {
  const userMessages = data.messages.filter((m) => m.role === "user");
  const prospectMessages = data.messages.filter((m) => m.role === "prospect");
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  // Discovery scoring
  const discoveryKeywords = [
    "tell me",
    "what",
    "how",
    "why",
    "when",
    "describe",
    "share",
    "walk me through",
    "what brought",
    "what made",
    "currently",
    "right now",
    "day to day",
  ];
  const discoveryHits = discoveryKeywords.filter((k) => allText.includes(k)).length;
  const discovery = Math.min(100, Math.round((discoveryHits / 6) * 100));

  // Pain extraction
  const painKeywords = [
    "struggle",
    "challenge",
    "frustrat",
    "hard",
    "difficult",
    "pain",
    "stress",
    "worry",
    "fear",
    "concern",
    "affect",
    "impact",
    "feel",
    "emotion",
    "hurt",
  ];
  const painHits = painKeywords.filter((k) => allText.includes(k)).length;
  const painExtraction = Math.min(100, Math.round((painHits / 5) * 100));

  // Objection handling
  const objectionKeywords = [
    "understand",
    "hear you",
    "makes sense",
    "totally",
    "get that",
    "appreciate",
    "fair",
    "valid",
    "let me",
    "what if",
    "imagine",
    "picture",
  ];
  const objHits = objectionKeywords.filter((k) => allText.includes(k)).length;
  const objectionHandling = Math.min(100, Math.round((objHits / 5) * 100));

  // Confidence — based on message count and length
  const avgLength =
    userMessages.reduce((sum, m) => sum + m.content.length, 0) /
    Math.max(userMessages.length, 1);
  const confidence = Math.min(
    100,
    Math.round(
      (Math.min(userMessages.length, 10) / 10) * 50 +
        (Math.min(avgLength, 100) / 100) * 50
    )
  );

  // Closing
  const closingKeywords = [
    "ready",
    "start",
    "begin",
    "move forward",
    "get going",
    "sign up",
    "commit",
    "invest",
    "next step",
    "let's do",
    "go ahead",
    "today",
    "right now",
  ];
  const closeHits = closingKeywords.filter((k) => allText.includes(k)).length;
  const closing = Math.min(100, Math.round((closeHits / 4) * 100));

  const overall = Math.round(
    discovery * 0.2 +
      painExtraction * 0.2 +
      objectionHandling * 0.25 +
      confidence * 0.15 +
      closing * 0.2
  );

  // Generate feedback
  const didWell: string[] = [];
  const missed: string[] = [];
  const tips: string[] = [];

  if (discovery >= 60) didWell.push("Good discovery questions — you dug into the prospect's situation");
  else missed.push("Ask more open-ended discovery questions to understand the prospect's situation");

  if (painExtraction >= 60) didWell.push("You explored their pain points effectively");
  else missed.push("Dig deeper into emotional pain — ask how their situation affects their daily life");

  if (objectionHandling >= 60) didWell.push("You handled objections with empathy and skill");
  else missed.push("When they push back, acknowledge first, then reframe — don't argue");

  if (confidence >= 60) didWell.push("You spoke with confidence and authority");
  else tips.push("Speak more assertively — longer, clearer statements show confidence");

  if (closing >= 40) didWell.push("You attempted to close the deal");
  else missed.push("You never clearly asked for the close — always ask for the next step");

  if (userMessages.length < 4)
    tips.push("The call was very short — aim for longer conversations to build rapport");

  if (prospectMessages.length > userMessages.length + 2)
    tips.push("Let the prospect talk, but make sure you're guiding the conversation");

  tips.push("Practice transitioning smoothly from discovery to your pitch");

  return {
    scores: { overall, discovery, painExtraction, objectionHandling, confidence, closing },
    feedback: { didWell, missed, tips },
  };
}

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
  const [analysis, setAnalysis] = useState<{ scores: Scores; feedback: Feedback } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("closearena_last_call");
    if (stored) {
      const data = JSON.parse(stored) as CallData;
      setCallData(data);
      setAnalysis(analyzeCall(data));
    }
  }, []);

  if (!callData || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted">No call data found.</p>
          <button
            onClick={() => router.push("/call")}
            className="px-6 py-2 bg-accent text-white rounded-lg"
          >
            Start a Call
          </button>
        </div>
      </div>
    );
  }

  const { scores, feedback } = analysis;
  const minutes = Math.floor(callData.duration / 60);
  const seconds = callData.duration % 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Call Results</h1>
          <p className="text-muted">
            Call duration: {minutes}m {seconds}s •{" "}
            {callData.messages.filter((m) => m.role === "user").length} exchanges
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-accent mb-4">
            <span className="text-3xl font-bold">{scores.overall}</span>
          </div>
          <p className="text-muted text-sm">Overall Score</p>
          <p className="text-lg font-medium mt-1">
            {scores.overall >= 70
              ? "Strong performance!"
              : scores.overall >= 40
              ? "Good effort — room to improve"
              : "Keep practicing — you'll get there"}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold mb-2">Score Breakdown</h2>
          <ScoreBar label="Discovery" score={scores.discovery} />
          <ScoreBar label="Pain Extraction" score={scores.painExtraction} />
          <ScoreBar label="Objection Handling" score={scores.objectionHandling} />
          <ScoreBar label="Confidence" score={scores.confidence} />
          <ScoreBar label="Closing" score={scores.closing} />
        </div>

        {/* Feedback */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* What went well */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-success mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              What You Did Well
            </h2>
            {feedback.didWell.length > 0 ? (
              <ul className="space-y-2">
                {feedback.didWell.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Keep practicing to earn positive feedback!</p>
            )}
          </div>

          {/* What to improve */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-warning mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Areas to Improve
            </h2>
            <ul className="space-y-2">
              {feedback.missed.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        {feedback.tips.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-accent mb-3">Pro Tips</h2>
            <ul className="space-y-2">
              {feedback.tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground/80">
                  💡 {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call Transcript */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Call Transcript</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {callData.messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-[#2a4a6a] text-white"
                  }`}
                >
                  {msg.role === "user" ? "Y" : "S"}
                </div>
                <div>
                  <span className="text-xs text-muted">
                    {msg.role === "user" ? "You" : "Sarah"}
                  </span>
                  <p className="text-sm text-foreground/90">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/call")}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-card border border-border hover:bg-card-hover text-foreground rounded-xl font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
