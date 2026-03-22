"""
CloserArena ↔ Fetch.ai bridge (no LLM).

- Runs a local uAgent with REST only (on_rest_*), same pattern as
  innovation-lab-examples/frontend-integration and fetch-hackathon orchestrator.
- Agentverse / mailbox is OPTIONAL: set mailbox=True + mailbox key only if you
  want ASI One / Agentverse discovery. For local dev, mailbox=False is enough.

Endpoints (default http://127.0.0.1:8765):
  GET  /health   — liveness + agent address + session counter
  POST /session  — record a completed practice session (metadata only, no transcript)
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from uagents import Agent, Context, Model

from store import append_session

_agent_kwargs: dict = {
    "name": "closerarena_practice_bridge",
    "seed": os.environ.get(
        "FETCH_BRIDGE_AGENT_SEED",
        "closerarena-bridge-dev-seed-change-in-production",
    ),
    "port": int(os.environ.get("FETCH_BRIDGE_PORT", "8765")),
}
# Optional: mailbox=True when you connect this agent to Agentverse (see Fetch docs).
if os.environ.get("FETCH_BRIDGE_MAILBOX", "").lower() in ("1", "true", "yes"):
    _agent_kwargs["mailbox"] = True

bridge = Agent(**_agent_kwargs)

SESSION_COUNT = 0


class BridgeHealth(Model):
    status: str
    agent_address: str
    sessions_recorded: int


class PracticeSessionReport(Model):
    """No transcript / no PII — ids and counts only."""

    persona_id: str = ""
    mode_id: str = ""
    duration_sec: int = 0
    coach_turns: int = 0
    stripe_sent: bool = False


class PracticeSessionAck(Model):
    ok: bool
    agent_address: str
    received_at: str
    sessions_recorded: int


@bridge.on_rest_get("/health", BridgeHealth)
async def health(ctx: Context) -> BridgeHealth:
    return BridgeHealth(
        status="ok",
        agent_address=str(bridge.address),
        sessions_recorded=SESSION_COUNT,
    )


@bridge.on_rest_post("/session", PracticeSessionReport, PracticeSessionAck)
async def record_session(ctx: Context, req: PracticeSessionReport) -> PracticeSessionAck:
    global SESSION_COUNT
    SESSION_COUNT += 1
    ts = datetime.now(tz=timezone.utc).isoformat()
    ctx.logger.info(
        "practice_session persona=%s mode=%s duration=%ss turns=%s stripe=%s",
        req.persona_id,
        req.mode_id,
        req.duration_sec,
        req.coach_turns,
        req.stripe_sent,
    )
    append_session(
        {
            "received_at": ts,
            "persona_id": req.persona_id,
            "mode_id": req.mode_id,
            "duration_sec": req.duration_sec,
            "coach_turns": req.coach_turns,
            "stripe_sent": bool(req.stripe_sent),
            "recorder_address": str(bridge.address),
        }
    )
    return PracticeSessionAck(
        ok=True,
        agent_address=str(bridge.address),
        received_at=ts,
        sessions_recorded=SESSION_COUNT,
    )


if __name__ == "__main__":
    bridge.run()
