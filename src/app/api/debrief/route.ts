import { NextRequest, NextResponse } from "next/server";
import { getModeById } from "@/lib/modes";
import { getPersonaById } from "@/lib/personas";
import { extractJsonObject, parseAiDebriefPayload } from "@/lib/debrief-types";

const SYSTEM = `You are an expert sales coach reviewing a fitness/coaching sales roleplay: a human coach vs an AI prospect.

Read the transcript. Judge each objective for whether the COACH substantially met it based on what they actually said — not generic theory.

Rules:
- met = clear evidence in the coach's lines; if unsure, met:false.
- note: max 120 characters, one concrete observation (no fluff).
- strengths / improvements: 2–4 items each, specific to THIS call.
- betterLines: 1–3 short example lines they could use next time (plain text, no nested quotes).
- retryChallenge: one actionable sentence for the next rep.

Output ONLY valid JSON (no markdown fences, no commentary) with exactly this structure:
{"modeObjectives":[{"index":0,"met":true,"note":"string"}],"personaObjectives":[{"index":0,"met":false,"note":"string"}],"coachSummary":"string","strengths":["string"],"improvements":["string"],"betterLines":["string"],"retryChallenge":"string"}

Include one modeObjectives entry for every mode objective index given (0 through n-1), and one personaObjectives entry for every persona objective index given.`;

export async function POST(req: NextRequest) {
  let body: {
    transcript?: string;
    modeId?: string;
    personaId?: string;
    durationSeconds?: number;
    stripeLinkSent?: boolean;
    modeGoals?: string[];
    personaGoals?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  const modeGoals = Array.isArray(body.modeGoals)
    ? body.modeGoals.filter((g): g is string => typeof g === "string")
    : [];
  const personaGoals = Array.isArray(body.personaGoals)
    ? body.personaGoals.filter((g): g is string => typeof g === "string")
    : [];

  if (!transcript || transcript.length < 20) {
    return NextResponse.json(
      { ok: false, error: "transcript_too_short" },
      { status: 400 },
    );
  }

  const mode = getModeById(body.modeId);
  const persona = getPersonaById(body.personaId);
  const modeCount = modeGoals.length || mode.goals.length;
  const personaCount = personaGoals.length || persona.practiceObjectives.length;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "missing_gemini_api_key" },
      { status: 503 },
    );
  }

  const userBlock = `
Mode: ${mode.label} (${mode.id})
Duration: ${Number(body.durationSeconds) || 0} seconds
Coach sent Stripe / payment link in simulation: ${body.stripeLinkSent ? "yes" : "no"}

MODE OBJECTIVES (evaluate index 0..${modeCount - 1}):
${(modeGoals.length ? modeGoals : mode.goals).map((g, i) => `${i}. ${g}`).join("\n")}

PERSONA: ${persona.displayName} (${persona.id})
PERSONA OBJECTIVES (evaluate index 0..${personaCount - 1}):
${(personaGoals.length ? personaGoals : persona.practiceObjectives).map((g, i) => `${i}. ${g}`).join("\n")}

TRANSCRIPT:
${transcript.slice(0, 48_000)}
`.trim();

  const modelCandidates = Array.from(
    new Set([
      configuredModel,
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ]),
  );

  let lastError = "";

  for (const model of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: userBlock }] }],
          generationConfig: {
            maxOutputTokens: 1600,
            temperature: 0.35,
          },
        }),
      });

      if (!response.ok) {
        lastError = await response.text();
        continue;
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) =>
            typeof p?.text === "string" ? p.text : "",
          )
          .join("\n")
          .trim() ?? "";

      const parsedObj = extractJsonObject(text);
      const debrief = parseAiDebriefPayload(
        parsedObj,
        modeCount,
        personaCount,
      );

      if (debrief) {
        return NextResponse.json({
          ok: true,
          debrief,
          meta: { model },
        });
      }
      lastError = "parse_failed";
    } catch (e) {
      lastError = e instanceof Error ? e.message : "request_failed";
    }
  }

  return NextResponse.json(
    { ok: false, error: lastError || "debrief_failed" },
    { status: 502 },
  );
}
