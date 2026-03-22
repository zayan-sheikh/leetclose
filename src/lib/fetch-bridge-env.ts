/** Default localhost ports match fetch-bridge/run_all_agents.py */

export function fetchSessionBridgeUrl(): string {
  return (process.env.FETCH_BRIDGE_BASE_URL || "http://127.0.0.1:8765").replace(
    /\/$/,
    "",
  );
}

export function fetchStatsBridgeUrl(): string {
  return (process.env.FETCH_BRIDGE_STATS_URL || "http://127.0.0.1:8766").replace(
    /\/$/,
    "",
  );
}

export function fetchChallengeBridgeUrl(): string {
  return (
    process.env.FETCH_BRIDGE_CHALLENGE_URL || "http://127.0.0.1:8767"
  ).replace(/\/$/, "");
}
