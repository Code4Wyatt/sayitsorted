# api

NestJS API for Say It Sorted. It turns spoken bill entries into structured bills using Claude.

## Setup

```bash
cp .env.example .env
pnpm install
```

| Variable | Default | |
| --- | --- | --- |
| `BILL_PARSER` | `claude` | `fake` uses a simple local parser, so no API key or credits are needed |
| `ANTHROPIC_API_KEY` | | Required when `BILL_PARSER=claude` |
| `WEB_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `PORT` | `3002` | |

The API checks these at startup and exits with a clear message if any are invalid.

## Running

```bash
pnpm dev          # watch mode
pnpm build && pnpm start:prod
```

`@repo/core` must be built first (`pnpm build` from the repo root does this).

## Tests

```bash
pnpm test         # unit
pnpm test:e2e     # end to end
pnpm lint
pnpm check-types
```

## Endpoints

| Method | Path | |
| --- | --- | --- |
| `GET` | `/health` | Returns `{ "status": "ok" }`. Doesn't call Claude or other services |
| `POST` | `/bills/parse` | Body `{ text, today }`. Returns a complete bill, a draft with missing fields, or `not-a-bill` |

Requests are rate limited per client: 60 a minute and 1000 a day overall, with tighter limits of 10 a minute and 100 a day on `/bills/parse`.
