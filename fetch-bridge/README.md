# CloserArena Fetch uAgents (no LLM)

Three small **[uAgents](https://github.com/fetchai/uAgents)** processes that integrate with the Next.js app over **HTTP REST** (`on_rest_get` / `on_rest_post`). None of them call Gemini or read full transcripts.

| Agent | Port | Role |
|--------|------|------|
| **Session recorder** | 8765 | `POST /session` — stores one metadata line per completed practice (from feedback page). Appends to `data/sessions.jsonl`. |
| **Stats aggregator** | 8766 | `GET /stats` — reads `sessions.jsonl`, returns totals and simple breakdowns. |
| **Daily challenge** | 8767 | `GET /daily-challenge` — returns a fixed coaching micro-challenge picked by UTC date (hash). |

## Agentverse?

**Not required.** Run all three locally. Set `FETCH_BRIDGE_MAILBOX=true` (and mailbox key) only if you connect them to Agentverse.

## Quick start

```bash
cd fetch-bridge
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run_all_agents.py
```

One terminal, three processes. **Ctrl+C** stops all.

Alternatively run each file alone: `practice_bridge_agent.py`, `stats_agent.py`, `challenge_agent.py`.

## Next.js

Defaults assume `http://127.0.0.1:8765–8767`. Optional `.env` overrides:

```bash
FETCH_BRIDGE_BASE_URL=http://127.0.0.1:8765
FETCH_BRIDGE_STATS_URL=http://127.0.0.1:8766
FETCH_BRIDGE_CHALLENGE_URL=http://127.0.0.1:8767
```

- **Dashboard** — panel shows agent health, bridge stats, and today’s challenge.
- **Settings** — three green/gray dots for reachability.
- **Feedback** — still POSTs metadata to the session agent (once per call).

## Data

Session rows are appended to **`data/sessions.jsonl`** (gitignored). Delete the file to reset stats.

## Env (Python)

| Variable | Purpose |
|----------|---------|
| `FETCH_BRIDGE_PORT` | Session agent port (default 8765) |
| `FETCH_BRIDGE_STATS_PORT` | Stats agent (default 8766) |
| `FETCH_BRIDGE_CHALLENGE_PORT` | Challenge agent (default 8767) |
| `FETCH_BRIDGE_AGENT_SEED` | Session agent seed |
| `FETCH_BRIDGE_STATS_SEED` | Stats agent seed |
| `FETCH_BRIDGE_CHALLENGE_SEED` | Challenge agent seed |
| `FETCH_BRIDGE_MAILBOX` | `true` to enable mailbox |
