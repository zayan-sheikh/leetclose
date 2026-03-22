"""
uAgent 2 — aggregates practice sessions written by the session recorder (JSONL).

GET /health
GET /stats — totals and simple breakdowns (no LLM)
"""

from __future__ import annotations

import os
from collections import Counter
from datetime import datetime, timezone

from uagents import Agent, Context, Model

from store import iter_sessions

_port = int(os.environ.get("FETCH_BRIDGE_STATS_PORT", "8766"))
_agent_kwargs: dict = {
    "name": "closerarena_stats_aggregator",
    "seed": os.environ.get(
        "FETCH_BRIDGE_STATS_SEED",
        "closerarena-stats-agent-seed-change-me",
    ),
    "port": _port,
}
if os.environ.get("FETCH_BRIDGE_MAILBOX", "").lower() in ("1", "true", "yes"):
    _agent_kwargs["mailbox"] = True

stats_agent = Agent(**_agent_kwargs)


class Health(Model):
    status: str
    agent_address: str


class StatsSummary(Model):
    total_sessions: int
    top_mode_id: str
    top_mode_count: int
    top_persona_id: str
    top_persona_count: int
    stripe_practice_count: int
    last_session_at: str


@stats_agent.on_rest_get("/health", Health)
async def health(ctx: Context) -> Health:
    return Health(status="ok", agent_address=str(stats_agent.address))


@stats_agent.on_rest_get("/stats", StatsSummary)
async def stats(ctx: Context) -> StatsSummary:
    rows = list(iter_sessions())
    if not rows:
        return StatsSummary(
            total_sessions=0,
            top_mode_id="",
            top_mode_count=0,
            top_persona_id="",
            top_persona_count=0,
            stripe_practice_count=0,
            last_session_at="",
        )

    modes = Counter(r.get("mode_id") or "" for r in rows)
    personas = Counter(r.get("persona_id") or "" for r in rows)
    stripe_n = sum(1 for r in rows if r.get("stripe_sent"))

    top_m, top_m_c = modes.most_common(1)[0]
    top_p, top_p_c = personas.most_common(1)[0]

    last_ts = ""
    for r in reversed(rows):
        t = r.get("received_at") or ""
        if t:
            last_ts = t
            break

    return StatsSummary(
        total_sessions=len(rows),
        top_mode_id=top_m or "",
        top_mode_count=top_m_c,
        top_persona_id=top_p or "",
        top_persona_count=top_p_c,
        stripe_practice_count=stripe_n,
        last_session_at=last_ts,
    )


if __name__ == "__main__":
    stats_agent.run()
