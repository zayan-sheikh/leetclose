import type { CallScoreSnapshot } from "./gamification";

export interface CallData {
  messages: { role: string; content: string; timestamp: number }[];
  duration: number;
  timestamp: number;
  personaId?: string;
  modeId?: string;
  stripeLinkSent?: boolean;
}

export interface FullScores extends CallScoreSnapshot {
  rapport: number;
  emotionalConnection: number;
  callControl: number;
  offerClarity: number;
  paymentTiming: number;
  closeProbability: number;
}

export interface ExtendedFeedback {
  didWell: string[];
  missed: string[];
  tips: string[];
  betterResponses: string[];
  momentsAtRisk: string[];
  objectionsMishandled: string[];
  coachSummary: string;
  retryChallenge: string;
}

export function analyzeCallFull(data: CallData): {
  scores: FullScores;
  feedback: ExtendedFeedback;
} {
  const userMessages = data.messages.filter((m) => m.role === "user");
  const prospectMessages = data.messages.filter((m) => m.role === "prospect");
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");
  const transcript = data.messages.map((m) => `${m.role}: ${m.content}`).join("\n").toLowerCase();

  const countHits = (keywords: string[], text: string) =>
    keywords.filter((k) => text.includes(k)).length;

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
  const discovery = Math.min(100, Math.round((countHits(discoveryKeywords, allText) / 6) * 100));

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
  const painExtraction = Math.min(100, Math.round((countHits(painKeywords, allText) / 5) * 100));

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
  const objectionHandling = Math.min(
    100,
    Math.round((countHits(objectionKeywords, allText) / 5) * 100)
  );

  const avgLength =
    userMessages.reduce((sum, m) => sum + m.content.length, 0) /
    Math.max(userMessages.length, 1);
  const confidence = Math.min(
    100,
    Math.round(
      (Math.min(userMessages.length, 10) / 10) * 50 + (Math.min(avgLength, 100) / 100) * 50
    )
  );

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
    "payment",
    "link",
    "stripe",
    "card",
    "invoice",
  ];
  const closing = Math.min(100, Math.round((countHits(closingKeywords, allText) / 5) * 100));

  const rapportKeywords = [
    "thanks",
    "appreciate",
    "great to",
    "nice to",
    "how are you",
    "before we",
    "totally get",
  ];
  const rapport = Math.min(100, Math.round((countHits(rapportKeywords, allText) / 3) * 100));

  const emotionalKeywords = [
    "feel",
    "felt",
    "scared",
    "excited",
    "worried",
    "hope",
    "afraid",
    "proud",
    "embarrass",
    "ashamed",
  ];
  const emotionalConnection = Math.min(
    100,
    Math.round((countHits(emotionalKeywords, allText) / 4) * 100)
  );

  const controlKeywords = [
    "let's",
    "what i'd suggest",
    "next",
    "the plan",
    "here's how",
    "walk you",
    "does that make sense",
    "quick question",
  ];
  const callControl = Math.min(100, Math.round((countHits(controlKeywords, allText) / 3) * 100));

  const offerKeywords = [
    "program",
    "coaching",
    "includes",
    "week",
    "session",
    "support",
    "accountability",
    "onboarding",
    "deliver",
  ];
  const offerClarity = Math.min(100, Math.round((countHits(offerKeywords, allText) / 4) * 100));

  const paymentTiming = data.stripeLinkSent
    ? Math.min(100, 55 + Math.round(discovery * 0.25))
    : Math.min(100, Math.round(closing * 0.6));

  const closeProbability = Math.round(
    discovery * 0.12 +
      painExtraction * 0.12 +
      objectionHandling * 0.18 +
      closing * 0.15 +
      rapport * 0.08 +
      emotionalConnection * 0.1 +
      offerClarity * 0.1 +
      paymentTiming * 0.07 +
      (data.stripeLinkSent ? 8 : 0)
  );

  const overall = Math.round(
    discovery * 0.12 +
      painExtraction * 0.12 +
      objectionHandling * 0.16 +
      confidence * 0.1 +
      closing * 0.12 +
      rapport * 0.08 +
      emotionalConnection * 0.08 +
      callControl * 0.08 +
      offerClarity * 0.08 +
      paymentTiming * 0.06
  );

  const scores: FullScores = {
    overall: Math.min(100, overall),
    discovery,
    painExtraction,
    objectionHandling,
    confidence,
    closing,
    rapport,
    emotionalConnection,
    callControl,
    offerClarity,
    paymentTiming,
    closeProbability: Math.min(100, closeProbability),
    stripeLinkSent: data.stripeLinkSent,
  };

  const didWell: string[] = [];
  const missed: string[] = [];
  const tips: string[] = [];
  const betterResponses: string[] = [];
  const momentsAtRisk: string[] = [];
  const objectionsMishandled: string[] = [];

  if (rapport >= 55) didWell.push("Opened with human rapport — good tone setup.");
  else missed.push("Lead with warmth and a clear agenda before diving in.");

  if (discovery >= 60) didWell.push("Solid discovery — you asked situation-style questions.");
  else missed.push("Ask more who/what/when/why questions before pitching.");

  if (painExtraction >= 60) didWell.push("You explored consequences and feelings, not just facts.");
  else missed.push("Go deeper on emotional impact: “What does that cost you day to day?”");

  if (objectionHandling >= 60) didWell.push("You acknowledged pushback instead of debating.");
  else {
    missed.push("On objections, label + validate before reframing.");
    betterResponses.push(
      "“Totally fair — a lot of people feel that at first. What part worries you most — the money or whether it’ll stick?”"
    );
  }

  if (emotionalConnection >= 55) didWell.push("You connected to emotion, not just logistics.");
  else tips.push("Mirror their language and ask one “what does that feel like?” follow-up.");

  if (callControl >= 55) didWell.push("You guided next steps instead of only reacting.");
  else tips.push("Use micro-summaries: “So if I’m hearing you…” then ask permission to explain the plan.");

  if (offerClarity >= 55) didWell.push("You hinted at structure — keep making the deliverables concrete.");
  else missed.push("Spell out what week 1 looks like: check-ins, audits, expectations.");

  if (closing >= 45) didWell.push("You moved toward commitment language.");
  else missed.push("Ask explicitly for the sale or next step with a clear binary choice.");

  if (data.stripeLinkSent) {
    didWell.push("You simulated sending a payment link — great close practice.");
    if (paymentTiming < 50)
      tips.push("Next time, earn the link with tighter discovery so the ask feels inevitable.");
  } else {
    missed.push("No payment link moment — practice asking to send the Stripe link out loud.");
    betterResponses.push(
      "“I’m going to text you the secure checkout now — it’ll take 60 seconds. I’ll stay on while you open it.”"
    );
  }

  if (userMessages.length < 4) {
    tips.push("Run a longer rep — aim for 8+ coach turns to practice pacing.");
    momentsAtRisk.push("Call ended very early — hard to diagnose or build trust.");
  }

  const objSignals = [
    "expensive",
    "think about",
    "husband",
    "wife",
    "partner",
    "time",
    "scam",
    "guarantee",
    "not sure",
    "info",
  ];
  const lastProspectObj = [...prospectMessages].reverse().find((m) =>
    objSignals.some((s) => m.content.toLowerCase().includes(s))
  );
  if (lastProspectObj && userMessages.length > 0) {
    const lastUser = userMessages[userMessages.length - 1];
    if (lastUser.content.length < 30) {
      momentsAtRisk.push(
        `After pushback (“${lastProspectObj.content.slice(0, 70)}…”), your last reply was short — slow down with validate → clarify → question.`
      );
    }
  }

  if (objectionHandling < 50 && transcript.includes("expensive")) {
    objectionsMishandled.push(
      "Price pushback: tie cost to cost of staying the same, then offer a clear next step."
    );
  }
  if (objectionHandling < 50 && transcript.includes("think about")) {
    objectionsMishandled.push(
      "“Think about it”: clarify what they need to think through — decision criteria, not endless delay."
    );
  }

  if (betterResponses.length === 0) {
    betterResponses.push(
      "“What would need to be true for you to feel confident saying yes today?”"
    );
  }

  const coachSummary = `You scored ${scores.overall}/100 overall with ${scores.closeProbability}% modeled close probability. Strongest levers: ${
    scores.objectionHandling >= scores.discovery ? "objection tone" : "discovery"
  }. Focus next on ${
    scores.paymentTiming < 55 ? "payment timing + explicit Stripe ask" : "deepening emotional diagnosis"
  }.`;

  const retryChallenge =
    scores.discovery < 60
      ? "Retry on Full sales call mode — don’t mention price until you’ve labeled their top 3 pains."
      : scores.objectionHandling < 60
        ? "Retry on Objection only mode — every prospect line gets: validate → clarify → reframe → question."
        : scores.stripeLinkSent
          ? "Retry on Paid-in-full close mode — practice confident PIF framing after they agree in principle."
          : "Retry on Closing only mode — open with “Assume we’re a fit…” and drive to the Stripe link.";

  return {
    scores,
    feedback: {
      didWell,
      missed,
      tips,
      betterResponses,
      momentsAtRisk,
      objectionsMishandled,
      coachSummary,
      retryChallenge,
    },
  };
}
