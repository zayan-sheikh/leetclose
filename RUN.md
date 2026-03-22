# Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

If `npm install` errors with auth (E401):

```bash
npm install --registry https://registry.npmjs.org/
```

Copy `.env.example` → `.env.local` and set:

- **`LIVEAVATAR_API_KEY`** — video prospect on `/call` (HeyGen Live Avatar; `/api/token` uses sandbox).
- **`GEMINI_API_KEY`** — prospect chat (`/api/chat`). Optional **`GEMINI_MODEL`**.
- **Stripe** vars if you use checkout on `/pricing`.

Restart the dev server after changing env files.
