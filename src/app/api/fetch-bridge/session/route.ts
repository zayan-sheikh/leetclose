import { NextRequest, NextResponse } from "next/server";
import { fetchSessionBridgeUrl } from "@/lib/fetch-bridge-env";

/** Proxy to session recorder uAgent POST /session — metadata only, no transcript. */
export async function POST(req: NextRequest) {
  const base = fetchSessionBridgeUrl();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const url = `${base}/session`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
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
