import { NextResponse } from "next/server";
import { fetchSessionBridgeUrl } from "@/lib/fetch-bridge-env";

/** Proxy to session recorder uAgent GET /health */
export async function GET() {
  const url = `${fetchSessionBridgeUrl()}/health`;
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
        { ok: false, error: "bridge_error", status: res.status, detail: data },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, bridge: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "bridge_unreachable" },
      { status: 502 },
    );
  }
}
