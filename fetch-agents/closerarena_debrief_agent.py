"""
CloserArena debrief uAgent (Fetch.ai uAgents + local REST).

Runs without AgentVerse: start this process, then point Next.js at it:
  FETCH_DEBRIEF_UAGENT_URL=http://127.0.0.1:8010

Optional: register the same agent on Agentverse / ASI One for hackathon demos;
REST integration with the web app does not require registration.

Pattern: innovation-lab-examples frontend-integration + orchestrator on_rest_post.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from typing import Any

import requests
from dotenv import load_dotenv
from uagents import Agent, Context, Model

load_dotenv()

SYSTEM = """You are an expert sales coach reviewing a fitness/coaching sales roleplay: a human coach vs an AI prospect.

Read the transcript. Judge each objective for whether the COACH substantially met it based on what they actually said — not generic theory.

Rules:
- met = clear evidence in the coach's lines; if unsure, met:false.
- note: max 120 characters, one concrete observation (no fluff).
- strengths / improvements: 2–4 items each, specific to THIS call.
- betterLines: 1–3 short example lines they could use next time (plain text, no nested quotes).
- retryChallenge: one actionable sentence for the next rep.

Output ONLY valid JSON (no markdown fences, no commentary) with exactly this structure:
{"modeObjectives":[{"index":0,"met":true,"note":"string"}],"personaObjectives":[{"index":0,"met":false,"note":"string"}],"coachSummary":"string","strengths":["string"],"improvements":["string"],"betterLines":["string"],"retryChallenge":"string"}

Include one modeObjectives entry for every mode objective index given (0 through n-1), and one personaObjectives entry for every persona objective index given."""


class DebriefRequest(Model):
    user_block: str


class DebriefResponse(Model):
    ok: bool
    model_text: str = ""
    error: str = ""
    gemini_model: str = ""


class HealthResponse(Model):
    status: str
    agent: str


def _extract_json_object(text: str) -> Any | None:
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", t, re.I)
    body = fence.group(1).strip() if fence else t
    start = body.find("{")
    end = body.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(body[start : end + 1])
    except json.JSONDecodeError:
        return None


def _gemini_generate(system_text: str, user_text: str, api_key: str, model: str) -> tuple[str, str | None]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {"parts": [{"text": system_text}]},
        "contents": [{"role": "user", "parts": [{"text": user_text}]}],
        "generationConfig": {
            "maxOutputTokens": 1600,
            "temperature": 0.35,
        },
    }
    r = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    if not r.ok:
        return "", f"gemini_http_{r.status_code}: {r.text[:500]}"
    data = r.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "\n".join(
        p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p
    ).strip()
    if not text:
        return "", "empty_model_response"
    return text, None


agent = Agent(
    name="closerarena_debrief",
    port=8010,
    seed=os.getenv("FETCH_DEBRIEF_SEED", "closerarena_debrief_change_this_seed"),
    endpoint=["http://127.0.0.1:8010/submit"],
)


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("CloserArena debrief uAgent — REST POST /debrief")
    ctx.logger.info(f"Address: {agent.address}")


@agent.on_rest_get("/health", HealthResponse)
async def health(ctx: Context) -> HealthResponse:
    return HealthResponse(status="ok", agent=agent.name)


@agent.on_rest_post("/debrief", DebriefRequest, DebriefResponse)
async def debrief(ctx: Context, req: DebriefRequest) -> DebriefResponse:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return DebriefResponse(ok=False, error="missing_gemini_api_key")

    configured = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    candidates = list(
        dict.fromkeys(
            [configured, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]
        )
    )

    user_block = (req.user_block or "").strip()
    if len(user_block) < 20:
        return DebriefResponse(ok=False, error="user_block_too_short")

    last_err = ""
    for model in candidates:
        try:

            def call():
                return _gemini_generate(SYSTEM, user_block, api_key, model)

            text, err = await asyncio.to_thread(call)
            if err:
                last_err = err
                continue
            if _extract_json_object(text) is not None:
                ctx.logger.info(f"Debrief ok via {model}")
                return DebriefResponse(ok=True, model_text=text, gemini_model=model)
            last_err = "parse_failed"
        except Exception as e:
            last_err = str(e)[:300]

    ctx.logger.error(f"Debrief failed: {last_err}")
    return DebriefResponse(ok=False, error=last_err or "debrief_failed")


if __name__ == "__main__":
    print("CloserArena debrief uAgent")
    print("  REST: POST http://127.0.0.1:8010/debrief  JSON {\"user_block\": \"...\"}")
    print("  Health: GET http://127.0.0.1:8010/health")
    print("  AgentVerse: optional (register for ASI One / discovery)")
    agent.run()
