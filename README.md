# Embedded Labs

**Open-source side project** — a visual lab for learning low-level programming: bits, masks, shifts, and (later) the path toward embedded systems / the kernel.

> Prototype bootstrapped with AI assistance (Cursor). The goal is learning by building: real infrastructure, a visual frontend, and lesson content you extend yourself.

## What it is

A highly visual web app where you **watch bits transform** step by step (AND/OR/XOR/NOT, masks, SHL), featuring:

- Graphic lesson player + bit-shift animations
- **ES/EN i18n** with an interactive language toggle (persisted)
- Lessons & progress API (FastAPI)
- Docker Compose for a full local stack
- Lesson 1 complete as a template; Lesson 2 stub for you to fill in

## Stack (v0.2)

| Layer | Tech |
|------|------|
| Frontend | Vite + React + TypeScript (`apps/web`) |
| Backend | Python — FastAPI + SQLAlchemy (`apps/api`) |
| DB | Postgres |
| Infra | Docker Compose |

## Live demo

GitHub Pages (static frontend, bilingual lessons bundled, progress in `localStorage`):

**https://anidroid1184.github.io/embedded_labs/**

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
make test-api          # pytest (C01–C08, locale C04–C05)
cd apps/web && pnpm test
cd apps/web && pnpm exec playwright install chromium && pnpm e2e
```

## Add a lesson

1. Copy `content/lessons/lesson-02-stub.json` → `lesson-03-....json`
2. Change `id` (UUID), `slug`, bilingual `title`/`summary`/`narration` (`{ "es": "...", "en": "..." }`), `status`, `steps`
3. Restart the API (seed syncs JSON → DB on boot)
4. Supported kinds: `bit_op` · `mask` · `quiz` · `placeholder`

## Security / credentials

- **Never commit `.env`** (gitignored). Only `.env.example` is tracked, with local placeholders (`changeme`).
- Copy `cp .env.example .env` before `docker compose up`.
- Compose **requires** `POSTGRES_*` from `.env` (no silent default passwords in YAML).
- CI runs **Gitleaks** on every push/PR (`.github/workflows/secret-scan.yml`).
- GitHub Pages deploy is static-only: no DB URL or API secrets in the frontend build.

If you ever push a real secret by mistake: rotate it immediately and scrub git history.

## Out of scope (v0.2)

- Docker sandbox for asm/kernel
- User authentication
- WASM

## License

MIT — use it, fork it, learn with it.

## Contributing

Issues and PRs welcome. This is a side project in progress: prioritize clarity, tests, and playable lessons.
