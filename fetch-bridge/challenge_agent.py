"""
uAgent 3 — deterministic daily micro-challenge for reps (no LLM).

GET /health
GET /daily-challenge — rotates by UTC date from a fixed list
"""

from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone

from uagents import Agent, Context, Model

CHALLENGES = [
    "Open with one agenda line: what you want them to leave with in 20 minutes.",
    "Before any price talk, summarize their situation in one sentence and check it.",
    "On the first objection, use label → validate → one diagnostic question only.",
    "End your next turn with a binary choice, not an open-ended 'what do you think?'",
    "Mirror their exact phrase once before you add your frame.",
    "Ask what 'success in 90 days' looks like in their words before you prescribe.",
    "Practice one full silence after you state the investment — let them fill it.",
    "Trade one feature dump for one consequence question: 'What does that cost you weekly?'",
]

_port = int(os.environ.get("FETCH_BRIDGE_CHALLENGE_PORT", "8767"))
_agent_kwargs: dict = {
    "name": "closerarena_daily_challenge",
    "seed": os.environ.get(
        "FETCH_BRIDGE_CHALLENGE_SEED",
        "closerarena-challenge-agent-seed-change-me",
    ),
    "port": _port,
}
if os.environ.get("FETCH_BRIDGE_MAILBOX", "").lower() in ("1", "true", "yes"):
    _agent_kwargs["mailbox"] = True

challenge_agent = Agent(**_agent_kwargs)


class Health(Model):
    status: str
    agent_address: str


class DailyChallenge(Model):
    date_utc: str
    challenge: str
    agent_address: str


def pick_challenge() -> tuple[str, str]:
    now = datetime.now(tz=timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    h = int(hashlib.sha256(date_str.encode()).hexdigest()[:8], 16)
    return date_str, CHALLENGES[h % len(CHALLENGES)]


@challenge_agent.on_rest_get("/health", Health)
async def health(ctx: Context) -> Health:
    return Health(status="ok", agent_address=str(challenge_agent.address))


@challenge_agent.on_rest_get("/daily-challenge", DailyChallenge)
async def daily_challenge(ctx: Context) -> DailyChallenge:
    date_str, text = pick_challenge()
    return DailyChallenge(
        date_utc=date_str,
        challenge=text,
        agent_address=str(challenge_agent.address),
    )


if __name__ == "__main__":
    challenge_agent.run()
