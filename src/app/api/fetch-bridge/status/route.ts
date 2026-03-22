import { NextResponse } from "next/server";
import {
  fetchChallengeBridgeUrl,
  fetchSessionBridgeUrl,
  fetchStatsBridgeUrl,
} from "@/lib/fetch-bridge-env";

async function pingHealth(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Which of the three local uAgents respond (for Settings / ops). */
export async function GET() {
  const [session, stats, challenge] = await Promise.all([
    pingHealth(fetchSessionBridgeUrl()),
    pingHealth(fetchStatsBridgeUrl()),
    pingHealth(fetchChallengeBridgeUrl()),
  ]);
  return NextResponse.json({
    ok: true,
    agents: { session, stats, challenge },
  });
}
