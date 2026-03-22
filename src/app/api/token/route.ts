import { NextResponse } from "next/server";

/** Sandbox-only avatar (Wayne). See https://docs.liveavatar.com/docs/developing-in-sandbox-mode */
const SANDBOX_AVATAR_ID = "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";

function formatUpstreamErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as {
      message?: string;
      detail?: unknown;
    };
    if (typeof j.message === "string" && j.message) return j.message;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((d: { msg?: string; loc?: unknown }) => {
          if (typeof d?.msg === "string") return d.msg;
          return JSON.stringify(d);
        })
        .join("; ");
    }
    if (typeof j.detail === "string") return j.detail;
  } catch {
    /* raw text */
  }
  return text || "(empty response)";
}

/**
 * Proxies Live Avatar session token creation (keeps API key on the server).
 * POST https://api.liveavatar.com/v1/sessions/token — `is_sandbox: true` avoids credit usage.
 *
 * Use an API key from the Live Avatar dashboard (not necessarily the same as other HeyGen keys).
 */
export async function POST() {
  const apiKey = process.env.LIVEAVATAR_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "LIVEAVATAR_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const headers = {
    "X-API-KEY": apiKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  } as const;

  const url = "https://api.liveavatar.com/v1/sessions/token";

  /**
   * This app drives avatar speech via FULL-mode command events over LiveKit data channels.
   * Do not silently fall back to LITE here; LITE requires websocket `agent.speak` audio events.
   */
  const attempts: Record<string, unknown>[] = [
    {
      mode: "FULL",
      avatar_id: SANDBOX_AVATAR_ID,
      is_sandbox: true,
      avatar_persona: null,
    },
    {
      mode: "FULL",
      avatar_id: SANDBOX_AVATAR_ID,
      is_sandbox: true,
      avatar_persona: {},
    },
  ];

  let response: Response | undefined;
  let lastRaw = "";

  for (const body of attempts) {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (response.ok) break;
    lastRaw = await response.text();
    if (response.status !== 422) break;
  }

  if (!response || !response.ok) {
    const detail = formatUpstreamErrorBody(lastRaw);
    return NextResponse.json(
      {
        error: "Failed to create Live Avatar session token",
        hint: "FULL mode token is required for text-command lip-sync in this app. Check LiveAvatar mode availability for your API key/account.",
        detail,
        status: response?.status ?? 500,
      },
      { status: response?.status ?? 500 },
    );
  }

  const body = (await response.json()) as {
    data?: { session_token?: string };
  };
  const token = body?.data?.session_token;
  if (!token) {
    return NextResponse.json(
      { error: "Invalid token response from Live Avatar API" },
      { status: 502 },
    );
  }

  return NextResponse.json({ token });
}
