import { NextRequest, NextResponse } from "next/server";

type DeepDiveMessage = {
  role?: string;
  content?: string;
};

type DeepDivePayload = {
  messages?: DeepDiveMessage[];
  feedback?: {
    didWell?: string[];
    missed?: string[];
    coachSummary?: string;
    retryChallenge?: string;
    tips?: string[];
  };
  scores?: Record<string, number>;
  prospectLabel?: string;
  duration?: number;
};

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && !!x.trim());
}

function compactScores(scores?: Record<string, number>): string {
  if (!scores || typeof scores !== "object") return "unknown";

  const orderedKeys = [
    "overall",
    "closeProbability",
    "rapport",
    "discovery",
    "painExtraction",
    "emotionalConnection",
    "callControl",
    "offerClarity",
    "confidence",
    "objectionHandling",
    "closing",
    "paymentTiming",
  ];

  return orderedKeys
    .filter((key) => typeof scores[key] === "number")
    .map((key) => `${key}: ${scores[key]}`)
    .join(" | ");
}

function fallbackReply(lastUserMessage: string): string {
  if (lastUserMessage.includes("objection")) {
    return "Use a 3-step objection sequence: acknowledge the concern, isolate the true blocker, and re-anchor to the prospect's outcome. Keep each step to one sentence before asking a check-in question.";
  }

  if (
    lastUserMessage.includes("close") ||
    lastUserMessage.includes("closing")
  ) {
    return "Tighten your close by confirming value first, then giving one clear next step with a deadline. Avoid adding new features during the close.";
  }

  return "Focus your next rep on one weakness only. Start with two discovery questions, summarize their pain in their own words, then ask for a concrete next commitment.";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DeepDivePayload;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const didWell = safeArray(body.feedback?.didWell);
  const missed = safeArray(body.feedback?.missed);
  const tips = safeArray(body.feedback?.tips);
  const transcriptMessages = Array.isArray(body.messages) ? body.messages : [];

  const contextBlock = [
    `Prospect: ${body.prospectLabel || "Unknown"}`,
    `Duration seconds: ${typeof body.duration === "number" ? body.duration : 0}`,
    `Scores: ${compactScores(body.scores)}`,
    `Strengths: ${didWell.join("; ") || "none listed"}`,
    `Improvements: ${missed.join("; ") || "none listed"}`,
    `Tips: ${tips.join("; ") || "none listed"}`,
    `Coach summary: ${body.feedback?.coachSummary || ""}`,
    `Retry challenge: ${body.feedback?.retryChallenge || ""}`,
  ].join("\n");

  const geminiContents = transcriptMessages
    .map((m) => {
      const role = m.role === "assistant" ? "model" : "user";
      const content = typeof m.content === "string" ? m.content.trim() : "";
      return { role, content };
    })
    .filter((m) => m.content.length > 0)
    .map((m) => ({ role: m.role, parts: [{ text: m.content }] }));

  if (!apiKey) {
    const lastUser =
      [...transcriptMessages]
        .reverse()
        .find((m) => m.role === "user" && typeof m.content === "string")
        ?.content?.toLowerCase() || "";

    return NextResponse.json({
      response: fallbackReply(lastUser),
      meta: { source: "fallback", reason: "missing_gemini_api_key" },
    });
  }

  const systemPrompt = [
    "You are an elite sales coach in an AI deep-dive chat.",
    "Give tactical coaching based on this completed call report context:",
    contextBlock,
    "Rules:",
    "1) Be specific and concrete, not generic.",
    "2) Give actionable scripts and sequencing the user can say on the next call.",
    "3) Keep responses concise but useful (usually 5-12 lines).",
    "4) If asked for examples, provide short roleplay snippets.",
    "5) Maintain a confident, supportive tone.",
  ].join("\n\n");

  try {
    const modelCandidates = Array.from(
      new Set([
        configuredModel,
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
      ]),
    );

    for (const model of modelCandidates) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 900,
            temperature: 0.65,
          },
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) =>
            typeof p?.text === "string" ? p.text : "",
          )
          .join("\n")
          .trim() ||
        "Ask me one specific part of your call and I will break it down.";

      return NextResponse.json({
        response: text,
        meta: { source: "gemini", model },
      });
    }

    const lastUser =
      [...transcriptMessages]
        .reverse()
        .find((m) => m.role === "user" && typeof m.content === "string")
        ?.content?.toLowerCase() || "";

    return NextResponse.json({
      response: fallbackReply(lastUser),
      meta: { source: "fallback", reason: "gemini_request_failed" },
    });
  } catch {
    const lastUser =
      [...transcriptMessages]
        .reverse()
        .find((m) => m.role === "user" && typeof m.content === "string")
        ?.content?.toLowerCase() || "";

    return NextResponse.json({
      response: fallbackReply(lastUser),
      meta: { source: "fallback", reason: "deepdive_route_exception" },
    });
  }
}
