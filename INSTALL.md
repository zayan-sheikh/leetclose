# Installation & dependencies

What you need on your machine and what this repo pulls in to run **CloserArena** (Next.js app + optional local Fetch bridge). Copy `.env.example` to `.env` and fill values for full features.

---

## Prerequisites (install once on your system)

| Tool | Typical use |
|------|-------------|
| **Node.js** | v20+ recommended (matches `@types/node`); includes **npm**. |
| **Python 3** | Only if you run **`fetch-bridge/`** uAgents. |
| **pip** | Install Python packages for the bridge (often `python3 -m pip`). |

No global installs are required for the web app beyond Node/npm.

---

## Web app (project root)

From the repository root:

```bash
npm install
```

### Runtime dependencies (`dependencies` in `package.json`)

| Package | Role in this project |
|---------|----------------------|
| **next** | App framework (App Router, API routes). |
| **react** / **react-dom** | UI. |
| **@heygen/liveavatar-web-sdk** | HeyGen Live Avatar on `/call`. |
| **livekit-client** | WebRTC session for Live Avatar (pinned via `overrides`). |
| **@mediapipe/tasks-vision** | On-device face + pose (bundled; WASM/models load from CDN at runtime). |
| **stripe** | Server-side Stripe (checkout / payment link flows). |

### Dev dependencies (`devDependencies`)

| Package | Role |
|---------|------|
| **typescript** | Type-checking. |
| **eslint** / **eslint-config-next** | Linting. |
| **tailwindcss** / **@tailwindcss/postcss** | Styling pipeline. |
| **@types/node** / **@types/react** / **@types/react-dom** | TypeScript types. |

### Commands

```bash
npm run dev    # local dev (webpack)
npm run build  # production build
npm run start  # production server
npm run lint   # eslint
```

---

## Optional: Fetch uAgents (`fetch-bridge/`)

Small Python services (session log, stats, daily challenge). Not required for the core call/feedback flow unless you want dashboard/settings integration.

```bash
cd fetch-bridge
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run_all_agents.py
```

### Python packages (`fetch-bridge/requirements.txt`)

| Package | Role |
|---------|------|
| **uagents** (≥ 0.22) | Fetch uAgents framework + REST hooks used by the bridge scripts. |

`pip` also installs **transitive** dependencies of `uagents` (e.g. networking, crypto helpers—whatever that release requires). Pin or lock in your own `pip freeze` if you need reproducible deploys.

---

## Not installed via npm/pip (loaded at runtime)

These are configured in code or env, not `package.json`:

- **MediaPipe WASM + `.task` models** — fetched from **jsDelivr** / **Google Cloud Storage** URLs in `UserCallCamera.tsx` when the call page runs (camera overlay).
- **API keys / URLs** — set in **`.env`** (see `.env.example`): Gemini, HeyGen Live Avatar, Stripe, optional Fetch bridge base URLs.

---

## Environment file

```bash
cp .env.example .env
```

See `.env.example` for every variable name. Without keys, some routes or features will fail or degrade gracefully depending on the code path.

---

## Other folders in the workspace

If you have **`innovation-lab-examples-main/`** (or similar), that tree contains many separate demos, each with its own `requirements.txt` or `package.json`. Those are **not** installed by the root `npm install`; use each subproject’s own instructions if you work there.

---

## Quick verification

```bash
npm run build
```

For the bridge (with venv active):

```bash
curl -s http://127.0.0.1:8765/health
curl -s http://127.0.0.1:8766/health
curl -s http://127.0.0.1:8767/health
```
