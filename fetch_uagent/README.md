# CloserArena debrief uAgent (optional)

Runs a **local Fetch uAgent** that exposes `POST /debrief`. Your Next app builds the **same** coaching prompt in TypeScript (`src/lib/debrief-prompt.ts`) and forwards `system` + `user` here so **prompt logic is not duplicated** in Python—this process only calls Gemini and returns raw text for JSON parsing in `/api/debrief`.

## Do I need AgentVerse?

**No.** `python closerarena_debrief_agent.py` is enough for local demos. AgentVerse / mailbox is optional if you want ASI One or remote discovery later.

## Setup

```bash
cd fetch_uagent
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set GEMINI_API_KEY in .env
```

## Run

```bash
python closerarena_debrief_agent.py
```

Default REST URL: `http://127.0.0.1:8099`

## Wire Next.js

In the project root `.env`:

```env
FETCH_UAGENT_DEBRIEF_URL=http://127.0.0.1:8099
```

When this is set, `POST /api/debrief` sends the assembled prompt to the uAgent instead of calling Gemini from Node. Unset it to use the built-in Gemini path.

## Health check

`GET http://127.0.0.1:8099/health` → `{"status":"ok"}`
