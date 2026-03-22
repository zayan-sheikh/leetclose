import { NextRequest, NextResponse } from "next/server";
import { buildProspectSystemPrompt } from "@/lib/prospect-prompt";

export async function POST(req: NextRequest) {
  const { messages, profile, personaId, modeId } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const geminiContents = Array.isArray(messages)
    ? messages
        .map((m: { role?: string; content?: string }) => {
          const role = m?.role === "assistant" ? "model" : "user";
          const content =
            typeof m?.content === "string" ? m.content.trim() : "";
          return { role, content };
        })
        .filter((m: { content: string }) => m.content.length > 0)
        .map((m: { role: string; content: string }) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }))
    : [];

  if (!apiKey) {
    console.warn("[chat] GEMINI_API_KEY is missing, using fallback response");
    return NextResponse.json({
      response: getFallbackResponse(messages),
      meta: {
        source: "fallback",
        reason: "missing_gemini_api_key",
      },
    });
  }

  const systemPrompt = buildProspectSystemPrompt(
    profile || {},
    personaId,
    modeId,
  );

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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.8,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        errors.push(`model=${model} status=${response.status} ${error}`);
        console.error(
          `[chat] Gemini API error (${response.status}) [${model}]:`,
          error,
        );
        continue;
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) =>
            typeof p?.text === "string" ? p.text : "",
          )
          .join("\n")
          .trim() || "Sorry, I didn't catch that. Can you repeat?";

      return NextResponse.json({
        response: text,
        meta: {
          source: "gemini",
          model,
        },
      });
    }

    return NextResponse.json({
      response: getFallbackResponse(messages),
      meta: {
        source: "fallback",
        reason: "gemini_request_failed",
        detail: errors.join(" | ") || "unknown_error",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response: getFallbackResponse(messages),
      meta: {
        source: "fallback",
        reason: "chat_route_exception",
      },
    });
  }
}

function getFallbackResponse(
  messages: { role: string; content: string }[],
): string {
  const lastMessage =
    messages[messages.length - 1]?.content?.toLowerCase() || "";
  const messageCount = messages.filter(
    (m: { role: string }) => m.role === "user",
  ).length;

  if (
    lastMessage.includes("[coach sent stripe") ||
    lastMessage.includes("stripe link")
  ) {
    const roll = messageCount % 3;
    if (roll === 0) {
      return "Okay… I see it. I'm kind of nervous clicking it but… yeah. Let's do it. I just don't want to regret this.";
    }
    if (roll === 1) {
      return "Wait — before I pay, can you confirm what's included in the first 30 days? Like, exactly how often do we check in?";
    }
    return "Hmm. I see the link. I'm not going to lie, my stomach just dropped. Can we do a smaller first step or is it all upfront?";
  }

  if (messageCount <= 1) {
    return "Hey! Yeah, I can hear you fine. Thanks for taking the time to chat today.";
  }

  if (
    lastMessage.includes("tell me about") ||
    lastMessage.includes("what brought")
  ) {
    return "Yeah, so... honestly I've been wanting to get back in shape for a while now. I've got two kids and between work and everything else, I just feel like I've kind of let myself go, you know? I saw some of your stuff on Instagram and it seemed like you actually get results.";
  }

  if (lastMessage.includes("goal") || lastMessage.includes("want to")) {
    return "I mean, I just want to feel good again. I've gained like 25 pounds since my second kid and my energy is just... not there. I used to be in really good shape and I miss that version of myself.";
  }

  if (lastMessage.includes("tried") || lastMessage.includes("before")) {
    return "Yeah, I tried a gym membership last year but honestly I stopped going after like three months. And I bought this online program but doing it alone just didn't work for me. I think I need more accountability or something.";
  }

  if (
    lastMessage.includes("price") ||
    lastMessage.includes("cost") ||
    lastMessage.includes("invest")
  ) {
    return "Okay... wow, that's definitely more than I was expecting. I mean, I want to do this but that's a big number. I'd probably need to talk to my husband about it first.";
  }

  if (
    lastMessage.includes("husband") ||
    lastMessage.includes("spouse") ||
    lastMessage.includes("partner")
  ) {
    return "It's not that he'd say no exactly, it's more like... we usually make big financial decisions together. And honestly I'm a little nervous about spending that much on myself when we've got the kids and everything.";
  }

  if (lastMessage.includes("think about") || lastMessage.includes("decide")) {
    return "I hear you, and I do want to make a change. I'm just... I need to sit with it, you know? Can I maybe think about it overnight and get back to you?";
  }

  if (
    lastMessage.includes("guarantee") ||
    lastMessage.includes("work for me") ||
    lastMessage.includes("results")
  ) {
    return "I get that you've helped other people, but how do I know it'll work for me? I mean, I've started things before and haven't followed through. What makes this different?";
  }

  if (messageCount > 8) {
    return "Look, I appreciate you being patient with me. You've been really helpful. Let me... let me think about this tonight and I'll message you tomorrow. Is that okay?";
  }

  // Generic responses
  const generics = [
    "Yeah, that makes sense. But I'm still not totally sure...",
    "Right, I hear you. Can you tell me more about how it actually works day to day?",
    "Hmm, okay. And what happens if I feel like it's not working after a few weeks?",
    "I get that. I guess I'm just worried about committing to something and not following through again.",
    "That's a good point actually. I hadn't thought about it like that.",
  ];
  return generics[messageCount % generics.length];
}
