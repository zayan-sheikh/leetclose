# CloseArena

Practice sales calls until closing feels automatic.

CloseArena is an AI-powered sales call simulator for online fitness coaches. Train against a live AI prospect, handle real objections, and get better at closing high-ticket coaching clients.

## Features

- **Live Call Simulator** — Zoom-inspired interface with AI avatar that speaks and responds in real time
- **AI Prospect** — Realistic prospect (Sarah Mitchell) who brings up natural objections and responds based on your selling skill
- **Voice Interaction** — Speak with your microphone, hear responses via speech synthesis
- **Real Objections** — "Too expensive," "I need to think about it," "Let me ask my spouse," and more
- **Instant Feedback** — Scores for discovery, objection handling, confidence, and closing
- **Onboarding** — Quick setup to customize the AI prospect to your coaching business

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI Responses

The app works out of the box with fallback responses. For full AI conversation, add your Anthropic API key:

```bash
cp .env.example .env.local
# Edit .env.local with your API key
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Web Speech API (speech recognition + synthesis)
- Anthropic Claude API (AI conversation)

## Pages

- `/` — Landing page
- `/signup` — Sign up
- `/login` — Log in
- `/onboarding` — Quick profile setup
- `/call` — Live call simulator (core feature)
- `/feedback` — Post-call results and scoring
