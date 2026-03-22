# CloserArena × Fetch.ai (uAgents)

Local **uAgents** debrief service with a **REST** endpoint your Next.js app can call. **AgentVerse registration is optional** — not required for this integration.

## Why this exists

- **Hackathon story:** debrief logic runs on a **Fetch uAgent** (same Gemini prompt as `/api/debrief`).
- **Local dev:** run Python + Next; set one env var to route debrief traffic through the agent.

## Setup

```bash
cd fetch-agents
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env   # or create .env with GEMINI_API_KEY
# GEMINI_API_KEY must be available (export or .env in this directory: cp ../.env .env)
```

Set a **unique** seed for anything public:

```bash
export FETCH_DEBRIEF_SEED="your_random_seed_no_spaces"
```

## Run

```bash
python closerarena_debrief_agent.py
```

- Health: `GET http://127.0.0.1:8010/health`
- Debrief: `POST http://127.0.0.1:8010/debrief` with JSON `{"user_block": "..."}` (same block the app builds for Gemini).

## Next.js

In the project root `.env`:

```bash
FETCH_DEBRIEF_UAGENT_URL=http://127.0.0.1:8010
```

Restart `next dev`. Session debrief on `/feedback` will call the uAgent for the Gemini step; parsing stays in TypeScript.

Unset `FETCH_DEBRIEF_UAGENT_URL` to use the built-in `/api/debrief` Gemini path only.

## AgentVerse (optional)

Use Fetch docs to host or connect via mailbox if you want **ASI One** / discoverability — the REST server above is enough for **best-use-of-Fetch** demos that show **uAgents + app integration**.
