# Embedded Labs

**Open-source side project** — a visual lab for learning low-level programming: bits, masks, shifts, and (later) the path toward embedded systems / the kernel.

> Prototype bootstrapped with AI assistance (Cursor). The goal is learning by building: real infrastructure, a visual frontend, and lesson content you extend yourself.

## What it is

A highly visual web app where you **watch bits transform** step by step (AND/OR/XOR/NOT, masks, SHL), featuring:

- Graphic lesson player + bit-shift animations
- Lessons & progress API
- Docker Compose for a full local stack
- Lesson 1 complete as a template; Lesson 2 stub for you to fill in

## Stack (v0.1)

| Layer | Tech |
|------|------|
| Frontend | Vite + React + TypeScript (`apps/web`) |
| Backend | Rust — Axum + sqlx (`apps/api`) |
| DB | Postgres |
| Infra | Docker Compose |

## Quick start

```bash
git clone https://github.com/anidroid1184/embedded_labs.git
cd embedded_labs
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:8080/health
- Postgres (host): `localhost:15433`

## Local development

```bash
# Terminal 1 — DB
docker compose up -d postgres

# Terminal 2 — API
make api-dev

# Terminal 3 — Web
cd apps/web && pnpm install && pnpm dev
```

## Tests

```bash
make test-api          # API (C01–C08)
cd apps/web && pnpm test
cd apps/web && pnpm exec playwright install chromium && pnpm e2e
```

## Add a lesson

1. Copy `content/lessons/lesson-02-stub.json` → `lesson-03-....json`
2. Change `id` (UUID), `slug`, `title`, `status`, `steps`
3. Restart the API (seed syncs JSON → DB on boot)
4. Supported kinds: `bit_op` · `mask` · `quiz` · `placeholder`

## Out of scope (v0.1)

- Docker sandbox for asm/kernel
- User authentication
- WASM

## License

MIT — use it, fork it, learn with it.

## Contributing

Issues and PRs welcome. This is a side project in progress: prioritize clarity, tests, and playable lessons.
