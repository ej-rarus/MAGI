# MAGI

Evangelion MAGI-style decision console built with React, TypeScript, and Vite.

The UI always works without API keys. When `/api/judgement` is available, the three MAGI nodes try real model calls:

- `MELCHIOR•1` -> Gemini
- `BALTHASAR•2` -> Claude
- `CASPER•3` -> ChatGPT / OpenAI

If an API key is missing, a provider fails, or the endpoint is unavailable, that node falls back to the local MAGI demo engine. The final verdict still completes with all three nodes.

## Development

```bash
npm install
npm run dev
```

The plain Vite dev server does not serve the serverless `api/judgement.ts` function. In that mode the UI intentionally falls back to local judgement. Deploying with a serverless environment such as Vercel, or running an equivalent API server for `/api/judgement`, enables live model calls.

## Environment

Copy `.env.example` to your local environment and set only the keys you want to enable.

For API-free demo mode, keep the client in local mode:

```bash
VITE_MAGI_API_MODE=local
```

For live model calls, switch the client to `auto` or `api` and provide the server API keys:

```bash
VITE_MAGI_API_MODE=api
VITE_MAGI_API_ENDPOINT=/api/judgement
VITE_MAGI_API_TIMEOUT_MS=6000
```

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

Optional model overrides:

```bash
OPENAI_MODEL=gpt-5.4-mini
ANTHROPIC_MODEL=claude-sonnet-4-6
GEMINI_MODEL=gemini-3.5-flash
```

## Checks

```bash
npm test
npm run lint
npm run build
```
