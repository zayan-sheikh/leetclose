# Installations

## System

- Node.js 20+ (npm)
- Python 3 + pip (only for `fetch-bridge/`)

## Node — repository root

```bash
npm install
```

**dependencies**

- `@heygen/liveavatar-web-sdk`
- `@mediapipe/tasks-vision`
- `livekit-client` (pinned via `package.json` `overrides`)
- `next`
- `react`
- `react-dom`
- `stripe`

**devDependencies**

- `@tailwindcss/postcss`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `eslint`
- `eslint-config-next`
- `tailwindcss`
- `typescript`

## Python — optional (`fetch-bridge/`)

```bash
cd fetch-bridge
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**`fetch-bridge/requirements.txt`**

- `uagents>=0.22.0`

## Runtime (no install step)

MediaPipe WASM and `.task` models load from CDN in the browser on `/call`.

## Environment

```bash
cp .env.example .env
```
