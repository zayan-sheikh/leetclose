import { NextRequest, NextResponse } from "next/server";

type DeepDiveMessage = {
  role?: string;
  content?: string;
};

type DeepDiveContext = {
  prospect?: string;
  durationSec?: number;
  userTurnCount?: number;
  scores?: Record<string, unknown>;
  feedback?: Record<string, unknown>;
  transcriptTail?: { role?: string; content?: string }[];
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = (body?.messages ?? []) as DeepDiveMessage[];
  const context = (body?.context ?? {}) as DeepDiveContext;
  const wantsStream = Boolean(body?.stream);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey) {
    return responseForMode(
      wantsStream,
      "AI deep dive is unavailable because GEMINI_API_KEY is missing. Add your key in environment settings and retry.",
      { source: "fallback", reason: "missing_gemini_api_key" },
    );
  }

  const modelMessages = messages
    .map((m) => ({
      role: m?.role === "assistant" ? "model" : "user",
      content: typeof m?.content === "string" ? m.content.trim() : "",
    }))
    .filter((m) => m.content.length > 0)
    .map((m) => ({ role: m.role, parts: [{ text: m.content }] }));

  const systemPrompt = buildDeepDivePrompt(context);

  try {
    const modelCandidates = Array.from(
      new Set([
        configuredModel,
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
      ]),
    );

    const errors: string[] = [];

    for (const model of modelCandidates) {
      const firstPass = await generateCoachingText({
        apiKey,
        model,
        systemPrompt,
        contents: modelMessages,
      });

      if (!firstPass.ok) {
        errors.push(firstPass.error);
        continue;
      }

      let combinedText = firstPass.text;

      if (firstPass.wasTruncated) {
        const continueMessages = [
          ...modelMessages,
          { role: "model", parts: [{ text: firstPass.text }] },
          {
            role: "user",
            parts: [
              {
                text: "Continue exactly where you left off. Do not repeat previous lines. Finish the answer.",
              },
            ],
          },
        ];

        const secondPass = await generateCoachingText({
          apiKey,
          model,
          systemPrompt,
          contents: continueMessages,
        });

        if (secondPass.ok && secondPass.text) {
          combinedText = `${firstPass.text}\n\n${secondPass.text}`.trim();
        }
      }

      return responseForMode(
        wantsStream,
        combinedText ||
          "Give me one specific part of your call you want to improve and I will coach it step-by-step.",
        {
          source: "gemini",
          model,
        },
      );
    }

    return responseForMode(wantsStream, fallbackCoach(messages), {
      source: "fallback",
      reason: "gemini_request_failed",
      detail: errors.join(" | ") || "unknown_error",
    });
  } catch {
    return responseForMode(wantsStream, fallbackCoach(messages), {
      source: "fallback",
      reason: "deep_dive_route_exception",
    });
  }
}

function responseForMode(
  wantsStream: boolean,
  text: string,
  meta: Record<string, unknown>,
) {
  if (!wantsStream) {
    return NextResponse.json({ response: text, meta });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Split into small chunks for a typing-like UX without websockets.
      const chunks = text.match(/.{1,16}(\s|$)/g) ?? [text];
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 10));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-DeepDive-Meta": encodeURIComponent(JSON.stringify(meta)),
    },
  });
}

async function generateCoachingText({
  apiKey,
  model,
  systemPrompt,
  contents,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
}): Promise<
  | { ok: true; text: string; wasTruncated: boolean }
  | { ok: false; error: string }
> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.6,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      ok: false,
      error: `model=${model} status=${response.status} ${error}`,
    };
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text =
    candidate?.content?.parts
      ?.map((p: { text?: string }) =>
        typeof p?.text === "string" ? p.text : "",
      )
      .join("\n")
      .trim() || "";

  return {
    ok: true,
    text,
    wasTruncated: candidate?.finishReason === "MAX_TOKENS",
  };
}

function buildDeepDivePrompt(context: DeepDiveContext): string {
  const safeContext = JSON.stringify(context ?? {}, null, 2);

  return `You are an elite sales call coach for practice roleplays.

You are in POST-CALL DEEP DIVE mode. Your job is to help the user improve quickly with concrete actions.

Context from the completed call:
${safeContext}

Rules:
- Be practical and specific.
- Prioritize highest-impact fixes first.
- Give script-level examples when useful.
- Keep answers concise and structured.
- If asked for lines, provide lines they can say verbatim.
- If asked for strategy, provide a clear sequence.
- Never roleplay as the prospect in this mode.
- Focus on discovery, labeling, pain, objection handling, offer framing, closing, and payment transition.

Style:
- Direct coach tone.
- No fluff.
- Use short sections and bullets.
`;
}

function fallbackCoach(messages: DeepDiveMessage[]): string {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || "";

  if (last.includes("objection") || last.includes("price")) {
    return [
      "Try this 3-step objection pattern:",
      "1) Label: 'Totally fair, sounds like you're unsure if the value is worth the spend.'",
      "2) Isolate: 'Is it mostly price, or uncertainty this will work for you?'",
      "3) Bridge: 'If we solve that concern, are you open to moving forward today?'",
    ].join("\n");
  }

  if (last.includes("discovery") || last.includes("question")) {
    return [
      "Use this discovery chain on your next call:",
      "1) Situation: 'What is your lead flow/process like right now?'",
      "2) Pain: 'Where are leads slipping specifically?'",
      "3) Impact: 'What is that costing you weekly?'",
      "4) Urgency: 'How long can you let this continue?'",
      "5) Commitment: 'If we solved this, would you move now?'",
    ].join("\n");
  }

  return "Ask me one targeted question, like: 'Give me 5 better lines for the close' or 'Rewrite my pitch transition based on this call.'";
}
