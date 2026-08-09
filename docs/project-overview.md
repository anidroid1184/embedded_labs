<!-- Generated: 2026-08-09 20:00:00 UTC -->

# Project overview — Embedded Labs

## Purpose

Web app to learn low-level programming visually. v0.1 delivers a bitwise lesson player, lesson/progress API in Rust, and Docker Compose infrastructure.

## Key paths

| Path | Role |
|---|---|
| `apps/web` | React lesson player + bit-engine |
| `apps/api` | Axum API, migrations, seed |
| `content/lessons` | Lesson JSON source of truth for seed |
| `docker-compose.yml` | postgres + api + web |
| `docs/project-overview.md` | This file |

## Runtime flow

1. API boots → migrates Postgres → seeds lessons if empty
2. Web loads lesson list from `/api/v1/lessons`
3. Player runs bit animations client-side (`src/lib/bit-engine`)
4. Progress stored per guest UUID (`X-Guest-Id` + `localStorage`)

## Deferred

- Docker sandbox for asm/kernel
- Real user accounts
- Lesson WYSIWYG editor
