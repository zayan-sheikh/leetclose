import { NextResponse } from "next/server";
import { fetchChallengeBridgeUrl } from "@/lib/fetch-bridge-env";

/** Proxy to challenge uAgent GET /daily-challenge */
export async function GET() {
  const url = `${fetchChallengeBridgeUrl()}/daily-challenge`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "challenge_agent_error",
          status: res.status,
          detail: data,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, bridge: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "challenge_agent_unreachable" },
      { status: 502 },
    );
  }
}
