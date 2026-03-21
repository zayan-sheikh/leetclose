# Run locally

```bash
cd ./
npm install
npm run dev
```

Open **http://localhost:3000**

If `npm install` errors with auth (E401):

```bash
npm install --registry https://registry.npmjs.org/
```

Optional: copy `.env.example` → `.env.local` and set `ANTHROPIC_API_KEY` and/or Stripe vars for checkout on `/pricing`.
